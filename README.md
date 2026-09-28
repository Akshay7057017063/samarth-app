# DIGITAL LYF PVT. LTD. - Full-Stack MERN Platform
### Smart Bio-Magnetic Wellness • Captcha Micro-Earning • Referral Tree Network • TDS Ledger • React CMS Admin

This is a production-grade full-stack MERN (MongoDB, Express, React, Node.js) platform built to modernize the original website into an animatic, live, and interactive web application with:
1. **Interactive Public Website** (Managed via Admin CMS)
2. **Member Earning Portal & Workstation** (Captcha Solving with instant wallet credit)
3. **Genealogy Chain Tree** (Multi-level referral network visualizer)
4. **Statutory TDS & Payout Ledger** (5% TDS with PAN / 20% without PAN + 5% Admin charge)
5. **Master Admin Panel** (Withdrawal clearance desk, user management, Form 26Q tax reports, and live website CMS)

---

## 🚀 Quick Start Guide

### 1. Database Requirement
Ensure MongoDB is running locally or provide a remote MongoDB Atlas URI:
- **Local MongoDB**: Ensure MongoDB service is running (`net start MongoDB` or `mongod`).
- **MongoDB Atlas**: Update `server/.env` with your cloud URI:
  ```env
  MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/samarth_platform
  ```

### 2. Start the Backend API (Port 5000)
```bash
cd "C:\Users\CARE SYSTEM\.gemini\antigravity\scratch\samarth-platform\server"
npm start
```
The server will automatically:
- Connect to MongoDB
- Seed the **Master Admin account**
- Seed the **Default CMS Website Content**
- Seed **Demo downline members** (`SAM1002`, `SAM1003`) for instant tree visualization

### 3. Start the React Frontend (Port 3000)
In a second terminal:
```bash
cd "C:\Users\CARE SYSTEM\.gemini\antigravity\scratch\samarth-platform\client"
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Login Identifier | Password | Access / Features |
| :--- | :--- | :--- | :--- |
| **Master Admin** | `admin@samarth.com` | `admin123456` | Full Admin Panel, CMS Content Editor, Withdrawal Approvals, TDS Tax Reports |
| **Demo Member 1** | `SAM1002` (or `vikas@example.com`) | `user123456` | Member Portal, Captcha Workstation, Downline Tree, Wallet Withdrawal |
| **Demo Member 2** | `SAM1003` (or `pooja@example.com`) | `user123456` | Level 3 Member under SAM1002 |

> *Tip: On the Login Page (`/login`), click the quick-fill buttons to sign in with 1 click.*

---

## 📦 System Architecture & Features

### 1. Modern Animatic Website (Manageable from Admin CMS)
- **Live Activity Ticker**: Real-time popups showing member payouts, solved tasks, and new registrations.
- **Interactive 3D Layer Explorer**: Exploded view of the Bio-Magnetic mattress pad with clickable layers and benefit hotspots.
- **Dynamic 4-Step Pipeline**: Scroll-responsive workflow diagram replacing static icons.
- **Interactive Calculator**: Real-time income estimator based on personal tasks and team downline size.
- **Full Visual CMS (`/admin/cms`)**: Update banners, headline text, products, phone, email, and address from the admin panel without modifying code.

### 2. Captcha Earning Engine (`/dashboard/captcha`)
- Cryptographic server-side SVG distorted captcha generator (zero bot-bypassable plaintext in client source).
- Instant credit of ₹0.50 per task directly into member's wallet.
- 10% sponsor override automatically awarded to direct upline when a member solves a task.
- 50 tasks daily quota with countdown timer and celebratory confetti animations.

### 3. Referral Genealogy Tree (`/dashboard/tree`)
- Interactive recursive tree diagram showing upline and downlines.
- Expand/collapse downline branches.
- Direct referral invite link generator (`/register?ref=SAM1001`).
- MongoDB Materialized Path indexing (`/SAM1001/SAM1002/`) ensuring instant queries even with thousands of members.

### 4. Statutory TDS (Tax Deducted at Source) & Wallet (`/dashboard/wallet` & `/admin/tds`)
- **Compliant with Section 194H** of the Indian Income Tax Act.
- **Automatic Tax Calculations**:
  - With Verified PAN: **5% TDS**
  - Without PAN: **20% TDS** (Section 206AA compliance)
  - Platform/Admin Fee: **5%**
- **Admin Clearance Desk (`/admin/withdrawals`)**:
  - Review requested payouts, enter bank UTR numbers on approval, or reject and automatically refund balances to member wallets.
- **One-Click TDS Export (`/admin/tds`)**:
  - Exports a complete `.csv` spreadsheet for quarterly e-TDS Form 26Q filing.
