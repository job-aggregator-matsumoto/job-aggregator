var fso = new ActiveXObject("Scripting.FileSystemObject");
function readUtf8(path) {
    var stream = new ActiveXObject("ADODB.Stream");
    stream.Type = 2; stream.Charset = "utf-8"; stream.Open(); stream.LoadFromFile(path);
    var text = stream.ReadText(); stream.Close(); return text;
}
function readSjis(path) {
    var stream = new ActiveXObject("ADODB.Stream");
    stream.Type = 2; stream.Charset = "Shift_JIS"; stream.Open(); stream.LoadFromFile(path);
    var text = stream.ReadText(); stream.Close(); return text;
}

var sourceFolder = fso.GetFolder("C:\\Users\\user\\Google ドライブ ストリーミング\\共有ドライブ\\求人情報PDF");
var files = new Enumerator(sourceFolder.Files);
var firstHtml = null;
while (!files.atEnd()) {
    var file = files.item();
    if (file.Name.toLowerCase().indexOf(".html") !== -1) {
        firstHtml = file.Path;
        break;
    }
    files.moveNext();
}

if (firstHtml) {
    WScript.Echo("File: " + firstHtml);
    var t = readUtf8(firstHtml);
    WScript.Echo("UTF8 isCorrect: " + (t.indexOf("\u53d7\u4ed8\u5e74\u6708\u65e5") !== -1));
    var t2 = readSjis(firstHtml);
    WScript.Echo("SJIS isCorrect: " + (t2.indexOf("\u53d7\u4ed8\u5e74\u6708\u65e5") !== -1));
    
    var h = (t.indexOf("\u53d7\u4ed8\u5e74\u6708\u65e5") !== -1) ? t : t2;
    var chunks = h.split(/<table[^>]*class="[^"]*kyujin/i);
    if (chunks.length > 1) {
        var chunk = chunks[1];
        var m_title = chunk.match(/class="fb">([\s\S]*?)<\/div>/);
        WScript.Echo("Title Match: " + (m_title !== null));
        if (m_title) WScript.Echo("Title: " + m_title[1].replace(/<[^>]+>/g,"").substring(0, 30));
    }
}
