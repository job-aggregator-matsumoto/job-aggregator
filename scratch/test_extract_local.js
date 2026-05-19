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
    return res.replace(/\r\n|\n|\r/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
}

function extract(h, label, labelName) {
    var labelEscaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    WScript.Echo("DEBUG: Testing label [" + labelName + "] (" + label + ")");
    
    var p = "<t[hd][^>]*>[\\s\\S]*?" + labelEscaped + "[\\s\\S]*?</t[hd]>[\\s\\S]*?<td[^>]*>([\\s\\S]*?)</td>";
    var m = h.match(new RegExp(p, "i"));
    if (m) {
        WScript.Echo("  Matched: " + clean(m[1]));
        return clean(m[1]);
    }
    
    WScript.Echo("  NO MATCH for [" + labelName + "]");
    return "";
}

var content = readUtf8("html_full_sample.html");
if (!content) {
    WScript.Echo("Failed to read html_full_sample.html");
    WScript.Quit();
}

var chunks = content.split(/<table[^>]*class="[^"]*kyujin/i);
if (chunks.length > 1) {
    var h = chunks[1];
    WScript.Echo("Processing chunk 1... (Length: " + h.length + ")");
    
    var titleMatch = h.match(/class="fb">([\s\S]*?)<\/div>/);
    var jobTitle = titleMatch ? clean(titleMatch[1]) : "Unknown";
    WScript.Echo("Job Title: " + jobTitle);
    
    extract(h, "\u8cc1\u91d1", "Salary");
    extract(h, "\u4ed5\u4e8b\u5185\u5bb9", "Description");
    extract(h, "\u5c31\u696d\u5834\u6240", "Location");
    extract(h, "\u4f11\u65e5", "Holiday");
}
