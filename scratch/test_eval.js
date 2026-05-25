var fso = new ActiveXObject("Scripting.FileSystemObject");
function readAs(path, charset) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; stream.Charset = charset; stream.Open(); stream.LoadFromFile(path);
        var text = stream.ReadText(); stream.Close(); return text;
    } catch(e) { return null; }
}
var editsJson = readAs("data\\manual_edits.json", "utf-8");
if (!editsJson) {
    WScript.Echo("Could not read file");
    WScript.Quit(1);
}
WScript.Echo("Length: " + editsJson.length);
WScript.Echo("Start: " + editsJson.substring(0, 10));
WScript.Echo("End: " + editsJson.substring(editsJson.length - 10));

try {
    var editsArray = eval("(" + editsJson + ")");
    WScript.Echo("Success: " + editsArray.length);
} catch(e) {
    WScript.Echo("Error: " + e.message);
}
