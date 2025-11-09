import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './Login/Login';
import ManageUser from './manageUsers/ManageUser';
import AddUser from './manageUsers/AddUser';
import ResetPassword from './resetPassword/resetPassword';
import ForgotPassword from './Login/forgetPassword';  // Add this import

function Home() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Instead of redirecting to dashboards, render ManageUser as the default page
  return <ManageUser />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/manage-users" element={<ManageUser />} />
        <Route path="/add-user" element={<AddUser />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />  {/* Add this route */}
      </Routes>
    </BrowserRouter>
  );
}
