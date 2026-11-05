# Petty Cash & Reimbursement Monitoring - Zero-Dependency Local Web Server
# Uses native .NET TcpListener to serve both localhost and local network (LAN) connections.

$Port = 8080
$Root = $PSScriptRoot

# Determine primary local IP for LAN sharing
$localIP = "localhost"
try {
    $ips = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) | Where-Object { $_.AddressFamily -eq 'InterNetwork' -and $_.IPAddressToString -notlike '127.*' -and $_.IPAddressToString -notlike '169.254*' }
    if ($ips) {
        $localIP = $ips[0].IPAddressToString
    }
} catch {}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  PettyCash Pro - Local & Team Application Server" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Root Directory: $Root" -ForegroundColor Gray
Write-Host "Starting HTTP server on all interfaces (0.0.0.0:$Port) ..." -ForegroundColor Yellow

$listener = $null
try {
    # Bind to Any (0.0.0.0) so consultants on the local network can also connect
    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $Port)
    $listener.Start()
} catch {
    Write-Host "Port $Port busy, trying port 8085..." -ForegroundColor Yellow
    $Port = 8085
    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $Port)
    $listener.Start()
}

Write-Host "Server is running and listening!" -ForegroundColor Green
Write-Host "  -> On this computer:          http://localhost:$Port" -ForegroundColor Cyan
if ($localIP -ne "localhost") {
    Write-Host "  -> For other consultants on LAN: http://$localIP`:$Port" -ForegroundColor Cyan
}
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray

function Get-MimeType($path) {
    $ext = [System.IO.Path]::GetExtension($path).ToLower()
    switch ($ext) {
        ".html" { return "text/html; charset=utf-8" }
        ".htm"  { return "text/html; charset=utf-8" }
        ".css"  { return "text/css; charset=utf-8" }
        ".js"   { return "application/javascript; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".pdf"  { return "application/pdf" }
        ".svg"  { return "image/svg+xml" }
        ".ico"  { return "image/x-icon" }
        default { return "application/octet-stream" }
    }
}

while ($true) {
    try {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $buffer = New-Object byte[] 65536
        $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
        
        if ($bytesRead -gt 0) {
            $requestText = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $bytesRead)
            $lines = $requestText -split "`r`n"
            $firstLine = $lines[0]
            $tokens = $firstLine -split " "
            $method = $tokens[0]
            $url = $tokens[1]

            # Route: Centralized Database API (/api/db)
            if ($url -eq "/api/db") {
                $dbPath = Join-Path $Root "data\database.json"
                if ($method -eq "GET") {
                    if ([System.IO.File]::Exists($dbPath)) {
                        $dbBytes = [System.IO.File]::ReadAllBytes($dbPath)
                    } else {
                        $initJson = '{"claims":[],"users":[],"pcfAmount":5000.00,"replenishments":[]}'
                        $dbBytes = [System.Text.Encoding]::UTF8.GetBytes($initJson)
                    }
                    $headers = "HTTP/1.1 200 OK`r`nContent-Type: application/json`r`nAccess-Control-Allow-Origin: *`r`nContent-Length: $($dbBytes.Length)`r`nConnection: close`r`n`r`n"
                    $headBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
                    $stream.Write($headBytes, 0, $headBytes.Length)
                    $stream.Write($dbBytes, 0, $dbBytes.Length)
                }
                elseif ($method -eq "POST") {
                    $parts = $requestText -split "`r`n`r`n", 2
                    if ($parts.Length -gt 1) {
                        $bodyText = $parts[1]
                        [System.IO.File]::WriteAllText($dbPath, $bodyText, [System.Text.Encoding]::UTF8)
                    }
                    $responseBody = '{"status":"saved","storage":"local-server"}'
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
                    $headers = "HTTP/1.1 200 OK`r`nContent-Type: application/json`r`nAccess-Control-Allow-Origin: *`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
                    $headBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
                    $stream.Write($headBytes, 0, $headBytes.Length)
                    $stream.Write($bytes, 0, $bytes.Length)
                }
            }
            # Route: API Health & Info
            elseif ($url -eq "/api/health") {
                $responseBody = "{`"status`":`"ok`",`"app`":`"PettyCash Pro`",`"lanIp`":`"$localIP`",`"port`":$Port}"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
                $headers = "HTTP/1.1 200 OK`r`nContent-Type: application/json`r`nAccess-Control-Allow-Origin: *`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
                $headBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
                $stream.Write($headBytes, 0, $headBytes.Length)
                $stream.Write($bytes, 0, $bytes.Length)
            }
            # Route: API Sync Claims
            elseif ($url -eq "/api/claims/sync" -and $method -eq "POST") {
                $parts = $requestText -split "`r`n`r`n", 2
                if ($parts.Length -gt 1) {
                    $claimsJson = $parts[1]
                    $dataPath = Join-Path $Root "data\claims.json"
                    [System.IO.File]::WriteAllText($dataPath, $claimsJson, [System.Text.Encoding]::UTF8)
                }
                $responseBody = '{"status":"synced"}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($responseBody)
                $headers = "HTTP/1.1 200 OK`r`nContent-Type: application/json`r`nAccess-Control-Allow-Origin: *`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
                $headBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
                $stream.Write($headBytes, 0, $headBytes.Length)
                $stream.Write($bytes, 0, $bytes.Length)
            }
            # Route: Static Files
            else {
                $cleanUrl = $url.Split('?')[0]
                if ($cleanUrl -eq "/" -or [string]::IsNullOrWhiteSpace($cleanUrl)) {
                    $cleanUrl = "/index.html"
                }

                $filePath = Join-Path $Root ($cleanUrl.TrimStart('/').Replace('/', '\'))

                if ([System.IO.File]::Exists($filePath)) {
                    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
                    $mime = Get-MimeType $filePath
                    $headers = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($fileBytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
                    $headBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
                    $stream.Write($headBytes, 0, $headBytes.Length)
                    $stream.Write($fileBytes, 0, $fileBytes.Length)
                } else {
                    $notFound = "<h1>404 Not Found</h1><p>The requested file does not exist.</p>"
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($notFound)
                    $headers = "HTTP/1.1 404 Not Found`r`nContent-Type: text/html`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
                    $headBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
                    $stream.Write($headBytes, 0, $headBytes.Length)
                    $stream.Write($bytes, 0, $bytes.Length)
                }
            }
        }
        $stream.Close()
        $client.Close()
    } catch {
        # continue loop
    }
}
