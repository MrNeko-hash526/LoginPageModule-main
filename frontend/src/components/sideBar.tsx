import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, PlusSquare, LogOut } from 'lucide-react';

type Role = string;

function parseRolesFromToken(token?: string): Role[] {
  if (!token) return [];
  try {
    const parts = token.split('.');
    if (parts.length < 2) return [];
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const raw =
      payload.userTypes ||
      payload.roles ||
      payload.role ||
      payload.user?.roles ||
      payload.user?.userTypes ||
      payload.rolesList ||
      payload.scope ||
      payload.role_name ||
      null;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((r: any) => String(r).toLowerCase());
    if (typeof raw === 'string') {
      return raw.split(/[, ]+/).map(s => s.toLowerCase()).filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

export default function SideBar() {
  const location = useLocation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [collapsed, setCollapsed] = useState(false);
 
  useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    setRoles(parseRolesFromToken(token));
  }, []);

  const isAdminOrManager = roles.includes('admin') || roles.includes('manager');

  const navItem = (to: string, label: string, Icon: any) => {
    // consider root '/' as dashboard as well so active state highlights correctly
    const active =
      location.pathname === to ||
      (to === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard'));

    return (
      <Link
        key={to}
        to={to}
        className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-700 hover:text-white transition-colors
          ${active ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
      >
        <Icon className="w-4 h-4" />
        {!collapsed && <span className="text-sm">{label}</span>}
      </Link>
    );
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/login';
  };

  return (
    <aside className={`flex flex-col bg-gray-800 text-gray-100 ${collapsed ? 'w-16' : 'w-64'} transition-width duration-200 shrink-0`}>
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-sm font-bold">P</div>
          {!collapsed && <div className="text-sm font-semibold">Pipeway</div>}
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-gray-300 hover:text-white p-1 rounded"
          aria-label="Toggle sidebar"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItem('/dashboard', 'Dashboard', Home)}
        {isAdminOrManager && navItem('/manage-users', 'Manage Users', Users)}
        {navItem('/add-user', 'Add User', PlusSquare)}
      </nav>

      <div className="px-3 py-3 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-red-300 hover:bg-gray-700 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-sm">Sign out</span>}
        </button>
      </div>
    </aside>
  );
}