
var fso = new ActiveXObject("Scripting.FileSystemObject");

function readAs(path, charset) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; stream.Charset = charset; stream.Open(); stream.LoadFromFile(path);
        var text = stream.ReadText(); stream.Close(); return text;
    } catch(e) { return null; }
}

function isCorrect(t) {
    if (!t) return false;
    return (t.indexOf("\u53d7\u4ed8\u5e74\u6708\u65e5") !== -1 || 
            t.indexOf("\u53d7\u7406\u5e74\u6708\u65e5") !== -1 ||
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
        WScript.Echo("DEBUG: Found match for " + label);
        WScript.Echo("DEBUG: Raw match[1]: " + m[1].substring(0, 100) + "...");
        return clean(m[1]);
    }
    return "";
}

var path = "c:\\Users\\user\\Google ドライブ ストリーミング\\マイドライブ\\求人情報まとめサイト\\html_full_sample.html";
var content = readSmart(path);
WScript.Echo("Content length: " + content.length);
if (content.length > 0) {
    WScript.Echo("Content start: " + content.substring(0, 200));
}

var chunks = content.split(/<table[^>]*class="[^"]*kyujin/i);
if (chunks.length > 1) {
    var h = chunks[1];
    WScript.Echo("Processing first job chunk...");
    var loc = extract(h, "\u5c31\u696d\u5834\u6240");
    WScript.Echo("Extracted Location: " + loc);
    
    var comp = extract(h, "\u4e8b\u696d\u6240\u540d");
    WScript.Echo("Extracted Company: " + comp);
} else {
    WScript.Echo("No job tables found.");
}
