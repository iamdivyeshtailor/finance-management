import { useState } from 'react';
import { getTodayString } from '../utils/dateHelpers';

export default function ExpenseForm({ categories, onSubmit, submitting }) {
  const [date, setDate] = useState(getTodayString());
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!date) errs.date = 'Date is required.';
    if (!category) errs.category = 'Please select a category.';
    if (!amount || Number(amount) <= 0) errs.amount = 'Amount must be greater than 0.';
    if (!description.trim()) errs.description = 'Description is required.';
    else if (description.trim().length > 200) errs.description = 'Description must be 200 characters or less.';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSubmit({
      date,
      category,
      amount: Number(amount),
      description: description.trim(),
    });
  };

  const inputClass = (field) =>
    `mt-1 w-full rounded-md border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 ${
      errors[field]
        ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
        : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-600">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass('date')}
        />
        {errors.date && <p className="mt-1 text-xs text-danger-600">{errors.date}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-600">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass('category')}
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.name} value={cat.name}>{cat.name}</option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-xs text-danger-600">{errors.category}</p>}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-600">Amount (INR)</label>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass('amount')}
          placeholder="e.g. 500"
        />
        {errors.amount && <p className="mt-1 text-xs text-danger-600">{errors.amount}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-600">Description</label>
        <input
          type="text"
          maxLength={200}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass('description')}
          placeholder="e.g. Dinner with friends"
        />
        <div className="mt-1 flex justify-between">
          {errors.description
            ? <p className="text-xs text-danger-600">{errors.description}</p>
            : <span />}
          <span className="text-xs text-slate-400">{description.length}/200</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
}
