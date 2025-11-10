import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login/Login';
import ManageUser from './manageUsers/ManageUser';
import AddUser from './manageUsers/AddUser';
import ResetPassword from './resetPassword/resetPassword';
import ForgotPassword from './Login/forgetPassword';
import Layout from '../layout/layout';
import Dashboard from './dashboard/Dashboard'; // added

function Home() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Dashboard />; // default landing -> dashboard (accessible to all roles)
}

export default function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        {/* routes without navbar */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* routes wrapped by Layout (Navbar + Sidebar + Outlet) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} /> {/* added dashboard route */}
          <Route path="/manage-users" element={<ManageUser />} />
          <Route path="/add-user" element={<AddUser />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
