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
        Write-Host "Found ID in: $($file.Name)"
        
        # Locate the ID offset in the raw bytes (using ASCII representation since ID is digits and hyphen)
        $idStr = "13010-48716861"
        $idBytes = [System.Text.Encoding]::ASCII.GetBytes($idStr)
        
        # Find index of idBytes in $b
        $index = -1
        for ($i = 0; $i -lt $b.Length - $idBytes.Length; $i++) {
            $match = $true
            for ($j = 0; $j -lt $idBytes.Length; $j++) {
                if ($b[$i + $j] -ne $idBytes[$j]) {
                    $match = $false
                    break
                }
            }
            if ($match) {
                $index = $i
                break
            }
        }
        
        if ($index -ge 0) {
            Write-Host "Found ID at byte index: $index"
            
            # We want to find the job title which is BEFORE the ID in the table chunk.
            # Let's search backwards for 'class="fb"'
            $fbStr = 'class="fb"'
            $fbBytes = [System.Text.Encoding]::ASCII.GetBytes($fbStr)
            $fbIndex = -1
            for ($i = $index; $i -ge 0; $i--) {
                $match = $true
                for ($j = 0; $j -lt $fbBytes.Length; $j++) {
                    if ($b[$i + $j] -ne $fbBytes[$j]) {
                        $match = $false
                        break
                    }
                }
                if ($match) {
                    $fbIndex = $i
                    break
                }
            }
            
            if ($fbIndex -ge 0) {
                Write-Host "Found 'class=`"fb`"' at byte index: $fbIndex"
                
                # Dump 300 bytes starting from $fbIndex to inspect the title and its tags
                $len = [Math]::Min(300, $b.Length - $fbIndex)
                $slice = New-Object byte[] $len
                [Array]::Copy($b, $fbIndex, $slice, 0, $len)
                
                Write-Host "--- Hex Dump (from class='fb') ---"
                $hex = ""
                $ascii = ""
                for ($i = 0; $i -lt $slice.Length; $i++) {
                    $val = $slice[$i]
                    $hex += "{0:X2} " -f $val
                    
                    # Printable ASCII
                    if ($val -ge 32 -and $val -le 126) {
                        $ascii += [char]$val
                    } else {
                        $ascii += "."
                    }
                    
                    if (($i + 1) % 16 -eq 0 -or ($i + 1) -eq $slice.Length) {
                        # Pad hex if shorter than 16
                        if (($i + 1) % 16 -ne 0) {
                            $padCount = 16 - (($i + 1) % 16)
                            $hex += "   " * $padCount
                        }
                        Write-Host "$hex | $ascii"
                        $hex = ""
                        $ascii = ""
                    }
                }
                
                Write-Host "--- Decoded Title with UTF-8 ---"
                $decodedUtf8 = [System.Text.Encoding]::UTF8.GetString($slice)
                Write-Host $decodedUtf8
                
                Write-Host "--- Decoded Title with Shift_JIS (932) ---"
                $decodedSjis = [System.Text.Encoding]::GetEncoding(932).GetString($slice)
                Write-Host $decodedSjis
            } else {
                Write-Host "Could not find 'class=`"fb`"' before the ID."
            }
        } else {
            Write-Host "Could not find raw byte index for ID."
        }
        break
    }
}
