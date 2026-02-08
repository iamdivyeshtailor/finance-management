import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/add', label: 'Add Expense' },
  { to: '/history', label: 'History' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-sm font-medium ${
      isActive
        ? 'bg-primary-700 text-white'
        : 'text-primary-100 hover:bg-primary-500 hover:text-white'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-primary-600 shadow-md">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="text-lg font-bold text-white">
            Finance Manager
          </NavLink>

          {/* Desktop links */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === '/'}>
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center justify-center rounded-md p-2 text-primary-100 hover:bg-primary-500 hover:text-white md:hidden"
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

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-primary-500 md:hidden">
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
          </div>
        </div>
      )}
    </nav>
  );
}
