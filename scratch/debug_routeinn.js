var fso = new ActiveXObject("Scripting.FileSystemObject");
var path = "C:\\Users\\user\\Google \u30c9\u30e9\u30a4\u30d6 \u30b9\u30c8\u30ea\u30fc\u30df\u30f3\u30b0\\\u5171\u6709\u30c9\u30e9\u30a4\u30d6\\\u6c42\u4eba\u60c5\u5831PDF\\\u30cf\u30ed\u30fc\u30ef\u30fc\u30af\u30a4\u30f3\u30bf\u30fc\u30cd\u30c3\u30c8\u30b5\u30fc\u30d3\u30b9 - \u6c42\u4eba\u60c5\u5831\u691c\u7d22\u30fb\u4e00\u89a71.html";

function readAs(path, charset) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; stream.Charset = charset; stream.Open(); stream.LoadFromFile(path);
        var text = stream.ReadText(); stream.Close(); return text;
    } catch(e) { return null; }
}

var text = readAs(path, "utf-8");
if (!text || text.indexOf("\u6c42\u4eba\u756a\u53f7") === -1) {
    text = readAs(path, "Shift_JIS");
}

if (!text) {
    WScript.Echo("Could not read file!");
    WScript.Quit();
}

// Find chunk with "ルートインジャパン" (\u30eb\u30fc\u30c8\u30a4\u30f3\u30b8\u30e3\u30d1\u30f3)
var chunks = text.split(/<table[^>]*class="[^"]*kyujin/i);
var found = false;
for (var i = 1; i < chunks.length; i++) {
    if (chunks[i].indexOf("\u30eb\u30fc\u30c8\u30a4\u30f3\u30b8\u30e3\u30d1\u30f3") !== -1) {
        WScript.Echo("Found listing!");
        found = true;
        
        var m_id = chunks[i].match(/(\d{5}-\d{8})/);
        WScript.Echo("ID: " + (m_id ? m_id[1] : "unknown"));
        
        // Match Working Hours
        var m_hours = chunks[i].match(/<t[hd][^>]*>[\s\S]*?\u5c31\u696d\u6642\u9593[\s\S]*?<\/t[hd]>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i);
        WScript.Echo("Working Hours Raw HTML: " + (m_hours ? m_hours[1].substring(0, 200).replace(/\r\n|\n|\r/g, " ") : "Not found"));
        
        // Also look for alternate labels for working hours in the chunk
        var m_all_labels = chunks[i].match(/<th[^>]*class="label_col"[^>]*>([\s\S]*?)<\/th>/g);
        if(!m_all_labels) m_all_labels = chunks[i].match(/<td[^>]*class="label_col"[^>]*>([\s\S]*?)<\/td>/g);
        
        WScript.Echo("Labels found in table:");
        if (m_all_labels) {
            for(var j=0; j<m_all_labels.length; j++) {
                var cleanLabel = m_all_labels[j].replace(/<[^>]+>/g, "").replace(/\r\n|\n|\r/g, "").replace(/\s+/g, " ");
                if (cleanLabel.indexOf("\u6642\u9593") !== -1 || cleanLabel.indexOf("\u5c31\u696d") !== -1) {
                    WScript.Echo("  " + cleanLabel);
                }
            }
        }
        break;
    }
}
if (!found) WScript.Echo("Listing not found in this file.");
