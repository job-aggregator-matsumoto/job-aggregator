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
        // Find the title field inside the JSON slice
        var start = Math.max(0, idx - 150);
        var end = Math.min(text.length, idx + 600);
        var slice = text.substring(start, end);
        
        // Find "title":"..."
        var m = slice.match(/"title"\s*:\s*"([^"]+)"/);
        if (m) {
            var title = m[1];
            WScript.Echo("Title string: " + title);
            WScript.Echo("Title length: " + title.length);
            
            var hexPoints = [];
            for (var i = 0; i < title.length; i++) {
                var code = title.charCodeAt(i);
                var hex = code.toString(16).toUpperCase();
                while (hex.length < 4) hex = "0" + hex;
                hexPoints.push("U+" + hex);
            }
            WScript.Echo("Code points: " + hexPoints.join(" "));
        } else {
            WScript.Echo("Could not extract title field from slice");
        }
    } else {
        WScript.Echo("Target ID not found");
    }
} catch(e) {
    WScript.Echo("Error: " + e.message);
}
