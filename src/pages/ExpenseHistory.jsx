import { useState, useEffect } from 'react';
import { getExpenses, updateExpense, deleteExpense } from '../services/expenseService';
import { getSettings } from '../services/settingsService';
import { getCurrentReport } from '../services/reportService';
import { getMonthName } from '../utils/dateHelpers';
import ExpenseTable from '../components/ExpenseTable';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

export default function ExpenseHistory() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(null);
  const [year, setYear] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    Promise.all([getCurrentReport(), getSettings()])
      .then(([report, settings]) => {
        setMonth(report.month);
        setYear(report.year);
        setCategories(settings.categories || []);
        return getExpenses(report.month, report.year);
      })
      .then(setExpenses)
      .catch(() => setMessage({ type: 'error', text: 'Failed to load expenses.' }))
      .finally(() => setLoading(false));
  }, []);

  // Filter
  const filtered = filterCategory
    ? expenses.filter((e) => e.category === filterCategory)
    : expenses;

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  // Edit handler
  const handleEdit = (exp) => {
    setEditingExpense(exp);
  };

  const handleEditSave = async (data) => {
    setMessage(null);
    try {
      const updated = await updateExpense(editingExpense._id, data);
      setExpenses(expenses.map((e) => (e._id === updated._id ? updated : e)));
      setEditingExpense(null);
      setMessage({ type: 'success', text: 'Expense updated.' });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update expense.';
      setMessage({ type: 'error', text: msg });
    }
  };

  // Delete handler
  const handleDelete = (exp) => {
    setConfirmDelete(exp);
  };

  const handleDeleteConfirm = async () => {
    setMessage(null);
    try {
      await deleteExpense(confirmDelete._id);
      setExpenses(expenses.filter((e) => e._id !== confirmDelete._id));
      setConfirmDelete(null);
      setMessage({ type: 'success', text: 'Expense deleted.' });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to delete expense.';
      setMessage({ type: 'error', text: msg });
    }
  };

  if (loading) {
    return <Spinner text="Loading expenses..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Expense History</h1>
        {month && year && (
          <p className="mt-1 text-sm text-slate-500">{getMonthName(month)} {year}</p>
        )}
      </div>

      {message && message.type === 'error' && (
        <div className="rounded-md bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {message.text}
        </div>
      )}

      <Toast
        message={message?.type === 'success' ? message.text : null}
        type="success"
        onClose={() => setMessage(null)}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500">Filter by Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="amount-desc">Amount (High → Low)</option>
            <option value="amount-asc">Amount (Low → High)</option>
          </select>
        </div>
      </div>

      {/* Expense Table */}
      <ExpenseTable expenses={sorted} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Edit Modal */}
      {editingExpense && (
        <EditModal
          expense={editingExpense}
          categories={categories}
          onSave={handleEditSave}
          onCancel={() => setEditingExpense(null)}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-lg bg-white p-6 shadow-xl sm:rounded-lg">
            <h3 className="text-lg font-medium text-slate-900">Delete Expense?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete "{confirmDelete.description}"? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-md bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Edit Modal component
function EditModal({ expense, categories, onSave, onCancel }) {
  const [date, setDate] = useState(expense.date.slice(0, 10));
  const [category, setCategory] = useState(expense.category);
  const [amount, setAmount] = useState(expense.amount);
  const [description, setDescription] = useState(expense.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !category || !amount || Number(amount) <= 0 || !description.trim()) {
      setError('All fields are required and amount must be > 0.');
      return;
    }
    setSaving(true);
    await onSave({
      date,
      category,
      amount: Number(amount),
      description: description.trim(),
    });
    setSaving(false);
  };

  const inputClass = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 sm:items-center">
      <div className="w-full max-w-md rounded-t-lg bg-white p-6 shadow-xl sm:rounded-lg">
        <h3 className="text-lg font-medium text-slate-900">Edit Expense</h3>
        {error && <p className="mt-2 text-sm text-danger-600">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">Amount</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">Description</label>
            <input type="text" maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
