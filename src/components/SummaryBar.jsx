import { formatCurrency } from '../utils/formatCurrency';

export default function SummaryBar({ salary, totalSpent, currentSavings }) {
  const savingsColor = currentSavings >= 0 ? 'text-success-600' : 'text-danger-600';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Salary</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(salary)}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Total Spent</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Current Savings</p>
        <p className={`mt-1 text-2xl font-bold ${savingsColor}`}>{formatCurrency(currentSavings)}</p>
      </div>
    </div>
  );
}
