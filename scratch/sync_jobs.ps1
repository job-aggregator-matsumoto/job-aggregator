$sourceDir = "C:\Users\user\OneDrive\Documents\求人まとめサイト"
# Get current directory to avoid hardcoding Japanese paths in script
$currentDir = Get-Location
$outputPath = Join-Path $currentDir "data\jobs_data.js"
$today = Get-Date -Format "yyyy-MM-dd"
$allJobs = @{}

# Define regex patterns using Unicode escapes to avoid encoding issues
# Remote: 在宅|リモート|テレワーク
$remoteRegex = "[\u5728\u5b85]|[\u30ea\u30e2\u30fc\u30c8]|[\u30c6\u30ec\u30ef\u30fc\u30af]"
# Shogai: 障|【障】|（障）
$shogaiRegex = "[\u969c]|[\u3010\u969c\u3011]|[\uff08\u969c\uff09]"
# Date labels: 受付年月日, 年, 月, 日
$labelDate = "[\u53d7\u4ed8\u5e74\u6708\u65e5]"
$labelYear = "[\u5e74]"
$labelMonth = "[\u6708]"
$labelDay = "[\u65e5]"

$files = Get-ChildItem -Path $sourceDir -Filter "*.html"
foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)"
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    $tables = [regex]::Matches($content, '(?s)<table class="kyujin.*?".*?>(.*?)</table>')
    
    foreach ($match in $tables) {
        $tableHtml = $match.Groups[1].Value
        
        # ID (求人番号)
        if ($tableHtml -match '[\u6c42\u4eba\u756a\u53f7].*?(\d{5}-\d{8})') {
            $jobId = $matches[1]
        } else {
            continue
        }

        if ($allJobs.ContainsKey($jobId)) { continue }

        # Title
        $title = "Unknown"
        if ($tableHtml -match 'class="fb">(.*?)</div>') {
            $title = $matches[1] -replace '<[^>]+>', ''
        }

        # Company (事業所名)
        $company = ""
        if ($tableHtml -match "[\u4e8b\u696d\u6240\u540d][\s\S]*?<td[^>]*?>(.*?)</td>") {
            $company = $matches[1] -replace '<[^>]+>', ''
        }
        # Location (就業場所)
        $location = ""
        if ($tableHtml -match "[\u5c31\u696d\u5834\u6240][\s\S]*?<td[^>]*?>(.*?)</td>") {
            $location = $matches[1] -replace '<[^>]+>', ''
        }
        # Salary (賃金)
        $salary = ""
        if ($tableHtml -match "[\u8cc1\u91d1][\s\S]*?<td[^>]*?>(.*?)</td>") {
            $salary = $matches[1] -replace '<[^>]+>', ''
        }
        # Hours (就業時間)
        $hours = ""
        if ($tableHtml -match "[\u5c31\u696d\u6642\u9593][\s\S]*?<td[^>]*?>(.*?)</td>") {
            $hours = $matches[1] -replace '<[^>]+>', ''
        }
        # Holiday (休日)
        $holiday = ""
        if ($tableHtml -match "[\u4fd1\u65e5][\s\S]*?<td[^>]*?>(.*?)</td>") {
            $holiday = $matches[1] -replace '<[^>]+>', ''
        }
        # Description (仕事内容)
        $description = ""
        if ($tableHtml -match "[\u4ed5\u4e8b\u5185\u5bb9][\s\S]*?<td[^>]*?>(.*?)</td>") {
            $description = $matches[1] -replace '<[^>]+>', ''
        }

        $jobType = "Part-time"
        if ($tableHtml -match '<div class="bg_label_white">(.*?)</div>') {
            $jobType = $matches[1] -replace '<[^>]+>', ''
        }

        # Date
        $postedAt = $today
        if ($tableHtml -match "$labelDate[\s\S]*?(\d{4})$labelYear(\d{1,2})$labelMonth(\d{1,2})$labelDay") {
            $postedAt = "{0}-{1:D2}-{2:D2}" -f $matches[1], [int]$matches[2], [int]$matches[3]
        }

        $job = @{
            id = $jobId
            title = $title.Trim()
            company = $company.Trim()
            location = $location.Trim()
            salary = $salary.Trim()
            workingHours = $hours.Trim()
            holiday = $holiday.Trim()
            type = $jobType.Trim()
            category = if ($title -match $shogaiRegex) { "Shogai" } else { "General" }
            isRemote = if ($title -match $remoteRegex) { $true } else { $false }
            postedAt = $postedAt
            description = $description.Trim()
            isImported = $true
        }
        $allJobs[$jobId] = $job
    }
}

$jobsList = $allJobs.Values | Sort-Object postedAt -Descending
$json = $jobsList | ConvertTo-Json -Depth 10 -Compress
$jsContent = "const initialJobsData = $json;"
[System.IO.File]::WriteAllText($outputPath, $jsContent, [System.Text.Encoding]::UTF8)
Write-Host "Finished! Total: $($allJobs.Count)"
