import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getMonthName } from './dateHelpers';

export function exportReportToPDF(report) {
  const doc = new jsPDF();
  const title = `${getMonthName(report.month)} ${report.year} — Finance Report`;

  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Summary
  doc.setFontSize(11);
  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
  doc.text(`Salary: ${fmt(report.salary)}`, 14, 32);
  doc.text(`Total Spent: ${fmt(report.totalSpent)}`, 14, 39);
  doc.text(`Savings: ${fmt(report.totalSavings)}`, 14, 46);

  // Category table
  const rows = report.categoryBreakdown.map((cat) => {
    const remaining = cat.limit - cat.spent;
    const status = remaining < 0 ? 'Over' : cat.spent === 0 ? 'Unused' : 'OK';
    return [cat.category, fmt(cat.limit), fmt(cat.spent), fmt(remaining), status];
  });

  autoTable(doc, {
    startY: 54,
    head: [['Category', 'Limit', 'Spent', 'Remaining', 'Status']],
    body: rows,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`report-${report.month}-${report.year}.pdf`);
}
