import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/history', label: 'History' },
  { to: '/import', label: 'Import' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-sm font-medium ${
      isActive
        ? 'bg-primary-700 text-white'
        : 'text-primary-100 hover:bg-primary-500 hover:text-white'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-primary-600 shadow-md dark:bg-slate-800">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="text-lg font-bold text-white">
            Finance Manager
          </NavLink>

          {/* Desktop links + user */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === '/'}>
                {link.label}
              </NavLink>
            ))}
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="ml-2 rounded-md p-2 text-primary-100 hover:bg-primary-500 hover:text-white dark:hover:bg-slate-700"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {user && (
              <div className="ml-3 flex items-center gap-2 border-l border-primary-500 pl-3 dark:border-slate-600">
                <span className="text-sm text-primary-100">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-primary-100 hover:bg-primary-500 hover:text-white dark:hover:bg-slate-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={toggleTheme}
              className="rounded-md p-2 text-primary-100 hover:bg-primary-500 hover:text-white dark:hover:bg-slate-700"
            >
              {dark ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center justify-center rounded-md p-2 text-primary-100 hover:bg-primary-500 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-primary-500 dark:border-slate-600 md:hidden">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClass}
                end={link.to === '/'}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {user && (
              <div className="border-t border-primary-500 dark:border-slate-600 mt-2 pt-2">
                <span className="block px-3 py-1 text-sm text-primary-200">{user.name}</span>
                <button
                  onClick={() => { setOpen(false); handleLogout(); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-primary-100 hover:bg-primary-500 hover:text-white dark:hover:bg-slate-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
