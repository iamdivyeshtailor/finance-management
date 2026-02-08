export default function ProgressBar({ percentUsed }) {
  const clamped = Math.min(percentUsed, 100);
  const isOver = percentUsed > 100;

  let barColor = 'bg-success-500';
  if (percentUsed > 100) barColor = 'bg-danger-500';
  else if (percentUsed > 70) barColor = 'bg-warning-500';

  return (
    <div className="h-2.5 w-full rounded-full bg-slate-200">
      <div
        className={`h-2.5 rounded-full ${barColor}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
