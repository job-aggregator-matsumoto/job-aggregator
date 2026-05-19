$dir = Get-Item $PSScriptRoot
$sharedName = [char]0x5171 + [char]0x6709 + [char]0x30c9 + [char]0x30e9 + [char]0x30a4 + [char]0x30d6
$sourceName = [char]0x6c42 + [char]0x4eba + [char]0x60c5 + [char]0x5831 + "PDF"

while ($dir -and -not (Test-Path (Join-Path $dir.FullName $sharedName))) {
    $dir = $dir.Parent
}

$googleRoot = $dir.FullName
$srcPath = Join-Path $googleRoot "$sharedName\$sourceName"

$file = Get-ChildItem -Path $srcPath -Filter "*.html" | Select-Object -First 1
$b = [System.IO.File]::ReadAllBytes($file.FullName)

$uHello = [char]0x30cf + [char]0x30ed + [char]0x30fc + [char]0x30ef + [char]0x30fc + [char]0x30af

$tUtf8 = [System.Text.Encoding]::UTF8.GetString($b)
$tSjis = [System.Text.Encoding]::GetEncoding(932).GetString($b)

$res = "File: $($file.Name)`n"
$res += "UTF8 IndexOf Hello: $($tUtf8.IndexOf($uHello))`n"
$res += "SJIS IndexOf Hello: $($tSjis.IndexOf($uHello))`n"
$res += "UTF8 Sample: $($tUtf8.Substring(0, 100))`n"
$res += "SJIS Sample: $($tSjis.Substring(0, 100))`n"

$res | Out-File -FilePath encoding_test.txt -Encoding UTF8
