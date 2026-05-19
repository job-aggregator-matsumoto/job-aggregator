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

var sourceDir = "C:\\Users\\user\\Google \u30c9\u30e9\u30a4\u30d6 \u30b9\u30c8\u30ea\u30fc\u30df\u30f3\u30b0\\\u5171\u6709\u30c9\u30e9\u30a4\u30d6\\\u6c42\u4eba\u60c5\u5831PDF";
var folder = fso.GetFolder(sourceDir);
var files = new Enumerator(folder.Files);

while (!files.atEnd()) {
    var file = files.item();
    if (file.Name.toLowerCase().indexOf(".html") !== -1) {
        var content = readSmart(file.Path);
        if (!content || content.length < 100) { files.moveNext(); continue; }
        
        var chunks = content.split(/<table[^>]*class="[^"]*kyujin/i);
        for (var j = 1; j < chunks.length; j++) {
            var h = chunks[j];
            var m_id = h.match(/(\d{5}-\d{8})/);
            if (!m_id) continue;
            var currentJobId = m_id[1];
            
            if (currentJobId === "13010-48716861") {
                WScript.Echo("FOUND ID in " + file.Name);
                var m_title = h.match(/class="fb">([\s\S]*?)<\/div>/);
                WScript.Echo("  m_title matches: " + (m_title !== null));
                if (m_title) {
                    WScript.Echo("  Raw title: " + m_title[1].substring(0, 30));
                }
            }
        }
    }
    files.moveNext();
}
