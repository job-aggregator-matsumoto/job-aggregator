function readAs(path, charset) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; stream.Charset = charset; stream.Open(); stream.LoadFromFile(path);
        var text = stream.ReadText(); stream.Close(); return text;
    } catch(e) { return null; }
}

function clean(s) {
    if (!s) return "";
    var res = String(s).replace(/<[^>]+>/g, "").replace(/^\s+|\s+$/g, "");
    res = res.replace(/\uff1a/g, "");
    return res.replace(/\r\n|\n|\r/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
}

var fso = new ActiveXObject("Scripting.FileSystemObject");
var sourceDir = "C:\\Users\\user\\Google \u30c9\u30e9\u30a4\u30d6 \u30b9\u30c8\u30ea\u30fc\u30df\u30f3\u30b0\\\u5171\u6709\u30c9\u30e9\u30a4\u30d6\\\u6c42\u4eba\u60c5\u5831PDF";

if (fso.FolderExists(sourceDir)) {
    var folder = fso.GetFolder(sourceDir);
    var files = new Enumerator(folder.Files);
    var foundFile = null;
    while (!files.atEnd()) {
        var f = files.item();
        if (f.Name.toLowerCase().indexOf(".html") !== -1) {
            foundFile = f.Path;
            break;
        }
        files.moveNext();
    }
    
    if (foundFile) {
        var content = readAs(foundFile, "utf-8");
        if (content) {
            var chunks = content.split(/<table[^>]*class="[^"]*kyujin/i);
            if (chunks.length > 1) {
                var h = chunks[1];
                WScript.Echo("Testing first chunk of length: " + h.length);
                
                var fbIndex = h.indexOf("class=\"fb\"");
                WScript.Echo("Index of class=\"fb\": " + fbIndex);
                
                if (fbIndex >= 0) {
                    var slice = h.substring(fbIndex, fbIndex + 200);
                    WScript.Echo("HTML Slice: " + slice);
                    
                    var m_title = h.match(/class="fb">([\s\S]*?)<\/div>/);
                    WScript.Echo("Match object exists: " + (m_title !== null));
                    if (m_title) {
                        WScript.Echo("Match [0]: " + m_title[0].substring(0, 100));
                        WScript.Echo("Match [1] (title): " + m_title[1].substring(0, 100));
                        WScript.Echo("Clean Title: " + clean(m_title[1]));
                    }
                }
            } else {
                WScript.Echo("No chunks found in file.");
            }
        }
    }
} else {
    WScript.Echo("Folder not found.");
}
