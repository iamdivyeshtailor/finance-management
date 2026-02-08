import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateHelpers';

export default function ExpenseTable({ expenses, onEdit, onDelete }) {
  if (expenses.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">No expenses found for this period.</p>
    );
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp._id} className="border-b border-slate-50 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(exp.date)}</td>
                <td className="px-4 py-3 text-slate-700">{exp.category}</td>
                <td className="px-4 py-3 text-slate-600">{exp.description}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(exp.amount)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    onClick={() => onEdit(exp)}
                    className="mr-2 rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(exp)}
                    className="rounded px-2 py-1 text-xs font-medium text-danger-600 hover:bg-danger-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-medium">
              <td className="px-4 py-3 text-slate-700" colSpan={3}>Total</td>
              <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(total)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="space-y-3 sm:hidden">
        {expenses.map((exp) => (
          <div key={exp._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800">{exp.description}</p>
                <p className="mt-1 text-xs text-slate-500">{exp.category} &middot; {formatDate(exp.date)}</p>
              </div>
              <p className="ml-3 whitespace-nowrap text-lg font-semibold text-slate-900">{formatCurrency(exp.amount)}</p>
            </div>
            <div className="mt-3 flex gap-3 border-t border-slate-100 pt-3">
              <button
                onClick={() => onEdit(exp)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(exp)}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-right text-sm font-medium text-slate-700">
          Total: {formatCurrency(total)}
        </div>
      </div>
    </>
  );
}
