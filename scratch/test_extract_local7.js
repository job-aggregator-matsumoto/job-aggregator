var fso = new ActiveXObject("Scripting.FileSystemObject");
function readUtf8(path) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; stream.Charset = "utf-8"; stream.Open(); stream.LoadFromFile(path);
        var text = stream.ReadText(); stream.Close(); return text;
    } catch(e) { return null; }
}
function clean(s) {
    if (!s) return "";
    var res = String(s).replace(/<[^>]+>/g, "").replace(/^\s+|\s+$/g, "");
    res = res.replace(/\uff1a/g, "");
    res = res.replace(/\s*\u753b\u50cf\u3042\u308a\s*$/g, "");
    return res.replace(/\r\n|\n|\r/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
}
function extract(h, label) {
    var labelEscaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var p = "<t[hd][^>]*>[\\s\\S]*?" + labelEscaped + "[\\s\\S]*?</t[hd]>[\\s\\S]*?<td[^>]*>([\\s\\S]*?)</td>";
    var m = h.match(new RegExp(p, "i"));
    if (m) return clean(m[1]);
    return "";
}

var content = readUtf8("scratch\\source_sample.html");
var chunks = content.split(/<table[^>]*class="[^"]*kyujin/i);
var h = chunks[1];

var m_id = h.match(/(\d{5}-\d{8})/);
var currentJobId = m_id[1];

var m_title = h.match(/class="fb">([\s\S]*?)<\/div>/);
var currentJobTitle = "Unknown";
if (m_title && m_title[1]) {
    currentJobTitle = clean(m_title[1]);
}
if (!currentJobTitle) currentJobTitle = "Unknown";

var salary = extract(h, "\u8cc3\u91d1");

WScript.Echo("ID: " + currentJobId);
WScript.Echo("Title: " + currentJobTitle.substring(0, 30));
WScript.Echo("Salary: " + salary.substring(0, 30));

var isRemote = /[\u5728\u5b85]|[\u30ea\u30e2\u30fc\u30c8]|[\u30c6\u30ec\u30ef\u30fc\u30af]/.test(String(currentJobTitle));
WScript.Echo("Remote: " + isRemote);
