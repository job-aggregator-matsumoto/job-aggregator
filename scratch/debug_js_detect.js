function readAs(path, charset) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; stream.Charset = charset; stream.Open(); stream.LoadFromFile(path);
        var text = stream.ReadText(); stream.Close(); return text;
    } catch(e) { return null; }
}

function isCorrect(t) {
    if (!t) return false;
    
    var idx1 = t.indexOf("\u53d7\u4ed8\u5e74\u6708\u65e5");
    var idx2 = t.indexOf("\u53d7\u7406\u5e74\u6708\u65e5");
    var idx3 = t.indexOf("\u4e8b\u696d\u6240\u540d");
    var idx4 = t.indexOf("\u6c42\u4eba\u756a\u53f7");
    
    WScript.Echo("  Indexes - Date1: " + idx1 + ", Date2: " + idx2 + ", Company: " + idx3 + ", JobNum: " + idx4);
    
    return (idx1 !== -1 || idx2 !== -1 || idx3 !== -1 || idx4 !== -1);
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
            WScript.Echo("Testing with file: " + f.Name);
            break;
        }
        files.moveNext();
    }
    
    if (foundFile) {
        WScript.Echo("--- Reading as utf-8 ---");
        var tUtf8 = readAs(foundFile, "utf-8");
        WScript.Echo("  tUtf8 loaded, length: " + (tUtf8 ? tUtf8.length : "null"));
        WScript.Echo("  isCorrect(utf8): " + isCorrect(tUtf8));
        
        WScript.Echo("--- Reading as Shift_JIS ---");
        var tSjis = readAs(foundFile, "Shift_JIS");
        WScript.Echo("  tSjis loaded, length: " + (tSjis ? tSjis.length : "null"));
        WScript.Echo("  isCorrect(Sjis): " + isCorrect(tSjis));
    } else {
        WScript.Echo("No HTML files found.");
    }
} else {
    WScript.Echo("Folder not found.");
}
