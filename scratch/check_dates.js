var fso = new ActiveXObject("Scripting.FileSystemObject");
var sourceDir = "C:\\Users\\user\\OneDrive\\Documents\\\u6c42\u4eba\u307e\u3068\u3081\u30b5\u30a4\u30c8";

function readAs(path, charset) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; stream.Charset = charset; stream.Open(); stream.LoadFromFile(path);
        var text = stream.ReadText(); stream.Close(); return text;
    } catch(e) { return null; }
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
    return null;
}

var folder = fso.GetFolder(sourceDir);
var files = new Enumerator(folder.Files);
while (!files.atEnd()) {
    var f = files.item();
    if (f.Name.toLowerCase().indexOf(".html") !== -1) {
        var content = readAs(f.Path, "utf-8");
        if (content) {
            var date = extractDate(content);
            WScript.Echo(f.Name + ": " + date);
        }
    }
    files.moveNext();
}
