Add-Type -AssemblyName System.Drawing

function Create-Receipt {
    param(
        [string]$Path,
        [string]$StoreName,
        [string]$Subtitle,
        [string]$ReceiptNo,
        [string]$DateStr,
        [array]$Items,
        [string]$Subtotal,
        [string]$Tax,
        [string]$Total,
        [string]$PaymentMethod
    )

    $width = 460
    $height = 680
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # Background
    $bgColor = [System.Drawing.Color]::FromArgb(250, 250, 248)
    $brushBg = New-Object System.Drawing.SolidBrush($bgColor)
    $g.FillRectangle($brushBg, 0, 0, $width, $height)

    # Paper Border & Shadow
    $penBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(215, 215, 210), 1)
    $g.DrawRectangle($penBorder, 10, 10, $width - 20, $height - 20)

    # Fonts
    $fontHeader = New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Bold)
    $fontSub = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Regular)
    $fontMono = New-Object System.Drawing.Font("Consolas", 10, [System.Drawing.FontStyle]::Regular)
    $fontMonoBold = New-Object System.Drawing.Font("Consolas", 11, [System.Drawing.FontStyle]::Bold)
    $fontTotal = New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Bold)

    $brushBlack = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 30, 30))
    $brushGray = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 100, 100))
    $brushGreen = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 120, 70))

    $y = 35

    # Store Name (Centered)
    $strFormat = New-Object System.Drawing.StringFormat
    $strFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString($StoreName, $fontHeader, $brushBlack, ($width / 2), $y, $strFormat)
    $y += 24

    $g.DrawString($Subtitle, $fontSub, $brushGray, ($width / 2), $y, $strFormat)
    $y += 18

    $g.DrawString("TAX INVOICE / OFFICIAL RECEIPT", $fontSub, $brushGray, ($width / 2), $y, $strFormat)
    $y += 25

    # Dashed Divider
    $penDashed = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 180, 180), 1)
    $penDashed.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
    $g.DrawLine($penDashed, 30, $y, $width - 30, $y)
    $y += 15

    # Receipt Info
    $strLeft = New-Object System.Drawing.StringFormat
    $strLeft.Alignment = [System.Drawing.StringAlignment]::Near
    $strRight = New-Object System.Drawing.StringFormat
    $strRight.Alignment = [System.Drawing.StringAlignment]::Far

    $g.DrawString("Receipt #: $ReceiptNo", $fontMono, $brushBlack, 30, $y, $strLeft)
    $g.DrawString("Date: $DateStr", $fontMono, $brushBlack, $width - 30, $y, $strRight)
    $y += 20
    $g.DrawString("Cashier: Terminal 04", $fontMono, $brushGray, 30, $y, $strLeft)
    $g.DrawString("Status: COMPLETED", $fontMono, $brushGreen, $width - 30, $y, $strRight)
    $y += 25

    $g.DrawLine($penDashed, 30, $y, $width - 30, $y)
    $y += 15

    # Table Header
    $g.DrawString("ITEM DESCRIPTION", $fontMonoBold, $brushBlack, 30, $y, $strLeft)
    $g.DrawString("AMOUNT", $fontMonoBold, $brushBlack, $width - 30, $y, $strRight)
    $y += 22

    # Items
    foreach ($item in $Items) {
        $g.DrawString($item.Desc, $fontMono, $brushBlack, 30, $y, $strLeft)
        $g.DrawString($item.Price, $fontMono, $brushBlack, $width - 30, $y, $strRight)
        $y += 20
    }

    $y += 10
    $g.DrawLine($penDashed, 30, $y, $width - 30, $y)
    $y += 15

    # Subtotal & Tax
    $g.DrawString("Subtotal:", $fontMono, $brushGray, 30, $y, $strLeft)
    $g.DrawString($Subtotal, $fontMono, $brushBlack, $width - 30, $y, $strRight)
    $y += 20

    $g.DrawString("Sales Tax / VAT:", $fontMono, $brushGray, 30, $y, $strLeft)
    $g.DrawString($Tax, $fontMono, $brushBlack, $width - 30, $y, $strRight)
    $y += 25

    # Total Box
    $penSolid = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 40, 40), 2)
    $g.DrawRectangle($penSolid, 30, $y, $width - 60, 45)
    $g.DrawString("TOTAL PAID", $fontTotal, $brushBlack, 45, $y + 11, $strLeft)
    $g.DrawString($Total, $fontTotal, $brushBlack, $width - 45, $y + 11, $strRight)
    $y += 60

    # Payment details
    $g.DrawString("Payment Method: $PaymentMethod", $fontMono, $brushBlack, 30, $y, $strLeft)
    $y += 20
    $g.DrawString("Auth Code: 894103 / Approved", $fontMono, $brushGray, 30, $y, $strLeft)
    $y += 30

    # Barcode representation
    $penBar = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 60, 60), 2)
    $rand = New-Object System.Random(12345)
    for ($bx = 70; $bx -lt $width - 70; $bx += 4) {
        if ($rand.Next(0, 10) -gt 3) {
            $g.DrawLine($penBar, $bx, $y, $bx, $y + 35)
        }
    }
    $y += 45
    $g.DrawString("* THANK YOU FOR YOUR BUSINESS *", $fontSub, $brushGray, ($width / 2), $y, $strFormat)

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $g.Dispose()
}

$dir = "C:\Users\User\.gemini\antigravity\scratch\petty-cash-app\sample-receipts"

Create-Receipt -Path "$dir\receipt-1001-restaurant.png" `
    -StoreName "THE BISTRO & LOUNGE" `
    -Subtitle "450 Financial Way, Suite 100" `
    -ReceiptNo "INV-2026-9812" `
    -DateStr "2026-10-28 19:42" `
    -Items @(
        @{ Desc = "2x Prime Dry-Aged Ribeye"; Price = "$94.00" },
        @{ Desc = "1x San Pellegrino 750ml"; Price = "$7.50" },
        @{ Desc = "1x Pinot Noir Bottle"; Price = "$28.50" },
        @{ Desc = "1x Dessert Platter"; Price = "$15.50" }
    ) `
    -Subtotal "$130.00" `
    -Tax "$15.50" `
    -Total "$145.50" `
    -PaymentMethod "Corporate Visa *4192"

Create-Receipt -Path "$dir\receipt-1002-transport.png" `
    -StoreName "METRO CAB & AIRPORT EXPRESS" `
    -Subtitle "Direct Dispatch Services" `
    -ReceiptNo "TRIP-88421" `
    -DateStr "2026-11-02 08:35" `
    -Items @(
        @{ Desc = "Airport Pick-up T2 -> Apex Tower"; Price = "$55.00" },
        @{ Desc = "Express Expressway Toll"; Price = "$6.20" },
        @{ Desc = "Driver Gratuity"; Price = "$7.00" }
    ) `
    -Subtotal "$61.20" `
    -Tax "$7.00" `
    -Total "$68.20" `
    -PaymentMethod "Mastercard *7721"

Create-Receipt -Path "$dir\receipt-1003-supplies.png" `
    -StoreName "OFFICE DEPOT & SUPPLIES" `
    -Subtitle "Store #402 - Business District" `
    -ReceiptNo "OD-550182" `
    -DateStr "2026-10-25 14:15" `
    -Items @(
        @{ Desc = "2x Dual Monitor Arm Stands"; Price = "$190.00" },
        @{ Desc = "3x Ultra 4K HDMI Cables 10ft"; Price = "$45.00" },
        @{ Desc = "1x Whiteboard Accessories Kit"; Price = "$50.00" }
    ) `
    -Subtotal "$285.00" `
    -Tax "$25.00" `
    -Total "$310.00" `
    -PaymentMethod "Corporate Amex *3004"

Create-Receipt -Path "$dir\receipt-1004-telecom.png" `
    -StoreName "GLOBAL ROAM MOBILE" `
    -Subtitle "Enterprise Telecom Solutions" `
    -ReceiptNo "TEL-992144" `
    -DateStr "2026-11-01 10:00" `
    -Items @(
        @{ Desc = "30-Day APAC High-Speed Roaming"; Price = "$85.00" },
        @{ Desc = "Direct International Dialing Pack"; Price = "$10.00" }
    ) `
    -Subtotal "$85.00" `
    -Tax "$10.00" `
    -Total "$95.00" `
    -PaymentMethod "Corporate Visa *4192"

Create-Receipt -Path "$dir\receipt-1005-catering.png" `
    -StoreName "ARTISAN EXECUTIVE CATERING" `
    -Subtitle "Gourmet Corporate Luncheons" `
    -ReceiptNo "CAT-44910" `
    -DateStr "2026-11-03 12:15" `
    -Items @(
        @{ Desc = "8x Executive Gourmet Box Lunch"; Price = "$320.00" },
        @{ Desc = "Assorted Beverages & Fresh Juices"; Price = "$60.00" },
        @{ Desc = "Setup & Delivery Service"; Price = "$40.00" }
    ) `
    -Subtotal "$380.00" `
    -Tax "$40.00" `
    -Total "$420.00" `
    -PaymentMethod "Corporate Visa *4192"

Write-Output "Successfully generated 5 sample receipts in $dir"
