import { getMonthName } from '../utils/dateHelpers';

export default function MonthSelector({ months, selected, onSelect }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Select Month</label>
      <select
        value={selected ? `${selected.month}-${selected.year}` : ''}
        onChange={(e) => {
          const [m, y] = e.target.value.split('-').map(Number);
          onSelect({ month: m, year: y });
        }}
        className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
      >
        <option value="">-- Choose a month --</option>
        {months.map((entry) => (
          <option key={`${entry.month}-${entry.year}`} value={`${entry.month}-${entry.year}`}>
            {getMonthName(entry.month)} {entry.year}
          </option>
        ))}
      </select>
    </div>
  );
}
