var fso = new ActiveXObject("Scripting.FileSystemObject");
function readUtf8(path) {
    var stream = new ActiveXObject("ADODB.Stream");
    stream.Type = 2; stream.Charset = "utf-8"; stream.Open(); stream.LoadFromFile(path);
    var text = stream.ReadText(); stream.Close(); return text;
}
var text = readUtf8("data\\jobs_data.js");
var countUnknown = text.match(/"title": "Unknown"/g);
var c = countUnknown ? countUnknown.length : 0;
WScript.Echo("Unknown titles: " + c);
