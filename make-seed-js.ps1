$dir = "C:\Users\User\.gemini\antigravity\scratch\petty-cash-app"
$json = [System.IO.File]::ReadAllText("$dir\data\claims.json", [System.Text.Encoding]::UTF8)

$jsContent = "window.DEFAULT_SEED_DATA = $json;"
[System.IO.File]::WriteAllText("$dir\data\seed.js", $jsContent, [System.Text.Encoding]::UTF8)

Write-Output "Successfully generated data/seed.js for instant offline/file:// protocol support."
