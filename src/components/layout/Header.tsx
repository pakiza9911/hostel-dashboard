import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, LogOut, ChevronDown, Building2, Menu } from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import { useData } from '../../stores/dataStore';
import { Avatar } from '../ui/Avatar';
import { useNavigate } from 'react-router-dom';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const { hostels, selectedHostelId, setSelectedHostelId } = useData();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hostelOpen, setHostelOpen] = useState(false);

  if (!user) return null;
  const isSuperAdmin = user.role === 'super_admin';
  const userHostel = hostels.find((h) => h.id === user.hostelId);
  const selectedHostel = isSuperAdmin
    ? hostels.find((h) => h.id === selectedHostelId) ?? null
    : userHostel;

  return (
    <header className="h-16 bg-white border-b border-ink-100 sticky top-0 z-20 flex items-center px-4 sm:px-6 gap-3">
      <button onClick={onMenuClick} className="md:hidden p-2 rounded-lg hover:bg-ink-100">
        <Menu size={20} />
      </button>

      {isSuperAdmin && (
        <div className="relative">
          <button
            onClick={() => setHostelOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-ink-200 hover:bg-ink-50 transition-colors text-sm font-medium"
          >
            <Building2 size={16} className="text-brand-600" />
            <span className="hidden sm:inline">{selectedHostel?.name ?? 'All Hostels'}</span>
            <ChevronDown size={14} className="text-ink-400" />
          </button>
          <AnimatePresence>
            {hostelOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute top-full mt-2 left-0 w-64 card p-2 z-50"
              >
                <button
                  onClick={() => {
                    setSelectedHostelId(null);
                    setHostelOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-ink-50 text-sm font-medium"
                >
                  All Hostels
                </button>
                <div className="h-px bg-ink-100 my-1" />
                {hostels.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setSelectedHostelId(h.id);
                      setHostelOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-ink-50 text-sm"
                  >
                    <span className="truncate">{h.name}</span>
                    <span className="text-xs text-ink-500">{h.city}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="hidden lg:flex flex-1 max-w-md ml-2">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search tenants, rooms, payments..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-ink-50 border border-transparent text-sm focus:outline-none focus:bg-white focus:border-ink-200 transition-all"
          />
        </div>
      </div>

      <div className="flex-1" />

      <button className="relative p-2 rounded-xl hover:bg-ink-100 text-ink-600 transition-colors">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white" />
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 p-1 pr-3 rounded-xl hover:bg-ink-100 transition-colors"
        >
          <Avatar name={user.name} size="sm" />
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-ink-900 leading-tight">{user.name}</div>
            <div className="text-[11px] text-ink-500 capitalize">{user.role.replace('_', ' ')}</div>
          </div>
          <ChevronDown size={14} className="text-ink-400 hidden sm:block" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute top-full mt-2 right-0 w-56 card p-2 z-50"
            >
              <div className="px-3 py-2">
                <div className="text-sm font-semibold text-ink-900">{user.name}</div>
                <div className="text-xs text-ink-500 truncate">{user.email}</div>
              </div>
              <div className="h-px bg-ink-100 my-1" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-ink-50 text-sm"
              >
                Account Settings
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 text-sm text-rose-600"
              >
                <LogOut size={14} /> Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
