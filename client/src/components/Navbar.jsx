import { FileText, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-brand-600 text-white rounded-lg p-1.5">
            <FileText size={18} />
          </div>
          <span className="font-semibold text-gray-800">DocSpace</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
