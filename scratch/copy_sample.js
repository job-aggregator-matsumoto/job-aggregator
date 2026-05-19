var fso = new ActiveXObject("Scripting.FileSystemObject");
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
    fso.CopyFile(firstHtml, "scratch\\source_sample.html", true);
    WScript.Echo("Copied " + firstHtml);
}
