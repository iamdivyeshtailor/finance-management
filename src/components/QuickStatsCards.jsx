import { formatCurrency } from '../utils/formatCurrency';

export default function QuickStatsCards({ report, expenses }) {
  if (!report) return null;

  // Top spending category
  const topCategory = report.categories.reduce(
    (max, cat) => (cat.spent > (max?.spent || 0) ? cat : max),
    null
  );

  // Days remaining in cycle
  const today = new Date();
  const creditDate = report.salaryCreditDate;
  let nextCreditDate;
  if (today.getDate() < creditDate) {
    nextCreditDate = new Date(today.getFullYear(), today.getMonth(), creditDate);
  } else {
    nextCreditDate = new Date(today.getFullYear(), today.getMonth() + 1, creditDate);
  }
  const daysRemaining = Math.max(0, Math.ceil((nextCreditDate - today) / (1000 * 60 * 60 * 24)));

  // Average daily spending
  const daysPassed = Math.max(1, creditDate <= today.getDate()
    ? today.getDate() - creditDate + 1
    : new Date(today.getFullYear(), today.getMonth(), 0).getDate() - creditDate + today.getDate() + 1
  );
  const avgDaily = Math.round(report.totalSpent / daysPassed);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Top Category</p>
        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{topCategory?.name || '-'}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{topCategory ? formatCurrency(topCategory.spent) : ''}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Days Left in Cycle</p>
        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{daysRemaining}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">until next salary</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Avg Daily Spending</p>
        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{formatCurrency(avgDaily)}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">per day this cycle</p>
      </div>
    </div>
  );
}
