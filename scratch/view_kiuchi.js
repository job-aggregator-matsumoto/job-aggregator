var fso = new ActiveXObject("Scripting.FileSystemObject");
var baseDir = fso.GetParentFolderName(WScript.ScriptFullName);
var targetFile = fso.BuildPath(fso.BuildPath(fso.GetParentFolderName(baseDir), "data"), "jobs_data.js");

function readAs(path, charset) {
    var stream = new ActiveXObject("ADODB.Stream");
    stream.Type = 2; stream.Charset = charset; stream.Open(); stream.LoadFromFile(path);
    var text = stream.ReadText(); stream.Close(); return text;
}

var content = readAs(targetFile, "utf-8");
// Extract the job block for Kiuchi Farm (ID: 12060-01008361 or 1206001008361)
var match = content.match(/\{\s*"id":\s*"12060-01008361"[\s\S]*?\}/i) || content.match(/\{\s*"id":\s*"1206001008361"[\s\S]*?\}/i);

if (match) {
    WScript.Echo("=== Found Job Listing ===");
    WScript.Echo(match[0]);
} else {
    WScript.Echo("Job listing not found in jobs_data.js!");
}
