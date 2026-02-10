import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/settingsService';
import { formatCurrency } from '../utils/formatCurrency';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

export default function Settings() {
  const [salary, setSalary] = useState('');
  const [salaryCreditDate, setSalaryCreditDate] = useState('');
  const [fixedDeductions, setFixedDeductions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getSettings()
      .then((data) => {
        setSalary(data.salary || '');
        setSalaryCreditDate(data.salaryCreditDate || '');
        setFixedDeductions(data.fixedDeductions || []);
        setCategories(data.categories || []);
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load settings.' }))
      .finally(() => setLoading(false));
  }, []);

  const validate = () => {
    if (!salary || Number(salary) <= 0) return 'Salary must be greater than 0.';
    if (!salaryCreditDate || Number(salaryCreditDate) < 1 || Number(salaryCreditDate) > 31) return 'Salary credit date must be between 1 and 31.';
    for (let i = 0; i < fixedDeductions.length; i++) {
      const d = fixedDeductions[i];
      if (!d.name.trim()) return `Fixed deduction #${i + 1}: Name is required.`;
      if (!d.amount || Number(d.amount) <= 0) return `Fixed deduction "${d.name || i + 1}": Amount must be greater than 0.`;
      if (!d.deductionDate || Number(d.deductionDate) < 1 || Number(d.deductionDate) > 31) return `Fixed deduction "${d.name}": Date must be between 1 and 31.`;
    }
    if (categories.length === 0) return 'At least one expense category is required.';
    const catNames = new Set();
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      if (!c.name.trim()) return `Category #${i + 1}: Name is required.`;
      if (!c.monthlyLimit || Number(c.monthlyLimit) <= 0) return `Category "${c.name || i + 1}": Monthly limit must be greater than 0.`;
      const lower = c.name.trim().toLowerCase();
      if (catNames.has(lower)) return `Duplicate category name: "${c.name}".`;
      catNames.add(lower);
    }
    return null;
  };

  const handleSave = async () => {
    setMessage(null);
    const error = validate();
    if (error) { setMessage({ type: 'error', text: error }); return; }
    setSaving(true);
    try {
      await updateSettings({
        salary: Number(salary),
        salaryCreditDate: Number(salaryCreditDate),
        fixedDeductions: fixedDeductions.map(d => ({ name: d.name.trim(), amount: Number(d.amount), deductionDate: Number(d.deductionDate) })),
        categories: categories.map(c => ({ name: c.name.trim(), monthlyLimit: Number(c.monthlyLimit), type: c.type || 'variable' })),
      });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to save settings.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner text="Loading settings..." />;

  const inputClass = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100';
  const smallInputClass = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100';

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>

      {message && message.type === 'error' && (
        <div className="rounded-md bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:bg-danger-900/30 dark:text-danger-300">{message.text}</div>
      )}
      <Toast message={message?.type === 'success' ? message.text : null} type="success" onClose={() => setMessage(null)} />

      {/* Salary Section */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">Salary</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Monthly Salary (INR)</label>
            <input type="number" min="1" value={salary} onChange={(e) => setSalary(e.target.value)} className={inputClass} placeholder="e.g. 30000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Salary Credit Date</label>
            <input type="number" min="1" max="31" value={salaryCreditDate} onChange={(e) => setSalaryCreditDate(e.target.value)} className={inputClass} placeholder="e.g. 3" />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Day of month when salary is credited (1-31)</p>
          </div>
        </div>
      </section>

      {/* Fixed Deductions */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">Fixed Deductions</h2>
          <button type="button" onClick={() => setFixedDeductions([...fixedDeductions, { name: '', amount: '', deductionDate: '' }])} className="rounded-md bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50">
            + Add Deduction
          </button>
        </div>
        {fixedDeductions.length === 0 && <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">No fixed deductions added yet.</p>}
        <div className="mt-4 space-y-3">
          {fixedDeductions.map((d, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 rounded-md border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-700/50">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Name</label>
                <input type="text" value={d.name} onChange={(e) => { const u = [...fixedDeductions]; u[i] = { ...u[i], name: e.target.value }; setFixedDeductions(u); }} className={smallInputClass} placeholder="e.g. Bike EMI" />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Amount</label>
                <input type="number" min="1" value={d.amount} onChange={(e) => { const u = [...fixedDeductions]; u[i] = { ...u[i], amount: e.target.value === '' ? '' : Number(e.target.value) }; setFixedDeductions(u); }} className={smallInputClass} placeholder="5000" />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Date</label>
                <input type="number" min="1" max="31" value={d.deductionDate} onChange={(e) => { const u = [...fixedDeductions]; u[i] = { ...u[i], deductionDate: e.target.value === '' ? '' : Number(e.target.value) }; setFixedDeductions(u); }} className={smallInputClass} placeholder="3" />
              </div>
              <button type="button" onClick={() => setFixedDeductions(fixedDeductions.filter((_, j) => j !== i))} className="rounded-md px-2 py-1.5 text-sm text-danger-500 hover:bg-danger-50 hover:text-danger-700 dark:hover:bg-danger-900/30">Delete</button>
            </div>
          ))}
        </div>
        {fixedDeductions.length > 0 && (
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Total: {formatCurrency(fixedDeductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0))}</p>
        )}
      </section>

      {/* Categories */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">Expense Categories</h2>
          <button type="button" onClick={() => setCategories([...categories, { name: '', monthlyLimit: '', type: 'variable' }])} className="rounded-md bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50">
            + Add Category
          </button>
        </div>
        {categories.length === 0 && <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">No categories added yet. Add at least one to start tracking expenses.</p>}
        <div className="mt-4 space-y-3">
          {categories.map((cat, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 rounded-md border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-700/50">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Category Name</label>
                <input type="text" value={cat.name} onChange={(e) => { const u = [...categories]; u[i] = { ...u[i], name: e.target.value }; setCategories(u); }} className={smallInputClass} placeholder="e.g. Personal Expenses" />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Limit</label>
                <input type="number" min="1" value={cat.monthlyLimit} onChange={(e) => { const u = [...categories]; u[i] = { ...u[i], monthlyLimit: e.target.value === '' ? '' : Number(e.target.value) }; setCategories(u); }} className={smallInputClass} placeholder="3000" />
              </div>
              <button type="button" onClick={() => setCategories(categories.filter((_, j) => j !== i))} className="rounded-md px-2 py-1.5 text-sm text-danger-500 hover:bg-danger-50 hover:text-danger-700 dark:hover:bg-danger-900/30">Delete</button>
            </div>
          ))}
        </div>
        {categories.length > 0 && (
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Total budget: {formatCurrency(categories.reduce((sum, c) => sum + (Number(c.monthlyLimit) || 0), 0))}</p>
        )}
      </section>

      <button onClick={handleSave} disabled={saving} className="rounded-md bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
