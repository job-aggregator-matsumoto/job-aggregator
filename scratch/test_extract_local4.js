var fso = new ActiveXObject("Scripting.FileSystemObject");
function readUtf8(path) {
    var stream = new ActiveXObject("ADODB.Stream");
    stream.Type = 2; stream.Charset = "utf-8"; stream.Open(); stream.LoadFromFile(path);
    var text = stream.ReadText(); stream.Close(); return text;
}
var h = readUtf8("scratch\\chunk1.html");

WScript.Echo("Contains Salary? " + (h.indexOf("\u8cc1\u91d1") >= 0));

var m1 = h.match(/\u8cc1\u91d1/);
WScript.Echo("Match literal: " + (m1 !== null));

var m2 = h.match(/<td[^>]*>[\s\S]*?\u8cc1\u91d1[\s\S]*?<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i);
if (m2) WScript.Echo("Match robust: " + m2[1].substr(0, 50));
else WScript.Echo("Match robust failed");

var m3 = h.match(/<t[hd][^>]*>[\s\S]*?\u8cc1\u91d1[\s\S]*?<\/t[hd]>[^<]*<td[^>]*>([\s\S]*?)<\/td>/i);
if (m3) WScript.Echo("Match 3: " + m3[1].substr(0, 50));
else WScript.Echo("Match 3 failed");

var m4 = h.match(/\u8cc1\u91d1[\s\S]*?<\/t[hd]>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i);
if (m4) WScript.Echo("Match 4: " + m4[1].substr(0, 50));
else WScript.Echo("Match 4 failed");

