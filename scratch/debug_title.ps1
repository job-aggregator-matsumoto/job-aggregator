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
$found = $false

foreach ($file in $files) {
    $b = [System.IO.File]::ReadAllBytes($file.FullName)
    $utf8 = [System.Text.Encoding]::UTF8.GetString($b)
    $sjis = [System.Text.Encoding]::GetEncoding(932).GetString($b)
    
    # Check if the target ID is in this file
    if ($utf8.Contains("13010-48716861")) {
        $found = $true
        Write-Host "Found ID in file: $($file.Name)"
        
        foreach ($enc in @("UTF-8", "Shift_JIS")) {
            $t = if ($enc -eq "UTF-8") { $utf8 } else { $sjis }
            $chunks = $t -split '<table[^>]*class="[^"]*kyujin'
            for ($i = 1; $i -lt $chunks.Count; $i++) {
                if ($chunks[$i] -match "13010-48716861") {
                    Write-Host "--- Encoding: $enc ---"
                    if ($chunks[$i] -match 'class="fb">([\s\S]*?)</div>') {
                        $rawTitle = $Matches[1]
                        $cleanTitle = ($rawTitle -replace '<[^>]+>', '' -replace '\s+', ' ').Trim()
                        
                        Write-Host "Raw Title: $rawTitle"
                        Write-Host "Clean Title: $cleanTitle"
                    } else {
                        Write-Host "No Title Match in this chunk"
                    }
                }
            }
        }
    }
}

if (-not $found) {
    Write-Host "ID 13010-48716861 not found in any HTML file in $srcPath"
}
