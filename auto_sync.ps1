# Job Sync Script (Robust PowerShell Version)
try {
    $baseDir = $PSScriptRoot
    $googleRoot = (Get-Item $baseDir).Parent.Parent.FullName
    $sharedName = [string][char]0x5171 + [char]0x6709 + [char]0x30c9 + [char]0x30e9 + [char]0x30a4 + [char]0x30d6
    $sourceName = [string][char]0x6c42 + [char]0x4eba + [char]0x60c5 + [char]0x5831 + "PDF"
    $srcPath = "$googleRoot\$sharedName\$sourceName"
} catch {
    Write-Host "Failed to resolve path"
    exit
}

$outputPath = Join-Path $baseDir "data\jobs_data.js"
$allJobs = @{}

Write-Host "Source: $srcPath"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source path not found: $srcPath"
    exit
}

$files = Get-ChildItem -Path $srcPath -Filter "*.html"
Write-Host "Found $($files.Count) files"

# Unicode Japanese strings
$uHello = ([string][char]0x30cf) + [char]0x30ed + [char]0x30fc + [char]0x30ef + [char]0x30fc + [char]0x30af
$uCo = ([string][char]0x4e8b) + [char]0x696d + [char]0x6240 + [char]0x540d
$uLo = ([string][char]0x5c31) + [char]0x696d + [char]0x5834 + [char]0x6240
$uSa = ([string][char]0x8cc3) + [char]0x91d1
$uHo = ([string][char]0x5c31) + [char]0x696d + [char]0x6642 + [char]0x9593
$uHol = ([string][char]0x4f11) + [char]0x65e5
$uDe = ([string][char]0x4ed5) + [char]0x4e8b + [char]0x5185 + [char]0x5bb9
$uDa = ([string][char]0x53d7) + [char]0x4ed8 + [char]0x5e74 + [char]0x6708 + [char]0x65e5
$uRe = ([string][char]0x53d7) + [char]0x7406 + [char]0x5e74 + [char]0x6708 + [char]0x65e5

$sNen = ([string][char]0x5e74)
$sGat = ([string][char]0x6708)
$sNic = ([string][char]0x65e5)
$sDis = ([string][char]0x969c)
$sGen = ([string][char]0x4e00) + [char]0x822c
$sDisCat = ([string][char]0x969c) + [char]0x5bb3 + [char]0x8005 + [char]0x67a0
$sSei = ([string][char]0x6b63) + [char]0x793e + [char]0x54e1
$sPic = ([string][char]0x753b) + [char]0x50cf + [char]0x3042 + [char]0x308a

$uZai = ([string][char]0x5728) + [char]0x5b85
$uRem = ([string][char]0x30ea) + [char]0x30e2 + [char]0x30fc + [char]0x30c8
$uTel = ([string][char]0x30c6) + [char]0x30ec + [char]0x30ef + [char]0x30fc + [char]0x30af

# Field extraction helper
function Get-Field($label, $context) {
    # Label can be a regex-like string
    if ($context -match "(?i)<t[hd][^>]*>[\s\S]*?$label[\s\S]*?</t[hd]>[\s\S]*?<td[^>]*>([\s\S]*?)</td>") {
        return ($Matches[1] -replace '<[^>]+>', '' -replace '\s+', ' ').Trim()
    }
    return ""
}

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)"
    try {
        $b = [System.IO.File]::ReadAllBytes($file.FullName)
        $tUtf8 = [System.Text.Encoding]::UTF8.GetString($b)
        $tSjis = [System.Text.Encoding]::GetEncoding(932).GetString($b)
        
        # UTF-8を基本とし、不正バイト（U+FFFD）がある場合のみShift-JISにフォールバック
        $t = $tUtf8
        if ($tUtf8.IndexOf([char]0xFFFD) -ge 0) { $t = $tSjis }

        # Split by job table
        $chunks = $t -split '<table[^>]*class="[^"]*kyujin'
        for ($i = 1; $i -lt $chunks.Count; $i++) {
            $h = $chunks[$i]
            $prevH = $chunks[$i-1]

            if ($h -match "(\d{5}-\d{8})") {
                $id = $Matches[1]
                if ($allJobs.ContainsKey($id)) { continue }

                $title = "Unknown"
                if ($h -match 'class="fb">([\s\S]*?)</div>') {
                    $title = ($Matches[1] -replace '<[^>]+>', '' -replace '\s+', ' ').Trim()
                }

                $isDisability = ($title.IndexOf($sDis) -ge 0)
                $category = $sGen
                if ($isDisability) { $category = $sDisCat }

                $isRemote = (($title.IndexOf($uZai) -ge 0) -or ($title.IndexOf($uRem) -ge 0) -or ($title.IndexOf($uTel) -ge 0))

                $type = $sSei
                # Get all bg_label elements and skip status ones like "閲覧済" or "新着"
                $typeMatches = [regex]::Matches($h, 'class="[^"]*bg_label[^"]*"[^>]*>([\s\S]*?)</div>')
                foreach ($m in $typeMatches) {
                    $text = ($m.Groups[1].Value -replace '<[^>]+>', '' -replace '\s+', ' ').Trim()
                    $uViewed = [char]0x95b2 + [char]0x89a7 + [char]0x6e08
                    $uNew = [char]0x65b0 + [char]0x7740
                    $uDetail = [char]0x8a73 + [char]0x7d30 + [char]0x3092 + [char]0x8868 + [char]0x793a
                    $uTicket = [char]0x6c42 + [char]0x4eba + [char]0x7968 + [char]0x3092 + [char]0x8868 + [char]0x793a
                    
                    if ($text -and ($text -ne $uViewed) -and ($text -ne $uNew) -and ($text -ne $uDetail) -and ($text -ne $uTicket)) {
                        $type = $text
                        break
                    }
                }

                $pAt = Get-Date -Format "yyyy-MM-dd"
                $dateRegex = "($uDa|$uRe)[\s\S]*?(\d{4})$sNen(\d{1,2})$sGat(\d{1,2})$sNic"
                if ($h -match $dateRegex) {
                    $pAt = "{0}-{1:D2}-{2:D2}" -f $Matches[2], [int]$Matches[3], [int]$Matches[4]
                }

                $officialUrl = ""
                $idClean = $id.Replace("-","")
                if ($h -match "href=`"(https://www\.hellowork\.mhlw\.go\.jp/kensaku/GECA110010\.do[^`"]*?kJNo=$idClean[^`"]*?)`"") {
                    $officialUrl = $Matches[1] -replace '&amp;', '&'
                } elseif ($prevH -match "href=`"(https://www\.hellowork\.mhlw\.go\.jp/kensaku/GECA110010\.do[^`"]*?kJNo=$idClean[^`"]*?)`"") {
                    $officialUrl = $Matches[1] -replace '&amp;', '&'
                }

                $uDeFull = "$uDe|" + [char]0x4ed5 + [char]0x4e8b + [char]0x306e + [char]0x5185 + [char]0x5bb9
                $allJobs[$id] = @{
                    id = $id
                    title = $title
                    company = (Get-Field $uCo $h).Replace($sPic, "")
                    location = Get-Field $uLo $h
                    salary = Get-Field "$uSa|賃金" $h
                    workingHours = Get-Field $uHo $h
                    holiday = Get-Field $uHol $h
                    description = Get-Field $uDeFull $h
                    postedAt = $pAt
                    type = $type
                    category = $category
                    isRemote = [bool]$isRemote
                    isImported = $true
                    officialUrl = $officialUrl
                }
            }
        }
    } catch {
        Write-Host "  Error: $($_.Exception.Message)"
    }
}

$sorted = $allJobs.Values | Sort-Object postedAt -Descending
$json = $sorted | ConvertTo-Json -Depth 10 -Compress
$updateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$js = "const lastUpdated = '$updateTime';`nconst initialJobsData = $json;"
[System.IO.File]::WriteAllText($outputPath, $js, [System.Text.Encoding]::UTF8)
Write-Host "Done! $($allJobs.Count) jobs extracted."
