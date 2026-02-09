import { useState, useRef, useCallback, useEffect } from 'react';
import { parseStatement, saveBulkExpenses } from '../services/importService';
import { getSettings } from '../services/settingsService';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateHelpers';
import TagInput from '../components/TagInput';
import Toast from '../components/Toast';

const STEPS = { UPLOAD: 'upload', PREVIEW: 'preview', DONE: 'done' };
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function BulkImport() {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  // Fetch user categories on mount
  useEffect(() => {
    getSettings()
      .then((s) => {
        if (s?.categories) setCategories(s.categories.map((c) => c.name));
      })
      .catch(() => {});
  }, []);

  const handleFile = useCallback(async (file) => {
    setError('');
    if (!file) return;

    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'csv' && ext !== 'pdf') {
      setError('Only CSV and PDF files are supported');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be under 5MB');
      return;
    }

    setLoading(true);
    try {
      const data = await parseStatement(file);
      setTransactions(data.transactions);
      setSelected(new Set(data.transactions.map((_, i) => i)));
      if (data.availableCategories?.length) {
        setCategories((prev) => {
          const merged = new Set([...prev, ...data.availableCategories]);
          return [...merged];
        });
      }
      setSummary(data.summary);
      setStep(STEPS.PREVIEW);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const toggleRow = (idx) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const filteredIndices = transactions
    .map((t, i) => ({ ...t, idx: i }))
    .filter((t) => typeFilter === 'all' || t.type === typeFilter)
    .map((t) => t.idx);

  const selectAll = () => setSelected(new Set(filteredIndices));
  const deselectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filteredIndices.forEach((i) => next.delete(i));
      return next;
    });
  };

  const updateCategory = (idx, category) => {
    setTransactions((prev) => prev.map((t, i) => (i === idx ? { ...t, category } : t)));
  };

  const updateTags = (idx, tags) => {
    setTransactions((prev) => prev.map((t, i) => (i === idx ? { ...t, tags } : t)));
  };

  const selectedCount = filteredIndices.filter((i) => selected.has(i)).length;
  const totalSelected = [...selected].length;
  const selectedTotal = transactions
    .filter((_, i) => selected.has(i))
    .reduce((sum, t) => sum + t.amount, 0);

  const handleSave = async () => {
    const toSave = transactions.filter((_, i) => selected.has(i));
    if (toSave.length === 0) {
      setToast({ message: 'No transactions selected', type: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const result = await saveBulkExpenses(toSave);
      setToast({ message: result.message || `${result.count} expenses imported!`, type: 'success' });
      setStep(STEPS.DONE);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to save transactions',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep(STEPS.UPLOAD);
    setTransactions([]);
    setSelected(new Set());
    setSummary(null);
    setTypeFilter('all');
    setError('');
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Import Bank Statement</h1>

      {/* Step 1: Upload */}
      {step === STEPS.UPLOAD && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
            dragOver ? 'border-primary-500 bg-primary-50' : 'border-slate-300 bg-white'
          }`}
        >
          <svg className="mb-4 h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="mb-2 text-lg font-medium text-slate-700">
            {loading ? 'Parsing file...' : 'Drop your bank statement here'}
          </p>
          <p className="mb-4 text-sm text-slate-500">CSV or PDF (max 5MB) — SBI format supported</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Choose File'}
          </button>
          <input ref={fileRef} type="file" accept=".csv,.pdf" onChange={onFileChange} className="hidden" />
          {error && <p className="mt-4 text-sm font-medium text-danger-600">{error}</p>}
        </div>
      )}

      {/* Step 2: Preview */}
      {step === STEPS.PREVIEW && (
        <div>
          {/* Summary cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Total" value={summary?.total || 0} />
            <SummaryCard label="Debits" value={summary?.debits || 0} color="text-danger-600" />
            <SummaryCard label="Credits" value={summary?.credits || 0} color="text-success-600" />
            <SummaryCard label="Selected" value={totalSelected} color="text-primary-600" />
          </div>

          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-lg border border-slate-200 p-0.5">
              {['all', 'debit', 'credit'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    typeFilter === f
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button onClick={selectAll} className="text-xs font-medium text-primary-600 hover:text-primary-800">
              Select All ({filteredIndices.length})
            </button>
            <button onClick={deselectAll} className="text-xs font-medium text-slate-500 hover:text-slate-700">
              Deselect All
            </button>
            <div className="ml-auto text-sm text-slate-500">
              Selected total: <span className="font-semibold text-slate-800">{formatCurrency(selectedTotal)}</span>
            </div>
          </div>

          {/* Transactions table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedCount === filteredIndices.length && filteredIndices.length > 0}
                      onChange={() => selectedCount === filteredIndices.length ? deselectAll() : selectAll()}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3 min-w-[200px]">Description</th>
                  <th className="px-3 py-3 min-w-[150px]">Category</th>
                  <th className="px-3 py-3 min-w-[180px]">Tags</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIndices.map((idx) => {
                  const txn = transactions[idx];
                  const isUncategorized = txn.category === 'Uncategorized';
                  return (
                    <tr key={idx} className={`${selected.has(idx) ? 'bg-primary-50/40' : ''} hover:bg-slate-50`}>
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selected.has(idx)}
                          onChange={() => toggleRow(idx)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            txn.type === 'debit'
                              ? 'bg-danger-50 text-danger-700'
                              : 'bg-success-50 text-success-700'
                          }`}
                        >
                          {txn.type === 'debit' ? 'DR' : 'CR'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{formatDate(txn.date)}</td>
                      <td className="px-3 py-2.5 text-slate-800 max-w-[250px] truncate" title={txn.description}>
                        {txn.description}
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={txn.category}
                          onChange={(e) => updateCategory(idx, e.target.value)}
                          className={`w-full rounded-md border px-2 py-1 text-sm ${
                            isUncategorized
                              ? 'border-warning-400 bg-warning-50 text-warning-700'
                              : 'border-slate-200 text-slate-700'
                          }`}
                        >
                          <option value="Uncategorized">Uncategorized</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          {/* Include auto-detected category if not in user list */}
                          {txn.category !== 'Uncategorized' && !categories.includes(txn.category) && (
                            <option value={txn.category}>{txn.category}</option>
                          )}
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <TagInput tags={txn.tags || []} onChange={(tags) => updateTags(idx, tags)} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium whitespace-nowrap text-slate-800">
                        {formatCurrency(txn.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredIndices.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No transactions match the filter</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || totalSelected === 0}
              className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Importing...' : `Import ${totalSelected} Transaction${totalSelected !== 1 ? 's' : ''}`}
            </button>
            <button
              onClick={reset}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === STEPS.DONE && (
        <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-12">
          <svg className="mb-4 h-16 w-16 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mb-2 text-xl font-semibold text-slate-800">Import Complete!</h2>
          <p className="mb-6 text-sm text-slate-500">Your transactions have been added successfully.</p>
          <button
            onClick={reset}
            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            Import Another Statement
          </button>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
}

function SummaryCard({ label, value, color = 'text-slate-800' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
