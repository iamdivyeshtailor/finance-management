import { formatCurrency } from '../utils/formatCurrency';
import ProgressBar from './ProgressBar';

export default function CategoryCard({ name, limit, spent, remaining, percentUsed }) {
  const isOver = percentUsed > 100;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-800">{name}</h3>
        <span className="text-xs text-slate-400">{percentUsed}% used</span>
      </div>

      <div className="mt-3">
        <ProgressBar percentUsed={percentUsed} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="text-slate-400">Limit</p>
          <p className="font-medium text-slate-700">{formatCurrency(limit)}</p>
        </div>
        <div>
          <p className="text-slate-400">Spent</p>
          <p className="font-medium text-slate-700">{formatCurrency(spent)}</p>
        </div>
        <div>
          <p className="text-slate-400">Left</p>
          <p className={`font-medium ${isOver ? 'text-danger-600' : 'text-success-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>
    </div>
  );
}
