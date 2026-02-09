import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ExpenseHistory from './pages/ExpenseHistory';
import Settings from './pages/Settings';
import MonthlyReports from './pages/MonthlyReports';
import BulkImport from './pages/BulkImport';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex min-h-screen flex-col bg-slate-50">
                  <Navbar />
                  <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/history" element={<ExpenseHistory />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/reports" element={<MonthlyReports />} />
                      <Route path="/import" element={<BulkImport />} />
                    </Routes>
                  </main>
                  <footer className="border-t border-slate-200 py-4 text-center text-sm text-slate-400">
                    Finance Manager &copy; {new Date().getFullYear()}
                  </footer>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
