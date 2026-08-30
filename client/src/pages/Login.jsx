import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate(location.state?.from || '/', { replace: true });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) setError(result.error);
    else navigate('/');
  }

  function quickFill(demoEmail) {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-brand-600 text-white rounded-lg p-2">
            <FileText size={22} />
          </div>
          <span className="text-2xl font-semibold text-gray-800">DocSpace</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 bg-brand-50 border border-brand-100 rounded-lg p-4 text-xs text-gray-600 space-y-2">
          <p className="font-medium text-gray-700">Demo accounts (seeded)</p>
          <button type="button" onClick={() => quickFill('alice@example.com')} className="block w-full text-left hover:text-brand-700">
            <span className="font-medium">alice@example.com</span> — owns a sample document
          </button>
          <button type="button" onClick={() => quickFill('bob@example.com')} className="block w-full text-left hover:text-brand-700">
            <span className="font-medium">bob@example.com</span> — has shared editor access
          </button>
          <p className="text-gray-400">Password for both: password123</p>
        </div>
      </div>
    </div>
  );
}
