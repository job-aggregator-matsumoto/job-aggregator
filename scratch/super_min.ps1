$s = "C:\Users\user\OneDrive\Documents\求人まとめサイト"
$t = Join-Path (Get-Location) "data\jobs_data.js"
$j = @{}

$fs = Get-ChildItem $s -Filter "*.html"
foreach ($f in $fs) {
    $c = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $ms = [regex]::Matches($c, '(?s)<table class="kyujin.*?".*?>(.*?)</table>')
    foreach ($m in $ms) {
        $h = $m.Groups[1].Value
        # ID: Use regex for 5 digits - 8 digits
        if ($h -match '(\d{5}-\d{8})') { $id = $matches[1] } else { continue }
        if ($j.ContainsKey($id)) { continue }
        
        $obj = @{ id = $id }
        # Title: class="fb"
        if ($h -match 'class="fb">(.*?)</div>') { $obj.title = ($matches[1] -replace '<[^>]+>', '').Trim() }
        # Company: After some specific tag or label
        # Since we avoid Japanese in script, we use the tag structure
        # ... actually let's just grab the first few <td> content as fallback
        
        # Get all <td> content
        $tds = [regex]::Matches($h, '(?s)<td[^>]*?>(.*?)</td>')
        if ($tds.Count -ge 5) {
            $obj.company = ($tds[2].Groups[1].Value -replace '<[^>]+>', '').Trim()
            $obj.location = ($tds[3].Groups[1].Value -replace '<[^>]+>', '').Trim()
            $obj.salary = ($tds[4].Groups[1].Value -replace '<[^>]+>', '').Trim()
        }
        
        # Date: YYYY年MM月DD日 pattern
        if ($h -match '(\d{4}).(\d{1,2}).(\d{1,2}).') {
            $obj.postedAt = "$($matches[1])-$($matches[2].PadLeft(2,'0'))-$($matches[3].PadLeft(2,'0'))"
        }
        
        $j[$id] = $obj
    }
}

$json = $j.Values | ConvertTo-Json -Depth 5 -Compress
"const initialJobsData = $json;" | Out-File -FilePath $t -Encoding utf8
Write-Host "Total: $($j.Count)"
