import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Zap, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ navItems = [] }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [open, setOpen]  = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const nav = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center shadow">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-sm">CACFPLink</span>
      </div>

      {/* Nav links */}
      <ul className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map(({ label, path, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              end={navItems.some((n) => n.path !== path && path.startsWith(n.path))}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* User + logout */}
      <div className="border-t border-gray-100 px-4 py-3">
        {user && (
          <p className="text-xs text-gray-400 mb-2 truncate">{user.email}</p>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex flex-col w-56 shrink-0 bg-white border-r border-gray-100 h-screen sticky top-0">
        {nav}
      </aside>

      {/* Mobile top bar */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm text-gray-900">CACFPLink</span>
        </div>
        <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-white h-full flex flex-col shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
