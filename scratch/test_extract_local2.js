var fso = new ActiveXObject("Scripting.FileSystemObject");

function readUtf8(path) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; stream.Charset = "utf-8"; stream.Open(); stream.LoadFromFile(path);
        var text = stream.ReadText(); stream.Close(); return text;
    } catch(e) { return null; }
}

var content = readUtf8("html_full_sample.html");
var chunks = content.split(/<table[^>]*class="[^"]*kyujin/i);
var h = chunks[1];

var m = h.match(/<t[hd][^>]*>[\s\S]*?\u8cc1\u91d1[\s\S]*?<\/tr>/i);
if (m) {
    WScript.Echo("FOUND ROW:\n" + m[0].substr(0, 500));
} else {
    WScript.Echo("NOT FOUND IN CHUNK");
}
