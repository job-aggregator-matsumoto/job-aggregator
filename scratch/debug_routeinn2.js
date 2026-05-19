var fso = new ActiveXObject("Scripting.FileSystemObject");
var path = "C:\\Users\\user\\Google \u30c9\u30e9\u30a4\u30d6 \u30b9\u30c8\u30ea\u30fc\u30df\u30f3\u30b0\\\u5171\u6709\u30c9\u30e9\u30a4\u30d6\\\u6c42\u4eba\u60c5\u5831PDF\\\u30cf\u30ed\u30fc\u30ef\u30fc\u30af\u30a4\u30f3\u30bf\u30fc\u30cd\u30c3\u30c8\u30b5\u30fc\u30d3\u30b9 - \u6c42\u4eba\u60c5\u5831\u691c\u7d22\u30fb\u4e00\u89a71.html";

function readAs(path, charset) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; stream.Charset = charset; stream.Open(); stream.LoadFromFile(path);
        var text = stream.ReadText(); stream.Close(); return text;
    } catch(e) { return null; }
}

function writeUtf8(path, text) {
    var stream = new ActiveXObject("ADODB.Stream");
    stream.Type = 2; stream.Charset = "utf-8"; stream.Open();
    stream.WriteText(text); stream.SaveToFile(path, 2); stream.Close();
}

var text = readAs(path, "utf-8");
if (!text || text.indexOf("\u6c42\u4eba\u756a\u53f7") === -1) {
    text = readAs(path, "Shift_JIS");
}

var chunks = text.split(/<table[^>]*class="[^"]*kyujin/i);
for (var i = 1; i < chunks.length; i++) {
    if (chunks[i].indexOf("\u30eb\u30fc\u30c8\u30a4\u30f3\u30b8\u30e3\u30d1\u30f3") !== -1) {
        writeUtf8("c:\\Users\\user\\Google \u30c9\u30e9\u30a4\u30d6 \u30b9\u30c8\u30ea\u30fc\u30df\u30f3\u30b0\\\u30de\u30a4\u30c9\u30e9\u30a4\u30d6\\\u6c42\u4eba\u60c5\u5831\u307e\u3068\u3081\u30b5\u30a4\u30c8\\scratch\\debug_routeinn.html", chunks[i]);
        WScript.Echo("Dumped to scratch/debug_routeinn.html");
        break;
    }
}
