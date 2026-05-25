var fso = new ActiveXObject("Scripting.FileSystemObject");
function readAs(path, charset) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; stream.Charset = charset; stream.Open(); stream.LoadFromFile(path);
        var text = stream.ReadText(); stream.Close(); return text;
    } catch(e) { return null; }
}
var editsJson = readAs("data\\manual_edits.json", "utf-8");
if (editsJson.charCodeAt(0) === 0xFEFF) editsJson = editsJson.substring(1);
editsJson = editsJson.replace(/^\s+|\s+$/g, '');

var editsArray = eval("(" + editsJson + ")");
var override = editsArray[0];

var job = {
    id: "22020-11078461",
    title: "old title",
    company: "old company"
};

try {
    WScript.Echo("Before title");
    job.title = override.title;
    WScript.Echo("Before company");
    job.company = override.company;
    WScript.Echo("Before location");
    job.location = override.location;
    WScript.Echo("Before salary");
    job.salary = override.salary;
    WScript.Echo("Before workingHours");
    job.workingHours = override.workingHours;
    WScript.Echo("Before holiday");
    job.holiday = override.holiday;
    WScript.Echo("Before description");
    job.description = override.description;
    WScript.Echo("Before postedAt");
    job.postedAt = override.postedAt;
    
    WScript.Echo("Success!");
} catch(e) {
    WScript.Echo("Error: " + e.message);
}
