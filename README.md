# 📊 Smart Reconciliation & Audit System (MERN)

Smart Recon is a **full-stack MERN application** built to reconcile external transaction files
against internal system records, identify mismatches or duplicates, and maintain a **complete,
immutable audit trail** of all actions.

This project is designed as a **real-world financial reconciliation system**, focusing on:
- Data correctness
- Performance at scale
- Auditability
- Role-based access control
- Asynchronous processing


## 🔐 Sample Login Credentials (Demo Only)

The following users are **pre-seeded for demonstration and testing purposes**.

> ⚠️ These credentials are for local / demo use only.

| Role    | Email              | Password     |
|-------- |--------------------|--------------|
| Admin   | admin@test.com     | password123 |
| Analyst | analyst@test.com   | password123 |
| Viewer  | viewer@test.com    | password123 |
| Sample  | sample@test.com    | password123 |


## 🧠 High-Level Architecture

```text
React (Vite)
   ↓ REST API
Node.js + Express
   ↓
MongoDB (Indexed Collections)
````

* **Frontend** handles uploads, previews, dashboards, filters, and audits
* **Backend** processes uploads asynchronously and performs reconciliation
* **MongoDB** stores normalized records, results, and immutable audit logs

---

## 🚀 Core Features

## 🔹 Reconciliation Engine

### Matching Rules (Configurable)

Matching rules are **configuration-driven**, not hardcoded.

* **Exact Match**

  * `Transaction ID + Amount`

* **Partial Match**

  * `Reference Number` match
  * Amount variance within **±2%**

* **Duplicate**

  * Same `Transaction ID` appears more than once in the uploaded file

* **Unmatched**

  * No matching system record found

---

### Match Outcomes

* ✅ Matched
* ⚠️ Partially Matched (highlight mismatched fields)
* ❌ Not Matched
* 🔁 Duplicate

---

## ⚡ Performance & Scalability

* Handles **50,000+ records per upload**
* Uses **streaming CSV parsing**
* Processing is **asynchronous and non-blocking**
* Upload Job Status:

  * `Processing`
  * `Completed`
  * `Failed`

⏱ **Performance Benchmark**

* ~50,000 records processed in **15–30 seconds**
* UI remains responsive during processing

---

## 🖥️ Frontend Features (React)

### 1️⃣ Reconciliation Dashboard

* Summary Cards:

  * Total records uploaded
  * Matched records
  * Unmatched records
  * Duplicate records
  * Reconciliation accuracy (%)
* Charts:

  * Bar / Donut chart using Recharts
* Filters:

  * Date range
  * Status
  * Uploaded by user
* Dashboard updates **dynamically** based on filters

---

### 2️⃣ File Upload & Column Mapping

* Supports **CSV** uploads (Excel supported via CSV export)
* Preview **first 20 rows** before submission
* Column mapping UI:

  * Transaction ID (required)
  * Amount (required)
  * Reference Number (required)
  * Date (required)
* Mapping can be corrected **without re-uploading** the file

---

### 3️⃣ Reconciliation View

* Side-by-side comparison:

  * System record vs Uploaded record
* Highlights mismatched fields
* Manual correction:

  * Allowed for Admin users
  * Changes reflected immediately
  * Logged in audit trail

---

### 4️⃣ Audit Timeline (UI)

* Visual timeline per record (not plain text)
* Shows:

  * Who made the change
  * What changed (old → new)
  * When it changed
  * Source (Upload / Manual Edit / System)
* Fully traceable history

---

## 🔐 Authentication & Authorization

### Roles

* **Admin**

  * Full access
  * Manage users
  * Upload system data
  * Manual corrections

* **Analyst**

  * Upload files
  * Run reconciliation
  * View reports

* **Viewer**

  * Read-only access
  * View audit history

🔒 Role enforcement exists in **both frontend and backend**

---

## 🧾 Audit Trail (Immutable)

* Stored in a **separate AuditLogs collection**
* Captures:

  * Old value
  * New value
  * User
  * Timestamp
  * Source of change
* Audit records are **immutable**
* No update or delete operations allowed

---

## 🔁 Idempotency & Data Consistency

* Uploading the **same file multiple times** does NOT duplicate data
* File hash comparison ensures:

  * Existing results are reused if data hasn’t changed
* Reprocessing is safe and consistent

---

## 🛢️ Database Design (MongoDB)

### Collections

* `Users`
* `UploadJobs`
* `Records`
* `ReconciliationResults`
* `AuditLogs`

### Mandatory Indexes

* `transactionID`
* `referenceNumber`
* `uploadJobId`

Indexes ensure fast lookups even for large datasets.

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Lucide React
* Recharts

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)

### Processing

* `csv-parser` (streaming)
* `multer` (memory storage for serverless)

### Deployment

* Vercel (Frontend + Serverless Backend)

---

## ⚙️ Installation & Setup

### Prerequisites

* Node.js v16+
* MongoDB (Local or Atlas)

### Clone Repository

```bash
git clone https://github.com/NagaPrabhu-N/Smart-Reconciliation-and-Audit-System.git
cd smart-recon
```

### Backend

```bash
cd backend
npm install
npm run server
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🕹️ Usage & Workflow Guide

Follow these steps to test the full lifecycle of the application, including role-specific features.

### 1️⃣ Initial Admin Setup (Prerequisite)
* **Login:** Use the Admin credentials (`admin@test.com` / `password123`).
* **Upload System Data (Admin Power):**
  * Navigate to **"Update System Data"** in the sidebar.
  * Upload your *Master System Record CSV* (the "Truth" source).
  * *Action:* This performs a bulk replace operation, wiping old system records and establishing the new baseline for future reconciliations.

### 2️⃣ User Management (Admin Power)
* **Create Users:**
  * Go to **"Manage Users"** in the sidebar.
  * Click **"Add New User"** to create accounts for Analysts or Viewers.
  * Assign specific roles (`Analyst`, `Viewer`) to enforce access control.
* **Edit/Delete:** Admins can update user roles or remove access for existing users.

### 3️⃣ Running a Reconciliation (Analyst/Admin)
* **Login:** Log in as an Analyst (or stay logged in as Admin).
* **Upload File:**
  * Click **"Upload New File"**.
  * Select a *Bank Statement CSV* to compare against the loaded System Data.
* **Map Columns:**
  * Map the CSV headers (e.g., `Bank_Ref_ID`) to the system fields (`Transaction ID`, `Amount`).
* **Process:** Click **"Confirm & Process"**.
  * The system runs the matching algorithm asynchronously.
  * Once complete, the **Dashboard Report** will automatically load.

### 4️⃣ Analyzing Results
* **Dashboard:** View summary charts showing the distribution of Matched vs. Mismatched records.
* **Detailed Report:** Scroll down to the table view.
  * **Green Rows:** Perfect matches.
  * **Yellow Rows:** Partial matches (e.g., variance ≤ 2%).
  * **Red Rows:** Mismatches or duplicate entries.
* **Filters:** Use the dropdowns to filter by "Mismatch Only" or search for specific Transaction IDs.

### 5️⃣ Manual Corrections (Admin Power)
* **Identify:** Locate a "Mismatch" row that requires adjustment (e.g., a known bank fee).
* **Edit:** Click the **Pencil Icon** (visible only to Admins).
* **Update:** Change the status to "Matched," adjust the amount, or add an explanatory note.
* **Save:** The record updates immediately, and a permanent **Audit Log** entry is generated.

### 6️⃣ Audit & History (Viewer/Admin)
* **Audit Trail:** Navigate to the **"Audit Trail"** page.
* **Timeline:** View a chronological history of all system actions:
  * *Who* uploaded files.
  * *Who* updated the master system data.
  * *Who* manually corrected records (displaying Old vs. New values).
* **Historical Snapshot:** Click **"View Data Snapshot"** on any past "File Reconciliation" log to reload the dashboard exactly as it appeared at that time.

## ☁️ Deployment Notes (Vercel)

* Backend uses `multer.memoryStorage()` (read-only FS compatible)
* Serverless-friendly architecture
* Environment-based CORS control

---

## 📄 Sample Files

* Sample CSV files are included in `/samples`
* Covers:

  * Exact match
  * Partial match
  * Duplicate
  * Unmatched cases

---

## 📘 API Documentation

* Postman collection / Swagger documentation included
* Covers:

  * Upload
  * Reconciliation
  * Audit
  * User management

---

## ⚠️ Assumptions & Trade-offs

* CSV chosen over XLSX for performance and streaming
* Async job model preferred over synchronous API calls
* No background queue (BullMQ) to keep infra simple
* File hashing used instead of content diff for idempotency

---

## 🚧 Limitations

* Extremely large files (>100k) may require batching
* Excel files must be converted to CSV
* Real-time progress tracking can be enhanced with WebSockets

---

## 🔐 Security Notes
- Passwords are hashed using bcrypt
- Sample credentials are for demo only
- No credentials are stored in plaintext in the database
