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
    WScript.Echo("UTF8 Correct: " + isCorrect(t));
    if (isCorrect(t)) return t;
    var t2 = readAs(path, "Shift_JIS");
    WScript.Echo("SJIS Correct: " + isCorrect(t2));
    if (isCorrect(t2)) return t2;
    return t || t2 || "";
}

var content = readSmart("scratch\\source_sample.html");
var chunks = content.split(/<table[^>]*class="[^"]*kyujin/i);
WScript.Echo("Chunks: " + chunks.length);

if (chunks.length > 1) {
    var h = chunks[1];
    var m_title = h.match(/class="fb">([\s\S]*?)<\/div>/);
    WScript.Echo("Title matched? " + (m_title !== null));
    if (m_title) {
        var cleanTitle = String(m_title[1]).replace(/<[^>]+>/g, "").replace(/^\s+|\s+$/g, "");
        WScript.Echo("Clean Title: " + cleanTitle.substr(0, 30));
    }
}
