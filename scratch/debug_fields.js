
var fso = new ActiveXObject("Scripting.FileSystemObject");

function readAs(path, charset) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; stream.Charset = charset; stream.Open(); stream.LoadFromFile(path);
        var text = stream.ReadText(); stream.Close(); return text;
    } catch(e) { return null; }
}

function clean(s) {
    if (!s) return "";
    var res = s.replace(/<[^>]+>/g, "").replace(/^\s+|\s+$/g, "");
    res = res.replace(/\uff1a/g, "");
    return res.replace(/\r\n|\n|\r/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
}

function extract(h, label, labelName) {
    var p = label + "[\\s\\S]*?<td[^>]*?>([\\s\\S]*?)<\\/td>";
    var m = h.match(new RegExp(p, "i"));
    if (m) {
        WScript.Echo("DEBUG: [" + labelName + "] Primary regex matched.");
        WScript.Echo("DEBUG: [" + labelName + "] Raw capture: " + m[1].substring(0, 100));
        return clean(m[1]);
    }
    
    p = label + "([\\s\\S]*?)(?=<span class=\"bg_label|<div class=\"bg_label|$)";
    m = h.match(new RegExp(p, "i"));
    if (m) {
        WScript.Echo("DEBUG: [" + labelName + "] Fallback regex matched.");
        return clean(m[1]);
    }
    WScript.Echo("DEBUG: [" + labelName + "] No match.");
    return "";
}

var path = "c:\\Users\\user\\Google \u30c9\u30e9\u30a4\u30d6 \u30b9\u30c8\u30ea\u30fc\u30df\u30f3\u30b0\\\u5171\u6709\u30c9\u30e9\u30a4\u30d6\\\u6c42\u4eba\u60c5\u5831PDF\\\u30cf\u30ed\u30fc\u30ef\u30fc\u30af\u30a4\u30f3\u30bf\u30fc\u30cd\u30c3\u30c8\u30b5\u30fc\u30d3\u30b9 - \u6c42\u4eba\u60c5\u5831\u691c\u7d22\u30fb\u4e00\u89a7.html";
var content = readAs(path, "Shift_JIS"); // I know this file is SJIS
if (!content) {
    WScript.Echo("Failed to read file.");
    WScript.Quit();
}

var chunks = content.split(/<table[^>]*class="[^"]*kyujin/i);
if (chunks.length > 1) {
    var h = chunks[1];
    WScript.Echo("Processing chunk 1... (Length: " + h.length + ")");
    WScript.Echo("Chunk starts with: " + h.substring(0, 200));
    WScript.Echo("Searching for labels: \u8cc1\u91d1, \u4ed5\u4e8b\u5185\u5bb9, \u5c31\u696d\u5834\u6240");
    
    // Check if labels exist in h
    WScript.Echo("Label Salary exists? " + (h.indexOf("\u8cc1\u91d1") !== -1));
    WScript.Echo("Label Description exists? " + (h.indexOf("\u4ed5\u4e8b\u5185\u5bb9") !== -1));
    WScript.Echo("Label Location exists? " + (h.indexOf("\u5c31\u696d\u5834\u6240") !== -1));

    extract(h, "\u8cc1\u91d1", "Salary");
    extract(h, "\u4ed5\u4e8b\u5185\u5bb9", "Description");
    extract(h, "\u5c31\u696d\u5834\u6240", "Location");
}
