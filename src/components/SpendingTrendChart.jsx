import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/formatCurrency';
import { useTheme } from '../context/ThemeContext';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SpendingTrendChart({ history }) {
  const { dark } = useTheme();

  if (!history || history.length === 0) return null;

  const data = [...history]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((h) => ({
      label: `${SHORT_MONTHS[h.month - 1]} ${String(h.year).slice(-2)}`,
      Spent: h.totalSpent,
      Savings: h.totalSavings,
    }));

  const tickColor = dark ? '#94a3b8' : '#64748b';
  const gridColor = dark ? '#334155' : '#e2e8f0';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className={`rounded-lg border px-3 py-2 text-sm shadow-md ${dark ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
        <p className={`mb-1 font-medium ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-2 text-base font-medium text-slate-700 dark:text-slate-300">Spending Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: tickColor }} />
          <YAxis tick={{ fontSize: 12, fill: tickColor }} tickFormatter={(v) => formatCurrency(v)} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="line"
            formatter={(value) => <span className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{value}</span>}
          />
          <Line type="monotone" dataKey="Spent" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Savings" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
