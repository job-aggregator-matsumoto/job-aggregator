var fso = new ActiveXObject("Scripting.FileSystemObject");
function readUtf8(path) {
    var stream = new ActiveXObject("ADODB.Stream");
    stream.Type = 2; stream.Charset = "utf-8"; stream.Open(); stream.LoadFromFile(path);
    var text = stream.ReadText(); stream.Close(); return text;
}
var h = readUtf8("scratch\\chunk1.html");
var m = h.match(/<div class="flex jus_center"><div>(.)(.)<\/div>/);
if (m) {
    WScript.Echo("Char 1: " + m[1].charCodeAt(0));
    WScript.Echo("Char 2: " + m[2].charCodeAt(0));
} else {
    WScript.Echo("Not found");
}
