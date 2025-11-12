import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, PlusSquare, LogOut, Shield } from 'lucide-react';  // Added Shield for Admin Dashboard

type Role = string;

// Use the SAME parsing logic as App.tsx
function parseRolesFromToken(token?: string): Role[] {
  if (!token) return [];
  try {
    const parts = token.split('.');
    if (parts.length < 2) return [];
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // After role selection, the token should contain ONLY the selected role
    // Check for selectedRole first (this is what should be in token after selection)
    const selectedRole = payload.selectedRole || payload.role_name;
    if (selectedRole) {
      return [String(selectedRole).toLowerCase()];
    }
    
    // Fallback for multiple roles (before selection)
    const raw = payload.roles || payload.userTypes || payload.role || null;
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
    const loadRoles = () => {
      const token = localStorage.getItem('token') || undefined;
      setRoles(parseRolesFromToken(token));
    };

    loadRoles();
    const onAuthChanged = () => loadRoles();
    const onStorage = (e: StorageEvent) => { if (e.key === 'token') loadRoles(); };
    
    window.addEventListener('authChanged', onAuthChanged);
    window.addEventListener('storage', onStorage);
    
    return () => {
      window.removeEventListener('authChanged', onAuthChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Check if user has admin, executive, or manager role based on SELECTED role only
  const hasAdminAccess = roles.some(role => 
    role.includes('admin') || role.includes('executive') || role.includes('manager')
  );

  console.log('🔧 Sidebar roles:', roles, 'hasAdminAccess:', hasAdminAccess);

  const navItem = (to: string, label: string, Icon: any) => {
    // Updated: Consider root '/' and '/dashboard-user' as active for the general dashboard
    const active =
      location.pathname === to ||
      (to === '/dashboard-user' && (location.pathname === '/' || location.pathname === '/dashboard-user'));

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
        {/* General Dashboard: Always available */}
        {navItem('/dashboard-user', 'Dashboard', Home)}
        
        {/* Admin/Executive/Manager only items */}
        {hasAdminAccess && navItem('/dashboard-admin', 'Admin Dashboard', Shield)}
        {hasAdminAccess && navItem('/manage-users', 'Manage Users', Users)}
        {hasAdminAccess && navItem('/add-user', 'Add User', PlusSquare)}
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