// Read UTF-8 file in JScript WSH
function readUtf8(path) {
    var stream = new ActiveXObject("ADODB.Stream");
    stream.Type = 2; // text
    stream.Charset = "utf-8";
    stream.Open();
    stream.LoadFromFile(path);
    var content = stream.ReadText();
    stream.Close();
    return content;
}

try {
    var content = readUtf8("c:\\Users\\user\\Google \u30c9\u30e9\u30a4\u30d6 \u30b9\u30c8\u30ea\u30fc\u30df\u30f3\u30b0\\\u30de\u30a4\u30c9\u30e9\u30a4\u30d6\\\u6c42\u4eba\u60c5\u5831\u307e\u3068\u3081\u30b5\u30a4\u30c8\\data\\jobs_data.js");
    
    // Replace const and let with var for WSH JScript compatibility
    content = content.replace(/\bconst\b/g, "var").replace(/\blet\b/g, "var");
    
    // Evaluate data
    var initialJobsData = [];
    var lastUpdated = "";
    eval(content);
    
    WScript.Echo("--- Database Diagnostics (WSH) ---");
    WScript.Echo("Total jobs loaded: " + initialJobsData.length);
    
    var keywords = ["\u4e8b\u52d9", "\u54c1\u51fa\u3057", "\u4ecb\u8b77", "\u8ca9\u58f2"]; // 事務, 品出し, 介護, 販売
    var kwLabels = ["\u4e8b\u52d9 (Office)", "\u54c1\u51fa\u3057 (Stocking)", "\u4ecb\u8b77 (Nursing)", "\u8ca9\u58f2 (Sales)"];
    
    for (var i = 0; i < keywords.length; i++) {
        var kw = keywords[i];
        var label = kwLabels[i];
        var matchesTitle = 0;
        var matchesDesc = 0;
        var matchesAny = 0;
        
        for (var j = 0; j < initialJobsData.length; j++) {
            var job = initialJobsData[j];
            var t = (job.title || "").toLowerCase();
            var d = (job.description || "").toLowerCase();
            var c = (job.company || "").toLowerCase();
            var type = (job.type || "").toLowerCase();
            
            var inTitle = t.indexOf(kw) !== -1;
            var inDesc = d.indexOf(kw) !== -1;
            var inAny = inTitle || inDesc || c.indexOf(kw) !== -1 || type.indexOf(kw) !== -1;
            
            if (inTitle) matchesTitle++;
            if (inDesc) matchesDesc++;
            if (inAny) matchesAny++;
        }
        
        WScript.Echo("Keyword: " + label);
        WScript.Echo("  Matches in Title: " + matchesTitle);
        WScript.Echo("  Matches in Description: " + matchesDesc);
        WScript.Echo("  Matches total (any): " + matchesAny);
    }
    
    WScript.Echo("\n--- Sample Titles (first 10) ---");
    var limit = Math.min(10, initialJobsData.length);
    for (var k = 0; k < limit; k++) {
        var jb = initialJobsData[k];
        WScript.Echo((k+1) + ". [" + jb.type + "] " + jb.title + " at " + jb.company);
    }
    
} catch (e) {
    WScript.Echo("Error: " + e.message);
}
