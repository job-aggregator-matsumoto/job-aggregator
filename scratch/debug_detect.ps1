try {
    $baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $googleRoot = (Get-Item $baseDir).Parent.Parent.Parent.FullName
    $sharedName = [string][char]0x5171 + [char]0x6709 + [char]0x30c9 + [char]0x30e9 + [char]0x30a4 + [char]0x30d6
    $sourceName = [string][char]0x6c42 + [char]0x4eba + [char]0x60c5 + [char]0x5831 + "PDF"
    $srcPath = "$googleRoot\$sharedName\$sourceName"
} catch {
    Write-Host "Failed to resolve path"
    exit
}

$files = Get-ChildItem -Path $srcPath -Filter "*.html"
foreach ($file in $files) {
    $b = [System.IO.File]::ReadAllBytes($file.FullName)
    $utf8 = [System.Text.Encoding]::UTF8.GetString($b)
    
    if ($utf8.Contains("13010-48716861")) {
        Write-Host "Analyzing file: $($file.Name)"
        
        $uHello = ([string][char]0x30cf) + [char]0x30ed + [char]0x30fc + [char]0x30ef + [char]0x30fc + [char]0x30af # ハローワーク
        $hasHelloUtf8 = $utf8.IndexOf($uHello) -ge 0
        Write-Host "Has 'ハローワーク' in UTF-8: $hasHelloUtf8 (Index: $($utf8.IndexOf($uHello)))"
        
        # Test other common markers
        $uCo = ([string][char]0x4e8b) + [char]0x696d + [char]0x6240 + [char]0x540d # 事業所名
        $uNum = ([string][char]0x6c42) + [char]0x4eba + [char]0x756a + [char]0x53f7 # 求人番号
        $uDate1 = ([string][char]0x53d7) + [char]0x4ed8 + [char]0x5e74 + [char]0x6708 + [char]0x65e5 # 受付年月日
        $uDate2 = ([string][char]0x53d7) + [char]0x7406 + [char]0x5e74 + [char]0x6708 + [char]0x65e5 # 受理年月日
        
        Write-Host "Has '事業所名' in UTF-8: $($utf8.IndexOf($uCo) -ge 0) (Index: $($utf8.IndexOf($uCo)))"
        Write-Host "Has '求人番号' in UTF-8: $($utf8.IndexOf($uNum) -ge 0) (Index: $($utf8.IndexOf($uNum)))"
        Write-Host "Has '受付年月日' in UTF-8: $($utf8.IndexOf($uDate1) -ge 0) (Index: $($utf8.IndexOf($uDate1)))"
        Write-Host "Has '受理年月日' in UTF-8: $($utf8.IndexOf($uDate2) -ge 0) (Index: $($utf8.IndexOf($uDate2)))"
        
        # Also check meta charset tag
        if ($utf8 -match "(?i)charset\s*=\s*[\x22']?([a-z0-9_-]+)") {
            Write-Host "Meta Charset tag found: $($Matches[1])"
        } else {
            Write-Host "No meta charset tag matched"
        }
        break
    }
}
