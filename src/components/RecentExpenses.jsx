import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateHelpers';

export default function RecentExpenses({ expenses }) {
  if (!expenses || expenses.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium text-slate-700 dark:text-slate-300">Recent Expenses</h3>
        <Link to="/history" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
          View All &rarr;
        </Link>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {expenses.map((exp) => (
          <div key={exp._id} className="flex items-center justify-between py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{exp.description}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{exp.category} &middot; {formatDate(exp.date)}</p>
            </div>
            <p className="ml-3 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(exp.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
