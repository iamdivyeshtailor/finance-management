# Finance Manager — Frontend

Personal finance tracker for monthly salary budgeting in INR. Track expenses across categories, monitor remaining budget, and view monthly savings reports.

## Tech Stack

- React 18 + Vite 5
- Tailwind CSS 3
- React Router 6
- Axios

## Features

- **Dashboard** — Live overview of salary, spending, and savings with category progress bars
- **Add Expense** — Log expenses with date, category, amount, and description
- **Expense History** — View, filter, sort, edit, and delete past expenses
- **Monthly Reports** — Browse past months with category breakdown and savings summary
- **Settings** — Configure salary, credit date, fixed deductions, and budget categories
- **Responsive** — Works on desktop and mobile

## Prerequisites

- Node.js 18+
- Backend API running ([api-finance-management](https://github.com/iamdivyeshtailor/api-finance-management))

## Setup

```bash
git clone https://github.com/iamdivyeshtailor/finance-management.git
cd finance-management
npm install
```

Create a `.env` file:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Development

```bash
npm run dev
```

Opens at `http://localhost:5173/finance-management/`

## Production Build

```bash
npm run build
```

Output in `dist/` — deploy to GitHub Pages or any static host.

## Project Structure

```
src/
  components/    # Reusable UI components (Navbar, CategoryCard, ExpenseTable, etc.)
  pages/         # Route pages (Dashboard, AddExpense, Settings, etc.)
  services/      # API service layer (Axios calls)
  utils/         # Helpers (currency formatting, date utilities)
```

## Related

- **Backend:** [api-finance-management](https://github.com/iamdivyeshtailor/api-finance-management)
