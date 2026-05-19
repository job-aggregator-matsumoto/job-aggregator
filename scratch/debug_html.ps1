$dir = Get-Item $PSScriptRoot
$sharedName = [char]0x5171 + [char]0x6709 + [char]0x30c9 + [char]0x30e9 + [char]0x30a4 + [char]0x30d6
$sourceName = [char]0x6c42 + [char]0x4eba + [char]0x60c5 + [char]0x5831 + "PDF"

while ($dir -and -not (Test-Path (Join-Path $dir.FullName $sharedName))) {
    $dir = $dir.Parent
}

$googleRoot = $dir.FullName
$srcPath = Join-Path $googleRoot "$sharedName\$sourceName"

$file = Get-ChildItem -Path $srcPath -Filter "*.html" | Select-Object -First 1
Copy-Item $file.FullName -Destination html_full_sample.html
