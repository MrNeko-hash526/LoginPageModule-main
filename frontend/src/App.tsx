import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login/Login';
import ManageUser from './manageUsers/ManageUser';
import AddUser from './manageUsers/AddUser';
import ResetPassword from './resetPassword/resetPassword';
import ForgotPassword from './Login/forgetPassword';
import Layout from '../layout/layout';
import Dashboard from './dashboard/Dashboard';
import DashboardG from './dashboardG';

type Role = string;

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

// Protected Route Component
function ProtectedRoute({ children, requiredRoles }: { children: React.ReactNode; requiredRoles: string[] }) {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const loadRoles = () => {
      const token = localStorage.getItem('token') || undefined;
      setRoles(parseRolesFromToken(token));
    };

    loadRoles();
    const onAuthChanged = () => loadRoles();
    window.addEventListener('authChanged', onAuthChanged);
    return () => window.removeEventListener('authChanged', onAuthChanged);
  }, []);

  const hasRequiredRole = requiredRoles.some(role => 
    roles.some(userRole => userRole.includes(role.toLowerCase()))
  );

  if (!hasRequiredRole) {
    return <Navigate to="/dashboard-user" replace />;
  }

  return <>{children}</>;
}

function Home() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <DashboardG />;
}

export default function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes without navbar */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Routes wrapped by Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard-user" element={<DashboardG />} />
          <Route 
            path="/dashboard-admin" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-users" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <ManageUser />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-user" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <AddUser />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/add-user/:id" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <AddUser />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/view-user/:id" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'manager']}>
                <AddUser />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
