# Finance Management — Project Documentation

## 1. What Is This Application?

This is a **personal finance tracker** built for a salaried individual (DevOps professional) who receives a fixed monthly salary in Indian Rupees (INR). The application helps you:

- Record your monthly salary (credited on the 3rd/4th of every month)
- Define spending categories with fixed budget limits
- Log every expense as it happens throughout the month
- See at a glance how much money is left in each category
- Know your total savings at the end of the month

Think of it as a **digital version of the envelope budgeting system** — you divide your salary into envelopes (categories), and every time you spend, the amount is deducted from the right envelope.

---

## 2. How It Works — A Real-Life Walkthrough

### Step 1: Month Begins — Salary Arrives

On the 3rd of the month, your salary (say ₹30,000) gets credited. You open the app and it already knows your salary and your pre-set budget categories.

### Step 2: Automatic & Fixed Deductions

Some expenses are fixed every month and happen automatically:

| Expense         | Amount   | When          |
|-----------------|----------|---------------|
| Bike EMI        | ₹X,XXX   | 3rd of month  |

After this deduction, the remaining salary is what you actually have to distribute.

### Step 3: Budget Categories — Your Spending Envelopes

You divide the remaining salary into categories, each with a monthly limit:

| Category                | Monthly Limit | Description                                          |
|-------------------------|---------------|------------------------------------------------------|
| Mother's Allowance      | ₹X,XXX        | Money you give to your mother throughout the month   |
| Personal Expenses       | ₹2,000–3,000  | Daily spending — food, outings, travel, etc.         |
| Miscellaneous           | ₹1,500         | Unexpected or one-off purchases                      |

> **Note:** You will set these exact amounts when you first configure the app. You can change them any month.

### Step 4: Logging Expenses Throughout the Month

Every time you spend money, you open the app and log it:

**Example entries:**

| Date       | Description               | Category          | Amount |
|------------|---------------------------|--------------------|--------|
| 5th Feb    | Dinner with friends       | Personal Expenses  | ₹500   |
| 8th Feb    | Gave money to Mom         | Mother's Allowance | ₹2,000 |
| 12th Feb   | Phone screen guard        | Miscellaneous      | ₹300   |
| 15th Feb   | Lunch at office           | Personal Expenses  | ₹250   |

### Step 5: Live Tracking — What's Left?

After each entry, the app instantly shows:

```
Personal Expenses:     ₹3,000 limit  →  ₹500 + ₹250 spent  →  ₹2,250 remaining
Mother's Allowance:    ₹5,000 limit  →  ₹2,000 spent       →  ₹3,000 remaining
Miscellaneous:         ₹1,500 limit  →  ₹300 spent          →  ₹1,200 remaining
```

### Step 6: End of Month — Savings Summary

At the end of the month, the app shows:

```
Total Salary:                ₹30,000
Bike EMI:                   -₹X,XXX
Mother's Allowance (used):  -₹X,XXX
Personal Expenses (used):   -₹X,XXX
Miscellaneous (used):       -₹X,XXX
─────────────────────────────────────
Total Savings:               ₹X,XXX  ← This is what you can invest!
```

---

## 3. Screens / Pages in the Application

### Page 1: Dashboard (Home Page)

This is the first thing you see when you open the app. It shows:

- **Current month and year** (e.g., February 2026)
- **Salary** for this month
- **Category cards** — each card shows:
  - Category name (e.g., "Personal Expenses")
  - Budget limit for this month
  - Amount spent so far
  - Amount remaining (with a progress bar or color indicator)
- **Total spent** across all categories
- **Total savings** so far this month
- A button to **"Add Expense"**

### Page 2: Add Expense

A simple form where you enter:

- **Date** of the expense (defaults to today)
- **Category** (dropdown: Personal Expenses, Mother's Allowance, Miscellaneous, etc.)
- **Amount** in ₹
- **Description** (short note — e.g., "Dinner with friends")

After submitting, you go back to the Dashboard with updated numbers.

### Page 3: Expense History

A list/table of all expenses for the current month:

- Filterable by category
- Sortable by date or amount
- Option to **delete** an incorrect entry
- Option to **edit** an entry if you made a mistake

### Page 4: Monthly Setup / Settings

Where you configure your monthly budget:

- **Salary amount** (fixed, but editable if it changes)
- **Salary credit date** (3rd, 4th, etc.)
- **Fixed deductions** (like Bike EMI — amount and date)
- **Category budgets** — add, remove, or change category names and limits
- These settings carry forward to the next month automatically

### Page 5: Monthly History / Reports

- View past months (e.g., January 2026, December 2025)
- See how much you saved each month
- Compare spending across months
- Understand spending patterns over time

---

## 4. Expense Categories — Explained

| Category            | Type     | Description                                                                 |
|---------------------|----------|-----------------------------------------------------------------------------|
| Bike EMI            | Fixed    | Same amount every month, auto-deducted on a fixed date                     |
| Mother's Allowance  | Variable | You give varying amounts; tracked against a monthly limit                  |
| Personal Expenses   | Variable | Daily spending (food, travel, outings); tracked against a monthly limit    |
| Miscellaneous       | Variable | Unexpected purchases; tracked against a monthly limit                      |

You can **add more categories** later (e.g., "Subscriptions", "Medical", "Savings Goal").

---

## 5. Key Rules / Business Logic

1. **Salary is the starting point.** Every month begins with your salary amount.
2. **Fixed deductions are subtracted first.** Bike EMI (and any other fixed expenses) are removed from the salary before distributing to categories.
3. **Remaining amount is distributed into categories** based on limits you set.
4. **Every expense must belong to a category.** No uncategorized spending.
5. **Overspending is allowed but warned.** If you exceed a category limit, the app shows a warning (red indicator) but still lets you log it.
6. **Savings = Salary − All Actual Spending.** This is calculated from real logged expenses, not from budget limits.
7. **Month resets automatically.** On the salary credit date, a new month cycle begins with fresh budgets.
8. **Past months are read-only.** You can view but not modify closed months.

---

## 6. Technology Choices — Why These?

| Layer      | Technology | Why                                                                              |
|------------|------------|----------------------------------------------------------------------------------|
| Frontend   | React      | Can be built as static files and hosted free on GitHub Pages                     |
| Backend    | Node.js    | Handles the logic (calculations, data processing); pairs naturally with React    |
| Database   | MongoDB    | Free tier available (MongoDB Atlas); stores data in a flexible format            |

### Hosting Plan

- **Frontend (React):** Hosted on **GitHub Pages** as static files — completely free
- **Backend (Node.js):** Hosted on a free/cheap service (Render, Railway, or similar)
- **Database (MongoDB):** Hosted on **MongoDB Atlas** free cluster (512 MB storage — more than enough)

---

## 7. Data That Gets Stored

### User Settings (stored once, updated as needed)

```
- Salary amount
- Salary credit date
- List of categories with their monthly limits
- List of fixed deductions (name, amount, date)
```

### Monthly Expenses (stored every time you log an expense)

```
- Date of expense
- Category
- Amount (in ₹)
- Description / note
- Month and year it belongs to
```

### Monthly Summary (calculated, can also be stored)

```
- Month and year
- Total salary
- Total fixed deductions
- Total spent per category
- Total savings
```

---

## 8. What You Will Be Able to Do (Feature Summary)

| #  | Feature                          | Description                                                   |
|----|----------------------------------|---------------------------------------------------------------|
| 1  | Set monthly salary               | Enter or update your fixed monthly salary                     |
| 2  | Define spending categories       | Create categories with monthly budget limits                  |
| 3  | Add fixed deductions             | Set up recurring deductions like EMIs                         |
| 4  | Log daily expenses               | Enter each expense with date, amount, category, and note      |
| 5  | View remaining budget            | See how much is left in each category at any time             |
| 6  | View total savings               | See how much money you've saved this month                    |
| 7  | Edit/delete expenses             | Fix mistakes in logged entries                                |
| 8  | View expense history             | See all expenses for the current or past months               |
| 9  | View monthly reports             | Compare savings and spending across months                    |
| 10 | Overspending alerts              | Get visual warnings when a category budget is exceeded        |
| 11 | Month auto-reset                 | New month starts fresh with your saved budget settings        |

---

## 9. Future Possibilities (Not for Now — Just Ideas)

These are NOT part of the first version, but could be added later:

- **Charts and graphs** showing spending trends
- **Export to Excel/PDF** for personal records
- **Multiple income sources** (freelance work, bonuses)
- **Savings goals** (e.g., "Save ₹50,000 for a trip")
- **Bill reminders / notifications**
- **Multi-user support** (if family members want to use it)

---

## 10. Summary

This application is your **personal financial diary**. It takes your salary, subtracts your commitments (EMI, family, personal spending, miscellaneous), and tells you exactly where your money went and how much you saved. It's simple, practical, and built to help you take control of your finances — one entry at a time.
