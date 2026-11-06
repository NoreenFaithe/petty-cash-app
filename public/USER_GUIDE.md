# 📘 PettyCash Pro — Official User Guide & Operating Manual
### Philippine Peso (₱ PHP) Multi-Consultant Reimbursement & Imprest Fund System

---

## 🌟 1. System Overview

**PettyCash Pro** is a modern, responsive web application designed for distributed and remote consulting teams to manage, monitor, and disburse petty cash reimbursements in **Philippine Peso (₱ PHP)**.

The application follows the standard **Imprest Fund Accounting Lifecycle**:
$$\text{Net Cash on Hand} = \text{Authorized Base Float (₱5,000.00)} - \text{Released Unreplenished Vouchers}$$

When cash in the drawer runs low, released expense vouchers are packaged into an audit batch, submitted to Treasury/Finance for replenishment, and the cash drawer is restored to its full float upon receipt of the reimbursement check.

---

## 👥 2. Role & Permission Matrix

The application enforces strict separation between the **Finance Admin (Approver)** and **Remote Consultants**:

| Feature / Capability | 👑 Finance Admin | 💼 Remote Consultant |
| :--- | :---: | :---: |
| **Personalized Dashboard & KPI Cards** | ✅ Consolidated Matrix | ✅ Personal Spend Only |
| **Submit New Expense Claims** | ✅ | ✅ |
| **Attach Receipt Photos (Mobile / PDF / JPG)** | ✅ | ✅ |
| **Tag Client Refundable vs. Internal Ops** | ✅ | ✅ |
| **Edit / Delete Own Pending Requests** | ✅ | ✅ (Before release only) |
| **Edit / Delete Released or Submitted Claims** | ✅ (Audit correction) | ❌ **Locked & Hidden** |
| **Modify Other Consultants' Claims** | ✅ | ❌ **Strictly Blocked** |
| **Set Authorized PCF Float (₱5,000.00)** | ✅ | ❌ **Hidden & Blocked** |
| **Authorize & Disburse Cash (`✓ Release Fund`)** | ✅ | ❌ **Hidden & Blocked** |
| **Submit Vouchers for Replenishment** | ✅ | ❌ **Hidden & Blocked** |
| **Acknowledge Replenishment Check** | ✅ | ❌ **Hidden & Blocked** |
| **Executive Consolidated Reports** | ✅ | ❌ **Hidden & Blocked** |
| **Settings & Security Passcode Management** | ✅ | ❌ **Hidden & Blocked** |
| **Export Accounting CSV & JSON Database** | ✅ | ❌ (CSV filtered to own claims) |

---

## 💼 3. Consultant Guide (For Remote Team Members)

### Step 3.1: Accessing the App & Creating an Account
1. Open the application link provided by your company (e.g. on your mobile phone, tablet, or laptop browser).
2. Click **"+ Create Account"** in the top navigation or sidebar.
3. Select the **💼 Consultant** role option card.
4. Enter your:
   - **Full Name** (e.g., `Jennifer Cruz`)
   - **Work Email Address** (e.g., `jennifer.cruz@company.com`)
   - **Job Title & Department** (e.g., `Management Consultant • Strategy & Ops`)
5. Click **Create Account**. Your profile will be registered and you will be immediately logged in.

---

### Step 3.2: Submitting an Expense Reimbursement Request
1. In the sidebar or top banner, click **"➕ Submit Expense"** (or click the quick button in the table header).
2. Complete the expense form:
   - **Date of Expense**: Select the date printed on your physical receipt or invoice.
   - **Expense Account / Category**: Choose the appropriate category:
     - 🍽️ *Meals & Representation* (Client dinners, team working meals)
     - 🚗 *Transportation/Travel* (Grab, taxi, fuel, tollway, parking)
     - 📎 *Office Supplies* (Stationery, courier, printing, postage)
     - 📱 *Communication* (Mobile load, emergency Wi-Fi hotspot)
     - 📦 *Miscellaneous* (Incidental supplies, hardware accessories)
   - **Amount in Philippine Peso (₱ PHP)**: Enter the exact total amount paid.
   - **Description**: Provide a clear business purpose (e.g., *"Client meeting with ABC Corp project leads at BGC"*).
   - **Client Billing Recovery Toggle**:
     - If the expense is billable to a client, switch the toggle to **"Yes (Recoverable / For Client Refund)"** and type the **Client / Account Name**.
     - If it is standard company overhead, leave it as **"No (Internal Company Expense)"**.
3. **Attach Your Receipt**:
   - On a smartphone: tap the receipt box and choose **Take Photo** or choose from your photo gallery.
   - On a computer: drag-and-drop or browse for a **PNG, JPG, or PDF** receipt (up to 10MB).
   - A thumbnail preview will confirm that your file is attached.
4. Click **"Submit Reimbursement Request"**. Your claim will instantly be registered under your name with an ID like `CLM-2026-001`.

---

### Step 3.3: Understanding Claim Statuses
Your claim goes through four distinct accounting stages:

1. ⏳ **Pending (Yellow)**:
   - Your request has been submitted and is in the Admin's queue for review and cash release.
   - **You can still edit or delete your request while it is Pending.**
2. 💵 **Released / Closed (Green)**:
   - The Finance Admin has authorized the expense, released cash from the petty cash box, and stored your voucher in the drawer.
   - **Your claim is now locked from further edits or deletions.**
3. 📦 **Submitted for Replenishment (Blue)**:
   - Your voucher has been packaged with other released receipts into a Treasury replenishment batch (e.g. `REP-2026-001`) awaiting check restitution.
4. ✅ **Replenished & Settled (Dark Green)**:
   - Treasury has issued the reimbursement check, and the petty cash drawer has been restored back to its base float.

---

### Step 3.4: Editing or Deleting a Pending Request
- If you made a typo in the amount, description, or attached the wrong photo:
  1. Locate your claim in the **Reimbursement Transactions** table.
  2. Click the **`✏️ Edit`** button on that row (or click `🔍` to open full details and click `Edit Entry`).
  3. Adjust the details or replace the receipt and click **"Save Changes"**.
- If you want to withdraw a request:
  1. Click **`🗑️ Delete`** on that row.
  2. Confirm the deletion prompt.
- **Important**: Once the Finance Admin marks your claim as **Released** or **Submitted for Replenishment**, the `Edit` and `Delete` buttons disappear automatically to maintain strict audit integrity.

---

## 👑 4. Finance Admin & Approver Guide

### Step 4.1: Customizing Your Admin Identity & Passcode
1. In the sidebar or top bar, click **"👑 My Admin Profile"** (or click the User badge in the bottom-left corner).
2. Enter your:
   - **Full Name** (e.g., `Maria Teresa Santos`)
   - **Work Email Address** (e.g., `admin.santos@company.com`)
   - **Job Title** (e.g., `Finance Controller & Custodian`)
   - **Admin Passcode** (Secret key required to unlock Admin mode; default is `ADMIN2026`).
3. Click **"Save Admin Profile"**. All subsequent cash disbursement signatures and audit trails will carry your name and title.

---

### Step 4.2: Managing the Petty Cash Fund (PCF) Float
1. Click **"✏️ Set PCF"** in the top control banner (or in Settings).
2. Enter the authorized float amount (default is **₱5,000.00**; minimum is ₱100.00). Quick presets for ₱3,000, ₱5,000, ₱10,000, and ₱20,000 are available.
3. Click **"Save PCF Amount"**.
4. The system calculates and displays your real-time cash position:
   $$\text{Net Cash on Hand} = \text{Base Float} - \text{Total Released Vouchers in Drawer}$$

---

### Step 4.3: Reviewing Receipts & Releasing Cash (`✓ Release Fund`)
1. On the **Reimbursement Transactions** table, pending claims are highlighted in yellow.
2. Click **"View Receipt"** to inspect the attached document:
   - Use the **Zoom In / Zoom Out**, **Rotate (90°)**, and **Print** controls.
   - For PDFs, preview the document inline or download a copy.
3. Click **"🔍"** to view the full audit history and timestamps.
4. When ready to disburse physical cash:
   - Click the green **`✓ Release Fund`** button.
   - Verify the consultant name, expense amount, and description in the confirmation modal.
   - Click **"Confirm & Release Cash"**.
5. The claim status updates to **Released**, the fund disbursement is logged into the audit timeline with your name and timestamp, and the amount is deducted from **Net Cash on Hand**.

---

### Step 4.4: Treasury Replenishment Workflow
When cash in the drawer runs low (or at month-end cutoff):

1. **Submitting Vouchers for Replenishment**:
   - Click **`📤 Submit for Replenishment`** in the PCF banner.
   - All released receipts currently in the drawer will be listed with their amounts.
   - Check the vouchers you wish to submit (or click "Select All").
   - Enter an optional Transmittal Memo or Treasury Department reference.
   - Click **"Submit Batch for Replenishment"**.
   - A batch ID (e.g. `REP-2026-001`) is generated. The selected claims are tagged as `submitted`, moving them out of "In-Drawer Vouchers" into "Pending Treasury Check".

2. **Receiving the Reimbursement Check**:
   - When the company Treasury/Accounting department issues the check to replenish the petty cash box:
   - Click **`📥 Receive Replenishment`**.
   - Select the pending batch from the dropdown.
   - Enter the **Check / Bank Reference Number** (e.g. `BDO-CHK-883921`) and Date Received.
   - Click **"Acknowledge Check & Restore Cash"**.
   - The batch is marked as **Restored & Settled**, and your **Net Cash on Hand** is immediately restored back to the full base float!

---

### Step 4.5: Consolidated Reports & Audit Exports
1. Click **"Executive Consolidated Reports"** in the sidebar.
   - **Consolidated Consultant Spend Matrix**: Breakdown of total claims, pending approvals, released cash, and client-recoverable sums for every consultant.
   - **Client Billing Recovery Matrix**: All expenses marked as recoverable, grouped by corporate client account for invoicing.
   - **Live Audit Activity Feed**: Chronological log of every claim submission, edit, approval, and release.
2. **Exporting Data**:
   - Click **"📊 Download CSV File"** to export all claims into an Excel-ready spreadsheet formatted in Philippine Peso.
   - Click **"💾 Download JSON Backup"** in Settings to export a complete portable database backup including all receipt attachments and audit trails.
   - Click **"🖨️ Print Executive Report"** to print or export a clean PDF summary for executive management.

---

## 🔒 5. Remote Security & Switching Views

- **Testing Consultant Experience**: If the Admin wants to see what a consultant sees, select their name from the **"Logged In As"** dropdown in the top bar. All admin tools and executive reports will disappear.
- **Returning to Admin View**: Click the **`🔒 Admin Access`** button in the top bar, enter your secret Admin Passcode (`ADMIN2026`), and your full administrative controls will unlock instantly.

---

## ❓ 6. Frequently Asked Questions (FAQ)

**Q: Can a consultant edit an expense after cash has been released?**  
*A: No. Once cash has left the drawer and the status is "Released", consultants cannot edit or delete the entry. Only the Finance Admin can make administrative adjustments.*

**Q: What happens if a receipt file is too large?**  
*A: The system supports PNG, JPG, and PDF receipts up to 10MB per file, which accommodates high-resolution camera photos from all smartphones.*

**Q: Does the app work in Dark Mode?**  
*A: Yes! Click the 🌙/☀️ toggle button in the top bar or under Settings to toggle between Clean Light and Midnight Dark themes.*

**Q: How do we sync across multiple remote consultants on different devices?**  
*A: Deploy the app to Vercel or Netlify and connect a free Supabase project using the included `schema.sql`. All data will sync in real time across the team!*

---
*PettyCash Pro • Philippine Peso (₱ PHP) Edition • Turnkey Financial Operations*
