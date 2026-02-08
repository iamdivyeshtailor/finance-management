# Finance Management -- Backend Documentation

**Version:** 1.0
**Last Updated:** February 2026
**Audience:** Engineering Leadership, CTO, CEO, Backend Engineers
**Status:** Production-Ready Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Project Structure](#3-project-structure)
4. [Server Configuration](#4-server-configuration)
5. [API Reference](#5-api-reference)
6. [Business Logic](#6-business-logic)
7. [Data Validation](#7-data-validation)
8. [Error Handling](#8-error-handling)
9. [Environment Variables](#9-environment-variables)
10. [CORS Configuration](#10-cors-configuration)
11. [Security Best Practices](#11-security-best-practices)
12. [Development Setup](#12-development-setup)
13. [Deployment (Render)](#13-deployment-render)
14. [Logging and Monitoring](#14-logging-and-monitoring)
15. [Dependencies](#15-dependencies)

---

## 1. Overview

### Purpose

The Finance Management backend is a RESTful API server that powers a personal finance tracking application. It provides the data layer and business logic for a salaried individual to manage monthly budgets, log daily expenses, track spending across categories, and generate financial summaries.

The backend is responsible for:

- Persisting and retrieving budget configuration (salary, deductions, spending categories)
- Recording, updating, and deleting individual expense entries
- Computing real-time financial reports including per-category spending, remaining budgets, and net savings
- Generating and storing monthly summary snapshots for historical comparison

### Tech Stack

| Technology     | Version | Role                                                        |
|----------------|---------|-------------------------------------------------------------|
| **Node.js**    | 20.x LTS | Server runtime -- long-term support release for stability  |
| **Express.js** | 4.x     | HTTP framework -- lightweight, mature, extensive ecosystem  |
| **Mongoose**   | 8.x     | MongoDB ODM -- schema enforcement, validation, query API   |
| **dotenv**     | 16.x    | Environment variable loader -- keeps secrets out of code   |
| **cors**       | 2.x     | Cross-origin middleware -- enables frontend-backend comms   |

### Role in the Overall Architecture

```
  GitHub Pages (React SPA)          Render (Node.js API)          MongoDB Atlas
 ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────┐
 │                      │      │                      │      │                  │
 │   Static Frontend    │─────>│   Express REST API   │─────>│   Cloud Database │
 │   (Client Browser)   │<─────│   (Business Logic)   │<─────│   (Persistent)   │
 │                      │      │                      │      │                  │
 └──────────────────────┘      └──────────────────────┘      └──────────────────┘
        HTTPS / JSON                Mongoose ODM               MongoDB Protocol
```

The backend serves as the **central authority** for all data operations. The frontend never communicates directly with the database. Every read and write passes through the API, which enforces validation, computes derived values, and returns structured JSON responses.

---

## 2. Architecture

### Layered Architecture

The backend follows the **Model-View-Controller (MVC)** pattern, adapted for an API-only server (no server-rendered views). The layers are:

```
                         ┌─────────────────────────────┐
                         │       HTTP Request           │
                         │   (from React frontend)      │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │        ROUTES LAYER          │
                         │   (Express Router files)     │
                         │                              │
                         │   Maps URL + HTTP method     │
                         │   to the correct controller  │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │     CONTROLLERS LAYER        │
                         │   (Business logic files)     │
                         │                              │
                         │   Validates input             │
                         │   Orchestrates data flow     │
                         │   Computes derived values    │
                         │   Formats response           │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │       MODELS LAYER           │
                         │   (Mongoose schema files)    │
                         │                              │
                         │   Defines data structure     │
                         │   Schema-level validation    │
                         │   Database indexes           │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │       DATABASE               │
                         │   (MongoDB Atlas)            │
                         │                              │
                         │   settings collection        │
                         │   expenses collection        │
                         │   monthly_summaries coll.    │
                         └─────────────────────────────┘
```

### Layer Responsibilities

| Layer          | Responsibility                                                                                       |
|----------------|------------------------------------------------------------------------------------------------------|
| **Routes**     | URL-to-handler mapping only. No logic. Delegates immediately to the appropriate controller function. |
| **Controllers**| Contains all business logic. Receives parsed request data, validates it, interacts with models, computes results, and sends the HTTP response. |
| **Models**     | Defines the shape of data (schemas), enforces type and constraint rules at the database level, and provides the query interface to MongoDB. |
| **Middleware** | Cross-cutting concerns such as CORS, JSON body parsing, and centralized error handling.              |
| **Config**     | Database connection setup and environment configuration.                                              |

### Request Lifecycle

A complete request lifecycle, from the moment an HTTP request arrives to the response being sent:

```
1.  Client sends HTTP request (e.g., POST /api/expenses)
2.  Express receives the request
3.  CORS middleware checks the Origin header
4.  express.json() middleware parses the request body
5.  Express Router matches the URL to a route file
6.  The route file calls the corresponding controller function
7.  The controller validates input fields
8.  The controller calls Mongoose model methods (e.g., Model.create())
9.  Mongoose validates against the schema
10. Mongoose sends the operation to MongoDB via the driver
11. MongoDB executes the operation and returns the result
12. Mongoose converts the result to a JavaScript object
13. The controller formats the response JSON
14. Express sends the HTTP response with appropriate status code
15. If any step throws an error, the centralized error handler catches it
    and returns a structured error response
```

---

## 3. Project Structure

```
server/
│
├── config/
│   └── db.js                    # MongoDB connection configuration
│                                  - Reads MONGODB_URI from environment
│                                  - Establishes Mongoose connection
│                                  - Logs connection success/failure
│                                  - Exported as connectDB() function
│
├── models/
│   ├── Settings.js              # Budget settings Mongoose schema
│   │                              - salary, salaryCreditDate fields
│   │                              - fixedDeductions array (name, amount, date)
│   │                              - categories array (name, limit, type)
│   │                              - timestamps enabled
│   │
│   ├── Expense.js               # Individual expense Mongoose schema
│   │                              - date, category, amount, description
│   │                              - month and year (derived from date)
│   │                              - Compound indexes for query performance
│   │                              - timestamps enabled
│   │
│   └── MonthlySummary.js        # Month-end snapshot Mongoose schema
│                                  - month, year, salary, totalFixedDeductions
│                                  - categoryBreakdown array
│                                  - totalSpent, totalSavings
│                                  - Unique compound index on (month, year)
│
├── controllers/
│   ├── settingsController.js    # Settings business logic
│   │                              - getSettings(): retrieve or return defaults
│   │                              - updateSettings(): validate and upsert
│   │
│   ├── expenseController.js     # Expense CRUD business logic
│   │                              - getExpenses(): filtered by month/year
│   │                              - addExpense(): validate, extract month/year, save
│   │                              - updateExpense(): find by ID, validate, update
│   │                              - deleteExpense(): find by ID, remove
│   │
│   └── reportController.js      # Report computation business logic
│                                  - getCurrentReport(): live aggregation
│                                  - getMonthlyReport(): stored or computed
│                                  - getReportHistory(): all past summaries
│
├── routes/
│   ├── settingsRoutes.js        # GET /api/settings, PUT /api/settings
│   ├── expenseRoutes.js         # GET, POST, PUT, DELETE /api/expenses
│   └── reportRoutes.js          # GET /api/reports/current, /monthly, /history
│
├── middleware/
│   └── errorHandler.js          # Centralized Express error-handling middleware
│                                  - Catches all unhandled errors
│                                  - Returns structured JSON error response
│                                  - Logs error details to console
│
├── server.js                    # Application entry point
│                                  - Loads environment variables (dotenv)
│                                  - Creates Express app instance
│                                  - Registers middleware (cors, json parser)
│                                  - Mounts route files at /api/*
│                                  - Registers error handler (must be last)
│                                  - Calls connectDB() and starts listening
│
├── package.json                 # Node.js project manifest
│                                  - Dependencies and devDependencies
│                                  - npm scripts (start, dev)
│                                  - Engine requirements (node >=20)
│
└── .env.example                 # Environment variable template
                                   - PORT, MONGODB_URI, CLIENT_ORIGIN, NODE_ENV
                                   - Safe to commit (contains no real secrets)
```

---

## 4. Server Configuration

### Express Application Setup (`server.js`)

The entry point initializes the application in a specific order. The ordering of middleware registration is critical in Express -- middleware executes in the order it is registered.

```javascript
// 1. Load environment variables FIRST (before any other imports use them)
require('dotenv').config();

// 2. Import dependencies
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// 3. Create Express application instance
const app = express();

// 4. Register middleware (order matters)
app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
}));
app.use(express.json());

// 5. Mount route files
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// 6. Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 7. Centralized error handler (MUST be registered last)
app.use(errorHandler);

// 8. Connect to database, then start listening
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
```

### Middleware Chain (Execution Order)

| Order | Middleware         | Purpose                                                                  |
|-------|--------------------|--------------------------------------------------------------------------|
| 1     | `cors()`           | Validates the Origin header; blocks or allows cross-origin requests      |
| 2     | `express.json()`   | Parses incoming JSON request bodies into `req.body`                      |
| 3     | Route handlers     | Matches URL path and HTTP method to the correct controller               |
| 4     | `errorHandler`     | Catches any error thrown or passed via `next(err)` in the chain          |

### Port Configuration

- **Default port:** `5000`
- Configurable via the `PORT` environment variable
- On Render, the platform injects its own `PORT` value automatically

### MongoDB Connection Setup (`config/db.js`)

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);   // Exit process with failure code
  }
};

module.exports = connectDB;
```

Key design decisions:

- **Fail-fast on connection error:** If the database cannot be reached at startup, the process exits immediately (`process.exit(1)`) rather than running in a broken state.
- **No deprecated options:** Mongoose 8.x no longer requires `useNewUrlParser` or `useUnifiedTopology` options.
- **Connection string via environment:** The `MONGODB_URI` is never hardcoded.

---

## 5. API Reference

**Base URL (Local):** `http://localhost:5000`
**Base URL (Production):** `https://finance-management-api.onrender.com`
**Content-Type:** All requests and responses use `application/json`

---

### 5.1 Settings API

#### GET /api/settings

Retrieve the current budget configuration. Since this is a single-user application, there is exactly one settings document.

| Property       | Value                     |
|----------------|---------------------------|
| **Method**     | `GET`                     |
| **URL**        | `/api/settings`           |
| **Description**| Retrieve budget settings  |
| **Headers**    | None required             |
| **Request Body** | None                    |

**Success Response (200 OK):**

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
  "createdAt": "2026-02-08T00:00:00.000Z",
  "updatedAt": "2026-02-08T00:00:00.000Z"
}
```

**Success Response when no settings exist (200 OK):**

```json
{
  "salary": 0,
  "salaryCreditDate": 1,
  "fixedDeductions": [],
  "categories": []
}
```

**Error Responses:**

| Status | Condition          | Body                                                      |
|--------|--------------------|------------------------------------------------------------|
| 500    | Database error     | `{ "error": { "message": "Server error", "status": 500 } }` |

**Example curl:**

```bash
curl -X GET http://localhost:5000/api/settings
```

---

#### PUT /api/settings

Create or update the budget configuration. Uses upsert semantics -- if no settings document exists, one is created; otherwise the existing document is replaced.

| Property       | Value                         |
|----------------|-------------------------------|
| **Method**     | `PUT`                         |
| **URL**        | `/api/settings`               |
| **Description**| Create or update settings     |
| **Headers**    | `Content-Type: application/json` |

**Request Body Schema:**

```json
{
  "salary": 30000,
  "salaryCreditDate": 3,
  "fixedDeductions": [
    {
      "name": "Bike EMI",
      "amount": 5000,
      "deductionDate": 3
    }
  ],
  "categories": [
    {
      "name": "Mother's Allowance",
      "monthlyLimit": 5000,
      "type": "variable"
    },
    {
      "name": "Personal Expenses",
      "monthlyLimit": 3000,
      "type": "variable"
    },
    {
      "name": "Miscellaneous",
      "monthlyLimit": 1500,
      "type": "variable"
    }
  ]
}
```

| Field                            | Type     | Required | Constraints                                   |
|----------------------------------|----------|----------|-----------------------------------------------|
| `salary`                         | Number   | Yes      | Must be greater than 0                        |
| `salaryCreditDate`               | Number   | Yes      | Integer between 1 and 31                      |
| `fixedDeductions`                | Array    | No       | Array of deduction objects                    |
| `fixedDeductions[].name`         | String   | Yes      | Non-empty string                              |
| `fixedDeductions[].amount`       | Number   | Yes      | Must be greater than 0                        |
| `fixedDeductions[].deductionDate`| Number   | Yes      | Integer between 1 and 31                      |
| `categories`                     | Array    | No       | Array of category objects                     |
| `categories[].name`              | String   | Yes      | Non-empty string, unique within the list      |
| `categories[].monthlyLimit`      | Number   | Yes      | Must be greater than 0                        |
| `categories[].type`              | String   | No       | One of `"fixed"` or `"variable"` (default: `"variable"`) |

**Success Response (200 OK):**

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
  "createdAt": "2026-02-08T00:00:00.000Z",
  "updatedAt": "2026-02-08T10:30:00.000Z"
}
```

**Error Responses:**

| Status | Condition                         | Body                                                                    |
|--------|-----------------------------------|-------------------------------------------------------------------------|
| 400    | Missing required field            | `{ "error": { "message": "salary is required", "status": 400 } }`      |
| 400    | Invalid salary value              | `{ "error": { "message": "salary must be greater than 0", "status": 400 } }` |
| 400    | Invalid salaryCreditDate          | `{ "error": { "message": "salaryCreditDate must be between 1 and 31", "status": 400 } }` |
| 500    | Database error                    | `{ "error": { "message": "Server error", "status": 500 } }`            |

**Example curl:**

```bash
curl -X PUT http://localhost:5000/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "salary": 30000,
    "salaryCreditDate": 3,
    "fixedDeductions": [
      { "name": "Bike EMI", "amount": 5000, "deductionDate": 3 }
    ],
    "categories": [
      { "name": "Mother'\''s Allowance", "monthlyLimit": 5000, "type": "variable" },
      { "name": "Personal Expenses", "monthlyLimit": 3000, "type": "variable" },
      { "name": "Miscellaneous", "monthlyLimit": 1500, "type": "variable" }
    ]
  }'
```

---

### 5.2 Expenses API

#### GET /api/expenses

Retrieve expenses for a specific month and year. Results are sorted by date in descending order (most recent first).

| Property       | Value                                        |
|----------------|----------------------------------------------|
| **Method**     | `GET`                                        |
| **URL**        | `/api/expenses?month=M&year=Y`               |
| **Description**| List expenses filtered by month and year     |
| **Headers**    | None required                                |
| **Request Body** | None                                       |

**Query Parameters:**

| Parameter | Type   | Required | Description                         |
|-----------|--------|----------|-------------------------------------|
| `month`   | Number | Yes      | Month number (1 = January, 12 = December) |
| `year`    | Number | Yes      | Four-digit year (e.g., 2026)        |

**Success Response (200 OK):**

```json
[
  {
    "_id": "65a1b2c3d4e5f6a7b8c9d0f1",
    "date": "2026-02-15T00:00:00.000Z",
    "category": "Personal Expenses",
    "amount": 250,
    "description": "Lunch at office",
    "month": 2,
    "year": 2026,
    "createdAt": "2026-02-15T12:00:00.000Z",
    "updatedAt": "2026-02-15T12:00:00.000Z"
  },
  {
    "_id": "65a1b2c3d4e5f6a7b8c9d0f2",
    "date": "2026-02-12T00:00:00.000Z",
    "category": "Miscellaneous",
    "amount": 300,
    "description": "Phone screen guard",
    "month": 2,
    "year": 2026,
    "createdAt": "2026-02-12T09:00:00.000Z",
    "updatedAt": "2026-02-12T09:00:00.000Z"
  }
]
```

**Empty Result (200 OK):**

```json
[]
```

**Error Responses:**

| Status | Condition          | Body                                                              |
|--------|--------------------|-------------------------------------------------------------------|
| 400    | Missing month/year | `{ "error": { "message": "month and year are required", "status": 400 } }` |
| 500    | Database error     | `{ "error": { "message": "Server error", "status": 500 } }`      |

**Example curl:**

```bash
curl -X GET "http://localhost:5000/api/expenses?month=2&year=2026"
```

---

#### POST /api/expenses

Add a new expense entry. The server automatically extracts `month` and `year` from the provided `date` field before saving.

| Property       | Value                          |
|----------------|--------------------------------|
| **Method**     | `POST`                         |
| **URL**        | `/api/expenses`                |
| **Description**| Create a new expense record    |
| **Headers**    | `Content-Type: application/json` |

**Request Body Schema:**

```json
{
  "date": "2026-02-05",
  "category": "Personal Expenses",
  "amount": 500,
  "description": "Dinner with friends"
}
```

| Field         | Type   | Required | Constraints                              |
|---------------|--------|----------|------------------------------------------|
| `date`        | String | Yes      | Valid ISO date string, not in the future |
| `category`    | String | Yes      | Must match an existing category name     |
| `amount`      | Number | Yes      | Must be greater than 0                   |
| `description` | String | Yes      | 1 to 200 characters                     |

**Server-side processing:**
- `month` is extracted as `new Date(date).getMonth() + 1`
- `year` is extracted as `new Date(date).getFullYear()`
- Both are stored on the document for efficient querying

**Success Response (201 Created):**

```json
{
  "_id": "65a1b2c3d4e5f6a7b8c9d0f3",
  "date": "2026-02-05T00:00:00.000Z",
  "category": "Personal Expenses",
  "amount": 500,
  "description": "Dinner with friends",
  "month": 2,
  "year": 2026,
  "createdAt": "2026-02-05T18:30:00.000Z",
  "updatedAt": "2026-02-05T18:30:00.000Z"
}
```

**Error Responses:**

| Status | Condition                | Body                                                                          |
|--------|--------------------------|-------------------------------------------------------------------------------|
| 400    | Missing required field   | `{ "error": { "message": "date, category, amount, and description are required", "status": 400 } }` |
| 400    | Amount not positive      | `{ "error": { "message": "amount must be greater than 0", "status": 400 } }` |
| 400    | Description too long     | `{ "error": { "message": "description must be 200 characters or fewer", "status": 400 } }` |
| 400    | Invalid date             | `{ "error": { "message": "date must be a valid date", "status": 400 } }` |
| 500    | Database error           | `{ "error": { "message": "Server error", "status": 500 } }`                  |

**Example curl:**

```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-05",
    "category": "Personal Expenses",
    "amount": 500,
    "description": "Dinner with friends"
  }'
```

---

#### PUT /api/expenses/:id

Update an existing expense by its MongoDB ObjectId. If the `date` field is changed, the server recalculates `month` and `year`.

| Property       | Value                                 |
|----------------|---------------------------------------|
| **Method**     | `PUT`                                 |
| **URL**        | `/api/expenses/:id`                   |
| **Description**| Update an existing expense record     |
| **Headers**    | `Content-Type: application/json`      |

**Path Parameters:**

| Parameter | Type   | Required | Description                   |
|-----------|--------|----------|-------------------------------|
| `id`      | String | Yes      | MongoDB ObjectId of expense   |

**Request Body Schema:**

```json
{
  "date": "2026-02-06",
  "category": "Personal Expenses",
  "amount": 600,
  "description": "Dinner with friends (updated)"
}
```

All fields follow the same constraints as POST. Any subset of fields may be provided for a partial update.

**Success Response (200 OK):**

```json
{
  "_id": "65a1b2c3d4e5f6a7b8c9d0f3",
  "date": "2026-02-06T00:00:00.000Z",
  "category": "Personal Expenses",
  "amount": 600,
  "description": "Dinner with friends (updated)",
  "month": 2,
  "year": 2026,
  "createdAt": "2026-02-05T18:30:00.000Z",
  "updatedAt": "2026-02-06T09:15:00.000Z"
}
```

**Error Responses:**

| Status | Condition          | Body                                                                        |
|--------|--------------------|-----------------------------------------------------------------------------|
| 400    | Invalid input      | `{ "error": { "message": "<field-specific message>", "status": 400 } }`    |
| 404    | Expense not found  | `{ "error": { "message": "Expense not found", "status": 404 } }`           |
| 500    | Database error     | `{ "error": { "message": "Server error", "status": 500 } }`                |

**Example curl:**

```bash
curl -X PUT http://localhost:5000/api/expenses/65a1b2c3d4e5f6a7b8c9d0f3 \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 600,
    "description": "Dinner with friends (updated)"
  }'
```

---

#### DELETE /api/expenses/:id

Permanently remove an expense entry by its MongoDB ObjectId.

| Property       | Value                                 |
|----------------|---------------------------------------|
| **Method**     | `DELETE`                              |
| **URL**        | `/api/expenses/:id`                   |
| **Description**| Delete an expense record              |
| **Headers**    | None required                         |
| **Request Body** | None                                |

**Path Parameters:**

| Parameter | Type   | Required | Description                   |
|-----------|--------|----------|-------------------------------|
| `id`      | String | Yes      | MongoDB ObjectId of expense   |

**Success Response (200 OK):**

```json
{
  "message": "Deleted"
}
```

**Error Responses:**

| Status | Condition          | Body                                                                |
|--------|--------------------|---------------------------------------------------------------------|
| 404    | Expense not found  | `{ "error": { "message": "Expense not found", "status": 404 } }`   |
| 500    | Database error     | `{ "error": { "message": "Server error", "status": 500 } }`        |

**Example curl:**

```bash
curl -X DELETE http://localhost:5000/api/expenses/65a1b2c3d4e5f6a7b8c9d0f3
```

---

### 5.3 Reports API

#### GET /api/reports/current

Retrieve a **live, computed** financial summary for the current month. This endpoint does not read from storage -- it aggregates expense data in real time against the current settings.

| Property       | Value                             |
|----------------|-----------------------------------|
| **Method**     | `GET`                             |
| **URL**        | `/api/reports/current`            |
| **Description**| Live summary for current month    |
| **Headers**    | None required                     |
| **Request Body** | None                            |

**Computation Logic:**

1. Load settings (salary, fixedDeductions, categories)
2. Determine current month and year using `salaryCreditDate` logic
3. Query all expenses for that month/year
4. For each category, sum expenses and compute remaining/percentage
5. Calculate total savings as `salary - totalFixedDeductions - totalVariableExpenses`

**Success Response (200 OK):**

```json
{
  "month": 2,
  "year": 2026,
  "salary": 30000,
  "totalFixedDeductions": 5000,
  "distributableAmount": 25000,
  "categories": [
    {
      "name": "Mother's Allowance",
      "limit": 5000,
      "spent": 2000,
      "remaining": 3000,
      "percentUsed": 40
    },
    {
      "name": "Personal Expenses",
      "limit": 3000,
      "spent": 750,
      "remaining": 2250,
      "percentUsed": 25
    },
    {
      "name": "Miscellaneous",
      "limit": 1500,
      "spent": 300,
      "remaining": 1200,
      "percentUsed": 20
    }
  ],
  "totalBudgeted": 9500,
  "totalSpent": 8050,
  "currentSavings": 21950
}
```

**Response Fields Explained:**

| Field                    | Calculation                                                |
|--------------------------|------------------------------------------------------------|
| `salary`                 | From settings                                              |
| `totalFixedDeductions`   | Sum of all `fixedDeductions[].amount`                      |
| `distributableAmount`    | `salary - totalFixedDeductions`                            |
| `categories[].spent`     | Sum of expenses in that category for the month             |
| `categories[].remaining` | `limit - spent` (can be negative if overspent)             |
| `categories[].percentUsed` | `(spent / limit) * 100` (can exceed 100)                |
| `totalBudgeted`          | `totalFixedDeductions + sum(categories[].limit)`           |
| `totalSpent`             | `totalFixedDeductions + sum(categories[].spent)`           |
| `currentSavings`         | `salary - totalSpent`                                      |

**Error Responses:**

| Status | Condition              | Body                                                      |
|--------|------------------------|-----------------------------------------------------------|
| 404    | No settings configured | `{ "error": { "message": "Settings not found. Please configure settings first.", "status": 404 } }` |
| 500    | Database error         | `{ "error": { "message": "Server error", "status": 500 } }` |

**Example curl:**

```bash
curl -X GET http://localhost:5000/api/reports/current
```

---

#### GET /api/reports/monthly

Retrieve the financial summary for a specific past month. If a stored summary exists, it is returned directly. If not, the summary is computed from expense data, stored for future access, and then returned.

| Property       | Value                                         |
|----------------|-----------------------------------------------|
| **Method**     | `GET`                                         |
| **URL**        | `/api/reports/monthly?month=M&year=Y`         |
| **Description**| Summary for a specific month (stored or computed) |
| **Headers**    | None required                                 |
| **Request Body** | None                                        |

**Query Parameters:**

| Parameter | Type   | Required | Description                   |
|-----------|--------|----------|-------------------------------|
| `month`   | Number | Yes      | Month number (1-12)           |
| `year`    | Number | Yes      | Four-digit year               |

**Success Response (200 OK):**

```json
{
  "_id": "65a1b2c3d4e5f6a7b8c9d0g1",
  "month": 1,
  "year": 2026,
  "salary": 30000,
  "totalFixedDeductions": 5000,
  "categoryBreakdown": [
    { "category": "Mother's Allowance", "limit": 5000, "spent": 4000 },
    { "category": "Personal Expenses", "limit": 3000, "spent": 2800 },
    { "category": "Miscellaneous", "limit": 1500, "spent": 900 }
  ],
  "totalSpent": 12700,
  "totalSavings": 17300,
  "createdAt": "2026-02-01T00:00:00.000Z",
  "updatedAt": "2026-02-01T00:00:00.000Z"
}
```

**Error Responses:**

| Status | Condition            | Body                                                                    |
|--------|----------------------|-------------------------------------------------------------------------|
| 400    | Missing month/year   | `{ "error": { "message": "month and year are required", "status": 400 } }` |
| 500    | Database error       | `{ "error": { "message": "Server error", "status": 500 } }`            |

**Example curl:**

```bash
curl -X GET "http://localhost:5000/api/reports/monthly?month=1&year=2026"
```

---

#### GET /api/reports/history

Retrieve all stored monthly summaries, sorted by year and month in descending order (most recent first).

| Property       | Value                             |
|----------------|-----------------------------------|
| **Method**     | `GET`                             |
| **URL**        | `/api/reports/history`            |
| **Description**| All past monthly summaries        |
| **Headers**    | None required                     |
| **Request Body** | None                            |

**Success Response (200 OK):**

```json
[
  {
    "_id": "65a1b2c3d4e5f6a7b8c9d0g1",
    "month": 1,
    "year": 2026,
    "salary": 30000,
    "totalFixedDeductions": 5000,
    "categoryBreakdown": [
      { "category": "Mother's Allowance", "limit": 5000, "spent": 4000 },
      { "category": "Personal Expenses", "limit": 3000, "spent": 2800 },
      { "category": "Miscellaneous", "limit": 1500, "spent": 900 }
    ],
    "totalSpent": 12700,
    "totalSavings": 17300
  },
  {
    "_id": "65a1b2c3d4e5f6a7b8c9d0g2",
    "month": 12,
    "year": 2025,
    "salary": 28000,
    "totalFixedDeductions": 5000,
    "categoryBreakdown": [
      { "category": "Mother's Allowance", "limit": 5000, "spent": 5000 },
      { "category": "Personal Expenses", "limit": 2500, "spent": 2200 },
      { "category": "Miscellaneous", "limit": 1500, "spent": 1400 }
    ],
    "totalSpent": 13600,
    "totalSavings": 14400
  }
]
```

**Empty Result (200 OK):**

```json
[]
```

**Error Responses:**

| Status | Condition      | Body                                                          |
|--------|----------------|---------------------------------------------------------------|
| 500    | Database error | `{ "error": { "message": "Server error", "status": 500 } }`  |

**Example curl:**

```bash
curl -X GET http://localhost:5000/api/reports/history
```

---

## 6. Business Logic

This section documents the core financial computations performed on the server. These calculations are the heart of the application and directly determine the numbers users see.

### 6.1 Savings Calculation

The fundamental equation:

```
totalSavings = salary - totalFixedDeductions - totalVariableExpenses
```

Where:
- `salary` is the gross monthly salary from settings
- `totalFixedDeductions` = sum of all `fixedDeductions[].amount` from settings (e.g., Bike EMI)
- `totalVariableExpenses` = sum of all logged expense amounts for the month across all categories

**Important:** Savings are calculated from **actual spending**, not from budget limits. If a category has a limit of 3,000 but only 1,500 was spent, the unspent 1,500 contributes to savings.

### 6.2 Month Cycle Detection

The application uses `salaryCreditDate` from settings to determine which "financial month" a given date belongs to:

```
If today's date >= salaryCreditDate:
    currentMonth = this calendar month
    currentYear  = this calendar year
Else:
    currentMonth = previous calendar month
    currentYear  = (adjust if January → December of previous year)
```

**Why this matters:** A user whose salary is credited on the 3rd of each month may log expenses on the 1st or 2nd. Those expenses belong to the **previous** month's budget cycle, because the new month's salary has not yet arrived.

**Example:**
- Salary credit date: 3rd
- Today: February 1st, 2026
- Financial month: **January 2026** (salary for Feb has not arrived yet)
- Today: February 3rd, 2026
- Financial month: **February 2026** (salary has arrived, new cycle begins)

### 6.3 Distributable Amount

```
distributableAmount = salary - totalFixedDeductions
```

This represents the money available after mandatory fixed expenses. It is the pool from which budget categories are funded. This number is displayed on the dashboard to give users a clear picture of their actual discretionary budget.

### 6.4 Per-Category Computation

For each budget category in the current month:

```
spent       = SUM(expenses.amount) WHERE category = this.name
                                     AND month = currentMonth
                                     AND year = currentYear

remaining   = category.monthlyLimit - spent

percentUsed = (spent / category.monthlyLimit) * 100
```

**Edge cases:**
- `remaining` can be **negative** if the user overspends a category
- `percentUsed` can **exceed 100** if overspent
- If `monthlyLimit` is 0, `percentUsed` is treated as 0 to avoid division by zero

### 6.5 Monthly Summary Generation and Storage

Monthly summaries serve as historical snapshots. The generation process:

1. When `GET /api/reports/monthly?month=M&year=Y` is called, the server first checks the `monthly_summaries` collection for an existing document with that month/year.
2. If found, it is returned immediately (cached snapshot).
3. If not found, the server:
   a. Loads the settings document
   b. Queries all expenses for that month/year
   c. Computes the full breakdown (per-category spent, total, savings)
   d. Creates and stores a new `MonthlySummary` document
   e. Returns the newly created summary

The `monthly_summaries` collection has a **unique compound index** on `(month, year)` ensuring no duplicate summaries exist for the same period.

### 6.6 Overspending Handling

The application takes a **tracking-only** approach to overspending:

- There is **no hard block** preventing an expense from being logged when a category limit is exceeded
- The `remaining` field goes negative, and `percentUsed` exceeds 100
- The **frontend** is responsible for visual warnings (red progress bars, warning indicators)
- The **backend** faithfully records the data and reports accurate numbers regardless of overspending

This design was chosen because real-world spending cannot always be deferred -- the user needs to record what actually happened, even if it exceeds the budget.

---

## 7. Data Validation

### 7.1 Validation Rules by Field

All validation is performed server-side in the controller layer before any database operation.

**Settings Fields:**

| Field                            | Rule                                          | Error on Failure                                 |
|----------------------------------|-----------------------------------------------|--------------------------------------------------|
| `salary`                         | Required, type Number, value > 0              | "salary is required" / "salary must be > 0"      |
| `salaryCreditDate`               | Required, type Number, integer, 1 <= x <= 31  | "salaryCreditDate must be between 1 and 31"      |
| `fixedDeductions[].name`         | Required, type String, non-empty              | "deduction name is required"                     |
| `fixedDeductions[].amount`       | Required, type Number, value > 0              | "deduction amount must be > 0"                   |
| `fixedDeductions[].deductionDate`| Required, type Number, 1 <= x <= 31           | "deduction date must be between 1 and 31"        |
| `categories[].name`              | Required, type String, non-empty, unique      | "category name is required" / "duplicate name"   |
| `categories[].monthlyLimit`      | Required, type Number, value > 0              | "monthly limit must be > 0"                      |
| `categories[].type`              | Optional, enum: `"fixed"`, `"variable"`       | "type must be 'fixed' or 'variable'"             |

**Expense Fields:**

| Field         | Rule                                               | Error on Failure                           |
|---------------|----------------------------------------------------|--------------------------------------------|
| `date`        | Required, valid Date, not in the future            | "date is required" / "invalid date"        |
| `category`    | Required, type String, must match existing category | "category is required"                    |
| `amount`      | Required, type Number, value > 0                   | "amount must be > 0"                       |
| `description` | Required, type String, 1-200 characters            | "description is required" / "too long"     |

### 7.2 Validation Failure Response

When validation fails, the server returns a **400 Bad Request** status with a structured error body:

```json
{
  "error": {
    "message": "description of what is wrong",
    "status": 400
  }
}
```

### 7.3 Validation Approach

Validation is performed at **two levels**:

1. **Controller-level (explicit checks):** The controller function checks for required fields, value ranges, and business rules before attempting any database operation. This catches errors early and returns descriptive messages.

2. **Schema-level (Mongoose):** The Mongoose schema enforces type constraints, `required` fields, `min`/`max` values, and `enum` restrictions. If a controller-level check is missed, the schema acts as a safety net. Mongoose validation errors are caught by the error handler and returned as 400 responses.

---

## 8. Error Handling

### 8.1 Centralized Error Handler Middleware

All errors are funneled through a single Express error-handling middleware defined in `middleware/errorHandler.js`:

```javascript
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Log the error for server-side debugging
  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode
    }
  });
};
```

### 8.2 Error Response Format

Every error response follows a consistent structure:

```json
{
  "error": {
    "message": "Human-readable description of what went wrong",
    "status": 400
  }
}
```

This consistency allows the frontend to parse errors uniformly regardless of the endpoint.

### 8.3 HTTP Status Code Usage

| Status Code | Meaning              | When Used                                                        |
|-------------|----------------------|------------------------------------------------------------------|
| `200`       | OK                   | Successful GET, PUT, DELETE operations                           |
| `201`       | Created              | Successful POST (new resource created)                           |
| `400`       | Bad Request          | Validation failure, missing required fields, invalid values       |
| `404`       | Not Found            | Expense ID does not exist, settings not configured yet           |
| `500`       | Internal Server Error| Unhandled exceptions, database connection failures               |

### 8.4 Try-Catch Pattern in Controllers

Every controller function wraps its logic in a try-catch block to ensure errors are never unhandled:

```javascript
const getExpenses = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      const error = new Error('month and year are required');
      error.statusCode = 400;
      throw error;
    }

    const expenses = await Expense.find({ month, year }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    next(error);  // Forward to centralized error handler
  }
};
```

The pattern:
1. Validate input -- throw with `statusCode = 400` if invalid
2. Perform database operation
3. Return success response
4. If anything throws, `catch` forwards the error to `next()`, which triggers the centralized error handler

---

## 9. Environment Variables

### 9.1 Variable Reference

| Variable         | Required | Default         | Description                                                              |
|------------------|----------|-----------------|--------------------------------------------------------------------------|
| `PORT`           | No       | `5000`          | Port number for the Express server to listen on                          |
| `MONGODB_URI`    | **Yes**  | None            | MongoDB Atlas connection string including credentials and database name  |
| `CLIENT_ORIGIN`  | **Yes**  | None            | Frontend URL for CORS (e.g., `https://username.github.io`)               |
| `NODE_ENV`       | No       | `development`   | Environment mode: `development` or `production`                          |

### 9.2 `.env.example` Template

```env
# Server port (Render injects its own PORT in production)
PORT=5000

# MongoDB Atlas connection string
# Replace <username>, <password>, and <cluster> with your values
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/finance-management

# Frontend origin for CORS (no trailing slash)
CLIENT_ORIGIN=https://<github-username>.github.io

# Environment: development or production
NODE_ENV=development
```

### 9.3 Important Notes

- `MONGODB_URI` must include the database name (`finance-management`) at the end of the connection string path. If omitted, Mongoose will use the `test` database by default.
- `CLIENT_ORIGIN` must **not** have a trailing slash. The `cors` middleware performs an exact string match against the `Origin` header.
- In production on Render, `PORT` is injected automatically by the platform. Do not hardcode a port for production.
- `NODE_ENV=production` suppresses verbose error stack traces in responses and enables any production-specific behavior.

---

## 10. CORS Configuration

### 10.1 Why CORS Is Required

The frontend and backend are hosted on **different domains**:

| Component  | Domain                                       |
|------------|----------------------------------------------|
| Frontend   | `https://<username>.github.io`               |
| Backend    | `https://finance-management-api.onrender.com`|

Browsers enforce the **Same-Origin Policy**, which blocks JavaScript on one domain from making requests to a different domain. CORS (Cross-Origin Resource Sharing) is the standard mechanism to selectively relax this restriction.

### 10.2 Configuration

```javascript
app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
}));
```

### 10.3 Configuration Breakdown

| Option        | Value                                 | Explanation                                                          |
|---------------|---------------------------------------|----------------------------------------------------------------------|
| `origin`      | `process.env.CLIENT_ORIGIN`           | Only the frontend domain is allowed. All other origins are blocked.  |
| `methods`     | `['GET', 'POST', 'PUT', 'DELETE']`    | Only the HTTP methods the API actually uses are permitted.           |
| `credentials` | `false`                               | No cookies or authentication headers are sent cross-origin. This is a single-user app with no authentication, so credentials are unnecessary. |

### 10.4 Preflight Requests

For `PUT` and `DELETE` requests with JSON bodies, browsers send an automatic **OPTIONS preflight request** before the actual request. The `cors` middleware handles these automatically, responding with the appropriate `Access-Control-Allow-*` headers.

---

## 11. Security Best Practices

### 11.1 Input Validation

All user input is validated server-side before any database operation. The frontend performs its own validation for user experience, but the server **never trusts** client-provided data. Every field is checked for type, presence, and acceptable value ranges.

### 11.2 NoSQL Injection Prevention

MongoDB is susceptible to operator injection (e.g., passing `{ "$gt": "" }` as a query value). Mongoose provides built-in protection:

- **Schema enforcement:** Mongoose casts all values to the types defined in the schema. A field defined as `Number` will reject an object like `{ "$gt": 0 }`.
- **Strict mode:** Mongoose schemas use `strict: true` by default, which strips any fields not defined in the schema from incoming documents.
- **Parameterized queries:** Mongoose queries use parameterized operations internally, preventing injection through query parameters.

### 11.3 Rate Limiting (Recommended Enhancement)

While not implemented in the initial release (single-user application with no public exposure), rate limiting is recommended for production hardening:

```javascript
// Future enhancement using express-rate-limit
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                     // limit each IP to 100 requests per window
});

app.use('/api/', limiter);
```

### 11.4 HTTP Security Headers (Recommended Enhancement)

Adding `helmet.js` is recommended for production to set secure HTTP headers:

```javascript
// Future enhancement
const helmet = require('helmet');
app.use(helmet());
```

Helmet sets headers such as:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `X-XSS-Protection`

### 11.5 Authentication

This application is designed as a **single-user personal tool**. There is no authentication or authorization layer. The API is open to anyone who knows the URL.

**Risk mitigation:**
- The `CLIENT_ORIGIN` CORS restriction prevents browser-based attacks from other domains
- The application contains only personal finance data, not sensitive credentials
- No administrative or destructive bulk operations are exposed

**Future considerations:**
- If multi-user support is added, implement JWT-based authentication
- Consider API key authentication as a lightweight first step
- OAuth 2.0 integration for third-party identity providers

### 11.6 Data Exposure

- MongoDB `_id` fields are exposed in API responses. These are opaque ObjectIds and do not reveal sensitive information.
- Error messages in production (`NODE_ENV=production`) omit stack traces to prevent information leakage about the server internals.
- The `.env` file is excluded from version control via `.gitignore`.

---

## 12. Development Setup

### 12.1 Prerequisites

- **Node.js** 20.x LTS installed (verify with `node -v`)
- **npm** 10.x or later (bundled with Node.js 20)
- **MongoDB Atlas** free cluster (M0 tier) or local MongoDB instance
- **Git** for version control

### 12.2 Step-by-Step Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/iamdivyeshtailor/finance-management.git
cd finance-management

# 2. Navigate to the server directory
cd server

# 3. Install dependencies
npm install

# 4. Create environment file from template
cp .env.example .env

# 5. Edit .env with your MongoDB connection string
#    Replace the MONGODB_URI value with your Atlas connection string
#    Set CLIENT_ORIGIN to http://localhost:5173 for local development

# 6. Start the development server (with auto-reload)
npm run dev
```

The server will start on `http://localhost:5000` by default.

### 12.3 npm Scripts

| Script         | Command                         | Description                                         |
|----------------|----------------------------------|-----------------------------------------------------|
| `npm start`    | `node server.js`                | Start the server in production mode                 |
| `npm run dev`  | `nodemon server.js`             | Start with nodemon for automatic restart on changes |

### 12.4 Verifying the Server Is Running

```bash
# Health check
curl http://localhost:5000/health
# Expected: { "status": "ok" }

# Test settings endpoint (should return empty defaults on first run)
curl http://localhost:5000/api/settings
```

### 12.5 Testing with curl

**Create initial settings:**

```bash
curl -X PUT http://localhost:5000/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "salary": 30000,
    "salaryCreditDate": 3,
    "fixedDeductions": [
      { "name": "Bike EMI", "amount": 5000, "deductionDate": 3 }
    ],
    "categories": [
      { "name": "Personal Expenses", "monthlyLimit": 3000, "type": "variable" },
      { "name": "Miscellaneous", "monthlyLimit": 1500, "type": "variable" }
    ]
  }'
```

**Add an expense:**

```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-05",
    "category": "Personal Expenses",
    "amount": 500,
    "description": "Dinner with friends"
  }'
```

**View current month report:**

```bash
curl http://localhost:5000/api/reports/current
```

### 12.6 Testing with Postman

1. Import the base URL as a Postman environment variable: `{{baseUrl}}` = `http://localhost:5000`
2. Create requests for each endpoint using the schemas documented in Section 5
3. Use the Postman collection runner to execute all endpoints in sequence
4. Validate response status codes and body structure against this documentation

---

## 13. Deployment (Render)

### 13.1 Prerequisites

- A Render account (free tier is sufficient)
- The GitHub repository connected to Render
- MongoDB Atlas connection string ready
- The GitHub Pages frontend URL for CORS

### 13.2 Step-by-Step Deployment

**Step 1: Create a New Web Service**

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click "New" and select "Web Service"
3. Connect your GitHub repository (`finance-management`)
4. Select the branch to deploy (typically `main`)

**Step 2: Configure Build and Start Commands**

| Setting         | Value                        |
|-----------------|------------------------------|
| **Root Directory** | `server`                  |
| **Build Command** | `npm install`              |
| **Start Command** | `npm start`                |
| **Runtime**       | Node                        |

If the root directory setting is not available, use:
- Build Command: `cd server && npm install`
- Start Command: `cd server && npm start`

**Step 3: Set Environment Variables**

In the Render dashboard, under "Environment", add:

| Key             | Value                                                                        |
|-----------------|------------------------------------------------------------------------------|
| `MONGODB_URI`   | `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/finance-management` |
| `CLIENT_ORIGIN` | `https://<github-username>.github.io`                                        |
| `NODE_ENV`      | `production`                                                                 |

Note: Do **not** set `PORT`. Render injects its own port automatically.

**Step 4: Deploy**

Click "Create Web Service". Render will:
1. Pull the code from GitHub
2. Run `npm install` to install dependencies
3. Run `npm start` to launch the server
4. Assign a public URL (e.g., `https://finance-management-api.onrender.com`)

**Step 5: Verify Deployment**

```bash
curl https://finance-management-api.onrender.com/health
# Expected: { "status": "ok" }
```

### 13.3 Health Check Endpoint

| Property       | Value                    |
|----------------|--------------------------|
| **Method**     | `GET`                    |
| **URL**        | `/health`                |
| **Response**   | `{ "status": "ok" }`    |
| **Status Code**| `200`                    |

Configure this in Render's health check settings to enable automatic restarts if the service becomes unresponsive.

### 13.4 Automatic Deployments

Render can be configured to automatically redeploy when new commits are pushed to the connected branch. This is enabled by default and provides a simple CI/CD pipeline.

### 13.5 Free Tier Considerations

- Render free tier services **spin down after 15 minutes of inactivity**
- The first request after a spin-down takes 30-60 seconds (cold start)
- This is acceptable for a personal finance tool with infrequent usage patterns
- Upgrade to a paid instance if consistent response times are required

---

## 14. Logging and Monitoring

### 14.1 Current Logging Strategy

The application uses `console` methods for logging in the initial release:

| Log Type       | Method            | When                                                  |
|----------------|-------------------|-------------------------------------------------------|
| Startup        | `console.log`     | Server starts listening, MongoDB connects             |
| Request errors | `console.error`   | Validation failures, database errors, unhandled exceptions |
| Connection     | `console.log`     | Successful MongoDB connection with host info          |
| Fatal errors   | `console.error`   | MongoDB connection failure (followed by process.exit) |

### 14.2 Error Logging in the Error Handler

The centralized error handler logs every error before sending the response:

```
[ERROR] POST /api/expenses - amount must be greater than 0
[ERROR] GET /api/reports/current - Settings not found
```

In development mode (`NODE_ENV=development`), the full stack trace is also logged to assist debugging.

### 14.3 Request Logging

Currently, individual successful requests are not logged. For production monitoring, adding a request logger is recommended.

### 14.4 Future Considerations

**Morgan (HTTP request logger):**

```javascript
const morgan = require('morgan');
app.use(morgan('combined'));  // Apache combined log format
```

Morgan would log every incoming request with method, URL, status code, response time, and user agent.

**Winston (Structured logging):**

```javascript
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

Winston would provide structured JSON logs, log levels, file rotation, and integration with external monitoring services (Datadog, CloudWatch, etc.).

**Recommended production logging stack:**
- Morgan for HTTP request/response logging
- Winston for application-level structured logging
- External log aggregation service for alerting and dashboards

---

## 15. Dependencies

### 15.1 Production Dependencies

| Package        | Version | Purpose                                          | Why Chosen                                                                |
|----------------|---------|--------------------------------------------------|---------------------------------------------------------------------------|
| **express**    | ^4.x    | HTTP server framework                            | Industry standard for Node.js APIs. Mature, well-documented, extensive middleware ecosystem. Lightweight yet powerful. |
| **mongoose**   | ^8.x    | MongoDB object data modeling (ODM)               | Provides schema validation, type casting, query building, and middleware hooks. Eliminates raw MongoDB driver boilerplate. Version 8 brings improved TypeScript support and performance. |
| **cors**       | ^2.x    | Cross-Origin Resource Sharing middleware          | Purpose-built Express middleware for CORS. Handles preflight requests, origin validation, and header management automatically. |
| **dotenv**     | ^16.x   | Environment variable loader                      | Reads `.env` files and populates `process.env`. Zero-dependency, zero-config. The standard approach for Node.js configuration management. |

### 15.2 Development Dependencies

| Package        | Version | Purpose                                          | Why Chosen                                                                |
|----------------|---------|--------------------------------------------------|---------------------------------------------------------------------------|
| **nodemon**    | ^3.x    | Automatic server restart on file changes         | Essential for development workflow. Watches for file changes and restarts the Node.js process automatically, eliminating manual stop/start cycles. |

### 15.3 Dependency Philosophy

The dependency list is intentionally minimal:

- **Only add what is necessary.** Every dependency is a maintenance burden and a potential security surface.
- **Prefer well-maintained, widely-used packages.** All five dependencies have millions of weekly downloads and active maintenance.
- **No utility libraries for simple operations.** Date extraction, number formatting, and array operations are done with native JavaScript.
- **No authentication libraries** in the initial release, consistent with the single-user design.

---

*This document is maintained alongside the codebase and should be updated whenever API endpoints, business logic, or infrastructure configuration changes.*
