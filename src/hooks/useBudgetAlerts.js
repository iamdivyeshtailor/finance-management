import { useState, useMemo } from 'react';

const STORAGE_KEY = 'dismissedBudgetAlerts';

function getDismissed() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export default function useBudgetAlerts(categories) {
  const [dismissed, setDismissed] = useState(getDismissed);

  const alerts = useMemo(() => {
    if (!categories) return [];
    return categories
      .filter((cat) => cat.percentUsed >= 80 && !dismissed.includes(cat.name))
      .map((cat) => ({
        name: cat.name,
        percentUsed: cat.percentUsed,
        level: cat.percentUsed >= 100 ? 'danger' : 'warning',
      }));
  }, [categories, dismissed]);

  const dismissAlert = (name) => {
    const updated = [...dismissed, name];
    setDismissed(updated);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { alerts, dismissAlert };
}
