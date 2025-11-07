import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './Login/Login';
import ManageUser from './manageUsers/ManageUser'; // Add this import
import AddUser from './manageUsers/AddUser'; // Add this import


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
        <Route path="/manage-users" element={<ManageUser />} /> {/* Keep this route */}
        <Route path="/add-user" element={<AddUser />} /> {/* Keep this route */}
        {/* Remove dashboard routes since we're not using them */}
      </Routes>
    </BrowserRouter>
  );
}
