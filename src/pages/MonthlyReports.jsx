import { useState, useEffect } from 'react';
import { getReportHistory, getMonthlyReport } from '../services/reportService';
import { formatCurrency } from '../utils/formatCurrency';
import { getMonthName } from '../utils/dateHelpers';
import { exportReportToCSV } from '../utils/exportHelpers';
import { exportReportToPDF } from '../utils/pdfHelpers';
import MonthSelector from '../components/MonthSelector';
import SummaryBar from '../components/SummaryBar';
import CategoryPieChart from '../components/CategoryPieChart';
import SpendingTrendChart from '../components/SpendingTrendChart';
import Spinner from '../components/Spinner';

export default function MonthlyReports() {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getReportHistory()
      .then((data) => {
        setHistory(data);
        if (data.length > 0) {
          const first = { month: data[0].month, year: data[0].year };
          setSelected(first);
          return fetchReport(first.month, first.year);
        }
      })
      .catch(() => setError('Failed to load report history.'))
      .finally(() => setLoading(false));
  }, []);

  const fetchReport = async (month, year) => {
    setReportLoading(true);
    setError(null);
    try {
      const data = await getMonthlyReport(month, year);
      setReport(data);
    } catch {
      setError('Failed to load report for this month.');
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  const handleSelect = (sel) => {
    setSelected(sel);
    fetchReport(sel.month, sel.year);
  };

  if (loading) {
    return <Spinner text="Loading reports..." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Monthly Reports</h1>

      {error && (
        <div className="rounded-md bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:bg-danger-900/30 dark:text-danger-300">{error}</div>
      )}

      {history.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No monthly reports yet. Reports are generated when you view a specific month.</p>
      ) : (
        <>
          <MonthSelector months={history} selected={selected} onSelect={handleSelect} />

          {reportLoading && <Spinner text="Loading report..." />}

          {!reportLoading && report && (
            <div className="space-y-6">
              {/* Month heading */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                  {getMonthName(report.month)} {report.year}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportReportToCSV(report)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => exportReportToPDF(report)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Export PDF
                  </button>
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                    report.totalSavings >= 0
                      ? 'bg-success-50 text-success-700'
                      : 'bg-danger-50 text-danger-700'
                  }`}>
                    {report.totalSavings >= 0 ? 'Saved' : 'Overspent'} {formatCurrency(Math.abs(report.totalSavings))}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <SummaryBar
                salary={report.salary}
                totalSpent={report.totalSpent}
                currentSavings={report.totalSavings}
              />

              {/* Category Pie Chart */}
              <CategoryPieChart
                categories={report.categoryBreakdown.map((cb) => ({ name: cb.category, spent: cb.spent }))}
              />

              {/* Category Breakdown */}
              <div>
                <h3 className="mb-3 text-base font-medium text-slate-700 dark:text-slate-300">Category Breakdown</h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium text-right">Limit</th>
                        <th className="px-4 py-3 font-medium text-right">Spent</th>
                        <th className="px-4 py-3 font-medium text-right">Remaining</th>
                        <th className="px-4 py-3 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.categoryBreakdown.map((cat) => {
                        const remaining = cat.limit - cat.spent;
                        const isOver = remaining < 0;
                        return (
                          <tr key={cat.category} className="border-b border-slate-50 last:border-0 dark:border-slate-700">
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{cat.category}</td>
                            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatCurrency(cat.limit)}</td>
                            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{formatCurrency(cat.spent)}</td>
                            <td className={`px-4 py-3 text-right font-medium ${isOver ? 'text-danger-600' : 'text-success-600'}`}>
                              {formatCurrency(remaining)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {isOver ? (
                                <span className="rounded-full bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-600 dark:bg-danger-900/30 dark:text-danger-400">Over</span>
                              ) : cat.spent === 0 ? (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400 dark:bg-slate-700 dark:text-slate-500">Unused</span>
                              ) : (
                                <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600 dark:bg-success-900/30 dark:text-success-400">OK</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Spending Trend Chart */}
              <SpendingTrendChart history={history} />

              {/* History List */}
              <div>
                <h3 className="mb-3 text-base font-medium text-slate-700 dark:text-slate-300">All Months</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {history.map((entry) => (
                    <button
                      key={`${entry.month}-${entry.year}`}
                      onClick={() => handleSelect({ month: entry.month, year: entry.year })}
                      className={`rounded-lg border p-4 text-left shadow-sm ${
                        selected?.month === entry.month && selected?.year === entry.year
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-slate-200 bg-white hover:border-primary-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-600'
                      }`}
                    >
                      <p className="font-medium text-slate-800 dark:text-slate-200">{getMonthName(entry.month)} {entry.year}</p>
                      <div className="mt-1 flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Spent: {formatCurrency(entry.totalSpent)}</span>
                        <span className={entry.totalSavings >= 0 ? 'text-success-600' : 'text-danger-600'}>
                          {formatCurrency(entry.totalSavings)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
