import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateHelpers';

export default function ExpenseTable({ expenses, onEdit, onDelete }) {
  if (expenses.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No expenses found for this period.</p>
    );
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp._id} className="border-b border-slate-50 last:border-0 dark:border-slate-700">
                <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">{formatDate(exp.date)}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{exp.category}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{exp.description}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(exp.tags || []).map((tag) => (
                      <span key={tag} className="inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">{formatCurrency(exp.amount)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button onClick={() => onEdit(exp)} className="mr-2 rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30">Edit</button>
                  <button onClick={() => onDelete(exp)} className="rounded px-2 py-1 text-xs font-medium text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/30">Delete</button>
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-medium dark:bg-slate-700/50">
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300" colSpan={4}>Total</td>
              <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatCurrency(total)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="space-y-3 sm:hidden">
        {expenses.map((exp) => (
          <div key={exp._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800 dark:text-slate-200">{exp.description}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{exp.category} &middot; {formatDate(exp.date)}</p>
                {exp.tags?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {exp.tags.map((tag) => (
                      <span key={tag} className="inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <p className="ml-3 whitespace-nowrap text-lg font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(exp.amount)}</p>
            </div>
            <div className="mt-3 flex gap-3 border-t border-slate-100 pt-3 dark:border-slate-700">
              <button onClick={() => onEdit(exp)} className="rounded-md px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30">Edit</button>
              <button onClick={() => onDelete(exp)} className="rounded-md px-3 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/30">Delete</button>
            </div>
          </div>
        ))}
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-right text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Total: {formatCurrency(total)}
        </div>
      </div>
    </>
  );
}
