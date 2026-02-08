# Finance Management Application — Frontend Documentation

**Version:** 1.0
**Last Updated:** February 8, 2026
**Audience:** Engineering Leadership, Product Stakeholders, Frontend Contributors
**Status:** Production-Ready Specification

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Project Structure](#3-project-structure)
4. [Pages and Routes](#4-pages-and-routes)
5. [Component Specifications](#5-component-specifications)
6. [Service Layer](#6-service-layer)
7. [Utility Functions](#7-utility-functions)
8. [Styling Strategy](#8-styling-strategy)
9. [Form Validation](#9-form-validation)
10. [Error Handling and UX](#10-error-handling-and-ux)
11. [Build and Deployment](#11-build-and-deployment)
12. [Performance Considerations](#12-performance-considerations)
13. [Browser Compatibility](#13-browser-compatibility)
14. [Security Considerations](#14-security-considerations)

---

## 1. Overview

### Purpose

The Finance Management frontend is a single-page application (SPA) that provides a personal finance tracking interface for salaried individuals. It implements a digital envelope budgeting system: users allocate their monthly salary across spending categories, log expenses in real time, and monitor remaining budgets and savings at a glance.

The application is designed for a single user operating on a mobile device (primary use case: logging expenses on-the-go from a phone) as well as desktop browsers.

### Technology Stack

| Technology       | Version | Role                                      |
|------------------|---------|-------------------------------------------|
| React            | 18.x    | Component-based UI library                |
| Vite             | 5.x     | Build tool, development server, bundler   |
| Tailwind CSS     | 3.x     | Utility-first CSS framework               |
| React Router     | 6.x     | Client-side routing and navigation        |
| Axios            | 1.x     | HTTP client for REST API communication    |

### Key Characteristics

- **Static deployment** — Built output is a set of static files hosted on GitHub Pages at zero cost.
- **API-driven** — All persistent data operations go through a Node.js/Express REST API hosted separately on Render.
- **INR-native** — All monetary values are displayed in Indian Rupees with proper formatting.
- **Mobile-first** — Responsive design prioritizes the phone viewport since the primary use case is logging expenses on the go.

---

## 2. Architecture

### 2.1 Component Architecture Diagram

```
App.jsx (Root)
│
├── <BrowserRouter>
│   │
│   ├── <Navbar />                          ← Persistent across all routes
│   │
│   └── <Routes>
│       │
│       ├── Route: "/"
│       │   └── <Dashboard />
│       │       ├── <SummaryBar />           ← Salary, total spent, savings
│       │       ├── <CategoryCard />[]       ← One per budget category
│       │       │   └── <ProgressBar />      ← Visual budget usage indicator
│       │       └── <Link to="/add" />       ← "Add Expense" navigation button
│       │
│       ├── Route: "/add"
│       │   └── <AddExpense />
│       │       └── <ExpenseForm />          ← Date, category, amount, description
│       │
│       ├── Route: "/history"
│       │   └── <ExpenseHistory />
│       │       └── <ExpenseTable />         ← Filterable, sortable expense list
│       │
│       ├── Route: "/settings"
│       │   └── <Settings />
│       │       ├── Salary Configuration     ← Amount and credit date
│       │       ├── Fixed Deductions List    ← CRUD for recurring deductions
│       │       └── Categories List          ← CRUD for budget categories
│       │
│       └── Route: "/reports"
│           └── <MonthlyReports />
│               ├── Month Selector           ← Dropdown for past months
│               └── <SummaryBar />           ← Reused for selected month's data
```

### 2.2 Data Flow

The application follows a unidirectional data flow pattern from user interaction through to screen update:

```
User Interaction
       │
       ▼
Page Component (event handler)
       │
       ▼
Service Layer (Axios HTTP call)
       │
       ▼
REST API (Node.js/Express backend)
       │
       ▼
API Response (JSON payload)
       │
       ▼
Component State Update (useState setter)
       │
       ▼
React Re-render (updated UI)
```

**Detailed flow for a typical expense submission:**

```
1. User fills in the expense form fields
2. User clicks "Submit"
3. AddExpense page component invokes the onSubmit handler
4. Handler calls expenseService.addExpense(formData)
5. Axios sends POST /api/expenses with the form data as JSON
6. Backend validates, saves to MongoDB, returns the created expense
7. Service layer returns the response to the component
8. Component navigates to Dashboard via React Router
9. Dashboard mounts and calls reportService.getCurrentReport()
10. API aggregates current month expenses, returns live summary
11. Dashboard updates local state with the summary
12. React re-renders SummaryBar and CategoryCard components with fresh data
```

### 2.3 State Management Approach

The application uses React's built-in state primitives exclusively:

| Mechanism       | Usage                                                                 |
|-----------------|-----------------------------------------------------------------------|
| `useState`      | Local component state for form inputs, API response data, UI toggles  |
| `useEffect`     | Side effects — API calls on mount, data fetching on dependency change |
| Prop drilling   | Parent-to-child data flow for reusable components                     |

**Why no Redux or Context API?**

This is a single-user, five-page application with no shared global state requirements. Each page fetches its own data on mount, and the reusable components receive data through props. Introducing a state management library would add complexity without a corresponding benefit at this scale. If the application grows to include features such as real-time collaboration, multi-tab synchronization, or deeply nested component trees sharing state, a centralized store should be re-evaluated.

---

## 3. Project Structure

```
client/
│
├── public/
│   └── index.html                     # HTML shell — single <div id="root"> mount point
│
├── src/
│   │
│   ├── components/                    # Reusable, presentation-focused UI components
│   │   ├── Navbar.jsx                 # Top navigation bar with route links
│   │   ├── CategoryCard.jsx           # Single category budget status card
│   │   ├── ProgressBar.jsx            # Horizontal bar indicating budget usage percentage
│   │   ├── ExpenseForm.jsx            # Form with date, category, amount, description fields
│   │   ├── ExpenseTable.jsx           # Sortable, filterable table of expense records
│   │   └── SummaryBar.jsx             # Top-level financial overview (salary, spent, savings)
│   │
│   ├── pages/                         # Route-level container components (one per route)
│   │   ├── Dashboard.jsx              # Home page — current month overview with category cards
│   │   ├── AddExpense.jsx             # Expense entry page wrapping ExpenseForm
│   │   ├── ExpenseHistory.jsx         # Expense list page wrapping ExpenseTable
│   │   ├── Settings.jsx               # Budget configuration page (salary, deductions, categories)
│   │   └── MonthlyReports.jsx         # Historical reports page with month selector
│   │
│   ├── services/                      # API integration layer — one file per backend resource
│   │   ├── settingsService.js         # GET/PUT operations for budget settings
│   │   ├── expenseService.js          # CRUD operations for individual expenses
│   │   └── reportService.js           # Read-only operations for financial summaries
│   │
│   ├── utils/                         # Pure helper functions with no side effects
│   │   ├── formatCurrency.js          # INR currency formatting with locale-aware output
│   │   └── dateHelpers.js             # Month detection logic, date formatting utilities
│   │
│   ├── App.jsx                        # Root component — defines route structure, renders Navbar
│   ├── main.jsx                       # Application entry point — renders App into DOM
│   └── index.css                      # Global stylesheet — Tailwind directives and base resets
│
├── package.json                       # Dependencies, scripts, project metadata
├── vite.config.js                     # Vite build configuration (base path, plugins)
└── tailwind.config.js                 # Tailwind CSS configuration (theme, content paths)
```

### Directory Responsibilities

| Directory      | Responsibility                                                                                             |
|----------------|------------------------------------------------------------------------------------------------------------|
| `public/`      | Static assets served as-is. Contains the HTML shell that Vite injects the bundled JavaScript into.          |
| `src/components/` | Reusable UI building blocks. These components receive data via props and do not make API calls directly. |
| `src/pages/`   | Route-level containers. Each page component orchestrates data fetching, manages local state, and composes reusable components. |
| `src/services/` | Axios-based functions that encapsulate HTTP requests. Isolates API concerns from component logic.          |
| `src/utils/`   | Stateless utility functions for formatting and date calculations. No React dependencies.                    |

---

## 4. Pages and Routes

### Route Configuration

```jsx
// App.jsx — Route Definitions
<BrowserRouter basename="/finance-management">
  <Navbar />
  <Routes>
    <Route path="/"         element={<Dashboard />}       />
    <Route path="/add"      element={<AddExpense />}       />
    <Route path="/history"  element={<ExpenseHistory />}   />
    <Route path="/settings" element={<Settings />}         />
    <Route path="/reports"  element={<MonthlyReports />}   />
  </Routes>
</BrowserRouter>
```

---

### 4.1 Dashboard (`/`)

**Purpose:** The landing page. Provides an at-a-glance financial overview of the current budget month.

**Data Fetched on Mount:**

| API Call                              | Data Returned                                                       |
|---------------------------------------|---------------------------------------------------------------------|
| `reportService.getCurrentReport()`    | Salary, fixed deductions total, per-category breakdown (limit, spent, remaining, percentUsed), total spent, current savings |

**Components Used:**

| Component        | Data Received                                      |
|------------------|-----------------------------------------------------|
| `SummaryBar`     | `salary`, `totalSpent`, `currentSavings`            |
| `CategoryCard[]` | `name`, `limit`, `spent`, `remaining`, `percentUsed` (one card per category) |
| `ProgressBar`    | `percentUsed`, `isOverBudget` (embedded inside each CategoryCard)    |

**Layout:**

```
┌──────────────────────────────────────────┐
│              SummaryBar                   │
│   Salary: ₹30,000  |  Spent: ₹8,050     │
│   Savings: ₹21,950                       │
├──────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐        │
│  │ CategoryCard │  │ CategoryCard │       │
│  │ Mother's     │  │ Personal    │        │
│  │ Allowance    │  │ Expenses    │        │
│  │ ████████░░░░ │  │ ██████░░░░░ │       │
│  │ ₹3,000 left  │  │ ₹2,250 left │       │
│  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐                          │
│  │ CategoryCard │                         │
│  │ Misc.        │                         │
│  │ ████░░░░░░░ │                          │
│  │ ₹1,200 left  │                         │
│  └─────────────┘                          │
│                                            │
│         [ + Add Expense ]                  │
└──────────────────────────────────────────┘
```

**UX Behavior:**

- On mount, a loading spinner is displayed while the API call resolves.
- If the API is unreachable, a fallback message is shown with a retry button.
- Category cards display a color-coded progress bar: green (0-74%), yellow (75-99%), red (100%+).
- The "Add Expense" button navigates to `/add`.
- The current month and year are displayed in the header area (e.g., "February 2026").

---

### 4.2 AddExpense (`/add`)

**Purpose:** Allows the user to log a new expense against a budget category.

**Data Fetched on Mount:**

| API Call                           | Data Returned                                   |
|------------------------------------|-------------------------------------------------|
| `settingsService.getSettings()`    | List of categories (to populate the dropdown)   |

**Form Fields:**

| Field         | Input Type | Default Value | Validation                                     |
|---------------|------------|---------------|------------------------------------------------|
| Date          | Date picker| Today's date  | Required; must not be in the future            |
| Category      | Dropdown   | First option  | Required; must select a valid category         |
| Amount        | Number     | Empty         | Required; must be greater than 0               |
| Description   | Text       | Empty         | Required; 1-200 characters                     |

**Submission Flow:**

```
1. User fills all form fields
2. Client-side validation runs on submit
3. If validation fails → inline error messages appear below invalid fields
4. If validation passes → expenseService.addExpense(formData) is called
5. Submit button shows a loading state (disabled, spinner)
6. On success → toast notification "Expense added successfully"
                 → navigate to Dashboard ("/")
7. On API error → toast notification with error message
                   → form remains populated so user can retry
```

**Success/Error Handling:**

- Success: Green toast notification, automatic redirect to Dashboard.
- Validation error: Red inline text below the offending field. Form is not submitted.
- API error (400): Toast displays the server's validation message.
- API error (500): Toast displays "Something went wrong. Please try again."
- Network error: Toast displays "Unable to reach the server. Check your connection."

---

### 4.3 ExpenseHistory (`/history`)

**Purpose:** Displays a complete list of all expenses for the current month with filtering, sorting, editing, and deletion capabilities.

**Data Fetched on Mount:**

| API Call                                           | Data Returned                       |
|----------------------------------------------------|-------------------------------------|
| `expenseService.getExpenses(currentMonth, currentYear)` | Array of expense objects        |
| `settingsService.getSettings()`                    | Categories list (for filter dropdown) |

**Table Columns:**

| Column      | Data Field     | Sortable | Description                          |
|-------------|----------------|----------|--------------------------------------|
| Date        | `date`         | Yes      | Formatted as DD MMM YYYY             |
| Category    | `category`     | No       | Category name                        |
| Description | `description`  | No       | User-provided note                   |
| Amount      | `amount`       | Yes      | Formatted as INR (e.g., ₹500)        |
| Actions     | —              | No       | Edit and Delete icon buttons          |

**Filtering:**

- A dropdown above the table allows filtering by category.
- "All Categories" is the default selection showing all expenses.
- Selecting a specific category filters the table to show only matching rows.

**Sorting:**

- Clicking a sortable column header toggles between ascending and descending order.
- Default sort: date descending (most recent first).

**Edit Flow:**

```
1. User clicks the Edit icon on an expense row
2. The row transforms into inline editable fields (or a modal opens)
3. User modifies the values
4. User clicks Save → expenseService.updateExpense(id, updatedData)
5. On success → row updates in-place, toast notification
6. On error → toast notification, original values restored
```

**Delete Flow:**

```
1. User clicks the Delete icon on an expense row
2. A confirmation dialog appears: "Delete this expense of ₹500?"
3. User confirms → expenseService.deleteExpense(id)
4. On success → row removed from table, toast notification
5. On error → toast notification, row remains
```

**Empty State:** If no expenses exist for the current month, a message is shown: "No expenses logged this month. Start by adding your first expense." with a link to `/add`.

---

### 4.4 Settings (`/settings`)

**Purpose:** Allows the user to configure their monthly budget parameters: salary, salary credit date, fixed deductions, and spending categories.

**Data Fetched on Mount:**

| API Call                          | Data Returned                                                  |
|-----------------------------------|----------------------------------------------------------------|
| `settingsService.getSettings()`   | Salary amount, credit date, fixed deductions array, categories array |

**Sections:**

**A. Salary Configuration**

| Field              | Input Type | Validation                |
|--------------------|------------|---------------------------|
| Monthly Salary     | Number     | Required; greater than 0  |
| Salary Credit Date | Number     | Required; integer 1-31    |

**B. Fixed Deductions (CRUD)**

Each deduction is displayed as an editable row with a remove button:

| Field           | Input Type | Validation                |
|-----------------|------------|---------------------------|
| Deduction Name  | Text       | Required; non-empty       |
| Amount          | Number     | Required; greater than 0  |
| Deduction Date  | Number     | Required; integer 1-31    |

- An "Add Deduction" button appends a new empty row.
- A remove button on each row deletes that deduction.

**C. Budget Categories (CRUD)**

Each category is displayed as an editable row:

| Field          | Input Type | Validation                              |
|----------------|------------|-----------------------------------------|
| Category Name  | Text       | Required; non-empty; unique within list |
| Monthly Limit  | Number     | Required; greater than 0                |

- An "Add Category" button appends a new empty row.
- A remove button on each row deletes that category.
- Editing a category name that is already in use by logged expenses should trigger a warning.

**Save Flow:**

```
1. User modifies any settings fields
2. User clicks "Save Settings"
3. Client-side validation runs on the entire settings object
4. If valid → settingsService.updateSettings(settingsData)
5. On success → toast "Settings saved successfully"
6. On error → toast with error message, fields remain populated
```

**UX Considerations:**

- Settings carry forward month-to-month automatically on the backend.
- A summary line shows the distributable amount: `Salary - Total Fixed Deductions = Distributable Amount`.
- A warning is displayed if the sum of all category limits exceeds the distributable amount.

---

### 4.5 MonthlyReports (`/reports`)

**Purpose:** Provides historical financial summaries, allowing the user to view past months and compare spending patterns over time.

**Data Fetched on Mount:**

| API Call                             | Data Returned                                     |
|--------------------------------------|---------------------------------------------------|
| `reportService.getReportHistory()`   | Array of monthly summary objects (all past months) |

**Month Selector:**

- A dropdown populated with all months for which data exists.
- Selecting a month triggers `reportService.getMonthlyReport(month, year)`.
- The most recent completed month is selected by default.

**Data Display for Selected Month:**

| Data Point             | Source Field            | Display Format            |
|------------------------|-------------------------|---------------------------|
| Month and Year         | `month`, `year`         | "January 2026"            |
| Total Salary           | `salary`                | ₹30,000                   |
| Total Fixed Deductions | `totalFixedDeductions`  | ₹5,000                    |
| Category Breakdown     | `categoryBreakdown[]`   | Table with category, limit, spent |
| Total Spent            | `totalSpent`            | ₹12,700                   |
| Total Savings          | `totalSavings`          | ₹17,300                   |

**Comparison View:**

- When multiple months of data are available, a comparison table or summary is displayed:

```
┌──────────────┬──────────┬──────────┬──────────┐
│ Month        │ Salary   │ Spent    │ Saved    │
├──────────────┼──────────┼──────────┼──────────┤
│ Feb 2026     │ ₹30,000  │ ₹8,050   │ ₹21,950  │
│ Jan 2026     │ ₹30,000  │ ₹12,700  │ ₹17,300  │
│ Dec 2025     │ ₹28,000  │ ₹11,500  │ ₹16,500  │
└──────────────┴──────────┴──────────┴──────────┘
```

- This allows the user to understand spending patterns and savings trends across months.

**Empty State:** If no past month summaries exist, a message is shown: "No monthly reports available yet. Reports will appear after your first full month of usage."

---

## 5. Component Specifications

### 5.1 Navbar

**File:** `src/components/Navbar.jsx`

**Description:** A persistent top navigation bar rendered on every page. Provides links to all five routes and highlights the currently active page.

**Props Interface:**

| Prop   | Type   | Required | Description                          |
|--------|--------|----------|--------------------------------------|
| —      | —      | —        | No props. Uses `useLocation()` from React Router internally to determine the active route. |

**Behavior:**

- Renders five navigation links: Dashboard, Add Expense, History, Settings, Reports.
- The link matching the current route receives an active visual style (e.g., bold text, underline, or distinct background color).
- On mobile viewports, the navbar collapses into a hamburger menu or a bottom tab bar for thumb-friendly navigation.

**Visual States:**

| State    | Appearance                                              |
|----------|---------------------------------------------------------|
| Normal   | All links displayed in default text color               |
| Active   | Current route link is visually distinguished (bold/colored) |
| Mobile   | Collapsed or bottom-tab layout for small screens        |

---

### 5.2 CategoryCard

**File:** `src/components/CategoryCard.jsx`

**Description:** Displays the budget status for a single spending category, including the allocated limit, amount spent, amount remaining, and a visual progress indicator.

**Props Interface:**

| Prop          | Type    | Required | Description                                        |
|---------------|---------|----------|----------------------------------------------------|
| `name`        | string  | Yes      | Category name (e.g., "Personal Expenses")          |
| `limit`       | number  | Yes      | Monthly budget limit in INR                        |
| `spent`       | number  | Yes      | Total amount spent in this category this month     |
| `remaining`   | number  | Yes      | Limit minus spent (can be negative if overspent)   |
| `percentUsed` | number  | Yes      | Percentage of limit consumed (can exceed 100)      |

**Behavior:**

- Renders the category name as the card title.
- Displays limit, spent, and remaining amounts formatted as INR.
- Embeds a `ProgressBar` component to visually represent `percentUsed`.
- If `remaining` is negative, the remaining value is displayed in red with a warning indicator.

**Visual States:**

| State                          | Condition             | Appearance                                     |
|--------------------------------|-----------------------|------------------------------------------------|
| Normal (under budget)          | `percentUsed` < 75    | Green progress bar, standard text colors       |
| Warning (approaching limit)    | 75 <= `percentUsed` < 100 | Yellow/amber progress bar, cautionary text |
| Overspent (over budget)        | `percentUsed` >= 100  | Red progress bar, red remaining text, warning icon |

---

### 5.3 ProgressBar

**File:** `src/components/ProgressBar.jsx`

**Description:** A horizontal bar that visually indicates the percentage of a budget category that has been consumed. Changes color based on the usage level.

**Props Interface:**

| Prop           | Type    | Required | Description                                      |
|----------------|---------|----------|--------------------------------------------------|
| `percentUsed`  | number  | Yes      | Percentage of budget consumed (0 to 100+)        |
| `isOverBudget` | boolean | No       | If true, forces the bar to display in the red/error state. Defaults to `false`. |

**Behavior:**

- Renders a container div (full width, light gray background) with an inner filled div whose width corresponds to `percentUsed`, capped at 100% visually.
- Color transitions smoothly based on the percentage thresholds.
- If `percentUsed` exceeds 100, the bar fills completely and displays in red.

**Visual States:**

| State   | Condition                             | Fill Color          |
|---------|---------------------------------------|---------------------|
| Normal  | `percentUsed` < 75                    | Green (`bg-green-500`)  |
| Warning | 75 <= `percentUsed` < 100             | Yellow (`bg-yellow-500`) |
| Error   | `percentUsed` >= 100 or `isOverBudget` | Red (`bg-red-500`)      |

---

### 5.4 ExpenseForm

**File:** `src/components/ExpenseForm.jsx`

**Description:** A form component for entering expense details. Used on the AddExpense page and potentially as an inline edit form on ExpenseHistory.

**Props Interface:**

| Prop            | Type       | Required | Description                                                    |
|-----------------|------------|----------|----------------------------------------------------------------|
| `categories`    | string[]   | Yes      | Array of category names to populate the category dropdown      |
| `onSubmit`      | function   | Yes      | Callback invoked with form data object when validation passes  |
| `initialValues` | object     | No       | Pre-populated values for editing an existing expense. Shape: `{ date, category, amount, description }` |
| `isLoading`     | boolean    | No       | If true, the submit button shows a loading state and is disabled. Defaults to `false`. |

**Behavior:**

- Manages its own internal state for form field values using `useState`.
- On submission, runs client-side validation before invoking `onSubmit`.
- Displays inline error messages below fields that fail validation.
- The submit button is disabled while `isLoading` is true.
- Clears the form after a successful submission (when not in edit mode).

**Visual States:**

| State    | Appearance                                                 |
|----------|------------------------------------------------------------|
| Normal   | All fields with default styling, submit button enabled     |
| Error    | Invalid fields highlighted with red border, error text below |
| Loading  | Submit button shows spinner, all fields disabled            |

---

### 5.5 ExpenseTable

**File:** `src/components/ExpenseTable.jsx`

**Description:** A data table displaying expense records with sorting, category filtering, and row-level edit/delete actions.

**Props Interface:**

| Prop         | Type       | Required | Description                                                  |
|--------------|------------|----------|--------------------------------------------------------------|
| `expenses`   | object[]   | Yes      | Array of expense objects: `{ _id, date, category, amount, description }` |
| `categories` | string[]   | Yes      | Array of category names for the filter dropdown               |
| `onEdit`     | function   | Yes      | Callback invoked with `(id, updatedData)` when an expense is edited |
| `onDelete`   | function   | Yes      | Callback invoked with `(id)` when an expense deletion is confirmed |

**Behavior:**

- Renders a table with columns: Date, Category, Description, Amount, Actions.
- A category filter dropdown above the table filters displayed rows.
- Clicking a sortable column header (Date, Amount) toggles sort direction.
- The Edit action on a row opens inline editing or a pre-filled form.
- The Delete action on a row shows a confirmation dialog before proceeding.
- If the `expenses` array is empty, an empty state message is displayed instead of the table.

**Visual States:**

| State   | Appearance                                                  |
|---------|-------------------------------------------------------------|
| Normal  | Table with rows, filter dropdown, sortable column headers   |
| Empty   | Message: "No expenses found" with link to add expense       |
| Editing | One row transforms to editable inputs with Save/Cancel      |

---

### 5.6 SummaryBar

**File:** `src/components/SummaryBar.jsx`

**Description:** A top-level financial overview bar displaying the three key metrics: total salary, total spent, and current savings.

**Props Interface:**

| Prop            | Type   | Required | Description                                    |
|-----------------|--------|----------|------------------------------------------------|
| `salary`        | number | Yes      | Monthly salary amount in INR                   |
| `totalSpent`    | number | Yes      | Sum of all expenses and fixed deductions       |
| `savings`       | number | Yes      | Salary minus total spent                       |
| `month`         | string | No       | Display label for the month (e.g., "February 2026") |

**Behavior:**

- Renders three metric blocks side by side (or stacked on mobile).
- All monetary values are formatted using the `formatCurrency` utility.
- The savings value is color-coded: green if positive, red if negative.

**Visual States:**

| State            | Condition        | Savings Display                     |
|------------------|------------------|-------------------------------------|
| Positive savings | `savings` > 0    | Green text                          |
| Zero savings     | `savings` === 0  | Neutral/gray text                   |
| Negative savings | `savings` < 0    | Red text with warning indicator     |

---

## 6. Service Layer

The service layer abstracts all HTTP communication with the backend API. Each service file corresponds to a backend resource. All functions return Promises that resolve with the response data or reject with an error.

**Base Configuration:**

```javascript
// All services use a shared Axios instance
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  // e.g., "http://localhost:5000/api"
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000  // 10-second timeout
});
```

---

### 6.1 settingsService.js

| Function                    | HTTP Method | Endpoint          | Request Body                                                                 | Response Format                                                               |
|-----------------------------|-------------|-------------------|-----------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| `getSettings()`             | GET         | `/api/settings`   | None                                                                        | `{ salary, salaryCreditDate, fixedDeductions[], categories[] }`               |
| `updateSettings(data)`      | PUT         | `/api/settings`   | `{ salary: Number, salaryCreditDate: Number, fixedDeductions: Array, categories: Array }` | `{ salary, salaryCreditDate, fixedDeductions[], categories[], updatedAt }` |

**Usage Example:**

```javascript
import { getSettings, updateSettings } from '../services/settingsService';

// Fetching settings
const settings = await getSettings();
console.log(settings.salary);  // 30000

// Updating settings
await updateSettings({
  salary: 32000,
  salaryCreditDate: 3,
  fixedDeductions: [{ name: "Bike EMI", amount: 5000, deductionDate: 3 }],
  categories: [
    { name: "Personal Expenses", monthlyLimit: 3000, type: "variable" }
  ]
});
```

---

### 6.2 expenseService.js

| Function                        | HTTP Method | Endpoint               | Request Body / Params                                           | Response Format                                                |
|---------------------------------|-------------|------------------------|-----------------------------------------------------------------|----------------------------------------------------------------|
| `getExpenses(month, year)`      | GET         | `/api/expenses`        | Query params: `?month=M&year=Y`                                | `[{ _id, date, category, amount, description, month, year }]` |
| `addExpense(data)`              | POST        | `/api/expenses`        | `{ date: String, category: String, amount: Number, description: String }` | `{ _id, date, category, amount, description, month, year }` |
| `updateExpense(id, data)`       | PUT         | `/api/expenses/:id`    | `{ date: String, category: String, amount: Number, description: String }` | `{ _id, date, category, amount, description, month, year }` |
| `deleteExpense(id)`             | DELETE      | `/api/expenses/:id`    | None                                                            | `{ message: "Deleted" }`                                       |

**Usage Example:**

```javascript
import { getExpenses, addExpense, deleteExpense } from '../services/expenseService';

// Fetch current month expenses
const expenses = await getExpenses(2, 2026);

// Add a new expense
const newExpense = await addExpense({
  date: "2026-02-05",
  category: "Personal Expenses",
  amount: 500,
  description: "Dinner with friends"
});

// Delete an expense
await deleteExpense("65a1b2c3d4e5f6g7h8i9j0k1");
```

---

### 6.3 reportService.js

| Function                             | HTTP Method | Endpoint                 | Request Params                  | Response Format                                                                                      |
|--------------------------------------|-------------|--------------------------|--------------------------------|------------------------------------------------------------------------------------------------------|
| `getCurrentReport()`                 | GET         | `/api/reports/current`   | None                           | `{ month, year, salary, totalFixedDeductions, distributableAmount, categories[], totalBudgeted, totalSpent, currentSavings }` |
| `getMonthlyReport(month, year)`      | GET         | `/api/reports/monthly`   | Query: `?month=M&year=Y`      | `{ month, year, salary, totalFixedDeductions, categoryBreakdown[], totalSpent, totalSavings }`       |
| `getReportHistory()`                 | GET         | `/api/reports/history`   | None                           | `[{ month, year, salary, totalFixedDeductions, categoryBreakdown[], totalSpent, totalSavings }]`     |

**Usage Example:**

```javascript
import { getCurrentReport, getReportHistory } from '../services/reportService';

// Get live current month summary
const current = await getCurrentReport();
console.log(current.currentSavings);  // 21950

// Get all past month summaries for comparison view
const history = await getReportHistory();
// Returns array sorted by year desc, month desc
```

---

## 7. Utility Functions

### 7.1 formatCurrency.js

**Purpose:** Formats a numeric value into an Indian Rupee string with the INR locale conventions (lakh/crore grouping, two decimal places).

**Function Signature:**

```javascript
formatCurrency(amount: number): string
```

**Behavior:**

- Uses `Intl.NumberFormat` with locale `'en-IN'` and currency `'INR'`.
- Prepends the `₹` symbol.
- Applies Indian number grouping (e.g., 1,50,000 instead of 150,000).
- Handles negative values by prefixing a minus sign before the rupee symbol.

**Examples:**

| Input       | Output         |
|-------------|----------------|
| `500`       | `"₹500.00"`    |
| `30000`     | `"₹30,000.00"` |
| `150000`    | `"₹1,50,000.00"` |
| `-2500`     | `"-₹2,500.00"` |
| `0`         | `"₹0.00"`      |

---

### 7.2 dateHelpers.js

**Purpose:** Provides date-related utility functions, most importantly the month detection logic that determines which "budget month" a given date belongs to based on the salary credit date.

**Function Signatures:**

```javascript
getCurrentBudgetMonth(salaryCreditDate: number): { month: number, year: number }
```

**Month Detection Logic:**

The salary credit date determines the boundary between budget months. This is critical because the user's financial month does not necessarily align with the calendar month.

```
If today's date >= salaryCreditDate:
  → Current budget month = this calendar month and year

If today's date < salaryCreditDate:
  → Current budget month = previous calendar month
  → If current calendar month is January, roll back to December of the previous year
```

**Example (salary credit date = 3):**

| Today's Date   | Budget Month | Budget Year |
|----------------|-------------|-------------|
| February 5     | February    | 2026        |
| February 2     | January     | 2026        |
| January 1      | December    | 2025        |
| March 3        | March       | 2026        |

**Additional Date Functions:**

```javascript
formatDate(dateString: string): string
// Converts ISO date string to human-readable format
// "2026-02-05T00:00:00Z" → "05 Feb 2026"

getMonthName(monthNumber: number): string
// Converts month number to name
// 2 → "February"

getMonthYearLabel(month: number, year: number): string
// Generates display label
// (2, 2026) → "February 2026"
```

---

## 8. Styling Strategy

### 8.1 Framework: Tailwind CSS 3.x

The application uses Tailwind CSS as its sole styling approach. No custom CSS files are used beyond the `index.css` file that contains Tailwind's three directive imports.

```css
/* index.css */
@tailwind base;
@tailwind components;
@tailwind layer;
```

**Rationale for Tailwind:**

- Eliminates context-switching between CSS and JSX files.
- Utility classes are highly composable, reducing the need for custom classes.
- PurgeCSS (built into Tailwind) removes unused styles, keeping the production bundle small.
- Consistent spacing, sizing, and color scales across the entire application.

### 8.2 Responsive Design — Mobile-First

The primary use case is logging expenses from a phone. The design starts with the mobile layout and scales up for tablet and desktop viewports.

**Breakpoint Strategy:**

| Breakpoint | Tailwind Prefix | Target Device          | Min Width |
|------------|-----------------|------------------------|-----------|
| Default    | (none)          | Mobile phones          | 0px       |
| `sm`       | `sm:`           | Large phones           | 640px     |
| `md`       | `md:`           | Tablets                | 768px     |
| `lg`       | `lg:`           | Laptops / small desktops | 1024px  |
| `xl`       | `xl:`           | Large desktops         | 1280px    |

**Mobile-First Layout Patterns:**

- **Dashboard CategoryCards:** Single column on mobile, two-column grid on `md:` and above.
- **SummaryBar metrics:** Stacked vertically on mobile, horizontal row on `md:` and above.
- **ExpenseTable:** Horizontal scroll on mobile with fixed first column; full table on desktop.
- **Navbar:** Bottom tab bar or hamburger menu on mobile; horizontal top bar on desktop.
- **Forms:** Full-width inputs on mobile; constrained max-width on desktop.

### 8.3 Color Scheme for Budget Status

Budget status is communicated through a consistent, traffic-light color system:

| Status                  | Tailwind Classes                       | Semantic Meaning                       |
|-------------------------|----------------------------------------|----------------------------------------|
| Under budget (< 75%)   | `bg-green-500`, `text-green-700`       | Spending is well within limits         |
| Approaching limit (75-99%) | `bg-yellow-500`, `text-yellow-700` | Caution — nearing budget ceiling       |
| Over budget (>= 100%)  | `bg-red-500`, `text-red-700`           | Budget exceeded — overspending alert   |
| Positive savings        | `text-green-600`                       | Money saved this month                 |
| Negative savings        | `text-red-600`                         | Spending exceeded salary               |

### 8.4 General Design Tokens

| Element            | Style                                                   |
|--------------------|---------------------------------------------------------|
| Card containers    | `bg-white rounded-lg shadow-md p-4`                     |
| Page headings      | `text-2xl font-bold text-gray-800`                       |
| Body text          | `text-sm text-gray-600` (mobile), `text-base` (desktop) |
| Buttons (primary)  | `bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700` |
| Buttons (danger)   | `bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700` |
| Input fields       | `border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500` |
| Error text         | `text-sm text-red-600 mt-1`                              |

---

## 9. Form Validation

### 9.1 Validation Rules by Form

**Expense Form (AddExpense / Edit Expense)**

| Field         | Rule                                | Error Message                                    |
|---------------|-------------------------------------|--------------------------------------------------|
| Date          | Required                            | "Date is required"                               |
| Date          | Must not be in the future           | "Date cannot be in the future"                   |
| Category      | Required                            | "Please select a category"                       |
| Category      | Must match an existing category     | "Invalid category selected"                      |
| Amount        | Required                            | "Amount is required"                             |
| Amount        | Must be a number                    | "Amount must be a valid number"                  |
| Amount        | Must be greater than 0              | "Amount must be greater than zero"               |
| Description   | Required                            | "Description is required"                        |
| Description   | Maximum 200 characters              | "Description must be 200 characters or fewer"    |

**Settings Form**

| Field                    | Rule                                   | Error Message                                      |
|--------------------------|----------------------------------------|----------------------------------------------------|
| Salary                   | Required                               | "Salary is required"                               |
| Salary                   | Must be greater than 0                 | "Salary must be greater than zero"                 |
| Salary Credit Date       | Required                               | "Salary credit date is required"                   |
| Salary Credit Date       | Integer between 1 and 31              | "Must be a valid day of the month (1-31)"          |
| Deduction Name           | Required (if a deduction row exists)  | "Deduction name is required"                       |
| Deduction Amount         | Greater than 0                        | "Deduction amount must be greater than zero"       |
| Deduction Date           | Integer between 1 and 31             | "Must be a valid day of the month (1-31)"          |
| Category Name            | Required                              | "Category name is required"                        |
| Category Name            | Unique within the categories list     | "Category name must be unique"                     |
| Category Monthly Limit   | Greater than 0                        | "Monthly limit must be greater than zero"          |

### 9.2 Error Display Strategy

- **Inline errors:** Displayed immediately below the offending input field in red text (`text-sm text-red-600`).
- **Timing:** Validation runs on form submission. Optionally, individual fields validate on blur for immediate feedback.
- **Invalid field highlighting:** The input border changes to red (`border-red-500`) when its validation fails.
- **Focus management:** After a failed submission, focus is moved to the first invalid field.
- **Clearing errors:** An error message is removed when the user modifies the corresponding field.

---

## 10. Error Handling and UX

### 10.1 API Error Handling

All service layer calls are wrapped in try/catch blocks at the page component level. Errors are classified and handled consistently:

| Error Type           | Detection                                | User-Facing Response                                    |
|----------------------|------------------------------------------|---------------------------------------------------------|
| Validation error     | HTTP 400 with message                    | Display server message in toast notification            |
| Not found            | HTTP 404                                 | "The requested resource was not found"                  |
| Server error         | HTTP 500                                 | "Something went wrong. Please try again later."         |
| Network error        | Axios `ERR_NETWORK` or timeout           | "Unable to reach the server. Check your connection."    |
| Unknown error        | Any other thrown error                   | "An unexpected error occurred. Please try again."       |

### 10.2 Loading States

Every page that fetches data on mount displays a loading indicator while the API call is in progress:

- **Dashboard:** Skeleton cards or a centered spinner.
- **ExpenseHistory:** Skeleton table rows or a spinner above the table area.
- **Settings:** Skeleton form fields or a spinner.
- **MonthlyReports:** Spinner within the report display area.
- **ExpenseForm submission:** The submit button shows a spinner and is disabled.

### 10.3 Empty States

Pages with no data to display show helpful empty-state messages rather than blank screens:

| Page             | Condition                  | Message                                                              |
|------------------|----------------------------|----------------------------------------------------------------------|
| Dashboard        | No categories configured   | "Set up your budget categories in Settings to get started."          |
| ExpenseHistory   | No expenses this month     | "No expenses logged this month. Start by adding your first expense." |
| MonthlyReports   | No past month data         | "No monthly reports available yet. Reports will appear after your first full month." |

### 10.4 Toast Notifications

A lightweight toast notification system provides feedback for user actions:

| Action                | Toast Type | Message                            | Duration |
|-----------------------|------------|-------------------------------------|----------|
| Expense added         | Success    | "Expense added successfully"        | 3 seconds |
| Expense updated       | Success    | "Expense updated successfully"      | 3 seconds |
| Expense deleted       | Success    | "Expense deleted"                   | 3 seconds |
| Settings saved        | Success    | "Settings saved successfully"       | 3 seconds |
| Validation failed     | Error      | Specific validation message         | 5 seconds |
| API error             | Error      | Error description                   | 5 seconds |
| Network unreachable   | Error      | "Unable to reach the server..."     | Persistent until dismissed |

**Toast behavior:**

- Appears at the top-right of the screen (or top-center on mobile).
- Auto-dismisses after the specified duration.
- Multiple toasts stack vertically.
- Each toast has a close button for manual dismissal.

### 10.5 Offline / API-Unreachable Fallback

When the backend API is unreachable (common with free-tier Render hosting where the server sleeps after inactivity):

- A banner appears at the top of the page: "Connecting to server... This may take a moment on first load."
- If the first request fails, an automatic retry is attempted after 3 seconds (the Render free tier cold-starts typically take 10-30 seconds).
- After 3 consecutive failures, the banner changes to: "Unable to connect to the server. Please check your internet connection and try again." with a manual "Retry" button.
- Previously loaded data (if any) remains visible on screen during retries.

---

## 11. Build and Deployment

### 11.1 Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/finance-management/',   // GitHub Pages base path (matches repository name)
  server: {
    port: 5173,                   // Development server port
    open: true                    // Auto-open browser on dev start
  },
  build: {
    outDir: 'dist',               // Output directory for production build
    sourcemap: false              // Disable source maps in production
  }
});
```

**Key Configuration Details:**

| Setting    | Value                     | Purpose                                                     |
|------------|---------------------------|-------------------------------------------------------------|
| `base`     | `/finance-management/`    | Required for GitHub Pages. All asset URLs are prefixed with this path. |
| `outDir`   | `dist`                    | The production build output directory.                      |
| `plugins`  | `[react()]`               | Enables JSX transformation and React Fast Refresh in dev.   |

### 11.2 Environment Variables

| Variable             | Dev Value                        | Production Value                                        | Purpose                     |
|----------------------|----------------------------------|---------------------------------------------------------|-----------------------------|
| `VITE_API_BASE_URL`  | `http://localhost:5000/api`      | `https://finance-management-api.onrender.com/api`       | Backend API base URL        |

**Important:** All Vite environment variables must be prefixed with `VITE_` to be exposed to the client-side code. These values are embedded into the build at compile time, not at runtime.

**Accessing in code:**

```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL;
```

### 11.3 GitHub Pages Deployment Steps

```bash
# Step 1: Ensure production environment variable is set
# Create or update client/.env.production:
# VITE_API_BASE_URL=https://finance-management-api.onrender.com/api

# Step 2: Build the production bundle
cd client
npm run build
# Output: client/dist/ directory with index.html, JS, and CSS bundles

# Step 3: Deploy to GitHub Pages
# Option A — Using the gh-pages npm package:
npm install --save-dev gh-pages
npx gh-pages -d dist

# Option B — Manual push to gh-pages branch:
# Copy dist/ contents to the gh-pages branch and push

# Step 4: Configure GitHub repository
# Go to Settings → Pages → Source: Deploy from branch → Branch: gh-pages → / (root)

# Step 5: Access the deployed application
# URL: https://<github-username>.github.io/finance-management/
```

### 11.4 SPA Routing on GitHub Pages

GitHub Pages does not natively support client-side routing (navigating to `/history` directly returns a 404). This is resolved by adding a `404.html` file in the `public/` directory that redirects all routes to `index.html`:

```html
<!-- public/404.html -->
<!DOCTYPE html>
<html>
  <head>
    <script>
      // Redirect all 404s to index.html for SPA routing
      const path = window.location.pathname;
      window.location.replace('/' + 'finance-management/' + '?redirect=' + encodeURIComponent(path));
    </script>
  </head>
</html>
```

A corresponding script in `index.html` picks up the redirect query parameter and restores the intended route via `history.replaceState`.

---

## 12. Performance Considerations

### 12.1 Code Splitting and Lazy Loading

Route-level code splitting is implemented using React's `lazy()` and `Suspense` to reduce the initial bundle size. Each page component is loaded on-demand when the user navigates to its route:

```jsx
import { lazy, Suspense } from 'react';

const Dashboard      = lazy(() => import('./pages/Dashboard'));
const AddExpense     = lazy(() => import('./pages/AddExpense'));
const ExpenseHistory = lazy(() => import('./pages/ExpenseHistory'));
const Settings       = lazy(() => import('./pages/Settings'));
const MonthlyReports = lazy(() => import('./pages/MonthlyReports'));

// In App.jsx
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    {/* ...other routes */}
  </Routes>
</Suspense>
```

**Impact:** The initial page load only downloads the Dashboard chunk. Other page chunks are fetched asynchronously when the user navigates to them.

### 12.2 Minimal Re-renders

- State is kept as local as possible (at the page component level), avoiding unnecessary re-renders of sibling components.
- `key` props are used correctly on list-rendered components (CategoryCard, ExpenseTable rows) to help React's reconciliation algorithm.
- Expensive computations (e.g., filtering/sorting the expense list) can be memoized with `useMemo` if profiling reveals performance issues.
- The service layer does not store state — it returns fresh data on every call, keeping the data flow predictable.

### 12.3 Asset Optimization

- **Tailwind PurgeCSS:** Unused CSS classes are removed at build time based on content scanning of JSX files. This typically reduces the CSS bundle from several hundred KB to under 10 KB.
- **Vite tree-shaking:** Unused JavaScript exports are eliminated from the production bundle.
- **No heavy dependencies:** The application avoids large libraries (no chart libraries, no animation frameworks in v1). This keeps the total JavaScript payload small.
- **Image optimization:** The application is text-heavy and uses minimal images. Any icons are rendered via inline SVG or a lightweight icon set.

### 12.4 Network Optimization

- **Axios timeout:** All API calls have a 10-second timeout to prevent indefinite hangs.
- **No polling:** The application does not poll the backend for updates. Data is fetched on page mount, which is sufficient for a single-user application.
- **Minimal API calls:** Each page makes one or two API calls on mount. There are no redundant or cascading requests.

---

## 13. Browser Compatibility

### 13.1 Target Browsers

| Browser             | Minimum Version | Notes                                      |
|---------------------|-----------------|---------------------------------------------|
| Google Chrome       | 90+             | Primary target (Android and desktop)        |
| Safari              | 15+             | iOS (iPhone users)                          |
| Firefox             | 90+             | Desktop fallback                            |
| Microsoft Edge      | 90+             | Chromium-based                              |
| Samsung Internet    | 15+             | Common on Samsung Android devices           |

**Not supported:** Internet Explorer (any version). The application uses ES2020+ features and modern CSS that IE does not support.

### 13.2 Responsive Breakpoints

| Breakpoint    | Width Range      | Target Devices                              |
|---------------|------------------|---------------------------------------------|
| Mobile        | 0 – 639px        | Phones (iPhone SE through standard phones)  |
| Small tablet  | 640 – 767px      | Large phones, small tablets in portrait     |
| Tablet        | 768 – 1023px     | Tablets (iPad), phones in landscape         |
| Desktop       | 1024 – 1279px    | Laptops, small desktop monitors             |
| Large desktop | 1280px+          | External monitors, wide screens             |

### 13.3 Viewport and Scaling

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

- Touch targets (buttons, links) are a minimum of 44x44 pixels for comfortable tapping on mobile.
- Font sizes use relative units and scale appropriately across viewports.
- No horizontal scrolling on any viewport (except the expense table which uses contained horizontal scroll on mobile).

---

## 14. Security Considerations

### 14.1 Input Sanitization

- All user inputs are validated on the client side before submission (see Section 9).
- The backend performs its own independent validation as the authoritative layer — client-side validation is a UX convenience, not a security boundary.
- Text inputs (description, category name, deduction name) are treated as plain text. No HTML rendering of user-provided content.

### 14.2 XSS Prevention

- **React's built-in escaping:** React automatically escapes all values embedded in JSX, preventing script injection through rendered content. For example, a description value of `<script>alert('xss')</script>` would render as literal text, not executable code.
- **No use of `dangerouslySetInnerHTML`:** The application never renders raw HTML from user input or API responses.
- **No `eval()` or dynamic code execution:** No user-provided data is ever interpreted as code.

### 14.3 No Sensitive Data in the Frontend

- The application does not handle authentication tokens, passwords, or API keys in the client-side code.
- The `VITE_API_BASE_URL` environment variable contains only the public API endpoint URL, which is non-sensitive.
- No personal identifying information (PII) beyond financial amounts is stored or transmitted.
- The MongoDB connection string and other server secrets exist exclusively in the backend's `.env` file and are never exposed to the frontend bundle.

### 14.4 CORS and API Communication

- The backend is configured to accept requests only from the known frontend origin (`CLIENT_ORIGIN` environment variable).
- All API communication occurs over HTTPS in production.
- No cookies or credentials are sent with API requests (`credentials: false`).

### 14.5 Dependency Security

- Dependencies should be audited regularly using `npm audit`.
- The dependency count is deliberately kept minimal (React, React Router, Axios, Tailwind) to reduce the attack surface.
- No third-party analytics, tracking, or advertising scripts are loaded.

---

## Appendix A: Quick Reference — File-to-Feature Mapping

| File                          | Primary Feature                                   |
|-------------------------------|---------------------------------------------------|
| `App.jsx`                     | Route definitions, Navbar inclusion               |
| `main.jsx`                    | React DOM mount point                             |
| `index.css`                   | Tailwind CSS imports                              |
| `pages/Dashboard.jsx`         | Current month overview                            |
| `pages/AddExpense.jsx`        | Expense entry form                                |
| `pages/ExpenseHistory.jsx`    | Expense list with edit/delete                     |
| `pages/Settings.jsx`          | Budget configuration                              |
| `pages/MonthlyReports.jsx`    | Historical financial summaries                    |
| `components/Navbar.jsx`       | Navigation across pages                           |
| `components/CategoryCard.jsx` | Individual category budget display                |
| `components/ProgressBar.jsx`  | Budget usage visual indicator                     |
| `components/ExpenseForm.jsx`  | Expense input form with validation                |
| `components/ExpenseTable.jsx` | Sortable/filterable expense data table            |
| `components/SummaryBar.jsx`   | Salary/spent/savings overview                     |
| `services/settingsService.js` | Settings API integration                          |
| `services/expenseService.js`  | Expense CRUD API integration                      |
| `services/reportService.js`   | Reports API integration                           |
| `utils/formatCurrency.js`     | INR currency formatting                           |
| `utils/dateHelpers.js`        | Budget month detection, date formatting           |
| `vite.config.js`              | Build configuration, base path                    |
| `tailwind.config.js`          | Tailwind theme and content paths                  |

---

## Appendix B: API Endpoint Summary

| Service   | Function              | Method | Endpoint                | Auth Required |
|-----------|-----------------------|--------|-------------------------|---------------|
| Settings  | `getSettings`         | GET    | `/api/settings`         | No            |
| Settings  | `updateSettings`      | PUT    | `/api/settings`         | No            |
| Expenses  | `getExpenses`         | GET    | `/api/expenses`         | No            |
| Expenses  | `addExpense`          | POST   | `/api/expenses`         | No            |
| Expenses  | `updateExpense`       | PUT    | `/api/expenses/:id`     | No            |
| Expenses  | `deleteExpense`       | DELETE | `/api/expenses/:id`     | No            |
| Reports   | `getCurrentReport`    | GET    | `/api/reports/current`  | No            |
| Reports   | `getMonthlyReport`    | GET    | `/api/reports/monthly`  | No            |
| Reports   | `getReportHistory`    | GET    | `/api/reports/history`  | No            |

---

*This document serves as the authoritative reference for the Finance Management frontend application. It should be updated as the implementation evolves.*
