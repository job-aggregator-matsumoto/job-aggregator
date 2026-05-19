var fso = new ActiveXObject("Scripting.FileSystemObject");
var sourceDir = "C:\\Users\\user\\OneDrive\\Documents\\\u6c42\u4eba\u307e\u3068\u3081\u30b5\u30a4\u30c8";

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

function check(path) {
    var u8 = readAs(path, "utf-8");
    var sj = readAs(path, "Shift_JIS");
    
    // "受付年月日" in Unicode
    var label = "\u53d7\u4ed8\u5e74\u6708\u65e5";
    var u8_ok = u8 && (u8.indexOf(label) !== -1);
    var sj_ok = sj && (sj.indexOf(label) !== -1);
    
    return {u8: u8_ok, sj: sj_ok};
}

var folder = fso.GetFolder(sourceDir);
var files = new Enumerator(folder.Files);
var count = 0;
while (!files.atEnd()) {
    var f = files.item();
    if (f.Name.toLowerCase().indexOf(".html") !== -1) {
        var res = check(f.Path);
        WScript.Echo(f.Name + ": UTF-8=" + res.u8 + ", Shift_JIS=" + res.sj);
        count++;
    }
    files.moveNext();
}
WScript.Echo("Total files: " + count);
