import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/formatCurrency';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function CategoryPieChart({ categories }) {
  const { dark } = useTheme();

  const data = (categories || [])
    .filter((c) => c.spent > 0)
    .map((c) => ({ name: c.name || c.category, value: c.spent }));

  if (data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0];
    return (
      <div className={`rounded-lg border px-3 py-2 text-sm shadow-md ${dark ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}>
        <p className={`font-medium ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{name}</p>
        <p className={dark ? 'text-slate-400' : 'text-slate-500'}>{formatCurrency(value)}</p>
      </div>
    );
  };

  const CenterLabel = ({ viewBox }) => {
    const { cx, cy } = viewBox;
    return (
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
        <tspan x={cx} dy="-0.5em" className="text-xs" fill={dark ? '#94a3b8' : '#64748b'}>Total</tspan>
        <tspan x={cx} dy="1.4em" className="text-sm font-semibold" fill={dark ? '#e2e8f0' : '#1e293b'}>{formatCurrency(total)}</tspan>
      </text>
    );
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-2 text-base font-medium text-slate-700 dark:text-slate-300">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
            {data.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
            <CenterLabel total={total} />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
