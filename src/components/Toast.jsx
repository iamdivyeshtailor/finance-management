import { useEffect } from 'react';

const styles = {
  success: 'bg-success-600 text-white',
  error: 'bg-danger-600 text-white',
  warning: 'bg-warning-500 text-white',
};

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 rounded-lg px-5 py-3 shadow-lg ${styles[type] || styles.success}`}>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
