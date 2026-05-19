var fso = new ActiveXObject("Scripting.FileSystemObject");
var sourceDir = "C:\\Users\\user\\OneDrive\\Documents\\\u6c42\u4eba\u307e\u3068\u3081\u30b5\u30a4\u30c8";
var targetFile = "c:\\Users\\user\\Google \u30c9\u30e9\u30a4\u30d6 \u30b9\u30c8\u30ea\u30fc\u30df\u30f3\u30b0\\\u30de\u30a4\u30c9\u30e9\u30a4\u30d6\\\u6c42\u4eba\u60c5\u5831\u307e\u3068\u3081\u30b5\u30a4\u30c8\\data\\jobs_data.js";

function readAs(path, charset) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2;
        stream.Charset = charset;
        stream.Open();
        stream.LoadFromFile(path);
        var text = stream.ReadText();
        stream.Close();
        return text;
    } catch(e) { return null; }
}

function isCorrect(t) {
    if (!t) return false;
    // Check for common Hellowork keywords to verify encoding
    return (t.indexOf("\u53d7\u4ed8\u5e74\u6708\u65e5") !== -1 || 
            t.indexOf("\u4e8b\u696d\u6240\u540d") !== -1 || 
            t.indexOf("\u6c42\u4eba\u756a\u53f7") !== -1);
}

function readSmart(path) {
    var t = readAs(path, "utf-8");
    if (isCorrect(t)) return t;
    var t2 = readAs(path, "Shift_JIS");
    if (isCorrect(t2)) return t2;
    return t || t2 || "";
}

function writeUtf8(path, text) {
    var stream = new ActiveXObject("ADODB.Stream");
    stream.Type = 2;
    stream.Charset = "utf-8";
    stream.Open();
    stream.WriteText(text);
    stream.SaveToFile(path, 2);
    stream.Close();
}

function clean(s) {
    if (!s) return "";
    var res = s.replace(/<[^>]+>/g, "").replace(/^\s+|\s+$/g, "");
    res = res.replace(/\uff1a/g, "");
    return res.replace(/\r\n|\n|\r/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
}

function extract(h, label) {
    var p = label + "([\\s\\S]*?)(?=<span class=\"bg_label|<div class=\"bg_label|$)";
    var m = h.match(new RegExp(p, "i"));
    if (m) {
        return clean(m[1]);
    }
    return "";
}

function extractDate(h) {
    var label = "\u53d7\u4ed8\u5e74\u6708\u65e5";
    var p = label + "[\\s\\S]*?(\\d{4})\\u5e74(\\d{1,2})\\u6708(\\d{1,2})\\u65e5";
    var m = h.match(new RegExp(p, "i"));
    if (m) {
        var mo = ("0" + m[2]).slice(-2);
        var da = ("0" + m[3]).slice(-2);
        return m[1] + "-" + mo + "-" + da;
    }
    return "2026-04-28";
}

var allJobs = [];
var jobIds = {};
var htmlFiles = [];

function findHtmlFiles(folder) {
    var files = new Enumerator(folder.Files);
    while (!files.atEnd()) {
        var file = files.item();
        if (file.Name.toLowerCase().indexOf(".html") !== -1) {
            htmlFiles.push(file);
        }
        files.moveNext();
    }
    var subfolders = new Enumerator(folder.SubFolders);
    while (!subfolders.atEnd()) {
        findHtmlFiles(subfolders.item());
        subfolders.moveNext();
    }
}

findHtmlFiles(fso.GetFolder(sourceDir));

for (var i = 0; i < htmlFiles.length; i++) {
    var f = htmlFiles[i];
    var content = readSmart(f.Path);
    if (!content) continue;
    
    var chunks = content.split('<table class="kyujin');
    for (var j = 1; j < chunks.length; j++) {
        var h = chunks[j];
        var idMatch = h.match(/value="(\d{13})"/) || h.match(/value="(\d{5}-\d{8})"/);
        if (!idMatch) continue;
        var rawId = idMatch[1];
        var id = (rawId.length === 13) ? rawId.substring(0, 5) + "-" + rawId.substring(5) : rawId;
        if (jobIds[id]) continue;
        jobIds[id] = true;

        var title = "";
        var tm = h.match(/class="fb"[^>]*?>([\s\S]*?)<\/div>/i);
        if (tm) title = clean(tm[1]);

        var company = extract(h, "\u4e8b\u696d\u6240\u540d");
        var location = extract(h, "\u5c31\u696d\u5834\u6240");
        var salary = extract(h, "\u8cc3\u91d1");
        var workingHours = extract(h, "\u5c31\u696d\u6642\u9593");
        var holiday = extract(h, "\u4f11\u65e5");
        var postedAt = extractDate(h);

        allJobs.push({
            id: id,
            title: title,
            company: company,
            location: location,
            salary: salary,
            workingHours: workingHours,
            holiday: holiday,
            type: "\u6b63\u793e\u54e1",
            category: (title.indexOf("\u969c") !== -1) ? "\u969c\u5bb3\u8005\u67a0" : "\u4e00\u822c",
            isRemote: (title.indexOf("\u5728\u5b85") !== -1 || title.indexOf("\u30ea\u30e2\u30fc\u30c8") !== -1),
            postedAt: postedAt,
            description: extract(h, "\u4ed5\u4e8b\u306e\u5185\u5bb9"),
            isImported: true
        });
    }
}

var jsonParts = [];
for (var i = 0; i < allJobs.length; i++) {
    var j = allJobs[i];
    var p = [];
    p.push('"id":"' + j.id + '"');
    p.push('"title":"' + j.title.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"');
    p.push('"company":"' + j.company.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"');
    p.push('"location":"' + j.location.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"');
    p.push('"salary":"' + j.salary.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"');
    p.push('"workingHours":"' + j.workingHours.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"');
    p.push('"holiday":"' + j.holiday.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"');
    p.push('"type":"' + j.type + '"');
    p.push('"category":"' + j.category + '"');
    p.push('"isRemote":' + j.isRemote);
    p.push('"postedAt":"' + j.postedAt + '"');
    p.push('"description":"' + j.description.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"');
    p.push('"isImported":true');
    jsonParts.push("{" + p.join(",") + "}");
}

writeUtf8(targetFile, "const initialJobsData = [" + jsonParts.join(",") + "];");
WScript.Echo("Successfully extracted " + allJobs.length + " jobs.");
