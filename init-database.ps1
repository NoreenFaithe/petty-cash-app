$dir = "C:\Users\User\.gemini\antigravity\scratch\petty-cash-app"
$receiptsDir = "$dir\sample-receipts"

function Get-Base64Image($file) {
    if (Test-Path $file) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $b64 = [Convert]::ToBase64String($bytes)
        return "data:image/png;base64,$b64"
    }
    return $null
}

$b64_1 = Get-Base64Image "$receiptsDir\receipt-1001-restaurant.png"
$b64_2 = Get-Base64Image "$receiptsDir\receipt-1002-transport.png"
$b64_3 = Get-Base64Image "$receiptsDir\receipt-1003-supplies.png"
$b64_4 = Get-Base64Image "$receiptsDir\receipt-1004-telecom.png"
$b64_5 = Get-Base64Image "$receiptsDir\receipt-1005-catering.png"

# Seed claims formatted in Philippine Peso (PHP)
$claims = @(
    @{
        id = "CLM-2026-001"
        date = "2026-10-28"
        consultantId = "c1"
        consultantName = "Sarah Jenkins"
        amount = 7250.00
        description = "Executive client dinner with Apex Holdings CFO and project steering group"
        category = "Meals & Representation"
        isClientRefund = $true
        clientName = "Apex Holdings"
        status = "Released"
        submittedAt = "2026-10-28T21:05:00Z"
        releasedAt = "2026-10-30T14:15:22Z"
        releasedBy = "Finance Admin (Manager)"
        receipt = @{
            name = "bistro-dinner-receipt.png"
            type = "image/png"
            size = 45200
            dataUrl = $b64_1
        }
        auditLog = @(
            @{ timestamp = "2026-10-28T21:05:00Z"; user = "Sarah Jenkins"; action = "Submitted claim"; notes = "Initial submission" },
            @{ timestamp = "2026-10-30T14:15:22Z"; user = "Finance Admin (Manager)"; action = "Closed & Released Fund"; notes = "Verified against project agreement SOW-44" }
        )
    },
    @{
        id = "CLM-2026-002"
        date = "2026-11-02"
        consultantId = "c1"
        consultantName = "Sarah Jenkins"
        amount = 3410.00
        description = "Express cab rides between airport terminal and Apex Tower for morning review"
        category = "Transportation/Travel"
        isClientRefund = $true
        clientName = "Apex Holdings"
        status = "Pending"
        submittedAt = "2026-11-02T16:30:00Z"
        releasedAt = $null
        releasedBy = $null
        receipt = @{
            name = "airport-taxi-express.png"
            type = "image/png"
            size = 38400
            dataUrl = $b64_2
        }
        auditLog = @(
            @{ timestamp = "2026-11-02T16:30:00Z"; user = "Sarah Jenkins"; action = "Submitted claim"; notes = "Awaiting management review" }
        )
    },
    @{
        id = "CLM-2026-003"
        date = "2026-10-25"
        consultantId = "c2"
        consultantName = "Alex Rivera"
        amount = 15500.00
        description = "Dual monitor mounts and 4K ultra-speed cables for onsite consulting war room"
        category = "Office Supplies"
        isClientRefund = $false
        clientName = "Internal Operations"
        status = "Released"
        submittedAt = "2026-10-25T17:45:00Z"
        releasedAt = "2026-10-27T10:30:15Z"
        releasedBy = "Finance Admin (Manager)"
        receipt = @{
            name = "office-depot-tech.png"
            type = "image/png"
            size = 42100
            dataUrl = $b64_3
        }
        auditLog = @(
            @{ timestamp = "2026-10-25T17:45:00Z"; user = "Alex Rivera"; action = "Submitted claim"; notes = "Internal office equipment" },
            @{ timestamp = "2026-10-27T10:30:15Z"; user = "Finance Admin (Manager)"; action = "Closed & Released Fund"; notes = "Charged to internal general tech budget" }
        )
    },
    @{
        id = "CLM-2026-004"
        date = "2026-11-01"
        consultantId = "c2"
        consultantName = "Alex Rivera"
        amount = 4750.00
        description = "International data roaming and secure hotspot for cross-border logistics audit"
        category = "Communication"
        isClientRefund = $true
        clientName = "Global Logistics Ltd"
        status = "Pending"
        submittedAt = "2026-11-01T11:20:00Z"
        releasedAt = $null
        releasedBy = $null
        receipt = @{
            name = "global-roam-package.png"
            type = "image/png"
            size = 35900
            dataUrl = $b64_4
        }
        auditLog = @(
            @{ timestamp = "2026-11-01T11:20:00Z"; user = "Alex Rivera"; action = "Submitted claim"; notes = "Approved per flight schedule" }
        )
    },
    @{
        id = "CLM-2026-005"
        date = "2026-11-03"
        consultantId = "c3"
        consultantName = "Marcus Brody"
        amount = 21000.00
        description = "Working executive lunch catering for 8 strategy alignment participants"
        category = "Meals & Representation"
        isClientRefund = $true
        clientName = "FinTech Corp"
        status = "Pending"
        submittedAt = "2026-11-03T14:10:00Z"
        releasedAt = $null
        releasedBy = $null
        receipt = @{
            name = "catering-lunch-box.png"
            type = "image/png"
            size = 46100
            dataUrl = $b64_5
        }
        auditLog = @(
            @{ timestamp = "2026-11-03T14:10:00Z"; user = "Marcus Brody"; action = "Submitted claim"; notes = "All-day strategy session" }
        )
    },
    @{
        id = "CLM-2026-006"
        date = "2026-10-18"
        consultantId = "c3"
        consultantName = "Marcus Brody"
        amount = 2700.00
        description = "Emergency same-day secure bonded courier for signed client NDA and agreements"
        category = "Miscellaneous"
        isClientRefund = $true
        clientName = "FinTech Corp"
        status = "Released"
        submittedAt = "2026-10-18T16:00:00Z"
        releasedAt = "2026-10-19T09:12:00Z"
        releasedBy = "Finance Admin (Manager)"
        receipt = @{
            name = "courier-dispatch.png"
            type = "image/png"
            size = 38400
            dataUrl = $b64_2
        }
        auditLog = @(
            @{ timestamp = "2026-10-18T16:00:00Z"; user = "Marcus Brody"; action = "Submitted claim"; notes = "Time-sensitive legal documents" },
            @{ timestamp = "2026-10-19T09:12:00Z"; user = "Finance Admin (Manager)"; action = "Closed & Released Fund"; notes = "Verified proof of delivery" }
        )
    },
    @{
        id = "CLM-2026-007"
        date = "2026-11-04"
        consultantId = "c1"
        consultantName = "Sarah Jenkins"
        amount = 9037.50
        description = "Express train ticket to provincial transit depot for on-site infrastructure inspection"
        category = "Transportation/Travel"
        isClientRefund = $false
        clientName = "Metro Transit Authority"
        status = "Pending"
        submittedAt = "2026-11-04T18:00:00Z"
        releasedAt = $null
        releasedBy = $null
        receipt = @{
            name = "train-express-ticket.png"
            type = "image/png"
            size = 45200
            dataUrl = $b64_1
        }
        auditLog = @(
            @{ timestamp = "2026-11-04T18:00:00Z"; user = "Sarah Jenkins"; action = "Submitted claim"; notes = "Ticket booking reference #TX-901" }
        )
    }
)

$users = @(
    @{
        id = "admin-you"
        name = "Finance Admin"
        role = "manager"
        title = "Finance Controller & Approver"
        email = "admin@company.com"
        avatar = "FA"
        color = "#0f172a"
    },
    @{
        id = "c1"
        name = "Sarah Jenkins"
        role = "consultant"
        title = "Senior Consultant"
        email = "sarah.jenkins@company.com"
        avatar = "SJ"
        color = "#7c3aed"
    },
    @{
        id = "c2"
        name = "Alex Rivera"
        role = "consultant"
        title = "Technology Consultant"
        email = "alex.rivera@company.com"
        avatar = "AR"
        color = "#059669"
    },
    @{
        id = "c3"
        name = "Marcus Brody"
        role = "consultant"
        title = "Strategy Consultant"
        email = "marcus.brody@company.com"
        avatar = "MB"
        color = "#d97706"
    }
)

$categories = @(
    "Meals & Representation",
    "Transportation/Travel",
    "Office Supplies",
    "Communication",
    "Miscellaneous"
)

$seedData = @{
    users = $users
    categories = $categories
    claims = $claims
}

$json = $seedData | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText("$dir\data\seed.json", $json, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText("$dir\data\claims.json", $json, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText("$dir\data\seed.js", "window.DEFAULT_SEED_DATA = $json;", [System.Text.Encoding]::UTF8)

Write-Output "Successfully updated seed database with Philippine Peso amounts and clean Admin structure."
