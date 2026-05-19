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

if (-not (Test-Path $srcPath)) {
    Write-Host "Source directory not found: $srcPath"
    exit
}

$files = Get-ChildItem -Path $srcPath -Filter "*.html"
$uHello = ([string][char]0x30cf) + [char]0x30ed + [char]0x30fc + [char]0x30ef + [char]0x30fc + [char]0x30af # ハローワーク
$uCo = ([string][char]0x4e8b) + [char]0x696d + [char]0x6240 + [char]0x540d # 事業所名

Write-Host "Scanning $($files.Count) files..."
$misdetectedCount = 0

foreach ($file in $files) {
    $b = [System.IO.File]::ReadAllBytes($file.FullName)
    $tUtf8 = [System.Text.Encoding]::UTF8.GetString($b)
    $tSjis = [System.Text.Encoding]::GetEncoding(932).GetString($b)
    
    # Meta Charset check
    $metaUtf8 = $false
    if ($tUtf8 -match "(?i)charset\s*=\s*[\x22']?utf-8") {
        $metaUtf8 = $true
    }
    
    # Current detection logic
    $detectedEncoding = "Shift_JIS"
    if ($tUtf8.IndexOf($uHello) -ge 0) {
        $detectedEncoding = "UTF-8"
    }
    
    # Real encoding check: does it contain '事業所名' when decoded as UTF-8 or Shift_JIS?
    $hasCoUtf8 = $tUtf8.Contains($uCo)
    $hasCoSjis = $tSjis.Contains($uCo)
    
    $actualEncoding = "Unknown"
    if ($hasCoUtf8 -and -not $hasCoSjis) {
        $actualEncoding = "UTF-8"
    } elseif ($hasCoSjis -and -not $hasCoUtf8) {
        $actualEncoding = "Shift_JIS"
    } elseif ($hasCoUtf8 -and $hasCoSjis) {
        $actualEncoding = "Both (ASCII only?)"
    }
    
    if ($detectedEncoding -ne $actualEncoding -and $actualEncoding -ne "Unknown" -and $actualEncoding -ne "Both (ASCII only?)") {
        $misdetectedCount++
        Write-Host "MISDETECTION on: $($file.Name)"
        Write-Host "  Meta tag indicates UTF-8: $metaUtf8"
        Write-Host "  Has 'ハローワーク' in UTF-8: $($tUtf8.Contains($uHello))"
        Write-Host "  Has '事業所名' in UTF-8: $hasCoUtf8"
        Write-Host "  Has '事業所名' in Shift_JIS: $hasCoSjis"
        Write-Host "  Detected: $detectedEncoding | Actual: $actualEncoding"
        Write-Host "----------------------------------------"
    }
}

Write-Host "Scan finished. Total misdetected files: $misdetectedCount"
