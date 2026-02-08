# Finance Management — Technical Documentation

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│                                                             │
│   React SPA (Single Page Application)                       │
│   ├── React Router (page navigation)                        │
│   ├── Axios (HTTP calls to backend)                         │
│   └── CSS Modules / Tailwind CSS (styling)                  │
│                                                             │
│   Hosted on: GitHub Pages (static build)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS (REST API calls)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js + Express)                │
│                                                             │
│   REST API                                                  │
│   ├── /api/settings     → Budget configuration CRUD         │
│   ├── /api/expenses     → Expense logging CRUD              │
│   └── /api/reports      → Monthly summaries (read-only)     │
│                                                             │
│   Hosted on: Render (free tier)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │ MongoDB Driver (Mongoose ODM)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (MongoDB Atlas)                   │
│                                                             │
│   Collections:                                              │
│   ├── settings          → salary, categories, deductions    │
│   ├── expenses          → individual expense records        │
│   └── monthly_summaries → aggregated month-end snapshots    │
│                                                             │
│   Hosted on: MongoDB Atlas M0 (free cluster, 512 MB)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack Details

| Layer       | Technology        | Version  | Purpose                                |
|-------------|-------------------|----------|----------------------------------------|
| Frontend    | React             | 18.x     | UI components and SPA routing          |
| Frontend    | React Router      | 6.x      | Client-side page navigation            |
| Frontend    | Axios             | 1.x      | HTTP client for API calls              |
| Frontend    | Tailwind CSS      | 3.x      | Utility-first CSS framework            |
| Build Tool  | Vite              | 5.x      | Fast dev server and production build   |
| Backend     | Node.js           | 20.x LTS | Server runtime                         |
| Backend     | Express.js        | 4.x      | REST API framework                     |
| Backend     | Mongoose          | 8.x      | MongoDB object modeling (ODM)          |
| Backend     | cors              | 2.x      | Cross-origin resource sharing          |
| Backend     | dotenv            | 16.x     | Environment variable management        |
| Database    | MongoDB Atlas     | 7.x      | Cloud-hosted NoSQL database            |

---

## 3. Project Folder Structure

```
finance-management/
│
├── client/                          # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── CategoryCard.jsx
│   │   │   ├── ExpenseForm.jsx
│   │   │   ├── ExpenseTable.jsx
│   │   │   ├── SummaryBar.jsx
│   │   │   └── ProgressBar.jsx
│   │   ├── pages/                   # Route-level page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AddExpense.jsx
│   │   │   ├── ExpenseHistory.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── MonthlyReports.jsx
│   │   ├── services/                # API call functions
│   │   │   ├── settingsService.js
│   │   │   ├── expenseService.js
│   │   │   └── reportService.js
│   │   ├── utils/                   # Helper functions
│   │   │   ├── formatCurrency.js
│   │   │   └── dateHelpers.js
│   │   ├── App.jsx                  # Root component with routes
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Global styles / Tailwind imports
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                          # Node.js backend
│   ├── config/
│   │   └── db.js                    # MongoDB connection setup
│   ├── models/                      # Mongoose schemas
│   │   ├── Settings.js
│   │   ├── Expense.js
│   │   └── MonthlySummary.js
│   ├── routes/                      # Express route handlers
│   │   ├── settingsRoutes.js
│   │   ├── expenseRoutes.js
│   │   └── reportRoutes.js
│   ├── controllers/                 # Business logic
│   │   ├── settingsController.js
│   │   ├── expenseController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── server.js                    # Express app entry point
│   ├── package.json
│   └── .env.example                 # Environment variable template
│
├── PROJECT_DOCUMENTATION.md         # Non-technical documentation
├── TECHNICAL_DOCUMENTATION.md       # This file
├── CLAUDE.md                        # AI assistant context
└── .gitignore
```

---

## 4. Database Schema (MongoDB Collections)

### 4.1 `settings` Collection

Stores the user's budget configuration. Single document (one user app).

```json
{
  "_id": "ObjectId",
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
  ],
  "createdAt": "2026-02-08T00:00:00Z",
  "updatedAt": "2026-02-08T00:00:00Z"
}
```

**Mongoose Schema:**

```javascript
const settingsSchema = new mongoose.Schema({
  salary: { type: Number, required: true },
  salaryCreditDate: { type: Number, required: true, min: 1, max: 31 },
  fixedDeductions: [
    {
      name: { type: String, required: true },
      amount: { type: Number, required: true },
      deductionDate: { type: Number, required: true, min: 1, max: 31 }
    }
  ],
  categories: [
    {
      name: { type: String, required: true },
      monthlyLimit: { type: Number, required: true },
      type: { type: String, enum: ["fixed", "variable"], default: "variable" }
    }
  ]
}, { timestamps: true });
```

### 4.2 `expenses` Collection

Each document is a single expense entry.

```json
{
  "_id": "ObjectId",
  "date": "2026-02-05T00:00:00Z",
  "category": "Personal Expenses",
  "amount": 500,
  "description": "Dinner with friends",
  "month": 2,
  "year": 2026
}
```

**Mongoose Schema:**

```javascript
const expenseSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, maxlength: 200 },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true }
}, { timestamps: true });

expenseSchema.index({ month: 1, year: 1 });
expenseSchema.index({ category: 1, month: 1, year: 1 });
```

### 4.3 `monthly_summaries` Collection

Snapshot of each month's financial summary. Created/updated when viewing reports.

```json
{
  "_id": "ObjectId",
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
}
```

**Mongoose Schema:**

```javascript
const monthlySummarySchema = new mongoose.Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  salary: { type: Number, required: true },
  totalFixedDeductions: { type: Number, required: true },
  categoryBreakdown: [
    {
      category: { type: String, required: true },
      limit: { type: Number, required: true },
      spent: { type: Number, required: true }
    }
  ],
  totalSpent: { type: Number, required: true },
  totalSavings: { type: Number, required: true }
}, { timestamps: true });

monthlySummarySchema.index({ month: 1, year: 1 }, { unique: true });
```

---

## 5. REST API Endpoints

### 5.1 Settings API

| Method | Endpoint             | Description                    | Request Body                          | Response                  |
|--------|----------------------|--------------------------------|---------------------------------------|---------------------------|
| GET    | `/api/settings`      | Get current budget settings    | —                                     | Settings object           |
| PUT    | `/api/settings`      | Update budget settings         | `{ salary, salaryCreditDate, ... }`   | Updated settings object   |

**PUT `/api/settings` — Request Body:**

```json
{
  "salary": 30000,
  "salaryCreditDate": 3,
  "fixedDeductions": [
    { "name": "Bike EMI", "amount": 5000, "deductionDate": 3 }
  ],
  "categories": [
    { "name": "Mother's Allowance", "monthlyLimit": 5000, "type": "variable" },
    { "name": "Personal Expenses", "monthlyLimit": 3000, "type": "variable" },
    { "name": "Miscellaneous", "monthlyLimit": 1500, "type": "variable" }
  ]
}
```

### 5.2 Expenses API

| Method | Endpoint              | Description                         | Request Body / Params                | Response                  |
|--------|-----------------------|-------------------------------------|--------------------------------------|---------------------------|
| GET    | `/api/expenses`       | Get expenses (filtered by month/year) | Query: `?month=2&year=2026`         | Array of expense objects  |
| POST   | `/api/expenses`       | Add a new expense                   | `{ date, category, amount, description }` | Created expense object |
| PUT    | `/api/expenses/:id`   | Update an existing expense          | `{ date, category, amount, description }` | Updated expense object |
| DELETE | `/api/expenses/:id`   | Delete an expense                   | —                                    | `{ message: "Deleted" }`  |

**POST `/api/expenses` — Request Body:**

```json
{
  "date": "2026-02-05",
  "category": "Personal Expenses",
  "amount": 500,
  "description": "Dinner with friends"
}
```

**Note:** `month` and `year` are derived from `date` on the server side before saving.

### 5.3 Reports API

| Method | Endpoint                      | Description                          | Params                  | Response                       |
|--------|-------------------------------|--------------------------------------|-------------------------|--------------------------------|
| GET    | `/api/reports/current`        | Get current month's live summary     | —                       | Summary with remaining amounts |
| GET    | `/api/reports/monthly`        | Get a specific month's summary       | Query: `?month=1&year=2026` | Monthly summary object      |
| GET    | `/api/reports/history`        | Get summaries for all past months    | —                       | Array of monthly summaries     |

**GET `/api/reports/current` — Response:**

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

---

## 6. Frontend — Component Architecture

```
App.jsx
├── Navbar                                (all pages)
│
├── Route: /                → Dashboard
│   ├── SummaryBar          (salary, total spent, savings)
│   ├── CategoryCard[]      (one per category — limit, spent, remaining, progress bar)
│   └── Button → /add       (navigate to Add Expense)
│
├── Route: /add             → AddExpense
│   └── ExpenseForm         (date, category dropdown, amount, description, submit)
│
├── Route: /history         → ExpenseHistory
│   └── ExpenseTable        (list of expenses, filter by category, sort, edit/delete)
│
├── Route: /settings        → Settings
│   ├── SalaryForm          (salary amount, credit date)
│   ├── FixedDeductionList  (add/remove fixed deductions)
│   └── CategoryList        (add/remove/edit categories and limits)
│
└── Route: /reports         → MonthlyReports
    ├── MonthSelector       (dropdown to pick a past month)
    └── SummaryBar          (reused — shows that month's data)
```

### Component Details

| Component         | Props / State                                     | Responsibility                                    |
|-------------------|---------------------------------------------------|---------------------------------------------------|
| `Navbar`          | current route                                     | Navigation links, active page highlight           |
| `SummaryBar`      | salary, totalSpent, savings                        | Top-level financial overview bar                 |
| `CategoryCard`    | name, limit, spent, remaining, percentUsed         | Single category budget status with progress bar  |
| `ProgressBar`     | percentUsed, isOverBudget                          | Visual bar (green → yellow → red)                |
| `ExpenseForm`     | categories[], onSubmit()                           | Form inputs + validation + submit                |
| `ExpenseTable`    | expenses[], onEdit(), onDelete()                   | Sortable/filterable table of expenses            |

### Frontend Routing

| Path         | Page Component    | Description                    |
|--------------|-------------------|--------------------------------|
| `/`          | `Dashboard`       | Home — overview of current month |
| `/add`       | `AddExpense`      | Log a new expense              |
| `/history`   | `ExpenseHistory`  | View/edit/delete past expenses |
| `/settings`  | `Settings`        | Configure salary and budgets   |
| `/reports`   | `MonthlyReports`  | View past month summaries      |

---

## 7. API Service Layer (Frontend)

Functions that encapsulate all API calls. Used by page components.

```javascript
// services/settingsService.js
getSettings()                         → GET    /api/settings
updateSettings(data)                  → PUT    /api/settings

// services/expenseService.js
getExpenses(month, year)              → GET    /api/expenses?month=M&year=Y
addExpense(data)                      → POST   /api/expenses
updateExpense(id, data)               → PUT    /api/expenses/:id
deleteExpense(id)                     → DELETE /api/expenses/:id

// services/reportService.js
getCurrentReport()                    → GET    /api/reports/current
getMonthlyReport(month, year)         → GET    /api/reports/monthly?month=M&year=Y
getReportHistory()                    → GET    /api/reports/history
```

---

## 8. Backend — Controller Logic

### 8.1 `settingsController.js`

```
getSettings()    → Find the single settings document, return it.
                   If none exists, return default empty settings.

updateSettings() → Validate input.
                   Upsert the settings document.
                   Return updated document.
```

### 8.2 `expenseController.js`

```
getExpenses()    → Extract month, year from query params.
                   Find all expenses matching that month/year.
                   Sort by date descending.
                   Return array.

addExpense()     → Validate input (amount > 0, category exists, date valid).
                   Extract month and year from the date field.
                   Create and save the expense document.
                   Return created document.

updateExpense()  → Find expense by ID.
                   Validate updated fields.
                   Recalculate month/year if date changed.
                   Save and return updated document.

deleteExpense()  → Find expense by ID.
                   Delete it.
                   Return success message.
```

### 8.3 `reportController.js`

```
getCurrentReport()    → Get settings (salary, categories, fixed deductions).
                        Get current month/year.
                        Aggregate all expenses for current month.
                        Calculate: spent per category, remaining per category,
                                   total spent, current savings.
                        Return computed summary (NOT stored — always live).

getMonthlyReport()    → Check if a stored summary exists for given month/year.
                        If yes, return it.
                        If no, compute it from expenses and settings, store it, return it.

getReportHistory()    → Find all monthly_summaries, sorted by year desc, month desc.
                        Return array.
```

---

## 9. Key Business Logic (Server-Side)

### 9.1 Current Month Calculation

```
distributableAmount = salary - sum(fixedDeductions[].amount)

For each category:
  spent     = sum of all expenses in this category for current month
  remaining = category.monthlyLimit - spent
  percentUsed = (spent / category.monthlyLimit) * 100

totalSpent    = sum(fixedDeductions) + sum(all variable expenses)
currentSavings = salary - totalSpent
```

### 9.2 Month Detection

The "current month" is determined by the salary credit date:
- If today's date >= salaryCreditDate → current month = this calendar month
- If today's date < salaryCreditDate → current month = previous calendar month

This handles the edge case where salary arrives on the 3rd but you're logging expenses on the 1st or 2nd (those belong to the previous month's cycle).

### 9.3 Overspending Handling

- No hard block on exceeding a category limit
- `remaining` can go negative
- `percentUsed` can exceed 100
- Frontend shows visual warning (red progress bar, warning icon) when `percentUsed >= 100`

---

## 10. Environment Variables

### Server `.env`

```
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/finance-management
NODE_ENV=development
CLIENT_ORIGIN=https://<github-username>.github.io
```

### Client `.env`

```
VITE_API_BASE_URL=http://localhost:5000/api
```

**Production:** `VITE_API_BASE_URL` will point to the deployed Render URL.

---

## 11. CORS Configuration

Since frontend (GitHub Pages) and backend (Render) are on different domains:

```javascript
// server.js
app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
}));
```

---

## 12. Development Workflow

### Local Setup

```bash
# Clone repository
git clone https://github.com/iamdivyeshtailor/finance-management.git
cd finance-management

# Backend setup
cd server
npm install
cp .env.example .env        # Fill in your MongoDB URI
npm run dev                  # Starts Express on port 5000

# Frontend setup (separate terminal)
cd client
npm install
npm run dev                  # Starts Vite dev server on port 5173
```

### Available Scripts

| Location  | Command          | Description                                  |
|-----------|------------------|----------------------------------------------|
| `server/` | `npm run dev`    | Start backend with nodemon (auto-reload)     |
| `server/` | `npm start`      | Start backend for production                 |
| `client/` | `npm run dev`    | Start Vite dev server with hot reload        |
| `client/` | `npm run build`  | Build React app for production (→ `dist/`)   |
| `client/` | `npm run preview`| Preview production build locally             |

---

## 13. Deployment

### Frontend → GitHub Pages

```bash
cd client
npm run build                # Generates dist/ folder
# Push dist/ contents to gh-pages branch, or use gh-pages npm package
```

**Vite config for GitHub Pages:**

```javascript
// vite.config.js
export default defineConfig({
  base: '/finance-management/',    // Repository name as base path
  plugins: [react()]
});
```

### Backend → Render (Free Tier)

1. Connect GitHub repository to Render
2. Set build command: `cd server && npm install`
3. Set start command: `cd server && npm start`
4. Add environment variables (`MONGODB_URI`, `CLIENT_ORIGIN`, `NODE_ENV=production`)
5. Render provides a URL like `https://finance-management-api.onrender.com`

### Database → MongoDB Atlas

1. Create free M0 cluster on MongoDB Atlas
2. Create database user with read/write access
3. Whitelist Render's IP (or allow all IPs: `0.0.0.0/0` for free tier)
4. Get connection string → put in server's `MONGODB_URI`

---

## 14. Error Handling Strategy

### Backend

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      message: err.message,
      status: statusCode
    }
  });
};
```

### Standard Error Responses

| Status Code | When                                        |
|-------------|---------------------------------------------|
| 400         | Invalid input (missing fields, bad values)  |
| 404         | Expense not found (wrong ID)                |
| 500         | Server/database error                       |

### Frontend

- Show toast/alert messages for API errors
- Show inline validation errors on forms (amount must be > 0, description required, etc.)
- Show a fallback message if the API is unreachable

---

## 15. Data Validation Rules

| Field               | Rules                                              |
|---------------------|----------------------------------------------------|
| `salary`            | Required, number, > 0                              |
| `salaryCreditDate`  | Required, integer, 1–31                            |
| `deduction.name`    | Required, string, non-empty                        |
| `deduction.amount`  | Required, number, > 0                              |
| `category.name`     | Required, string, non-empty, unique within list    |
| `category.limit`    | Required, number, > 0                              |
| `expense.date`      | Required, valid date, not in the future             |
| `expense.category`  | Required, must match an existing category name      |
| `expense.amount`    | Required, number, > 0                              |
| `expense.description` | Required, string, 1–200 characters               |

---

## 16. API Request/Response Flow Example

**User adds an expense of ₹500 for "Dinner with friends":**

```
1. User fills form on /add page
2. Frontend validates: amount > 0 ✓, category selected ✓, description filled ✓
3. Frontend calls: POST /api/expenses
   Body: { date: "2026-02-05", category: "Personal Expenses", amount: 500, description: "Dinner with friends" }
4. Backend validates input
5. Backend extracts month=2, year=2026 from date
6. Backend saves to MongoDB expenses collection
7. Backend returns: { _id: "...", date: "...", category: "Personal Expenses", amount: 500, ... }
8. Frontend receives success → navigates to Dashboard
9. Dashboard calls: GET /api/reports/current
10. Backend aggregates all Feb 2026 expenses by category
11. Backend calculates remaining amounts and savings
12. Backend returns live summary
13. Dashboard renders updated category cards with new remaining amounts
```
