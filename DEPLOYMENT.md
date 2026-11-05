# 🌐 Live Web Deployment Guide for Non-Developers

This guide walks you through deploying **PettyCash Pro** to a live public URL in under 2 minutes so your team can access it from anywhere (phones, laptops, home office).

---

## ⚡ Method 1: Netlify Drop (The Easiest 60-Second Method)
*No developer tools, no Git account, no coding required. Just drag and drop.*

1. Open your browser and go to: **[https://app.netlify.com/drop](https://app.netlify.com/drop)**
2. Sign up or log in (free forever, no credit card required).
3. Open your file explorer to:  
   `C:\Users\User\.gemini\antigravity\scratch\`
4. Drag the entire **`petty-cash-app`** folder into the Netlify Drop area in your browser.
5. In 10 seconds, Netlify will build and give you a live URL like:  
   `https://petty-cash-monitoring-xyz.netlify.app`
6. Click **Site configuration** → **Change site name** to pick a friendly name like `mycompany-pettycash.netlify.app`.
7. Share that link with your consultants!

---

## 🚀 Method 2: Vercel Deploy (High Performance & Custom Domain)
*Great if you already use or want to use Vercel.*

1. Go to **[https://vercel.com/new](https://vercel.com/new)** and sign in.
2. If using GitHub, upload this folder to a GitHub repository and click **Import**.
3. All build configurations (`vercel.json`, headers, output) are already pre-configured in this repository.
4. Click **Deploy**. Vercel will publish your app to `https://your-project.vercel.app` with instant global CDN and SSL.

---

## ☁️ Setting Up Shared Cloud Storage & Authentication (Optional)

By default, **PettyCash Pro** runs with **zero-setup embedded storage** (converting attached receipts to secure Base64 image data and persisting them in browser storage). This works completely out of the box with zero external configuration!

If you want **central real-time cross-device cloud sync** (where an expense submitted on Consultant A's phone immediately appears on the Manager's laptop):

### Free Cloud Setup with Supabase:
1. Go to **[https://supabase.com](https://supabase.com)** and create a free account.
2. Click **New Project** (choose any name, e.g., `company-petty-cash`).
3. **Receipt Storage Bucket**:
   - In the left sidebar, click **Storage**.
   - Click **New Bucket**, name it `receipts`, and check **Public bucket**.
4. **Get Project Credentials**:
   - In the left sidebar, go to **Project Settings** → **API**.
   - Copy your **Project URL** and **Project API Key (`anon public`)**.
5. Add these credentials to your deployment:
   - On Vercel / Netlify: Go to **Settings** → **Environment Variables**, and add:
     - `VITE_SUPABASE_URL` = your copied URL
     - `VITE_SUPABASE_ANON_KEY` = your copied anon key
6. Once added, all uploaded receipts will automatically save directly into your cloud storage bucket, accessible by all consultants across all devices!
