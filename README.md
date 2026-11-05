# PettyCash Pro - Reimbursement & Expense Monitoring

A modern, responsive full-stack web application designed for monitoring petty cash disbursements and consulting reimbursement requests with role-based access control.

---

## 🚀 Quick Start (For Non-Developers)

You can launch the application in either of two frictionless ways:

### Option 1: Instant Browser Launch (Zero-Setup, Recommended)
1. Navigate to: `C:\Users\User\.gemini\antigravity\scratch\petty-cash-app`
2. Double-click **`open-direct.bat`** (or simply double-click **`index.html`**).
3. The application will open immediately in your default web browser (Edge, Chrome, Opera, Brave).
4. All data, receipts, and permissions are preserved automatically in your browser's persistent storage.

### Option 2: Local Web Server
1. Navigate to: `C:\Users\User\.gemini\antigravity\scratch\petty-cash-app`
2. Double-click **`start.bat`**.
3. A lightweight background server will start and automatically open `http://localhost:8080` in your browser.

---

## 👥 User Roles & How to Test Them

The application comes pre-loaded with sample users so you can test role permissions instantly. Use the **User / Persona dropdown** in the top navigation bar to switch between personas:

### 1. Manager / Admin: **David Vance**
* **Access Scope**: Full visibility over all consultants' reimbursement submissions.
* **Capabilities**:
  * View all transactions across all consultants.
  * Search and filter by Consultant, Expense Account, Client Refund status, and Date Range.
  * **Release Funds**: Click the prominent **"Release Fund"** button on any pending request. This marks the claim as "Released", logs the disbursement timestamp, and closes the claim.
  * **Edit Allocations**: Click the **✏️** button to reclassify the **Expense Account / Category** or adjust the **Client Name**.
  * **Export Data**: Download transaction records to **CSV** for Excel or financial accounting.

### 2. Senior Consultant: **Sarah Jenkins**
* **Access Scope**: Restricted strictly to her own submissions.
* **Capabilities**:
  * Submit new reimbursement requests with attached receipts (PDF, PNG, JPG).
  * Auto-populated and locked Consultant Name.
  * **Edit & Delete**: Can edit or delete *only her own submissions* while their status is **"Pending"**.
  * **Locked on Release**: Once the manager releases the fund, the claim is permanently locked for audit integrity.

### 3. Other Pre-Configured Consultants:
* **Alex Rivera** (Tech Consultant)
* **Marcus Brody** (Strategy Consultant)

---

## 📋 Features Overview

1. **KPI Summary Cards**:
   * **Total Pending**: Real-time sum and count of pending claims awaiting manager release.
   * **Total Released**: Total funds disbursed and claims closed.
   * **For Client Refund**: Total amount tagged for client billing recovery.
   * **Total Monitored**: Overall cumulative volume.

2. **Main Transaction Table & Filters**:
   * Tabs: *All Transactions*, *Pending Requests*, and *Released / History*.
   * Live instant search bar.
   * Filters for Consultant, Expense Account, Client Refund flag, and Date Range.
   * One-click **Reset Filters** button.
   * One-click **Export CSV** button.

3. **Receipt Attachment & Viewer**:
   * Drag-and-drop file upload supporting PDF, PNG, and JPG.
   * Interactive Receipt Viewer modal with:
     * Zoom In / Zoom Out controls
     * 90° image rotation
     * Direct file download
     * Print receipt functionality

4. **Lifecycle Audit Trail**:
   * Click **🔍** on any claim to view its complete timestamped history (Submitted by, Allocations updated by, Released by Manager on [Date & Time]).

5. **Sample Data Reset**:
   * Need a fresh start? Head to **Settings & Backup** and click **"Restore Sample Data"** to reload the initial 7 realistic sample claims.
