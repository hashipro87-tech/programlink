// DemoSidebar — Sidebar for demo pages (no auth dependency)
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function DemoSidebar({ navItems = [], role }) {
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center shadow">
          <svg className="w-4 h-4 text-white" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 26H17a6 6 0 0 1 0-12h2" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M25 18h2a6 6 0 0 1 0 12h-2" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <line x1="18.5" y1="22" x2="25.5" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="font-bold text-gray-900 text-sm">CACFPLink</span>
      </div>

      {/* Nav links */}
      <ul className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map(({ label, path, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
              onClick={() => setOpen(false)}
            >
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Demo user footer */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold uppercase">
            D
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">Demo User</p>
            <p className="text-xs text-gray-400 capitalize truncate">{role}</p>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="sm:hidden fixed top-10 left-4 z-50 p-2 bg-white rounded-lg shadow border border-gray-200"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-40 flex">
          <div className="w-64 bg-white border-r border-gray-200 h-full shadow-xl">{nav}</div>
          <div className="flex-1 bg-black/20" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden sm:flex flex-col w-56 bg-white border-r border-gray-200 h-screen sticky top-0">
        {nav}
      </aside>
    </>
  );
}
