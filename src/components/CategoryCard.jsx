import { formatCurrency } from '../utils/formatCurrency';
import ProgressBar from './ProgressBar';

export default function CategoryCard({ name, limit, spent, remaining, percentUsed }) {
  const isOver = percentUsed > 100;
  const isWarning = percentUsed >= 80 && percentUsed <= 100;

  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {/* Budget alert badge */}
      {percentUsed >= 80 && (
        <span className={`absolute -top-2 -right-2 rounded-full px-2 py-0.5 text-xs font-bold text-white ${
          isOver ? 'bg-danger-500' : 'bg-warning-500'
        }`}>
          {isOver ? 'Over!' : 'Warning'}
        </span>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-800 dark:text-slate-200">{name}</h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">{percentUsed}% used</span>
      </div>

      <div className="mt-3">
        <ProgressBar percentUsed={percentUsed} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="text-slate-400 dark:text-slate-500">Limit</p>
          <p className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(limit)}</p>
        </div>
        <div>
          <p className="text-slate-400 dark:text-slate-500">Spent</p>
          <p className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(spent)}</p>
        </div>
        <div>
          <p className="text-slate-400 dark:text-slate-500">Left</p>
          <p className={`font-medium ${isOver ? 'text-danger-600' : 'text-success-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>
    </div>
  );
}
