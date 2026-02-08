import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings } from '../services/settingsService';
import { addExpense } from '../services/expenseService';
import ExpenseForm from '../components/ExpenseForm';
import Spinner from '../components/Spinner';

export default function AddExpense() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getSettings()
      .then((data) => {
        setCategories(data.categories || []);
        if (!data.categories || data.categories.length === 0) {
          setMessage({ type: 'error', text: 'No categories configured. Please set up your budget in Settings first.' });
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load settings. Is the server running?' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (data) => {
    setMessage(null);
    setSubmitting(true);
    try {
      await addExpense(data);
      navigate('/', { state: { success: 'Expense added successfully!' } });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to add expense.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner text="Loading categories..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Add Expense</h1>
        <button
          onClick={() => navigate('/')}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>

      {message && (
        <div className={`rounded-md px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'bg-success-50 text-success-700'
            : 'bg-danger-50 text-danger-700'
        }`}>
          {message.text}
        </div>
      )}

      {categories.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <ExpenseForm
            categories={categories}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </div>
      )}
    </div>
  );
}
