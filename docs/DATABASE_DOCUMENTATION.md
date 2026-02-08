# Finance Management — Database Documentation

**Document Version:** 1.0
**Last Updated:** February 8, 2026
**Classification:** Internal — Engineering & Leadership
**Audience:** CTO, Engineering Leads, Backend Developers, DevOps

---

## Table of Contents

1. [Overview](#1-overview)
2. [Database Architecture](#2-database-architecture)
3. [Collections Overview](#3-collections-overview)
4. [Collection: settings](#4-collection-settings)
5. [Collection: expenses](#5-collection-expenses)
6. [Collection: monthly_summaries](#6-collection-monthly_summaries)
7. [Entity Relationship Diagram](#7-entity-relationship-diagram)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Query Patterns](#9-query-patterns)
10. [Data Integrity & Validation](#10-data-integrity--validation)
11. [Backup & Recovery](#11-backup--recovery)
12. [Storage Estimation](#12-storage-estimation)
13. [Security](#13-security)
14. [MongoDB Atlas Setup Guide](#14-mongodb-atlas-setup-guide)
15. [Migration & Seeding](#15-migration--seeding)
16. [Monitoring](#16-monitoring)

---

## 1. Overview

### Role of the Database Layer

The database layer serves as the persistent storage backbone of the Finance Management application. It is responsible for:

- **Storing user configuration** — salary, budget categories, and fixed deductions
- **Recording every financial transaction** — individual expense entries with date, category, amount, and description
- **Preserving historical summaries** — month-end snapshots that enable trend analysis and reporting without recomputation

The database is accessed exclusively through the Node.js/Express backend via the Mongoose ODM. No direct client-to-database connections exist, ensuring a secure and controlled data access pattern.

### Why MongoDB Was Chosen

| Decision Factor | Rationale |
|---|---|
| **Document-oriented model** | Financial records naturally map to JSON-like documents. A single settings document encapsulates salary, deductions, and categories as a cohesive unit — no joins required. |
| **Flexible schema** | Categories and deductions are embedded arrays that can grow or shrink without schema migrations. Adding a new field (e.g., a future "notes" field on deductions) requires zero downtime. |
| **Mongoose ODM compatibility** | Mongoose provides schema-level validation, type casting, and middleware hooks that pair naturally with the Node.js/Express backend, reducing boilerplate code. |
| **MongoDB Atlas free tier** | The M0 cluster provides a production-grade, cloud-hosted database at zero cost — ideal for a personal finance tool with a single user. |
| **JSON-native queries** | Aggregation pipelines for monthly spending breakdowns are expressive and performant without the overhead of SQL joins across normalized tables. |

### MongoDB Atlas M0 Cluster Specifications

| Specification | Value |
|---|---|
| **Cluster tier** | M0 Sandbox (free forever) |
| **Storage** | 512 MB |
| **RAM** | Shared (multi-tenant) |
| **vCPUs** | Shared (multi-tenant) |
| **Connections** | Up to 500 concurrent |
| **Hosting** | AWS / GCP / Azure (user-selected region) |
| **MongoDB version** | 7.x |
| **Availability** | No SLA (best-effort for free tier) |
| **Automatic backups** | Not included on M0 (manual export available) |
| **Monitoring** | Basic metrics via Atlas UI |

---

## 2. Database Architecture

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                        │
│                   React SPA                               │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS REST API
                       v
┌──────────────────────────────────────────────────────────┐
│              APPLICATION SERVER                           │
│              Node.js + Express.js                         │
│                                                          │
│   ┌────────────────────────────────────────────────┐     │
│   │           Mongoose ODM (v8.x)                  │     │
│   │                                                │     │
│   │   Models:                                      │     │
│   │   ├── Settings.js    → settings collection     │     │
│   │   ├── Expense.js     → expenses collection     │     │
│   │   └── MonthlySummary.js → monthly_summaries    │     │
│   └──────────────────┬─────────────────────────────┘     │
│                      │                                   │
│   Hosted on: Render (free tier)                          │
└──────────────────────┬───────────────────────────────────┘
                       │ MongoDB Wire Protocol
                       │ (TLS-encrypted connection)
                       v
┌──────────────────────────────────────────────────────────┐
│              MONGODB ATLAS CLUSTER (M0)                   │
│                                                          │
│   Database: finance-management                           │
│   ┌────────────────────────────────────────────────┐     │
│   │                                                │     │
│   │   ┌─────────────┐  ┌──────────────┐           │     │
│   │   │  settings    │  │   expenses   │           │     │
│   │   │  (1 doc)     │  │   (N docs)   │           │     │
│   │   └─────────────┘  └──────────────┘           │     │
│   │                                                │     │
│   │   ┌──────────────────────┐                     │     │
│   │   │  monthly_summaries   │                     │     │
│   │   │  (1 doc per month)   │                     │     │
│   │   └──────────────────────┘                     │     │
│   │                                                │     │
│   └────────────────────────────────────────────────┘     │
│                                                          │
│   Cloud: AWS/GCP/Azure (user-selected region)            │
└──────────────────────────────────────────────────────────┘
```

### Relationship Between Collections

The three collections serve distinct but interconnected roles:

- **`settings`** is the configuration source of truth. It defines what categories exist, what the salary is, and what fixed deductions apply. It is read by almost every operation but modified infrequently.
- **`expenses`** is the transactional data store. Each document represents a single financial event. Expenses reference categories by name (string match to `settings.categories[].name`).
- **`monthly_summaries`** is the reporting cache. It stores pre-computed aggregations derived from `expenses` data, avoiding expensive recalculation when viewing historical months.

---

## 3. Collections Overview

| Collection | Purpose | Document Count Pattern | Growth Rate | Primary Access Pattern |
|---|---|---|---|---|
| `settings` | Stores salary, categories, and fixed deductions | Exactly 1 document (singleton) | Static (upserted, not appended) | Read on every page load; written on settings update |
| `expenses` | Stores individual expense entries | Many documents, grows continuously | ~30-100 documents per month | Read/write daily; queried by month/year |
| `monthly_summaries` | Stores month-end aggregated snapshots | 1 document per calendar month | 12 documents per year | Read on report views; written on report generation |

---

## 4. Collection: `settings`

### Purpose and Behavior

The `settings` collection holds a **single document** that represents the user's current financial configuration. This document is the application's configuration backbone — it is consulted whenever the dashboard loads, an expense is added (to validate the category), or a report is generated (to determine salary and deductions).

**Behavioral characteristics:**

- There is always exactly **one document** in this collection (singleton pattern).
- The document is created on first use and **upserted** on every subsequent update.
- Updates replace the entire document (full-document upsert via `findOneAndUpdate` with `upsert: true`).
- Changes to settings affect **future operations only** — historical summaries retain the values that were active at the time of their generation.

### Complete Document Schema

| Field | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Auto-generated | Unique, immutable | MongoDB default primary key |
| `salary` | Number | Yes | — | Must be > 0 | Monthly gross salary in INR |
| `salaryCreditDate` | Number | Yes | — | Integer, min: 1, max: 31 | Day of month when salary is credited |
| `fixedDeductions` | Array | No | `[]` | — | List of recurring fixed deductions (see subdocument spec below) |
| `categories` | Array | No | `[]` | — | List of budget categories (see subdocument spec below) |
| `createdAt` | Date | Auto | Auto-generated | Managed by Mongoose `timestamps` | Document creation timestamp |
| `updatedAt` | Date | Auto | Auto-generated | Managed by Mongoose `timestamps` | Last modification timestamp |

### Embedded Subdocument: `fixedDeductions[]`

Each element in the `fixedDeductions` array represents a recurring expense that is automatically accounted for before budget distribution.

| Field | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Auto-generated | Unique within array | Mongoose auto-generated subdocument ID |
| `name` | String | Yes | — | Non-empty string | Name of the fixed deduction (e.g., "Bike EMI") |
| `amount` | Number | Yes | — | Must be > 0 | Fixed deduction amount in INR |
| `deductionDate` | Number | Yes | — | Integer, min: 1, max: 31 | Day of month when deduction occurs |

### Embedded Subdocument: `categories[]`

Each element in the `categories` array defines a spending envelope with a monthly budget limit.

| Field | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Auto-generated | Unique within array | Mongoose auto-generated subdocument ID |
| `name` | String | Yes | — | Non-empty, unique within the array | Category display name (e.g., "Personal Expenses") |
| `monthlyLimit` | Number | Yes | — | Must be > 0 | Maximum budgeted amount for this category per month in INR |
| `type` | String | No | `"variable"` | Enum: `["fixed", "variable"]` | Classification of the category type |

### Sample Document

```json
{
  "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
  "salary": 30000,
  "salaryCreditDate": 3,
  "fixedDeductions": [
    {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e2",
      "name": "Bike EMI",
      "amount": 5000,
      "deductionDate": 3
    }
  ],
  "categories": [
    {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e3",
      "name": "Mother's Allowance",
      "monthlyLimit": 5000,
      "type": "variable"
    },
    {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e4",
      "name": "Personal Expenses",
      "monthlyLimit": 3000,
      "type": "variable"
    },
    {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e5",
      "name": "Miscellaneous",
      "monthlyLimit": 1500,
      "type": "variable"
    }
  ],
  "createdAt": "2026-01-03T09:30:00.000Z",
  "updatedAt": "2026-02-01T14:15:00.000Z"
}
```

### Indexes

| Index | Fields | Type | Rationale |
|---|---|---|---|
| Default `_id` | `{ _id: 1 }` | Unique | MongoDB default. Sufficient for a single-document collection — no additional indexes are needed since all queries target the sole document. |

---

## 5. Collection: `expenses`

### Purpose and Behavior

The `expenses` collection is the application's transactional ledger. Each document represents a single expense entry logged by the user. This collection grows continuously over time and is the primary source of data for both the live dashboard and historical reports.

**Behavioral characteristics:**

- **One document per expense** — each spending event creates a new document.
- **Grows over time** — approximately 30-100 new documents per month depending on user activity.
- **Supports full CRUD** — expenses can be created, read, updated, and deleted.
- **Month and year are derived server-side** — when an expense is created, the `month` and `year` fields are extracted from the `date` field by the backend controller, ensuring consistency.
- **Soft validation against settings** — the `category` field should match a category name from the `settings` document, validated at the application level.

### Complete Document Schema

| Field | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Auto-generated | Unique, immutable | MongoDB default primary key |
| `date` | Date | Yes | — | Valid date; should not be in the future (application-level) | Date when the expense occurred |
| `category` | String | Yes | — | Non-empty; must match an existing category in `settings` (application-level) | Spending category this expense belongs to |
| `amount` | Number | Yes | — | min: 0 (Mongoose schema validation) | Expense amount in INR |
| `description` | String | Yes | — | maxlength: 200 (Mongoose schema validation) | Short note describing the expense |
| `month` | Number | Yes | — | min: 1, max: 12 | Calendar month extracted from `date` (1 = January, 12 = December) |
| `year` | Number | Yes | — | Positive integer | Calendar year extracted from `date` |
| `createdAt` | Date | Auto | Auto-generated | Managed by Mongoose `timestamps` | Document creation timestamp |
| `updatedAt` | Date | Auto | Auto-generated | Managed by Mongoose `timestamps` | Last modification timestamp |

### Field Constraints and Validation Rules

| Field | Mongoose-Level Validation | Application-Level Validation |
|---|---|---|
| `date` | `required: true`, must be a valid `Date` | Must not be a future date |
| `category` | `required: true`, must be a non-empty `String` | Must match a `name` value in `settings.categories[]` |
| `amount` | `required: true`, `min: 0` | Must be strictly greater than 0 (controller check) |
| `description` | `required: true`, `maxlength: 200` | Must be at least 1 character |
| `month` | `required: true`, `min: 1`, `max: 12` | Derived from `date` — not user-supplied |
| `year` | `required: true` | Derived from `date` — not user-supplied |

### Sample Documents

```json
[
  {
    "_id": "65b2c3d4e5f6a7b8c9d0e101",
    "date": "2026-02-05T00:00:00.000Z",
    "category": "Personal Expenses",
    "amount": 500,
    "description": "Dinner with friends at Barbeque Nation",
    "month": 2,
    "year": 2026,
    "createdAt": "2026-02-05T19:30:00.000Z",
    "updatedAt": "2026-02-05T19:30:00.000Z"
  },
  {
    "_id": "65b2c3d4e5f6a7b8c9d0e102",
    "date": "2026-02-08T00:00:00.000Z",
    "category": "Mother's Allowance",
    "amount": 2000,
    "description": "Monthly pocket money to Mom",
    "month": 2,
    "year": 2026,
    "createdAt": "2026-02-08T10:00:00.000Z",
    "updatedAt": "2026-02-08T10:00:00.000Z"
  },
  {
    "_id": "65b2c3d4e5f6a7b8c9d0e103",
    "date": "2026-02-12T00:00:00.000Z",
    "category": "Miscellaneous",
    "amount": 350,
    "description": "New phone screen guard from Croma",
    "month": 2,
    "year": 2026,
    "createdAt": "2026-02-12T15:45:00.000Z",
    "updatedAt": "2026-02-12T15:45:00.000Z"
  },
  {
    "_id": "65b2c3d4e5f6a7b8c9d0e104",
    "date": "2026-02-15T00:00:00.000Z",
    "category": "Personal Expenses",
    "amount": 250,
    "description": "Lunch at office canteen with team",
    "month": 2,
    "year": 2026,
    "createdAt": "2026-02-15T13:30:00.000Z",
    "updatedAt": "2026-02-15T13:30:00.000Z"
  }
]
```

### Indexes

| # | Index Definition | Type | Fields | Purpose |
|---|---|---|---|---|
| 1 | Default `_id` | Unique | `{ _id: 1 }` | MongoDB default primary key index. Used for individual document lookups (edit/delete by ID). |
| 2 | Month-Year Compound | Non-unique | `{ month: 1, year: 1 }` | **Primary query index.** Optimizes the most frequent query pattern: fetching all expenses for a given month. Used by the dashboard, expense history page, and report generation. Without this index, every query for a month's expenses would require a full collection scan. |
| 3 | Category-Month-Year Compound | Non-unique | `{ category: 1, month: 1, year: 1 }` | **Aggregation index.** Optimizes per-category spending calculations. When the report controller groups expenses by category within a month, this index allows MongoDB to satisfy the `$match` and `$group` stages efficiently using an index scan rather than an in-memory sort. Also supports category-filtered views in the expense history page. |

**Index creation in Mongoose:**

```javascript
expenseSchema.index({ month: 1, year: 1 });
expenseSchema.index({ category: 1, month: 1, year: 1 });
```

**Why each index exists:**

- **`{ month: 1, year: 1 }`** — The dashboard and expense history load by calling `Expense.find({ month, year })`. This is executed on every page load for the current month. Without an index, MongoDB scans every expense document ever created. With this compound index, it jumps directly to the relevant month's documents.

- **`{ category: 1, month: 1, year: 1 }`** — The report controller runs an aggregation pipeline that groups expenses by category within a month (`$match` on month/year, then `$group` by category). This index covers the full query, allowing a covered index scan. It also supports the expense history page's category filter dropdown.

---

## 6. Collection: `monthly_summaries`

### Purpose

The `monthly_summaries` collection stores **pre-computed, month-end financial snapshots**. Each document captures the complete financial picture for a single calendar month: the salary, deductions, per-category spending breakdown, total expenditure, and net savings.

This collection exists to **avoid recalculating historical data from raw expenses** every time a user views past reports. Once a month's summary is generated, it serves as a read-optimized cache for the Monthly Reports page.

### Behavioral Characteristics

- **One document per calendar month** — enforced by a unique compound index on `{ month, year }`.
- **Created on demand** — when a user views a monthly report for a month that has no stored summary, the system aggregates expenses, computes the summary, and stores it via upsert.
- **Updated via upsert** — if a summary already exists for the requested month/year, it is replaced with freshly computed data (handles the case where expenses are edited retroactively).
- **Current month is computed live** — the dashboard always calculates the current month's data in real time from `settings` and `expenses`. Only past months are persisted here.

### Complete Document Schema

| Field | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `_id` | ObjectId | Auto | Auto-generated | Unique, immutable | MongoDB default primary key |
| `month` | Number | Yes | — | min: 1, max: 12 | Calendar month (1 = January, 12 = December) |
| `year` | Number | Yes | — | Positive integer | Calendar year |
| `salary` | Number | Yes | — | Must be > 0 | Salary that was active during this month |
| `totalFixedDeductions` | Number | Yes | — | >= 0 | Sum of all fixed deductions for this month |
| `categoryBreakdown` | Array | Yes | — | — | Per-category spending details (see subdocument spec below) |
| `totalSpent` | Number | Yes | — | >= 0 | Total amount spent (fixed deductions + all variable expenses) |
| `totalSavings` | Number | Yes | — | Can be negative (overspending) | Net savings: `salary - totalSpent` |
| `createdAt` | Date | Auto | Auto-generated | Managed by Mongoose `timestamps` | Document creation timestamp |
| `updatedAt` | Date | Auto | Auto-generated | Managed by Mongoose `timestamps` | Last modification timestamp |

### Embedded Subdocument: `categoryBreakdown[]`

Each element captures the spending performance of a single budget category for the month.

| Field | Type | Required | Default | Constraints | Description |
|---|---|---|---|---|---|
| `category` | String | Yes | — | Non-empty | Category name (matches `settings.categories[].name` at time of generation) |
| `limit` | Number | Yes | — | >= 0 | Budget limit that was active for this category during this month |
| `spent` | Number | Yes | — | >= 0 | Actual amount spent in this category during this month |

### Sample Document

```json
{
  "_id": "65c3d4e5f6a7b8c9d0e1f201",
  "month": 1,
  "year": 2026,
  "salary": 30000,
  "totalFixedDeductions": 5000,
  "categoryBreakdown": [
    {
      "category": "Mother's Allowance",
      "limit": 5000,
      "spent": 4200
    },
    {
      "category": "Personal Expenses",
      "limit": 3000,
      "spent": 2750
    },
    {
      "category": "Miscellaneous",
      "limit": 1500,
      "spent": 980
    }
  ],
  "totalSpent": 12930,
  "totalSavings": 17070,
  "createdAt": "2026-02-01T00:05:00.000Z",
  "updatedAt": "2026-02-01T00:05:00.000Z"
}
```

**Reading the sample:** In January 2026, the user earned Rs.30,000. After the Rs.5,000 Bike EMI and Rs.7,930 in variable spending across three categories, total expenditure was Rs.12,930, leaving Rs.17,070 in savings.

### Indexes

| # | Index Definition | Type | Fields | Purpose |
|---|---|---|---|---|
| 1 | Default `_id` | Unique | `{ _id: 1 }` | MongoDB default primary key |
| 2 | Month-Year Unique Compound | **Unique** | `{ month: 1, year: 1 }` | Prevents duplicate summaries for the same month. Enables efficient lookup by month/year. Supports the upsert pattern used during report generation. |

**Index creation in Mongoose:**

```javascript
monthlySummarySchema.index({ month: 1, year: 1 }, { unique: true });
```

**Why the unique constraint matters:** Without it, a race condition or repeated report generation could create duplicate summaries for the same month, leading to inconsistent report data. The unique index guarantees exactly one summary per calendar month at the database level.

### When This Document Is Created/Updated

| Trigger | Action |
|---|---|
| User navigates to Monthly Reports and selects a past month | System checks if a summary exists. If not, it aggregates expenses, computes the summary, and **inserts** it. |
| User views a month that already has a summary | System retrieves the existing summary. If the user triggers a refresh, it **upserts** with freshly computed data. |
| User edits or deletes a past expense | The corresponding month's summary (if it exists) becomes stale. On next report view, it is **re-upserted** with corrected data. |

---

## 7. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        SETTINGS                              │
│                     (Single Document)                         │
│                                                             │
│  salary            : Number                                  │
│  salaryCreditDate  : Number                                  │
│  fixedDeductions[] : [{name, amount, deductionDate}]         │
│  categories[]      : [{name, monthlyLimit, type}]            │
│                                                             │
└──────────┬─────────────────────────────────┬────────────────┘
           │                                 │
           │ category.name                   │ salary, categories,
           │ referenced by                   │ fixedDeductions
           │ expense.category                │ used to compute
           │ (logical link)                  │ summary fields
           │                                 │
           v                                 v
┌─────────────────────┐          ┌────────────────────────────┐
│      EXPENSES        │          │    MONTHLY_SUMMARIES       │
│  (Many Documents)    │          │   (1 per Month)            │
│                      │          │                            │
│  date       : Date   │   ──>   │  month             : Num   │
│  category   : String │ aggreg- │  year              : Num   │
│  amount     : Number │  ated   │  salary            : Num   │
│  description: String │  into   │  totalFixedDeduc.  : Num   │
│  month      : Number │          │  categoryBreakdown : []    │
│  year       : Number │          │  totalSpent        : Num   │
│                      │          │  totalSavings      : Num   │
└──────────────────────┘          └────────────────────────────┘

         ▲                                  ▲
         │              LEGEND              │
         │                                  │
    1 expense =                     1 summary =
    1 document                  aggregation of all
    (CRUD operations)           expenses for that
                                 month + settings
```

### Relationship Semantics

**Important:** These are **logical relationships**, not enforced foreign keys. MongoDB is a NoSQL document database and does not support foreign key constraints. Referential integrity is maintained at the **application level** through Mongoose validation and controller logic.

| Relationship | Type | Mechanism | Description |
|---|---|---|---|
| `settings` -> `expenses` | One-to-Many (logical) | `settings.categories[].name` matches `expenses.category` (string equality) | Each expense must belong to a category defined in settings. Validated by the expense controller before insertion. |
| `expenses` -> `monthly_summaries` | Many-to-One (aggregation) | `expenses` documents with matching `month`/`year` are aggregated into a single `monthly_summaries` document | The summary is a computed derivative of the raw expense data, not a live link. |
| `settings` -> `monthly_summaries` | One-to-Many (snapshot) | `settings.salary` and `settings.fixedDeductions` values are copied into the summary at generation time | The summary captures the settings state at the time of report generation, creating an immutable historical record. |

---

## 8. Data Flow Diagrams

### 8.1 Adding an Expense

```
User submits expense form
         │
         v
┌──────────────────────────────┐
│  Frontend Validation          │
│  - Amount > 0                 │
│  - Category selected          │
│  - Description non-empty      │
│  - Date valid                 │
└──────────────┬───────────────┘
               │ POST /api/expenses
               v
┌──────────────────────────────┐
│  Backend Controller           │
│  1. Validate input fields     │
│  2. Verify category exists    │◄──── READ settings.categories[]
│     in settings               │
│  3. Extract month & year      │
│     from date field           │
│  4. Construct expense doc     │
└──────────────┬───────────────┘
               │
               v
┌──────────────────────────────┐
│  MongoDB: expenses            │
│  INSERT new document          │──── WRITE to expenses collection
└──────────────────────────────┘
               │
               v
     Return created expense
     to frontend (HTTP 201)
```

### 8.2 Viewing the Dashboard

```
User opens Dashboard page
         │
         v
┌──────────────────────────────┐
│  Frontend: GET /api/reports/  │
│            current            │
└──────────────┬───────────────┘
               │
               v
┌──────────────────────────────────────────────────────┐
│  Backend: reportController.getCurrentReport()         │
│                                                      │
│  Step 1: READ settings document                      │◄── READ settings
│          (salary, fixedDeductions, categories)        │
│                                                      │
│  Step 2: Determine current month/year                │
│          (based on salaryCreditDate logic)            │
│                                                      │
│  Step 3: AGGREGATE expenses for current month        │◄── READ expenses
│          { $match: { month, year } }                 │    (index scan)
│          { $group: { _id: "$category",               │
│                      totalSpent: { $sum: "$amount" } │
│                    }                                  │
│          }                                           │
│                                                      │
│  Step 4: COMPUTE live summary                        │
│          - spent per category                        │
│          - remaining = limit - spent                 │
│          - percentUsed = (spent / limit) * 100       │
│          - totalSpent = fixedDeductions + variable    │
│          - currentSavings = salary - totalSpent      │
│                                                      │
│  NOTE: This is computed in real time.                │
│        Nothing is written to monthly_summaries.      │
└──────────────────────────────────────────────────────┘
               │
               v
     Return computed summary
     to frontend (HTTP 200)
```

### 8.3 Generating a Monthly Report

```
User navigates to Monthly Reports
and selects a past month (e.g., Jan 2026)
         │
         v
┌──────────────────────────────┐
│  Frontend: GET /api/reports/  │
│  monthly?month=1&year=2026   │
└──────────────┬───────────────┘
               │
               v
┌──────────────────────────────────────────────────────┐
│  Backend: reportController.getMonthlyReport()         │
│                                                      │
│  Step 1: CHECK if summary exists                     │
│          MonthlySummary.findOne({ month: 1,          │◄── READ monthly_summaries
│                                   year: 2026 })      │
│                                                      │
│  ┌─── If found ──────────────────────────────────┐   │
│  │  Return existing summary document             │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌─── If NOT found ─────────────────────────────┐    │
│  │                                               │   │
│  │  Step 2: READ settings                        │◄──┤── READ settings
│  │  Step 3: AGGREGATE expenses                   │◄──┤── READ expenses
│  │          for month=1, year=2026               │   │
│  │                                               │   │
│  │  Step 4: COMPUTE summary                      │   │
│  │  - categoryBreakdown from aggregation         │   │
│  │  - totalSpent, totalSavings                   │   │
│  │                                               │   │
│  │  Step 5: UPSERT into monthly_summaries        │──►┤── WRITE monthly_summaries
│  │          { month: 1, year: 2026 }             │   │
│  │          (unique index prevents duplicates)   │   │
│  │                                               │   │
│  │  Step 6: Return computed summary              │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### 8.4 Updating Settings

```
User modifies settings and clicks Save
         │
         v
┌──────────────────────────────┐
│  Frontend Validation          │
│  - Salary > 0                 │
│  - Category names unique      │
│  - Limits > 0                 │
└──────────────┬───────────────┘
               │ PUT /api/settings
               v
┌──────────────────────────────────────────────────────┐
│  Backend: settingsController.updateSettings()         │
│                                                      │
│  Step 1: Validate all input fields                   │
│                                                      │
│  Step 2: UPSERT settings document                    │
│          Settings.findOneAndUpdate(                   │──► WRITE settings
│            {},                    // match any (only  │    (single document
│            { $set: requestBody }, //  one exists)     │     upserted)
│            { upsert: true, new: true }               │
│          )                                           │
│                                                      │
│  NOTE: This affects FUTURE months only.              │
│  Past monthly_summaries retain their original values.│
│  The current month's dashboard will reflect the      │
│  new settings immediately (computed live).            │
└──────────────────────────────────────────────────────┘
               │
               v
     Return updated settings
     to frontend (HTTP 200)
```

---

## 9. Query Patterns

### 9.1 Find All Expenses for a Month

**Use case:** Dashboard, Expense History page

```javascript
// Mongoose query
const expenses = await Expense.find({ month, year }).sort({ date: -1 });
```

**MongoDB equivalent:**

```javascript
db.expenses.find({ month: 2, year: 2026 }).sort({ date: -1 })
```

**Index used:** `{ month: 1, year: 1 }`

**Performance notes:** This query performs an index scan on the `month_1_year_1` index, retrieving only documents matching the specified month/year. The `sort({ date: -1 })` is an in-memory sort, but with only 30-100 documents per month, this is negligible. For a year of data (~720 documents total), the index reduces the scan from 720 documents to approximately 60.

---

### 9.2 Aggregate Spending Per Category

**Use case:** Dashboard summary, Report generation

```javascript
// Mongoose aggregation pipeline
const categorySpending = await Expense.aggregate([
  {
    $match: { month, year }
  },
  {
    $group: {
      _id: "$category",
      totalSpent: { $sum: "$amount" }
    }
  }
]);
```

**MongoDB equivalent:**

```javascript
db.expenses.aggregate([
  { $match: { month: 2, year: 2026 } },
  { $group: { _id: "$category", totalSpent: { $sum: "$amount" } } }
])
```

**Index used:** `{ category: 1, month: 1, year: 1 }`

**Performance notes:** The `$match` stage uses the compound index to filter documents efficiently. The `$group` stage then iterates only over the matched documents. Since `category` is the leading field in the index, MongoDB can perform the grouping with minimal memory overhead. For typical usage (60 expenses across 3 categories), this completes in under 1ms.

---

### 9.3 Get or Create Monthly Summary

**Use case:** Monthly Reports page

```javascript
// Step 1: Try to find existing summary
let summary = await MonthlySummary.findOne({ month, year });

// Step 2: If not found, compute and upsert
if (!summary) {
  const computedData = await computeSummaryFromExpenses(month, year);

  summary = await MonthlySummary.findOneAndUpdate(
    { month, year },
    { $set: computedData },
    { upsert: true, new: true }
  );
}
```

**Index used:** `{ month: 1, year: 1 }` (unique)

**Performance notes:** The `findOne` lookup is an index seek operation (O(log n)). With at most 12 documents per year, this is instantaneous. The `findOneAndUpdate` with `upsert: true` leverages the unique index to either update the existing document or insert a new one atomically, preventing race conditions.

---

### 9.4 Get Settings (Singleton)

**Use case:** Nearly every operation

```javascript
const settings = await Settings.findOne({});
```

**Performance notes:** With exactly one document in the collection, this is always a single-document retrieval. The working set (the settings document) will almost always be in MongoDB's memory cache, making this effectively a no-op in terms of I/O.

---

### 9.5 Get All Historical Summaries

**Use case:** Monthly Reports overview / comparison

```javascript
const history = await MonthlySummary.find({}).sort({ year: -1, month: -1 });
```

**Performance notes:** Scans the entire `monthly_summaries` collection (12 documents per year). Even after 10 years, this is only 120 documents — a trivial full collection scan. No additional index needed.

---

## 10. Data Integrity & Validation

### Three Layers of Validation

The application enforces data integrity through a layered validation strategy:

```
┌─────────────────────────────────────┐
│  Layer 1: Frontend Validation        │  ← Immediate user feedback
│  (React form validation)             │
├─────────────────────────────────────┤
│  Layer 2: Application Validation     │  ← Business rule enforcement
│  (Express controller logic)          │
├─────────────────────────────────────┤
│  Layer 3: Schema Validation          │  ← Last line of defense
│  (Mongoose schema constraints)       │
└─────────────────────────────────────┘
```

### Mongoose-Level Validation (Layer 3)

| Collection | Field | Validation Rule | Error on Violation |
|---|---|---|---|
| `settings` | `salary` | `required: true` | `ValidatorError: Path 'salary' is required` |
| `settings` | `salaryCreditDate` | `required: true, min: 1, max: 31` | `ValidatorError: Path 'salaryCreditDate' (32) is more than maximum allowed value (31)` |
| `settings` | `fixedDeductions[].name` | `required: true` | `ValidatorError: Path 'name' is required` |
| `settings` | `fixedDeductions[].amount` | `required: true` | `ValidatorError: Path 'amount' is required` |
| `settings` | `categories[].name` | `required: true` | `ValidatorError: Path 'name' is required` |
| `settings` | `categories[].monthlyLimit` | `required: true` | `ValidatorError: Path 'monthlyLimit' is required` |
| `settings` | `categories[].type` | `enum: ["fixed", "variable"]` | `ValidatorError: 'invalid' is not a valid enum value for path 'type'` |
| `expenses` | `date` | `required: true` | `ValidatorError: Path 'date' is required` |
| `expenses` | `category` | `required: true` | `ValidatorError: Path 'category' is required` |
| `expenses` | `amount` | `required: true, min: 0` | `ValidatorError: Path 'amount' (-100) is less than minimum allowed value (0)` |
| `expenses` | `description` | `required: true, maxlength: 200` | `ValidatorError: Path 'description' is longer than the maximum allowed length (200)` |
| `expenses` | `month` | `required: true, min: 1, max: 12` | `ValidatorError: Path 'month' (13) is more than maximum allowed value (12)` |
| `expenses` | `year` | `required: true` | `ValidatorError: Path 'year' is required` |

### Application-Level Validation (Layer 2)

| Rule | Enforced By | Description |
|---|---|---|
| Category must exist in settings | `expenseController.addExpense()` | Before inserting an expense, the controller reads `settings.categories` and verifies that the submitted `category` string matches an existing category name. Returns HTTP 400 if no match. |
| Date must not be in the future | `expenseController.addExpense()` | The controller checks `new Date(req.body.date) <= new Date()`. Returns HTTP 400 for future dates. |
| Category names must be unique | `settingsController.updateSettings()` | Before upserting settings, the controller checks for duplicate category names in the submitted array. |
| Amount must be strictly positive | `expenseController.addExpense()` | While Mongoose allows `min: 0`, the controller enforces `amount > 0` at the business logic level. |

### Orphaned Expenses Prevention

Since there are no foreign keys in MongoDB, the application handles the scenario where a category is removed from settings while expenses still reference it:

- **Prevention strategy:** The settings update controller does not allow deletion of a category that has existing expenses in the current or past months.
- **Graceful handling:** If an orphaned expense is detected (e.g., due to a data inconsistency), the dashboard and reports display it under an "Uncategorized" fallback label rather than failing.

---

## 11. Backup & Recovery

### MongoDB Atlas Automatic Backups

| Feature | M0 (Free Tier) | M10+ (Paid Tiers) |
|---|---|---|
| Continuous backups | Not available | Available |
| Point-in-time recovery | Not available | Available |
| Scheduled snapshots | Not available | Available |
| Cloud provider snapshots | Not available | Available |

**Important:** The M0 free tier does **not** include automatic backup capabilities. Manual backup procedures are essential.

### Manual Backup with `mongodump`

```bash
# Full database export
mongodump --uri="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/finance-management" \
          --out=./backup/$(date +%Y-%m-%d)

# Compressed backup
mongodump --uri="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/finance-management" \
          --archive=./backup/finance-management-$(date +%Y-%m-%d).gz \
          --gzip
```

### Restore from Backup

```bash
# Restore from directory
mongorestore --uri="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net" \
             --drop \
             ./backup/2026-02-08/finance-management

# Restore from compressed archive
mongorestore --uri="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net" \
             --archive=./backup/finance-management-2026-02-08.gz \
             --gzip \
             --drop
```

### Recommended Backup Schedule

| Frequency | Method | Retention |
|---|---|---|
| Weekly | `mongodump` to local machine | Keep last 4 backups |
| Monthly | `mongodump` compressed archive | Keep last 12 backups |
| Before any settings change | Manual `mongodump` | Keep until verified |

### Point-in-Time Recovery Considerations

Without Atlas automatic backups, point-in-time recovery is not natively available. However, the data model provides natural recovery points:

- **`monthly_summaries`** serve as month-end checkpoints. If expense data is corrupted, summaries provide a reference for what the totals should be.
- **Low data volume** means full database exports complete in under 1 second, making frequent manual backups practical.

---

## 12. Storage Estimation

### Per-Document Size Analysis

| Collection | Avg. Document Size | Calculation |
|---|---|---|
| `settings` | ~1 KB | 1 salary field + 1 date field + ~3 fixed deductions (60 bytes each) + ~3 categories (80 bytes each) + timestamps + BSON overhead |
| `expenses` | ~200 bytes | ObjectId (12B) + Date (8B) + category string (~20B) + amount (8B) + description (~50B) + month/year (16B) + timestamps (16B) + BSON overhead (~70B) |
| `monthly_summaries` | ~500 bytes | ObjectId (12B) + month/year (16B) + salary/deductions/totals (32B) + categoryBreakdown array (~100B per category x 3) + timestamps (16B) + BSON overhead (~120B) |

### Annual Growth Projection

| Collection | Documents per Year | Size per Year |
|---|---|---|
| `settings` | 1 (static) | ~1 KB |
| `expenses` | ~720 (60/month x 12) | ~144 KB |
| `monthly_summaries` | 12 | ~6 KB |
| **Indexes** (overhead) | — | ~50 KB |
| **Total per year** | **~733** | **~201 KB** |

### Long-Term Storage Forecast

| Timeframe | Total Documents | Total Storage | % of 512 MB Limit |
|---|---|---|---|
| 1 year | ~733 | ~201 KB | 0.04% |
| 5 years | ~3,665 | ~1.0 MB | 0.2% |
| 10 years | ~7,330 | ~2.0 MB | 0.4% |
| 25 years | ~18,325 | ~5.0 MB | 1.0% |
| Theoretical max (512 MB) | — | ~512 MB | **~2,500 years of usage** |

**Conclusion:** The 512 MB free tier provides effectively unlimited storage for this application's use case. Even with generous estimates, the database will use less than 1% of available storage over a decade.

---

## 13. Security

### Network Security — MongoDB Atlas

| Control | Configuration | Purpose |
|---|---|---|
| **IP Whitelist** | Render server IP or `0.0.0.0/0` (for free tier dynamic IPs) | Restricts which network addresses can connect to the Atlas cluster |
| **TLS/SSL** | Enabled by default (mandatory on Atlas) | Encrypts all data in transit between the application server and the database |
| **VPC Peering** | Not available on M0 | Available on paid tiers for private network connectivity |

**Note on `0.0.0.0/0`:** The free tier on Render uses dynamic IPs, making strict IP whitelisting impractical. The `0.0.0.0/0` whitelist opens the network layer, but database authentication (username/password) remains enforced. For production workloads, upgrading to a paid Render tier with a static IP is recommended.

### Database User Authentication

| Setting | Value |
|---|---|
| **Authentication method** | SCRAM-SHA-256 (MongoDB default) |
| **User role** | `readWrite` on `finance-management` database only |
| **Password policy** | Minimum 10 characters, auto-generated via Atlas |
| **Users created** | One application user (no admin access needed) |

### Connection String Security

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/finance-management
```

| Practice | Implementation |
|---|---|
| **Stored in environment variables** | `MONGODB_URI` in server `.env` file |
| **Never committed to git** | `.env` is listed in `.gitignore` |
| **Template provided** | `.env.example` contains placeholder values without real credentials |
| **Production environment** | Stored in Render's encrypted environment variable manager |

### NoSQL Injection Prevention

Mongoose provides built-in protection against NoSQL injection attacks:

| Threat | Mitigation |
|---|---|
| **Query injection** (`{ $gt: "" }`) | Mongoose casts query parameters to their schema-defined types. A field defined as `Number` will reject objects or special operators passed as values. |
| **Operator injection** | Express `req.body` values are validated by the controller before being passed to Mongoose. No raw user input is used in query operators. |
| **Prototype pollution** | Mongoose schemas define an explicit allowlist of fields. Unknown fields are silently stripped during document creation. |

---

## 14. MongoDB Atlas Setup Guide

### Step 1: Create an Atlas Account

1. Navigate to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Click **"Try Free"** and register with email or Google account
3. Complete the onboarding questionnaire (select "Learning" or "Personal project")

### Step 2: Create a Free M0 Cluster

1. From the Atlas dashboard, click **"Build a Database"**
2. Select **"M0 FREE"** tier (Shared)
3. Choose a cloud provider and region:
   - **Recommended:** AWS `ap-south-1` (Mumbai) — closest to the Render server if deployed in Asia
   - **Alternative:** AWS `us-east-1` if Render server is in US
4. Name the cluster (e.g., `Cluster0` or `finance-cluster`)
5. Click **"Create Cluster"** — provisioning takes 1-3 minutes

### Step 3: Create a Database User

1. In the left sidebar, navigate to **"Database Access"**
2. Click **"Add New Database User"**
3. Authentication method: **Password**
4. Enter a username (e.g., `finance-app`)
5. Click **"Autogenerate Secure Password"** and save it securely
6. Built-in role: select **"Read and Write to Any Database"**
7. Click **"Add User"**

### Step 4: Configure Network Access

1. In the left sidebar, navigate to **"Network Access"**
2. Click **"Add IP Address"**
3. For development: click **"Add Current IP Address"**
4. For production (Render free tier): click **"Allow Access from Anywhere"** (`0.0.0.0/0`)
   - This is acceptable because database user authentication is still enforced
5. Click **"Confirm"**

### Step 5: Get the Connection String

1. Navigate to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Select **"Connect Your Application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string:
   ```
   mongodb+srv://finance-app:<password>@cluster0.xxxxx.mongodb.net/finance-management?retryWrites=true&w=majority
   ```
6. Replace `<password>` with the database user's password
7. Note: `finance-management` at the end specifies the database name

### Step 6: Test the Connection

```bash
# In the server directory
cd server
cp .env.example .env

# Edit .env and paste the connection string as MONGODB_URI
# Then start the server
npm run dev
```

**Expected output on successful connection:**

```
MongoDB connected: cluster0-shard-00-02.xxxxx.mongodb.net
Server running on port 5000
```

---

## 15. Migration & Seeding

### Initial Settings Seed

When the application is first deployed, the `settings` collection is empty. The application handles this gracefully:

1. **On first GET `/api/settings`:** The controller returns a default empty settings response, prompting the user to configure their budget.
2. **On first PUT `/api/settings`:** The controller uses `findOneAndUpdate` with `upsert: true`, which creates the settings document if it does not exist.

**Optional manual seed script** (for development or demo purposes):

```javascript
// server/seed.js
const mongoose = require('mongoose');
const Settings = require('./models/Settings');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  await Settings.findOneAndUpdate(
    {},
    {
      salary: 30000,
      salaryCreditDate: 3,
      fixedDeductions: [
        { name: 'Bike EMI', amount: 5000, deductionDate: 3 }
      ],
      categories: [
        { name: "Mother's Allowance", monthlyLimit: 5000, type: 'variable' },
        { name: 'Personal Expenses', monthlyLimit: 3000, type: 'variable' },
        { name: 'Miscellaneous', monthlyLimit: 1500, type: 'variable' }
      ]
    },
    { upsert: true, new: true }
  );

  console.log('Settings seeded successfully');
  await mongoose.disconnect();
}

seed().catch(console.error);
```

**Run with:**

```bash
cd server && node seed.js
```

### Schema Evolution Strategy

MongoDB's schemaless nature combined with Mongoose's `default` values provides a zero-downtime migration strategy:

| Scenario | Approach |
|---|---|
| **Adding a new field** | Add the field to the Mongoose schema with a `default` value. Existing documents are unaffected. When read through Mongoose, the default value is applied in memory. When the document is next saved, the field is persisted. |
| **Removing a field** | Remove the field from the Mongoose schema. Existing documents retain the field in the database, but it is ignored by Mongoose (not included in query results). No data loss occurs. |
| **Renaming a field** | Add the new field with a default. Write a one-time script to copy old field values to the new field. Remove the old field from the schema. |
| **Changing a field type** | Write a migration script using `updateMany` with aggregation pipeline syntax to transform the field in-place. |

**Example — Adding a `color` field to categories:**

```javascript
// Just update the schema — no migration needed
categories: [
  {
    name: { type: String, required: true },
    monthlyLimit: { type: Number, required: true },
    type: { type: String, enum: ["fixed", "variable"], default: "variable" },
    color: { type: String, default: "#3B82F6" }  // New field with default
  }
]
```

Existing category subdocuments will automatically include `color: "#3B82F6"` when read through Mongoose, even though the database document does not yet contain the field.

### No Complex Migrations Needed

This application benefits from several characteristics that eliminate the need for traditional database migrations:

- **Single-user application** — no concurrent schema conflicts
- **Embedded subdocuments** — no relational table restructuring
- **Mongoose defaults** — backward-compatible field additions
- **Low data volume** — even destructive migrations (drop and re-seed) are trivial

---

## 16. Monitoring

### MongoDB Atlas Free Tier Monitoring

Atlas provides basic monitoring metrics even on the M0 free tier:

| Metric | Description | Access |
|---|---|---|
| **Connections** | Number of active connections to the cluster | Atlas UI: Metrics tab |
| **Operations** | Read/write operation counts over time | Atlas UI: Metrics tab |
| **Data Size** | Total data stored across all collections | Atlas UI: Metrics tab |
| **Network I/O** | Bytes transferred in/out | Atlas UI: Metrics tab |
| **Opcounters** | Breakdown of insert, query, update, delete, command operations | Atlas UI: Metrics tab |

**Recommended monitoring cadence:** Review Atlas metrics weekly during active development, monthly during steady-state usage.

### Mongoose Connection Event Handling

The application monitors the database connection lifecycle through Mongoose's built-in event emitter:

```javascript
// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose: Connection established');
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose: Connection error — ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose: Connection lost — attempting reconnect');
});

module.exports = connectDB;
```

### Connection Events Reference

| Event | Trigger | Recommended Action |
|---|---|---|
| `connected` | Initial connection or reconnection succeeds | Log success; application is ready to serve requests |
| `error` | A connection-level error occurs | Log error; Mongoose will auto-retry by default |
| `disconnected` | Connection to Atlas is lost (network issue, cluster maintenance) | Log warning; Mongoose auto-reconnects with exponential backoff |
| `reconnected` | Connection is re-established after a disconnect | Log info; clear any "degraded mode" flags |
| `close` | Connection is intentionally closed (e.g., `mongoose.disconnect()`) | Log info; expected during graceful shutdown |

### Application Health Indicators

| Indicator | Healthy State | Alert Threshold |
|---|---|---|
| MongoDB connection status | `connected` | Any `error` or `disconnected` event lasting > 30 seconds |
| API response time (with DB) | < 200ms | > 1000ms consistently |
| Atlas storage usage | < 50 MB | > 400 MB (80% of 512 MB limit) |
| Active connections | 1-5 | > 50 (potential connection leak) |

---

## Appendix A: Quick Reference — All Collection Schemas

```javascript
// ─── Settings Schema ───────────────────────────────────────
const settingsSchema = new mongoose.Schema({
  salary:           { type: Number, required: true },
  salaryCreditDate: { type: Number, required: true, min: 1, max: 31 },
  fixedDeductions: [{
    name:           { type: String, required: true },
    amount:         { type: Number, required: true },
    deductionDate:  { type: Number, required: true, min: 1, max: 31 }
  }],
  categories: [{
    name:           { type: String, required: true },
    monthlyLimit:   { type: Number, required: true },
    type:           { type: String, enum: ["fixed", "variable"], default: "variable" }
  }]
}, { timestamps: true });


// ─── Expense Schema ────────────────────────────────────────
const expenseSchema = new mongoose.Schema({
  date:        { type: Date,   required: true },
  category:    { type: String, required: true },
  amount:      { type: Number, required: true, min: 0 },
  description: { type: String, required: true, maxlength: 200 },
  month:       { type: Number, required: true, min: 1, max: 12 },
  year:        { type: Number, required: true }
}, { timestamps: true });

expenseSchema.index({ month: 1, year: 1 });
expenseSchema.index({ category: 1, month: 1, year: 1 });


// ─── Monthly Summary Schema ───────────────────────────────
const monthlySummarySchema = new mongoose.Schema({
  month:                { type: Number, required: true, min: 1, max: 12 },
  year:                 { type: Number, required: true },
  salary:               { type: Number, required: true },
  totalFixedDeductions: { type: Number, required: true },
  categoryBreakdown: [{
    category: { type: String, required: true },
    limit:    { type: Number, required: true },
    spent:    { type: Number, required: true }
  }],
  totalSpent:    { type: Number, required: true },
  totalSavings:  { type: Number, required: true }
}, { timestamps: true });

monthlySummarySchema.index({ month: 1, year: 1 }, { unique: true });
```

---

## Appendix B: Glossary

| Term | Definition |
|---|---|
| **Atlas** | MongoDB's fully managed cloud database service |
| **BSON** | Binary JSON — MongoDB's internal document storage format |
| **Collection** | MongoDB equivalent of a relational database table |
| **Compound Index** | An index that includes multiple fields, enabling efficient queries on field combinations |
| **Document** | A single record in a MongoDB collection (analogous to a row in SQL) |
| **Embedded Document** | A document nested inside another document (denormalized data) |
| **M0** | MongoDB Atlas free tier cluster designation |
| **Mongoose** | Node.js ODM (Object Document Mapper) library for MongoDB |
| **ODM** | Object Document Mapper — maps application objects to database documents |
| **Upsert** | Update a document if it exists; insert it if it does not |
| **Singleton** | A collection pattern where exactly one document exists |

---

*Document prepared for Finance Management project — February 2026*
