$src = 'C:\Users\user\Google ドライブ ストリーミング\共有ドライブ\求人情報PDF'
$cur = Get-Location
$out = Join-Path $cur 'data\jobs_data.js'
$all = @{}

$rI = "[\u6c42\u4eba\u756a\u53f7].*?(\d{5}-\d{8})"
$rT = 'class="fb">(.*?)</div>'
$rC = "[\u4e8b\u696d\u6240\u540d][\s\S]*?<td[^>]*?>(.*?)</td>"
$rL = "[\u5c31\u696d\u5834\u6240][\s\S]*?<td[^>]*?>(.*?)</td>"
$rS = "[\u8cc1\u91d1][\s\S]*?<td[^>]*?>(.*?)</td>"
$rH = "[\u5c31\u696d\u6642\u9593][\s\S]*?<td[^>]*?>(.*?)</td>"
$rD = "[\u4ed5\u4e8b\u5185\u5bb9][\s\S]*?<td[^>]*?>(.*?)</td>"
$rA = "[\u53d7\u4ed8\u5e74\u6708\u65e5][\s\S]*?(\d{4})[\u5e74](\d{1,2})[\u6708](\d{1,2})[\u65e5]"

$sS = "正社員"
$sO = "正社員以外"
$sP = "パート"
$sM = "無期雇用"
$sF = "有期雇用"

function G-V ($h, $p) { if ($h -match $p) { return $Matches[1] -replace '<[^>]+>', '' } else { return "" } }

if (Test-Path $src) {
    Get-ChildItem -Path $src -Filter "*.html" | ForEach-Object {
        $b = [System.IO.File]::ReadAllBytes($_.FullName)
        $k = [System.Text.Encoding]::UTF8.GetString($b)
        if (-not ($k -match "\u53d7\u4ed8\u5e74\u6708\u65e5")) { $k = [System.Text.Encoding]::GetEncoding(932).GetString($b) }

        [regex]::Matches($k, '(?s)<table class="kyujin.*?".*?>(.*?)</table>') | ForEach-Object {
            $k = $_.Groups[1].Value
            $id = G-V $k $rI
            if (-not $id -or $all.ContainsKey($id)) { return }

            $pA = Get-Date -Format "yyyy-MM-dd"
            if ($k -match $rA) { $pA = "{0}-{1:D2}-{2:D2}" -f $Matches[1], [int]$Matches[2], [int]$Matches[3] }

            $jT = ""
            if ($k -match '(?s)class="[^"]*bg_label_white[^"]*"[^>]*>(.*?)</div>') { $jT = $Matches[1] -replace '<[^>]+>', '' }
            if (-not $jT -or $jT -eq $sS) {
                $rT = G-V $k "[\u6c42\u4eba\u533a\u5206][\s\S]*?<td[^>]*?>(.*?)</td>"
                if (-not $rT) { $rT = G-V $k "[\u96c7\u7528\u5f62\u614b][\s\S]*?<td[^>]*?>(.*?)</td>" }
                if ($rT) { $jT = $rT }
            }
            if (-not $jT -or $jT -eq $sS) {
                if ($k -match $sO) { $jT = $sO } elseif ($k -match $sM) { $jT = $sM } elseif ($k -match $sP) { $jT = $sP } elseif (-not $jT) { $jT = $sS }
            }
            
            if ($jT -match $sO) { $jT = $sO } elseif ($jT -match $sS) { $jT = $sS }
            if ($jT -match $sP) { $jT = $sP }
            if ($jT -match $sM) { $jT = $sM }
            if ($jT -match $sF) { $jT = $sF }

            $all[$id] = @{
                id = $id; title = (G-V $k $rT).Trim(); company = (G-V $k $rC).Trim(); location = (G-V $k $rL).Trim()
                salary = (G-V $k $rS).Trim(); workingHours = (G-V $k $rH).Trim(); description = (G-V $k $rD).Trim()
                postedAt = $pA; type = $jT.Trim(); isImported = $true
                category = if ($Matches[0] -match "[\u969c]") { "障害者枠" } else { "一般" }
                isRemote = if ($Matches[0] -match "[\u5728\u5b85]|[\u30ea\u30e2\u30fc\u30c8]|[\u30c6\u30ec\u30ef\u30fc\u30af]") { $true } else { $false }
            }
        }
    }
}

$js = "const lastUpdated = '$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')';`nconst initialJobsData = $($all.Values | Sort-Object postedAt -Descending | ConvertTo-Json -Depth 10 -Compress);"
[System.IO.File]::WriteAllText($out, $js, [System.Text.Encoding]::UTF8)
Write-Host "Done! $($all.Count) jobs."
