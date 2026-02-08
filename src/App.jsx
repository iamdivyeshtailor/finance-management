import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import ExpenseHistory from './pages/ExpenseHistory';
import Settings from './pages/Settings';
import MonthlyReports from './pages/MonthlyReports';

export default function App() {
  return (
    <HashRouter>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddExpense />} />
            <Route path="/history" element={<ExpenseHistory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/reports" element={<MonthlyReports />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-200 py-4 text-center text-sm text-slate-400">
          Finance Manager &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </HashRouter>
  );
}
