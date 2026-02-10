import { useState, useEffect } from 'react';
import { getExpenses, updateExpense, deleteExpense } from '../services/expenseService';
import { getSettings } from '../services/settingsService';
import { getCurrentReport } from '../services/reportService';
import { getMonthName } from '../utils/dateHelpers';
import { exportToCSV } from '../utils/exportHelpers';
import ExpenseTable from '../components/ExpenseTable';
import TagInput from '../components/TagInput';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

export default function ExpenseHistory() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(null);
  const [year, setYear] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Collect unique tags for the filter dropdown
  const allTags = [...new Set(expenses.flatMap((e) => e.tags || []))].sort();

  // Filter
  let filtered = expenses;
  if (filterCategory) filtered = filtered.filter((e) => e.category === filterCategory);
  if (filterTag) filtered = filtered.filter((e) => (e.tags || []).includes(filterTag));

  // Search
  if (debouncedSearch) {
    const q = debouncedSearch.toLowerCase();
    filtered = filtered.filter((e) =>
      (e.description || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      String(e.amount).includes(q)
    );
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  const handleEdit = (exp) => setEditingExpense(exp);

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

  const handleDelete = (exp) => setConfirmDelete(exp);

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

  const selectClass = 'mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Expense History</h1>
        {month && year && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{getMonthName(month)} {year}</p>
        )}
      </div>

      {message && message.type === 'error' && (
        <div className="rounded-md bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:bg-danger-900/30 dark:text-danger-300">
          {message.text}
        </div>
      )}

      <Toast
        message={message?.type === 'success' ? message.text : null}
        type="success"
        onClose={() => setMessage(null)}
      />

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search expenses..."
          className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-10 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters + Export */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Filter by Category</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectClass}>
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Filter by Tag</label>
          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className={selectClass}>
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Sort by</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectClass}>
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="amount-desc">Amount (High → Low)</option>
            <option value="amount-asc">Amount (Low → High)</option>
          </select>
        </div>
        <button
          onClick={() => exportToCSV(sorted, `expenses-${month}-${year}.csv`)}
          disabled={sorted.length === 0}
          className="ml-auto rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Export CSV
        </button>
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
          <div className="w-full max-w-sm rounded-t-lg bg-white p-6 shadow-xl sm:rounded-lg dark:bg-slate-800">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Delete Expense?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete "{confirmDelete.description}"? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
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
  const [tags, setTags] = useState(expense.tags || []);
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
      tags,
    });
    setSaving(false);
  };

  const inputClass = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 sm:items-center">
      <div className="w-full max-w-md rounded-t-lg bg-white p-6 shadow-xl sm:rounded-lg dark:bg-slate-800">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Edit Expense</h3>
        {error && <p className="mt-2 text-sm text-danger-600">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Amount</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Description</label>
            <input type="text" maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Tags</label>
            <TagInput tags={tags} onChange={setTags} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
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
