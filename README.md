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
