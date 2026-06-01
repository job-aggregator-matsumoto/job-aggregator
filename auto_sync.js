var fso = new ActiveXObject("Scripting.FileSystemObject");
var shell = new ActiveXObject("WScript.Shell");
var sourceDir = "C:\\Users\\user\\Google \u30c9\u30e9\u30a4\u30d6 \u30b9\u30c8\u30ea\u30fc\u30df\u30f3\u30b0\\\u5171\u6709\u30c9\u30e9\u30a4\u30d6\\\u6c42\u4eba\u60c5\u5831PDF";
var baseDir = fso.GetParentFolderName(WScript.ScriptFullName);
var targetFile = fso.BuildPath(fso.BuildPath(baseDir, "data"), "jobs_data.js");

function readAs(path, charset) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; stream.Charset = charset; stream.Open(); stream.LoadFromFile(path);
        var text = stream.ReadText(); stream.Close(); return text;
    } catch(e) { return null; }
}

function isCorrect(t) {
    if (!t) return false;
    // UTF-8としてのデコードに失敗した場合は代替文字が含まれる
    if (t.indexOf("\uFFFD") !== -1) return false;
    // Shift_JIS指定があれば除外
    if (t.indexOf("charset=Shift_JIS") !== -1 || t.indexOf("charset=shift_jis") !== -1) return false;
    
    // より汎用的なキーワードでチェック
    return (t.indexOf("年月日") !== -1 || 
            t.indexOf("事業所") !== -1 || 
            t.indexOf("求人") !== -1 ||
            t.indexOf("ハローワーク") !== -1);
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
    stream.Type = 2; stream.Charset = "utf-8"; stream.Open();
    stream.WriteText(text); stream.SaveToFile(path, 2); stream.Close();
}

function clean(s) {
    if (!s) return "";
    var res = String(s).replace(/<[^>]+>/g, "").replace(/\uff1a/g, "");
    // Remove "Image Available" suffix
    res = res.replace(/\s*\u753b\u50cf\u3042\u308a\s*$/g, "");
    // Convert all full-width Japanese spaces to half-width regular spaces
    res = res.replace(/\u3000/g, " ");
    // Convert newlines to spaces, collapse consecutive spaces to one, and trim
    return res.replace(/\r\n|\n|\r/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
}

function escapeStr(s) {
    if (!s) return '""';
    return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n").replace(/\r/g, "\\r") + '"';
}

function extract(h, label) {
    var labelPattern = label;
    var p = "<t[hd][^>]*>[\\s\\S]*?" + labelPattern + "[\\s\\S]*?</t[hd]>[\\s\\S]*?<td[^>]*>([\\s\\S]*?)</td>";
    var m = h.match(new RegExp(p, "i"));
    if (m) return clean(m[1]);
    return "";
}

function extractDate(h) {
    // Matches reception/acceptance dates (Acceptance/Reception Date: YYYY Year MM Month DD Day)
    var p = "(\u53d7\u7406|\u53d7\u4ed8)\u5e74\u6708\u65e5[\\s\\S]*?(\\d{4})\\u5e74(\\d{1,2})\\u6708(\\d{1,2})\\u65e5";
    var m = h.match(new RegExp(p, "i"));
    if (m) {
        var mo = ("0" + m[3]).slice(-2);
        var da = ("0" + m[4]).slice(-2);
        return m[2] + "-" + mo + "-" + da;
    }
    var now = new Date();
    var y = now.getFullYear();
    var m = ("0" + (now.getMonth() + 1)).slice(-2);
    var d = ("0" + now.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
}

function findUrl(text) {
    if (!text) return null;
    var m = text.match(/href="(https:\/\/www\.hellowork\.mhlw\.go\.jp\/kensaku\/GECA110010\.do\?[^"]+)"/);
    if (m) return m[1].replace(/&amp;/g, "&");
    return null;
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

WScript.Echo("Checking source directory: " + sourceDir);
if (fso.FolderExists(sourceDir)) {
    WScript.Echo("Source directory exists.");
    findHtmlFiles(fso.GetFolder(sourceDir));
    WScript.Echo("Files found: " + htmlFiles.length);
} else {
    WScript.Echo("Source directory DOES NOT exist.");
}

for (var i = 0; i < htmlFiles.length; i++) {
    var f = htmlFiles[i];
    WScript.Echo("Processing: " + f.Name);
    var content = readSmart(f.Path);
    if (!content) {
        WScript.Echo("  Failed to read content.");
        continue;
    }
    WScript.Echo("  Content length: " + content.length);
    
    var chunks = content.split(/<table[^>]*class="[^"]*kyujin/i);
    for (var j = 1; j < chunks.length; j++) {
        try {
            var h = chunks[j];
            var prevChunk = chunks[j-1];
            
            var m_id = h.match(/(\d{5}-\d{8})/);
            if (!m_id) continue;
            var currentJobId = m_id[1];
            if (jobIds[currentJobId]) continue;
            
            var m_title = h.match(/class="fb">([\s\S]*?)<\/div>/);
            var currentJobTitle = "Unknown";
            if (m_title && m_title[1]) {
                currentJobTitle = clean(m_title[1]);
            }
            if (!currentJobTitle) currentJobTitle = "Unknown";
            
            // Remote: Check for Telework, Disability: Check for Disabled
            var isRemote = /[\u5728\u5b85]|[\u30ea\u30e2\u30fc\u30c8]|[\u30c6\u30ec\u30ef\u30fc\u30af]/.test(String(currentJobTitle));
            var isDisability = /[\u969c]/.test(String(currentJobTitle));
            
            var currentType = "";
            var typeRegex = /class="[^"]*bg_label[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
            var typeMatch;
            while ((typeMatch = typeRegex.exec(h)) !== null) {
                var text = clean(typeMatch[1]);
                // Skip common WSH status tags (Viewed, New, Show Details, Show Sheet)
                if (text && text !== "\u95b2\u89a7\u6e08" && text !== "\u65b0\u7740" && text !== "\u8a73\u7d30\u3092\u8868\u793a" && text !== "\u6c42\u4eba\u756a\u7968\u3092\u8868\u793a") {
                    currentType = text;
                    break;
                }
            }
            
            // Regular Job types: Full time (bg_label mapping)
            if (!currentType || String(currentType) === "\u6b63\u793e\u54e1") {
                currentType = extract(h, "\u6c42\u4eba\u533a\u5206") || extract(h, "\u96c7\u7528\u5f62\u614b");
            }
            if (!currentType) {
                if (String(h).indexOf("\u6b63\u793e\u54e1\u4ee5\u5916") !== -1) currentType = "\u6b63\u793e\u54e1\u4ee5\u5916";
                else if (String(h).indexOf("\u6b63\u793e\u54e1") !== -1) currentType = "\u6b63\u793e\u54e1";
                else if (String(h).indexOf("\u30d1\u30fc\u30c8") !== -1) currentType = "\u30d1\u30fc\u30c8";
                else currentType = "\u6b63\u793e\u54e1";
            }
            
            var url = findUrl(h) || findUrl(prevChunk);
            
            var job = {
                id: currentJobId,
                title: currentJobTitle,
                company: extract(h, "\u4e8b\u696d\u6240\u540d"),
                location: extract(h, "\u5c31\u696d\u5834\u6240"),
                salary: extract(h, "\u8cc3\u91d1(?:\u30fb\u624b\u5f53)?"),
                workingHours: extract(h, "\u5c31\u696d\u6642\u9593"),
                holiday: extract(h, "\u4f11\u65e5"),
                description: extract(h, "\u4ed5\u4e8b(?:\u306e)?\u5185\u5bb9"),
                postedAt: extractDate(h),
                officialUrl: url,
                type: currentType,
                // Category: Disability quota vs General
                category: (isDisability || String(currentJobTitle).indexOf("\uff08\u969c\uff09") !== -1) ? "\u969c\u5bb3\u8005\u67a0" : "\u4e00\u822c",
                isRemote: isRemote,
                isImported: true
            };
            
            allJobs.push(job);
            jobIds[currentJobId] = true;
        } catch (err) {
            WScript.Echo("  Error processing chunk " + j + ": " + err.message);
        }
    }
}

function pad(n) { return n < 10 ? '0' + n : n; }
var now = new Date();
var timestamp = now.getFullYear() + "-" + pad(now.getMonth()+1) + "-" + pad(now.getDate()) + " " + pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());

var urlCount = 0;
for (var i = 0; i < allJobs.length; i++) {
    if (allJobs[i].officialUrl) urlCount++;
}

// 文字列からJSONフィールドを直接抽出する関数（COMオブジェクトを回避・トップレベルに配置）
function extractField(objStr, field) {
    var pattern = '"' + field + '":"';
    var idx = objStr.indexOf(pattern);
    if (idx === -1) return "";
    var start = idx + pattern.length;
    var end = start;
    while (end < objStr.length) {
        if (objStr.charAt(end) === '"' && objStr.charAt(end - 1) !== '\\') break;
        end++;
    }
    return objStr.substring(start, end);
}

// --- 手動修正データ（manual_edits.json）のマージ処理 ---
var manualEditsFile = fso.BuildPath(fso.BuildPath(baseDir, "data"), "manual_edits.json");
if (fso.FileExists(manualEditsFile)) {
    var editsJson = readAs(manualEditsFile, "utf-8");
    if (editsJson) {
        try {
        
        var overridesMap = {};
        var objStart = editsJson.indexOf('{');
        var parseCount = 0;
        while (objStart !== -1) {
            var depth = 0, objEnd = objStart;
            while (objEnd < editsJson.length) {
                var ch = editsJson.charAt(objEnd);
                if (ch === '{') depth++;
                else if (ch === '}') { depth--; if (depth === 0) break; }
                objEnd++;
            }
            var objStr = editsJson.substring(objStart, objEnd + 1);
            var eid = extractField(objStr, "id");
            if (eid) {
                overridesMap[eid] = {
                    title: extractField(objStr, "title"),
                    company: extractField(objStr, "company"),
                    location: extractField(objStr, "location"),
                    salary: extractField(objStr, "salary"),
                    workingHours: extractField(objStr, "workingHours"),
                    holiday: extractField(objStr, "holiday"),
                    description: extractField(objStr, "description"),
                    postedAt: extractField(objStr, "postedAt"),
                    type: extractField(objStr, "type"),
                    category: extractField(objStr, "category")
                };
                parseCount++;
            }
            objStart = editsJson.indexOf('{', objEnd + 1);
        }
        WScript.Echo("  Parsed " + parseCount + " override entries.");
        
        // 抽出済みのallJobsに対して上書き
        var applyCount = 0;
        for (var k = 0; k < allJobs.length; k++) {
            var override = overridesMap[allJobs[k].id];
            if (override) {
                if (override.title) allJobs[k].title = override.title;
                if (override.company) allJobs[k].company = override.company;
                if (override.location) allJobs[k].location = override.location;
                if (override.salary) allJobs[k].salary = override.salary;
                if (override.workingHours) allJobs[k].workingHours = override.workingHours;
                if (override.holiday) allJobs[k].holiday = override.holiday;
                if (override.description) allJobs[k].description = override.description;
                if (override.postedAt) allJobs[k].postedAt = override.postedAt;
                if (override.type) allJobs[k].type = override.type;
                if (override.category) allJobs[k].category = override.category;
                applyCount++;
            }
        }
        WScript.Echo("  Applied " + applyCount + " manual edits from manual_edits.json.");
        } catch(e) {
            WScript.Echo("  Failed to merge manual_edits.json: " + e.message);
        }
    }
}
// ----------------------------------------------------

var jsonStr = "[\n";
for (var i = 0; i < allJobs.length; i++) {
    var j = allJobs[i];
    jsonStr += "  {\n";
    jsonStr += '    "id": "' + j.id + '",\n';
    jsonStr += '    "title": ' + escapeStr(j.title) + ',\n';
    jsonStr += '    "company": ' + escapeStr(j.company) + ',\n';
    jsonStr += '    "location": ' + escapeStr(j.location) + ',\n';
    jsonStr += '    "salary": ' + escapeStr(j.salary) + ',\n';
    jsonStr += '    "workingHours": ' + escapeStr(j.workingHours) + ',\n';
    jsonStr += '    "holiday": ' + escapeStr(j.holiday) + ',\n';
    jsonStr += '    "description": ' + escapeStr(j.description) + ',\n';
    jsonStr += '    "postedAt": "' + j.postedAt + '",\n';
    jsonStr += '    "officialUrl": ' + (j.officialUrl ? '"' + j.officialUrl + '"' : 'null') + ',\n';
    jsonStr += '    "type": ' + escapeStr(j.type) + ',\n';
    jsonStr += '    "category": ' + escapeStr(j.category) + ',\n';
    jsonStr += '    "isRemote": ' + j.isRemote + ',\n';
    jsonStr += '    "isImported": true\n';
    jsonStr += "  }" + (i < allJobs.length - 1 ? "," : "") + "\n";
}
jsonStr += "]";

var jsContent = "const lastUpdated = '" + timestamp + "';\nconst initialJobsData = " + jsonStr + ";\n";
writeUtf8(targetFile, jsContent);

WScript.Echo("Sync complete! " + allJobs.length + " jobs extracted (" + urlCount + " with official URLs). " + timestamp);
