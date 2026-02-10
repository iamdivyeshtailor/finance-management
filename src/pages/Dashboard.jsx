import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentReport } from '../services/reportService';
import { getExpenses } from '../services/expenseService';
import { addExpense } from '../services/expenseService';
import { formatCurrency } from '../utils/formatCurrency';
import { getMonthName } from '../utils/dateHelpers';
import SummaryBar from '../components/SummaryBar';
import CategoryCard from '../components/CategoryCard';
import ExpenseForm from '../components/ExpenseForm';
import CategoryPieChart from '../components/CategoryPieChart';
import QuickStatsCards from '../components/QuickStatsCards';
import RecentExpenses from '../components/RecentExpenses';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import useBudgetAlerts from '../hooks/useBudgetAlerts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Add expense form state
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchReport = () => {
    return getCurrentReport()
      .then((data) => {
        setReport(data);
        return getExpenses(data.month, data.year);
      })
      .then((expenses) => {
        const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentExpenses(sorted.slice(0, 5));
      })
      .catch((err) => {
        const msg = err.response?.data?.error?.message || 'Failed to load dashboard. Is the server running?';
        setError(msg);
      });
  };

  useEffect(() => {
    fetchReport().finally(() => setLoading(false));
  }, []);

  const { alerts, dismissAlert } = useBudgetAlerts(report?.categories);

  const handleAddExpense = async (data) => {
    setSubmitting(true);
    try {
      await addExpense(data);
      setShowForm(false);
      await fetchReport();
      setToast({ type: 'success', text: 'Expense added successfully!' });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to add expense.';
      setToast({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <div className="rounded-lg border border-slate-200 bg-white py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-3xl">👋</p>
          <h2 className="mt-3 text-lg font-medium text-slate-800 dark:text-slate-200">Welcome to Finance Manager!</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Set up your salary and budget categories to get started.</p>
          <button
            onClick={() => navigate('/settings')}
            className="mt-5 rounded-md bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  // Map report categories to the format ExpenseForm expects
  const formCategories = report.categories.map((cat) => ({ name: cat.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {getMonthName(report.month)} {report.year} &middot; Salary credited on {report.salaryCreditDate}th
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`w-full rounded-md px-4 py-2.5 text-sm font-medium sm:w-auto ${
            showForm
              ? 'border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {/* Collapsible Add Expense Form */}
      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 text-lg font-medium text-slate-800 dark:text-slate-200">Add Expense</h2>
          <ExpenseForm
            categories={formCategories}
            onSubmit={handleAddExpense}
            submitting={submitting}
          />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Budget Alerts */}
      {alerts.map((alert) => (
        <div
          key={alert.name}
          className={`flex items-center justify-between rounded-md px-4 py-3 text-sm ${
            alert.level === 'danger'
              ? 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300'
              : 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'
          }`}
        >
          <span>
            {alert.level === 'danger'
              ? `${alert.name} has exceeded its budget (${alert.percentUsed}% used)`
              : `${alert.name} is approaching its limit (${alert.percentUsed}% used)`}
          </span>
          <button onClick={() => dismissAlert(alert.name)} className="ml-3 font-medium opacity-70 hover:opacity-100">&times;</button>
        </div>
      ))}

      {/* Summary Bar */}
      <SummaryBar
        salary={report.salary}
        totalSpent={report.totalSpent}
        currentSavings={report.currentSavings}
      />

      {/* Quick Stats + Recent Expenses */}
      <QuickStatsCards report={report} expenses={recentExpenses} />
      <RecentExpenses expenses={recentExpenses} />

      {/* Category Pie Chart */}
      <CategoryPieChart categories={report.categories} />

      {/* No expenses hint */}
      {report.totalSpent === report.totalFixedDeductions && !showForm && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white py-8 text-center dark:border-slate-600 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">No variable expenses this month. Tap <strong>+ Add Expense</strong> to log one.</p>
        </div>
      )}

      {/* Category Cards */}
      <div>
        <h2 className="mb-3 text-lg font-medium text-slate-800 dark:text-slate-200">Budget Categories</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {report.categories.map((cat) => (
            <CategoryCard
              key={cat.name}
              name={cat.name}
              limit={cat.limit}
              spent={cat.spent}
              remaining={cat.remaining}
              percentUsed={cat.percentUsed}
            />
          ))}
        </div>
      </div>

      {/* Fixed Deductions */}
      {report.fixedDeductions && report.fixedDeductions.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-medium text-slate-800 dark:text-slate-200">Fixed Deductions</h2>
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {report.fixedDeductions.map((d, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 dark:border-slate-700">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{d.name}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatCurrency(d.amount)}</td>
                    <td className="px-4 py-3 text-right text-slate-400 dark:text-slate-500">{d.deductionDate}th</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-medium dark:bg-slate-700/50">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Total</td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatCurrency(report.totalFixedDeductions)}</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
