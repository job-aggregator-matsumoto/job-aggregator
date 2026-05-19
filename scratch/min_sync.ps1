$source = "C:\Users\user\OneDrive\Documents\求人まとめサイト"
$target = "c:\Users\user\Google ドライブ ストリーミング\マイドライブ\求人情報まとめサイト\data\jobs_data.js"
$jobs = @{}

# Unicode for: 求人番号, 職種, 事業所名, 就業場所, 賃金, 受付年月日
$idLabel = "[\u6c42\u4eba\u756a\u53f7]"
$titleClass = "fb"
$compLabel = "[\u4e8b\u696d\u6240\u540d]"
$locLabel = "[\u5c31\u696d\u5834\u6240]"
$salLabel = "[\u8cc1\u91d1]"
$dateLabel = "[\u53d7\u4ed8\u5e74\u6708\u65e5]"

$files = Get-ChildItem -Path $source -Filter "*.html"
foreach ($f in $files) {
    $txt = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $ms = [regex]::Matches($txt, '(?s)<table class="kyujin.*?".*?>(.*?)</table>')
    foreach ($m in $ms) {
        $h = $m.Groups[1].Value
        if ($h -match "$idLabel.*?(\d{5}-\d{8})") { $id = $matches[1] } else { continue }
        if ($jobs.ContainsKey($id)) { continue }
        
        $obj = @{ id = $id }
        if ($h -match "class=`"$titleClass`">(.*?)</div>") { $obj.title = ($matches[1] -replace '<[^>]+>', '').Trim() }
        if ($h -match "$compLabel[\s\S]*?<td[^>]*?>(.*?)</td>") { $obj.company = ($matches[1] -replace '<[^>]+>', '').Trim() }
        if ($h -match "$locLabel[\s\S]*?<td[^>]*?>(.*?)</td>") { $obj.location = ($matches[1] -replace '<[^>]+>', '').Trim() }
        if ($h -match "$salLabel[\s\S]*?<td[^>]*?>(.*?)</td>") { $obj.salary = ($matches[1] -replace '<[^>]+>', '').Trim() }
        if ($h -match "$dateLabel[\s\S]*?(\d{4}).(\d{1,2}).(\d{1,2})") { $obj.postedAt = "$($matches[1])-$($matches[2].PadLeft(2,'0'))-$($matches[3].PadLeft(2,'0'))" }
        
        $jobs[$id] = $obj
    }
}

$json = $jobs.Values | ConvertTo-Json -Depth 5 -Compress
"const initialJobsData = $json;" | Out-File -FilePath $target -Encoding utf8
Write-Host "Done: $($jobs.Count)"
