import React, { useEffect, useState } from 'react';
import { Menu, X, User, Settings, LogOut, Bell, Command } from 'lucide-react';

export default function NavBar(): React.ReactElement {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [unread, setUnread] = useState(3);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandOpen(false);
        setIsUserOpen(false);
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const signOut = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <>
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-lg font-semibold text-gray-100">Pipeway</div>
                <div className="text-xs text-gray-400">Admin dashboard</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setIsCommandOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-700 bg-gray-800 text-sm text-gray-100 hover:shadow-sm"
                aria-label="Open navigation"
              >
                <Command className="w-4 h-4 text-gray-200" />
                <span className="hidden lg:inline">Navigation</span>
                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-gray-700 rounded text-gray-100">⌘K</kbd>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-200 hover:bg-gray-700"
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                <Command className="w-5 h-5" />
              </button>

              <button
                className="relative p-2 rounded-md text-gray-200 hover:bg-gray-700"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold text-white bg-blue-500 rounded-full">
                    {unread}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsUserOpen(prev => !prev)}
                  className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-700"
                  aria-haspopup="true"
                  aria-expanded={isUserOpen}
                >
                  <User className="w-5 h-5 text-gray-200" />
                  <span className="hidden sm:inline text-sm text-gray-100">Sid</span>
                </button>

                {isUserOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-gray-800 border border-gray-700 rounded-md shadow-lg overflow-hidden z-50">
                    <button
                      onClick={() => { /* profile */ setIsUserOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button
                      onClick={() => { /* settings */ setIsUserOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <div className="border-t border-gray-700" />
                    <button
                      onClick={signOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>

              <button
                className="md:hidden p-2 rounded-md text-gray-200 hover:bg-gray-700"
                onClick={() => setIsMobileOpen(prev => !prev)}
                aria-label="Toggle menu"
              >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {isMobileOpen && (
            <nav className="md:hidden mt-2 border-t border-gray-700 py-3">
              <div className="flex flex-col gap-2 px-2">
                <button onClick={() => { setIsCommandOpen(true); setIsMobileOpen(false); }} className="text-left px-3 py-2 rounded hover:bg-gray-700 text-gray-100">
                  <Command className="inline w-4 h-4 mr-2" /> Open Navigation
                </button>
                <button onClick={() => { setIsUserOpen(true); setIsMobileOpen(false); }} className="text-left px-3 py-2 rounded hover:bg-gray-700 text-gray-100">
                  <User className="inline w-4 h-4 mr-2" /> Profile
                </button>
                <button onClick={signOut} className="text-left px-3 py-2 rounded hover:bg-gray-700 text-red-400">
                  <LogOut className="inline w-4 h-4 mr-2" /> Sign Out
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Simple command modal */}
      {isCommandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-xl bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
            <div className="p-3 border-b border-gray-700 flex items-center gap-2">
              <Command className="w-4 h-4 text-gray-200" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to navigate or press Esc to close"
                className="w-full bg-transparent outline-none text-gray-100 placeholder-gray-400"
              />
              <button onClick={() => setIsCommandOpen(false)} className="text-gray-400 hover:text-gray-200">Close</button>
            </div>

            <div className="p-3">
              <div className="text-xs text-gray-400 mb-2">Quick actions</div>
              <ul className="space-y-1">
                <li>
                  <a href="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-700 text-gray-100">Dashboard</a>
                </li>
                <li>
                  <a href="/manage-users" className="block px-3 py-2 rounded hover:bg-gray-700 text-gray-100">Manage Users</a>
                </li>
                <li>
                  <a href="/add-user" className="block px-3 py-2 rounded hover:bg-gray-700 text-gray-100">Add User</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
