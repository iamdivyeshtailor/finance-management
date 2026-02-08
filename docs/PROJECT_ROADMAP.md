# Finance Management — Project Roadmap

## Complete Module Breakdown: Start to Finish

> This document lists every module and task required to build the Finance Management application
> from an empty repository to a fully deployed, production-ready web application.
> Work through these **sequentially** — one phase at a time, one module at a time.

---

## Phase 1: Project Initialization & Environment Setup

> **Goal:** Set up the development environment, project scaffolding, and external services.
> **No application code is written in this phase — only configuration and setup.**

### Module 1.1: Repository & Git Setup
- Initialize `.gitignore` (node_modules, .env, dist, build artifacts)
- Define branch strategy (main → development workflow)
- Verify GitHub remote is connected

### Module 1.2: Backend Project Initialization
- Create `server/` directory
- Initialize `package.json` with `npm init`
- Install production dependencies: `express`, `mongoose`, `cors`, `dotenv`
- Install dev dependencies: `nodemon`
- Configure npm scripts: `start`, `dev`
- Create `.env.example` with placeholder values
- Create `server.js` entry point (empty Express app that starts and listens)

### Module 1.3: Frontend Project Initialization
- Create React app using Vite inside `client/` directory: `npm create vite@latest client -- --template react`
- Install additional dependencies: `axios`, `react-router-dom`
- Install Tailwind CSS and configure it (`tailwind.config.js`, `postcss.config.js`)
- Configure Vite base path for GitHub Pages in `vite.config.js`
- Create `.env` with `VITE_API_BASE_URL=http://localhost:5000/api`
- Verify `npm run dev` starts the Vite dev server successfully

### Module 1.4: MongoDB Atlas Setup
- Create MongoDB Atlas account (if not exists)
- Create a free M0 cluster (select nearest region)
- Create a database user (username + password)
- Configure network access (allow all IPs: `0.0.0.0/0` for development)
- Create database: `finance-management`
- Copy the connection string

### Module 1.5: Backend-Database Connection
- Create `server/config/db.js` — MongoDB connection function using Mongoose
- Add `MONGODB_URI` to `.env` with the Atlas connection string
- Call the connection function from `server.js`
- Test: Start backend → verify "MongoDB Connected" log in terminal

### Module 1.6: Verify Full Local Stack
- Start backend (`npm run dev` in `server/`) — should connect to MongoDB
- Start frontend (`npm run dev` in `client/`) — should open in browser
- No API calls yet — just confirm both servers run without errors

**Phase 1 Deliverable:** Both servers start, MongoDB is connected, project structure is ready.

---

## Phase 2: Database Layer (Models)

> **Goal:** Define all Mongoose schemas and models. This is the data foundation — everything else builds on it.

### Module 2.1: Settings Model
- Create `server/models/Settings.js`
- Define schema: `salary` (Number, required), `salaryCreditDate` (Number, 1–31), `fixedDeductions` (Array of {name, amount, deductionDate}), `categories` (Array of {name, monthlyLimit, type})
- Enable timestamps
- Export the model

### Module 2.2: Expense Model
- Create `server/models/Expense.js`
- Define schema: `date` (Date, required), `category` (String, required), `amount` (Number, required, min: 0), `description` (String, required, maxlength: 200), `month` (Number, 1–12), `year` (Number)
- Add compound indexes: `{ month: 1, year: 1 }` and `{ category: 1, month: 1, year: 1 }`
- Enable timestamps
- Export the model

### Module 2.3: Monthly Summary Model
- Create `server/models/MonthlySummary.js`
- Define schema: `month`, `year`, `salary`, `totalFixedDeductions`, `categoryBreakdown` (Array of {category, limit, spent}), `totalSpent`, `totalSavings`
- Add unique compound index: `{ month: 1, year: 1 }`
- Enable timestamps
- Export the model

### Module 2.4: Model Verification
- Write a small test script or use the Node REPL to:
  - Create a sample settings document
  - Create a sample expense document
  - Verify both save to MongoDB Atlas successfully
  - Delete the test documents
- Confirm indexes are created in Atlas dashboard

**Phase 2 Deliverable:** All 3 models defined, validated, and tested against MongoDB Atlas.

---

## Phase 3: Backend API — Settings Module

> **Goal:** Build the Settings API so the user can configure their salary, categories, and fixed deductions.
> **This is built first because all other features depend on settings data.**

### Module 3.1: Settings Controller
- Create `server/controllers/settingsController.js`
- Implement `getSettings()`:
  - Find the single settings document
  - If none exists, return a default empty structure
- Implement `updateSettings()`:
  - Validate input (salary > 0, salaryCreditDate 1–31, categories non-empty)
  - Upsert the settings document (create if first time, update if exists)
  - Return the updated document

### Module 3.2: Settings Routes
- Create `server/routes/settingsRoutes.js`
- Define routes:
  - `GET /api/settings` → `settingsController.getSettings`
  - `PUT /api/settings` → `settingsController.updateSettings`
- Mount routes in `server.js` under `/api/settings`

### Module 3.3: Error Handling Middleware
- Create `server/middleware/errorHandler.js`
- Centralized error handler: catches errors, returns JSON with status code and message
- Add to `server.js` as the last middleware

### Module 3.4: CORS & Middleware Setup
- Configure CORS in `server.js` (allow `CLIENT_ORIGIN` from env)
- Add `express.json()` middleware for parsing request bodies
- Add the error handler middleware

### Module 3.5: Test Settings API
- Use curl or Postman to test:
  - `PUT /api/settings` — send full settings object → verify 200 response
  - `GET /api/settings` — verify saved data comes back correctly
  - `PUT /api/settings` with invalid data → verify 400 error response
- Check MongoDB Atlas to confirm the document exists

**Phase 3 Deliverable:** Settings API fully working. Can save and retrieve salary, categories, and deductions.

---

## Phase 4: Backend API — Expenses Module

> **Goal:** Build the Expenses CRUD API. This is the core of the application — logging daily expenses.

### Module 4.1: Expense Controller
- Create `server/controllers/expenseController.js`
- Implement `getExpenses()`:
  - Read `month` and `year` from query parameters
  - Find all expenses matching that month/year
  - Sort by date descending
  - Return array
- Implement `addExpense()`:
  - Validate input (amount > 0, category non-empty, date valid, description 1–200 chars)
  - Extract `month` and `year` from the `date` field automatically
  - Save to database
  - Return created document
- Implement `updateExpense()`:
  - Find by ID (return 404 if not found)
  - Validate updated fields
  - Recalculate month/year if date changed
  - Save and return updated document
- Implement `deleteExpense()`:
  - Find by ID (return 404 if not found)
  - Delete and return success message

### Module 4.2: Expense Routes
- Create `server/routes/expenseRoutes.js`
- Define routes:
  - `GET /api/expenses` → `expenseController.getExpenses`
  - `POST /api/expenses` → `expenseController.addExpense`
  - `PUT /api/expenses/:id` → `expenseController.updateExpense`
  - `DELETE /api/expenses/:id` → `expenseController.deleteExpense`
- Mount routes in `server.js` under `/api/expenses`

### Module 4.3: Test Expenses API
- Use curl or Postman to test all 4 operations:
  - `POST` — create 3-4 sample expenses with different categories and dates
  - `GET ?month=2&year=2026` — verify filtered results
  - `PUT /:id` — update an expense's amount → verify change
  - `DELETE /:id` — delete an expense → verify removal
  - Test validation: POST with amount = 0, missing category → verify 400 errors

**Phase 4 Deliverable:** Full CRUD for expenses. Can create, read, update, and delete expense entries.

---

## Phase 5: Backend API — Reports Module

> **Goal:** Build the reporting/calculation engine. This is where the business logic lives —
> calculating remaining budgets, savings, and generating monthly summaries.

### Module 5.1: Report Controller — Current Month Report
- Create `server/controllers/reportController.js`
- Implement `getCurrentReport()`:
  - Fetch settings (salary, categories, fixed deductions)
  - Determine current month/year (using salary credit date logic)
  - Aggregate all expenses for the current month grouped by category
  - For each category: calculate spent, remaining, percentUsed
  - Calculate: distributableAmount, totalSpent, currentSavings
  - Return the live computed summary (not stored)

### Module 5.2: Report Controller — Monthly & History Reports
- Implement `getMonthlyReport()`:
  - Accept month and year from query params
  - Check if a summary exists in `monthly_summaries` collection
  - If yes, return it
  - If no, compute from expenses + settings, save to `monthly_summaries`, return it
- Implement `getReportHistory()`:
  - Fetch all documents from `monthly_summaries`
  - Sort by year descending, then month descending
  - Return array

### Module 5.3: Month Cycle Detection Logic
- Implement helper function: `getCurrentMonthCycle(salaryCreditDate)`
  - If today >= salaryCreditDate → return { month: current month, year: current year }
  - If today < salaryCreditDate → return { month: previous month, year: adjusted }
  - Handle January edge case (previous month = December of previous year)

### Module 5.4: Report Routes
- Create `server/routes/reportRoutes.js`
- Define routes:
  - `GET /api/reports/current` → `reportController.getCurrentReport`
  - `GET /api/reports/monthly` → `reportController.getMonthlyReport`
  - `GET /api/reports/history` → `reportController.getReportHistory`
- Mount routes in `server.js` under `/api/reports`

### Module 5.5: Test Reports API
- Ensure sample expenses and settings exist from previous phases
- Test:
  - `GET /api/reports/current` — verify calculated fields (spent, remaining, savings)
  - `GET /api/reports/monthly?month=2&year=2026` — verify summary generation
  - `GET /api/reports/history` — verify array of past summaries
  - Verify math: salary - fixedDeductions - expenses = savings

**Phase 5 Deliverable:** Complete backend. All 8 API endpoints working with correct business logic.

---

## Phase 6: Frontend — Foundation & Layout

> **Goal:** Set up the React app structure, routing, navigation, and shared layout.
> **No API calls yet — just the skeleton and navigation.**

### Module 6.1: Project Cleanup & Base Setup
- Remove Vite default boilerplate (App.css content, logo, default markup)
- Set up Tailwind CSS imports in `index.css`
- Define color scheme / design tokens (primary, success-green, warning-yellow, danger-red)
- Set up base font and global styles

### Module 6.2: Routing Setup
- Install and configure React Router in `App.jsx`
- Define 5 routes: `/`, `/add`, `/history`, `/settings`, `/reports`
- Create placeholder page components (just a heading for now):
  - `src/pages/Dashboard.jsx`
  - `src/pages/AddExpense.jsx`
  - `src/pages/ExpenseHistory.jsx`
  - `src/pages/Settings.jsx`
  - `src/pages/MonthlyReports.jsx`

### Module 6.3: Navbar Component
- Create `src/components/Navbar.jsx`
- Navigation links to all 5 pages
- Active page highlighting (using React Router's `NavLink`)
- Responsive: hamburger menu on mobile, full links on desktop
- App title/logo: "Finance Manager"

### Module 6.4: Layout Wrapper
- Create a layout structure in `App.jsx`:
  - Navbar (top, fixed)
  - Main content area (below navbar, with padding)
- Verify: clicking each nav link shows the correct placeholder page

**Phase 6 Deliverable:** React app with 5 routes, working navigation, and responsive layout.

---

## Phase 7: Frontend — API Service Layer

> **Goal:** Create the functions that call the backend API. These will be used by all page components.
> **Build this layer before the pages so pages can simply call these functions.**

### Module 7.1: Axios Configuration
- Create `src/services/api.js`
- Configure Axios instance with `baseURL` from `VITE_API_BASE_URL`
- Set default headers (`Content-Type: application/json`)

### Module 7.2: Settings Service
- Create `src/services/settingsService.js`
- Functions:
  - `getSettings()` → GET `/api/settings`
  - `updateSettings(data)` → PUT `/api/settings`

### Module 7.3: Expense Service
- Create `src/services/expenseService.js`
- Functions:
  - `getExpenses(month, year)` → GET `/api/expenses?month=M&year=Y`
  - `addExpense(data)` → POST `/api/expenses`
  - `updateExpense(id, data)` → PUT `/api/expenses/:id`
  - `deleteExpense(id)` → DELETE `/api/expenses/:id`

### Module 7.4: Report Service
- Create `src/services/reportService.js`
- Functions:
  - `getCurrentReport()` → GET `/api/reports/current`
  - `getMonthlyReport(month, year)` → GET `/api/reports/monthly?month=M&year=Y`
  - `getReportHistory()` → GET `/api/reports/history`

### Module 7.5: Utility Functions
- Create `src/utils/formatCurrency.js`:
  - Format numbers as INR: `₹1,500` (using `Intl.NumberFormat('en-IN')`)
- Create `src/utils/dateHelpers.js`:
  - `getMonthName(monthNumber)` → "January", "February", etc.
  - `formatDate(dateString)` → "5 Feb 2026"
  - `getTodayString()` → "2026-02-08" (for date input default)

**Phase 7 Deliverable:** Complete API service layer. Every backend endpoint has a corresponding frontend function.

---

## Phase 8: Frontend — Settings Page

> **Goal:** Build the Settings page first because the user needs to configure salary and categories
> before they can log any expenses. This is the app's "first run" experience.

### Module 8.1: Settings Page — Salary Section
- Build the salary configuration form:
  - Input: Monthly salary amount (number, required)
  - Input: Salary credit date (number, 1–31)
  - Load existing settings on page mount (`useEffect` + `getSettings()`)
  - Save button

### Module 8.2: Settings Page — Fixed Deductions Section
- Build the fixed deductions list:
  - Display existing deductions (name, amount, date)
  - "Add Deduction" button → shows inline form (name, amount, date)
  - Delete button on each deduction
  - All changes are part of the same settings object

### Module 8.3: Settings Page — Categories Section
- Build the categories list:
  - Display existing categories (name, monthly limit)
  - "Add Category" button → shows inline form (name, limit)
  - Delete button on each category (with confirmation)
  - Edit button to modify name or limit

### Module 8.4: Settings Page — Save & Validation
- Combine all sections into one save operation (`updateSettings()`)
- Client-side validation:
  - Salary must be > 0
  - At least one category required
  - Category names must be unique
  - All amounts must be > 0
- Show success message on save
- Show error messages for validation failures

### Module 8.5: Test Settings Page End-to-End
- Open the app → go to Settings
- Enter salary, credit date, add a deduction (Bike EMI), add 3 categories
- Save → verify success
- Refresh page → verify data persists (loaded from API)
- Check MongoDB Atlas → verify the settings document

**Phase 8 Deliverable:** Fully functional Settings page. User can configure their entire budget.

---

## Phase 9: Frontend — Add Expense Page

> **Goal:** Build the expense logging form. This is the page the user will use most frequently.

### Module 9.1: Expense Form Component
- Create `src/components/ExpenseForm.jsx`
- Form fields:
  - Date picker (defaults to today)
  - Category dropdown (populated from settings)
  - Amount input (number, required, > 0)
  - Description input (text, required, max 200 chars)
- Submit button

### Module 9.2: Add Expense Page
- Create `src/pages/AddExpense.jsx`
- On mount: fetch settings to get category list for dropdown
- On submit:
  - Validate all fields (client-side)
  - Call `addExpense(data)`
  - On success: show confirmation, redirect to Dashboard
  - On error: show error message

### Module 9.3: Form Validation & UX
- Inline validation messages (red text below each field)
- Disable submit button while request is in progress (prevent double-submit)
- Clear form after successful submission
- "Cancel" button → navigates back to Dashboard

### Module 9.4: Test Add Expense End-to-End
- Go to Add Expense page
- Verify categories appear in dropdown (from settings)
- Add an expense → verify redirect to Dashboard
- Try submitting with empty fields → verify validation errors
- Check MongoDB Atlas → verify expense document created with correct month/year

**Phase 9 Deliverable:** Users can log expenses with date, category, amount, and description.

---

## Phase 10: Frontend — Dashboard Page

> **Goal:** Build the main dashboard — the first thing the user sees. Shows the financial overview.

### Module 10.1: Summary Bar Component
- Create `src/components/SummaryBar.jsx`
- Display 3 key numbers in a horizontal bar:
  - Total Salary (this month)
  - Total Spent (so far)
  - Current Savings (salary - spent)
- Color-coded: savings in green if positive, red if negative

### Module 10.2: Category Card Component
- Create `src/components/CategoryCard.jsx`
- Each card shows:
  - Category name
  - Budget limit (formatted as INR)
  - Amount spent (formatted as INR)
  - Amount remaining (formatted as INR)
  - Progress bar (visual percentage)
- Color logic:
  - 0–70% used → Green
  - 70–100% used → Yellow/Orange
  - 100%+ used → Red (overspent)

### Module 10.3: Progress Bar Component
- Create `src/components/ProgressBar.jsx`
- Takes: `percentUsed`, `isOverBudget`
- Visual: horizontal bar that fills based on percentage
- Color transitions: green → yellow → red

### Module 10.4: Dashboard Page Assembly
- Create `src/pages/Dashboard.jsx`
- On mount: call `getCurrentReport()` to fetch live data
- Display:
  - Current month and year heading
  - SummaryBar (salary, spent, savings)
  - Grid of CategoryCards (one per category)
  - Fixed deductions section (showing Bike EMI etc.)
  - "Add Expense" button (navigates to `/add`)
- Loading state while API call is in progress
- Error state if API fails

### Module 10.5: Test Dashboard End-to-End
- Ensure settings are configured and some expenses exist
- Open Dashboard → verify all numbers are correct
- Add a new expense → return to Dashboard → verify numbers updated
- Test with no expenses → verify zero spent, full remaining
- Test overspending scenario → verify red indicators

**Phase 10 Deliverable:** Dashboard shows live financial overview with visual budget tracking.

---

## Phase 11: Frontend — Expense History Page

> **Goal:** Build the page to view, filter, edit, and delete past expenses.

### Module 11.1: Expense Table Component
- Create `src/components/ExpenseTable.jsx`
- Table columns: Date, Category, Description, Amount, Actions
- Format date and amount properly
- Action buttons: Edit (pencil icon), Delete (trash icon)

### Module 11.2: Expense History Page — List & Filter
- Create `src/pages/ExpenseHistory.jsx`
- On mount: fetch expenses for current month (`getExpenses(month, year)`)
- Category filter: dropdown to show only one category's expenses
- Sort: by date (newest first by default) or by amount
- Show total at the bottom of the table

### Module 11.3: Edit Expense Functionality
- Click Edit → row becomes editable (inline edit or modal)
- User can change: date, category, amount, description
- Save → calls `updateExpense(id, data)`
- Cancel → reverts to original values
- Update table row on success

### Module 11.4: Delete Expense Functionality
- Click Delete → show confirmation dialog ("Are you sure?")
- On confirm → call `deleteExpense(id)`
- Remove row from table on success
- Show success message

### Module 11.5: Test Expense History End-to-End
- View all expenses for the current month
- Filter by category → verify filtered results
- Edit an expense → verify update reflects on Dashboard
- Delete an expense → verify removal from table and Dashboard

**Phase 11 Deliverable:** Users can view, filter, sort, edit, and delete their expense entries.

---

## Phase 12: Frontend — Monthly Reports Page

> **Goal:** Build the historical reports view for comparing past months.

### Module 12.1: Month Selector Component
- Dropdown or list to select past months
- Shows: "January 2026", "December 2025", etc.
- Populated from `getReportHistory()`

### Module 12.2: Monthly Reports Page
- Create `src/pages/MonthlyReports.jsx`
- On mount: fetch report history
- On month selection: fetch that month's detailed report
- Display: same SummaryBar and CategoryCards as Dashboard (reused) but with historical data
- Show comparison: "You saved ₹X this month" for each past month

### Module 12.3: Test Monthly Reports
- Ensure at least 1–2 months of data exist
- Select a past month → verify data displays correctly
- Verify monthly summary gets stored in `monthly_summaries` collection

**Phase 12 Deliverable:** Users can browse past months and see how much they saved.

---

## Phase 13: Polish & User Experience

> **Goal:** Improve the overall look, feel, and usability of the application.

### Module 13.1: Loading States
- Add loading spinners/skeletons for all API calls
- Dashboard: skeleton cards while loading
- Tables: loading indicator while fetching

### Module 13.2: Empty States
- Dashboard with no settings: "Welcome! Set up your budget in Settings →"
- Dashboard with no expenses: "No expenses this month. Tap + to add one."
- Expense History with no data: "No expenses found for this month."

### Module 13.3: Toast Notifications
- Success: "Expense added successfully"
- Error: "Failed to save. Please try again."
- Warning: "You've exceeded your Personal Expenses budget!"

### Module 13.4: Mobile Responsiveness
- Test and optimize for mobile screens (360px and up)
- Touch-friendly buttons and inputs
- Responsive grid: cards stack vertically on mobile, grid on desktop

### Module 13.5: Final UI Review
- Consistent spacing, fonts, and colors across all pages
- All buttons have hover/active states
- Forms are clean and easy to use
- No broken layouts at any screen size

**Phase 13 Deliverable:** Polished, responsive, user-friendly application.

---

## Phase 14: Testing & Bug Fixes

> **Goal:** Test the entire application end-to-end and fix any bugs found.

### Module 14.1: Backend API Testing
- Test all 8 endpoints with valid and invalid inputs
- Test edge cases:
  - What happens if no settings exist when adding an expense?
  - What if salary credit date is 31 and month has 30 days?
  - What if an expense date is on the salary credit date itself?

### Module 14.2: Frontend Flow Testing
- Complete user journey:
  1. First visit → Settings → configure salary and categories
  2. Add 5–6 expenses across different categories
  3. Check Dashboard → verify all numbers
  4. Edit one expense → verify Dashboard updates
  5. Delete one expense → verify Dashboard updates
  6. View Reports → verify monthly summary
- Test on Chrome, Firefox, and mobile browser

### Module 14.3: Bug Fixes
- Fix any issues discovered during testing
- Verify fixes don't break other functionality

**Phase 14 Deliverable:** Fully tested, bug-free application.

---

## Phase 15: Deployment

> **Goal:** Deploy the application to production — accessible from anywhere via a URL.

### Module 15.1: Backend Deployment (Render)
- Create a Render account
- Connect the GitHub repository
- Create a new Web Service:
  - Build command: `cd server && npm install`
  - Start command: `cd server && npm start`
- Add environment variables:
  - `MONGODB_URI` (Atlas connection string)
  - `CLIENT_ORIGIN` (GitHub Pages URL)
  - `NODE_ENV=production`
  - `PORT=5000`
- Deploy and verify the API is accessible via Render URL
- Test: `curl https://your-app.onrender.com/api/settings`

### Module 15.2: Frontend Deployment (GitHub Pages)
- Update `VITE_API_BASE_URL` in client `.env.production` to Render URL
- Build the React app: `npm run build`
- Deploy `dist/` to GitHub Pages:
  - Option A: Use `gh-pages` npm package
  - Option B: Push to `gh-pages` branch manually
- Verify: open `https://<username>.github.io/finance-management/`

### Module 15.3: Production Verification
- Open the live frontend URL
- Test the full flow:
  - Configure settings → Add expenses → Check Dashboard → View reports
- Verify CORS works (frontend on GitHub Pages → backend on Render)
- Verify MongoDB Atlas receives data from the production backend

### Module 15.4: MongoDB Atlas Production Config
- Whitelist Render's outbound IP (or keep `0.0.0.0/0` for free tier)
- Verify database user permissions
- Check Atlas monitoring for connections and operations

**Phase 15 Deliverable:** Application live and accessible on the internet.

---

## Phase 16: Documentation & Handover

> **Goal:** Finalize all documentation so anyone can understand, run, and maintain the project.

### Module 16.1: README.md
- Project description
- Live demo link (GitHub Pages URL)
- Tech stack
- Setup instructions (clone, install, configure, run)
- Screenshots of the application

### Module 16.2: Code Comments
- Add comments to complex business logic (report calculations, month cycle detection)
- No unnecessary comments on self-explanatory code

### Module 16.3: Final Commit & Push
- Ensure all code is committed
- Push to main branch
- Verify GitHub repository looks clean and professional

**Phase 16 Deliverable:** Project is complete, documented, and ready for presentation.

---

## Summary: Full Module Count

| Phase | Name                          | Modules | Description                         |
|-------|-------------------------------|---------|-------------------------------------|
| 1     | Project Setup                 | 6       | Environment, scaffolding, MongoDB   |
| 2     | Database Models               | 4       | Mongoose schemas & verification     |
| 3     | Settings API                  | 5       | Backend settings CRUD               |
| 4     | Expenses API                  | 3       | Backend expenses CRUD               |
| 5     | Reports API                   | 5       | Backend calculations & summaries    |
| 6     | Frontend Foundation           | 4       | React setup, routing, navbar        |
| 7     | API Service Layer             | 5       | Frontend-to-backend connection      |
| 8     | Settings Page                 | 5       | UI for budget configuration         |
| 9     | Add Expense Page              | 4       | UI for logging expenses             |
| 10    | Dashboard Page                | 5       | Main overview with budget cards     |
| 11    | Expense History Page          | 5       | View, filter, edit, delete expenses |
| 12    | Monthly Reports Page          | 3       | Historical comparison               |
| 13    | UI Polish                     | 5       | Loading, empty states, responsive   |
| 14    | Testing                       | 3       | End-to-end testing & bug fixes      |
| 15    | Deployment                    | 4       | Render + GitHub Pages + Atlas       |
| 16    | Documentation                 | 3       | README, comments, final push        |
| **Total** |                           | **69**  | **Complete project delivery**       |

---

## How We'll Work Through This

```
You say: "Let's start Phase 1"
   → I build Module 1.1, then 1.2, then 1.3... sequentially
   → At the end of the phase, we verify everything works
   → You say: "Move to Phase 2"
   → And so on...
```

Each phase builds on the previous one. No phase is skipped. No module is started until its predecessor is complete. This is how professional software teams deliver projects — **one brick at a time.**
