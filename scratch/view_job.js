function readUtf8(path) {
    var stream = new ActiveXObject("ADODB.Stream");
    stream.Type = 2; stream.Charset = "utf-8"; stream.Open(); stream.LoadFromFile(path);
    var text = stream.ReadText(); stream.Close(); return text;
}

try {
    var text = readUtf8("data\\jobs_data.js");
    var targetId = "13010-48716861";
    var idx = text.indexOf(targetId);
    
    if (idx >= 0) {
        WScript.Echo("Found target ID at string index: " + idx);
        // Extract a chunk before and after the ID to see the full object structure
        var start = Math.max(0, idx - 150);
        var end = Math.min(text.length, idx + 600);
        var slice = text.substring(start, end);
        
        WScript.Echo("--- Raw JSON Slice ---");
        WScript.Echo(slice);
    } else {
        WScript.Echo("Target ID " + targetId + " not found in jobs_data.js");
    }
} catch(e) {
    WScript.Echo("Error: " + e.message);
}
