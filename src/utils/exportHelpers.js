import { formatDate } from './dateHelpers';

export function exportToCSV(expenses, filename = 'expenses.csv') {
  const headers = ['Date', 'Category', 'Description', 'Tags', 'Amount'];
  const rows = expenses.map((e) => [
    formatDate(e.date),
    e.category,
    `"${(e.description || '').replace(/"/g, '""')}"`,
    (e.tags || []).join('; '),
    e.amount,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportReportToCSV(report) {
  const headers = ['Category', 'Limit', 'Spent', 'Remaining', 'Status'];
  const rows = report.categoryBreakdown.map((cat) => {
    const remaining = cat.limit - cat.spent;
    const status = remaining < 0 ? 'Over' : cat.spent === 0 ? 'Unused' : 'OK';
    return [cat.category, cat.limit, cat.spent, remaining, status];
  });

  const summary = [
    '',
    ['Salary', report.salary],
    ['Total Spent', report.totalSpent],
    ['Total Savings', report.totalSavings],
  ];

  const csv = [
    headers.join(','),
    ...rows.map((r) => r.join(',')),
    '',
    'Summary',
    ...summary.filter(Boolean).map((r) => r.join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `report-${report.month}-${report.year}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
