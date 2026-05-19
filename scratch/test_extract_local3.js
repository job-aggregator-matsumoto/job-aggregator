var fso = new ActiveXObject("Scripting.FileSystemObject");
function readUtf8(path) {
    var stream = new ActiveXObject("ADODB.Stream");
    stream.Type = 2; stream.Charset = "utf-8"; stream.Open(); stream.LoadFromFile(path);
    var text = stream.ReadText(); stream.Close(); return text;
}
function writeUtf8(path, text) {
    var stream = new ActiveXObject("ADODB.Stream");
    stream.Type = 2; stream.Charset = "utf-8"; stream.Open();
    stream.WriteText(text); stream.SaveToFile(path, 2); stream.Close();
}
var content = readUtf8("html_full_sample.html");
var chunks = content.split(/<table[^>]*class="[^"]*kyujin/i);
writeUtf8("scratch\\chunk1.html", chunks[1]);
