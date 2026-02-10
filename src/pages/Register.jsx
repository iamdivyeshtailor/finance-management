import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Please try again.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 dark:bg-slate-800">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2 dark:text-slate-100">Create Account</h1>
          <p className="text-gray-500 text-center mb-6 dark:text-slate-400">Start tracking your finances</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Repeat your password" />
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium dark:text-blue-400">Sign in</Link>
          </p>
        </div>
      </div>

      {message && <Toast type={message.type} message={message.text} onClose={() => setMessage(null)} />}
    </div>
  );
}
