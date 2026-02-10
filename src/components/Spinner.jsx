export default function Spinner({ text = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 py-8">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 dark:border-slate-600 dark:border-t-primary-400" />
      <span className="text-sm text-slate-500 dark:text-slate-400">{text}</span>
    </div>
  );
}
