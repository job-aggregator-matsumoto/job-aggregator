var fso = new ActiveXObject("Scripting.FileSystemObject");
function readUtf8(path) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; stream.Charset = "utf-8"; stream.Open(); stream.LoadFromFile(path);
        var text = stream.ReadText(); stream.Close(); return text;
    } catch(e) { return null; }
}

var sourceDir = "C:\\Users\\user\\Google \u30c9\u30e9\u30a4\u30d6 \u30b9\u30c8\u30ea\u30fc\u30df\u30f3\u30b0\\\u5171\u6709\u30c9\u30e9\u30a4\u30d6\\\u6c42\u4eba\u60c5\u5831PDF";
var folder = fso.GetFolder(sourceDir);
var files = new Enumerator(folder.Files);

while (!files.atEnd()) {
    var file = files.item();
    if (file.Name.toLowerCase().indexOf(".html") !== -1) {
        var t = readUtf8(file.Path);
        if (t && t.indexOf("13010-48716861") !== -1) {
            WScript.Echo("Found ID in: " + file.Name);
            var chunks = t.split(/<table[^>]*class="[^"]*kyujin/i);
            for (var i = 1; i < chunks.length; i++) {
                if (chunks[i].indexOf("13010-48716861") !== -1) {
                    var m_title = chunks[i].match(/class="fb">([\s\S]*?)<\/div>/);
                    WScript.Echo("  Title match: " + (m_title !== null));
                }
            }
        }
    }
    files.moveNext();
}
