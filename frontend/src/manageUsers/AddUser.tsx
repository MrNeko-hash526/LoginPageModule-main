import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

interface UserGroup { id: string; name: string; }
interface User { id: string; _id?: string; name: string; email: string; firstName: string; lastName: string; phoneNo?: string; phone_no?: string; }
interface Company { id: string; name: string; parentId?: string; }
interface Role { id: string; name: string; }

interface NewUserForm {
  companyId: string;
  firstName: string; lastName: string; email: string; confirmEmail: string;
  phoneNo?: string; role: string; userGroup: string[]; isActive: boolean;
}
interface ExistingUserForm {
  companyId: string;
  existingUserId: string; role: string; userGroup?: string[]; isActive: boolean;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const MAX_TOAST_LENGTH = 140;
  // Add these new state variables for dropdown functionality
  const [showUserGroupDropdown, setShowUserGroupDropdown] = useState(false);
  const [userGroupSearch, setUserGroupSearch] = useState('');

  const [formData, setFormData] = useState({
    companyId: '',
    existingUserId: '',
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phoneNo: '',
    role: '',
    userGroup: [] as string[],
    isActive: true
  });

  // Single declaration of filteredUserGroups
  const filteredUserGroups = userGroups.filter(group =>
    group.name.toLowerCase().includes(userGroupSearch.toLowerCase())
  );

  // Toast functions
  // normalize and trim messages, limit length
  const normalizeMessage = (s: string) => {
    if (!s) return '';
    const oneLine = s.replace(/\s+/g, ' ').trim();
    return oneLine.length > MAX_TOAST_LENGTH ? `${oneLine.slice(0, MAX_TOAST_LENGTH - 3)}...` : oneLine;
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', ttl = 5000) => {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
    const newToast: Toast = { id, message: normalizeMessage(message), type };
    setToasts(prev => {
      // avoid exact duplicates in quick succession
      if (prev.length && prev[prev.length - 1].message === newToast.message && prev[prev.length - 1].type === newToast.type) {
        return prev;
      }
      return [...prev, newToast];
    });
    setTimeout(() => removeToast(id), ttl);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Toast component (dark mode, compact)
  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className={`w-full bg-gray-900 text-white rounded-lg shadow-md ring-1 ring-black/20 overflow-hidden flex`}
        >
          <div className={`w-1 ${toast.type === 'success' ? 'bg-blue-400' : toast.type === 'error' ? 'bg-red-400' : toast.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-300'}`} />
          <div className="flex-1 p-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {toast.type === 'success' && (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"/></svg>
                )}
                {toast.type === 'error' && (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01"/></svg>
                )}
                {toast.type === 'warning' && (
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01"/></svg>
                )}
                {toast.type === 'info' && (
                  <svg className="h-5 w-5 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01"/></svg>
                )}
              </div>
              <div className="flex-1 leading-tight break-words">{toast.message}</div>
              <button
                aria-label="Dismiss"
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-gray-400 hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Authentication required. Please login.', 'error');
      navigate('/login');
      return;
    }
    fetchUsers();
    fetchCompanies();
    fetchUserGroups();
    fetchRoles();
  }, [navigate]);

  // Update the click outside handler to be more specific
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking inside the dropdown or its children
      if (target.closest('.user-group-dropdown')) {
        return;
      }
      
      if (showUserGroupDropdown) {
        setShowUserGroupDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserGroupDropdown]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/adduser/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        // backend may return either array or { users: [...] }
        setUsers(Array.isArray(data) ? data : (data.users || []));
        // avoid noisy toasts on normal loads — show only on error
      } else {
        showToast('Failed to fetch users', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Error loading users', 'error');
    }
  };
 
  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/adduser/companies', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : (data.companies || []));
      } else {
        showToast('Failed to fetch companies', 'error');
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      showToast('Error loading companies', 'error');
    }
  };
 
  const fetchUserGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/adduser/user-groups', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUserGroups(Array.isArray(data) ? data : (data.userGroups || []));
      } else {
        showToast('Failed to fetch user groups', 'error');
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
      showToast('Error loading user groups', 'error');
    }
  };
 
  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/adduser/roles', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setRoles(Array.isArray(data) ? data : (data.roles || []));
      } else {
        showToast('Failed to fetch roles', 'error');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      showToast('Error loading roles', 'error');
    }
  };

  const handleExistingUserChange = (userId: string) => {
    if (!userId) return;
    
    const selectedUser = users.find(u => ((u._id ?? u.id).toString() === userId.toString()));
    
    if (selectedUser) {
      setFormData({
        ...formData,
        existingUserId: userId,
        firstName: selectedUser.firstName || '',
        lastName: selectedUser.lastName || '',
        email: selectedUser.email || '',
        phoneNo: selectedUser.phone_no || ''
      });
      showToast(`Selected user: ${selectedUser.firstName} ${selectedUser.lastName}`, 'info');
    }
  };

  const handleUserGroupChange = (groupName: string) => {
    const currentGroups = formData.userGroup;
    const isSelected = currentGroups.includes(groupName);
    
    let newGroups;
    if (isSelected) {
      newGroups = currentGroups.filter(g => g !== groupName);
      showToast(`Removed "${groupName}" from selection`, 'info');
    } else {
      newGroups = [...currentGroups, groupName];
      showToast(`Added "${groupName}" to selection`, 'info');
    }
    
    setFormData({ ...formData, userGroup: newGroups });
    clearError('userGroup');
  };

  const newUserSchema = yup.object().shape({
    companyId: yup.string().required('Company is required'),
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    confirmEmail: yup.string().oneOf([yup.ref('email')], 'Emails must match').required('Confirm email is required'),
    phoneNo: yup.string().required('Phone is required').matches(/^\d{10}$/, 'Must be 10 digits'),
    role: yup.string().required('Role is required'),
    userGroup: yup.array().min(1, 'At least one user group is required'),
    isActive: yup.boolean().oneOf([true], 'Must be active')
  });

  const existingUserSchema = yup.object().shape({
    companyId: yup.string().required('Company is required'),
    existingUserId: yup.string().required('Existing user is required'),
    role: yup.string().required('Role is required'),
    isActive: yup.boolean().oneOf([true], 'Must be active')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const isExisting = formData.existingUserId.trim() !== '';
      const schema = isExisting ? existingUserSchema : newUserSchema;
      const validated = await schema.validate(formData, { abortEarly: false });

      setIsSubmitting(true);
      showToast('Creating user...', 'info');
      
      const token = localStorage.getItem('token');

      let payload: any;
      if (isExisting) {
        const v = validated as ExistingUserForm;
        payload = {
          companyId: v.companyId,
          existingUserId: v.existingUserId,
          role: v.role,
          isActive: v.isActive
        };
      } else {
        const v = validated as NewUserForm;
        payload = {
          companyId: v.companyId,
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          confirmEmail: v.confirmEmail,
          phoneNo: v.phoneNo,
          role: v.role,
          userGroup: v.userGroup,
          isActive: v.isActive
        };
      }

      const res = await fetch('/api/adduser/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to create user');
      }
      
      showToast(result.message || 'User created successfully!', 'success');
      
      // Navigate after a short delay to allow user to see the success message
      setTimeout(() => {
        navigate('/manage-users');
      }, 2000);
      
    } catch (err: any) {
      if (err.name === 'ValidationError') {
        const obj: Record<string, string> = {};
        err.inner.forEach((e: any) => { obj[e.path] = e.message; });
        setErrors(obj);
        showToast('Please fix the validation errors', 'error');
      } else {
        showToast(err.message || 'An error occurred while creating user', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      companyId: '',
      existingUserId: '',
      firstName: '',
      lastName: '',
      email: '',
      confirmEmail: '',
      phoneNo: '',
      role: '',
      userGroup: [],
      isActive: true
    });
    setErrors({});
    showToast('Form reset successfully', 'info');
  };

  const clearError = (field: string) => errors[field] && setErrors({ ...errors, [field]: '' });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Toast Container */}
      <ToastContainer />
      
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white text-sm font-bold">AU</div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Register User</h1>
                <p className="text-xs text-gray-600">Add a new user with role and groups</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/manage-users')}
              className="bg-gray-800 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-900"
            >
              View Users
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-800">User Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-4" noValidate>
            {/* Row 1: Company, Existing Users */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company: <span className="text-red-600">*</span></label>
                <select
                  value={formData.companyId}
                  onChange={(e) => { setFormData({ ...formData, companyId: e.target.value }); clearError('companyId'); }}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Select Company</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.companyId && <p className="text-red-600 text-xs mt-1">{errors.companyId}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Existing Users:</label>
                <select
                  value={formData.existingUserId}
                  onChange={(e) => handleExistingUserChange(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Select Existing User</option>
                  {users.map(u => (
                    <option key={u._id || u.id} value={u._id || u.id}>
                      {`${u.firstName} ${u.lastName}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Read-only fields for existing user */}
            {formData.existingUserId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Name:</label>
                  <input type="text" value={formData.firstName} readOnly className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name:</label>
                  <input type="text" value={formData.lastName} readOnly className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email:</label>
                  <input type="email" value={formData.email} readOnly className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number:</label>
                  <input type="text" value={formData.phoneNo} readOnly className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm" />
                </div>
              </div>
            )}

            {/* New user fields */}
            {!formData.existingUserId && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">First Name <span className="text-red-600">*</span></label>
                    <input
                      value={formData.firstName}
                      onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); clearError('firstName'); }}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="First Name"
                    />
                    {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name <span className="text-red-600">*</span></label>
                    <input
                      value={formData.lastName}
                      onChange={(e) => { setFormData({ ...formData, lastName: e.target.value }); clearError('lastName'); }}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Last Name"
                    />
                    {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email <span className="text-red-600">*</span></label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => { setFormData({ ...formData, email: e.target.value }); clearError('email'); }}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Email"
                    />
                    {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Email <span className="text-red-600">*</span></label>
                    <input
                      type="email"
                      value={formData.confirmEmail}
                      onChange={(e) => { setFormData({ ...formData, confirmEmail: e.target.value }); clearError('confirmEmail'); }}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Confirm Email"
                    />
                    {errors.confirmEmail && <p className="text-red-600 text-xs mt-1">{errors.confirmEmail}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone No <span className="text-red-600">*</span></label>
                    <input
                      type="tel"
                      value={formData.phoneNo}
                      onChange={(e) => { setFormData({ ...formData, phoneNo: e.target.value }); clearError('phoneNo'); }}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="10-digit number"
                    />
                    {errors.phoneNo && <p className="text-red-600 text-xs mt-1">{errors.phoneNo}</p>}
                  </div>
                  {/* User Groups - Dropdown Multi-select */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">User Groups: <span className="text-red-600">*</span></label>
                    <div className="relative user-group-dropdown">
                      {/* Main dropdown button */}
                      <div 
                        className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm min-h-[38px] cursor-pointer flex items-center justify-between"
                        onClick={() => setShowUserGroupDropdown(!showUserGroupDropdown)}
                      >
                        <div className="flex flex-wrap gap-1 flex-1">
                          {formData.userGroup.length === 0 ? (
                            <span className="text-gray-400">Select user groups...</span>
                          ) : (
                            formData.userGroup.map(group => (
                              <span key={group} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-sm text-xs flex items-center gap-1">
                                {group}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUserGroupChange(group);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-bold"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                        {/* Dropdown arrow */}
                        <svg 
                          className={`w-4 h-4 transition-transform ${showUserGroupDropdown ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      {/* Dropdown menu */}
                      {showUserGroupDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                          {/* Search input */}
                          <div className="p-2 border-b bg-gray-50">
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search groups..."
                                value={userGroupSearch}
                                onChange={(e) => setUserGroupSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <svg className="absolute left-2 top-1.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                          </div>

                          {/* Select all option */}
                          <div className="p-2 bg-gray-50 border-b">
                            <label className="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={formData.userGroup.length === filteredUserGroups.length && filteredUserGroups.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({ ...formData, userGroup: filteredUserGroups.map(g => g.name) });
                                    showToast(`Selected all ${filteredUserGroups.length} groups`, 'info');
                                  } else {
                                    setFormData({ ...formData, userGroup: [] });
                                    showToast('Cleared all group selections', 'info');
                                  }
                                  clearError('userGroup');
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm font-semibold">Select all ({filteredUserGroups.length})</span>
                            </label>
                          </div>

                          {/* Group options */}
                          <div className="max-h-32 overflow-y-auto">
                            {filteredUserGroups.length > 0 ? (
                              filteredUserGroups.map(g => (
                                <label key={g.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                                  <input
                                    type="checkbox"
                                    checked={formData.userGroup.includes(g.name)}
                                    onChange={(e) => {
                                      console.log('Checkbox changed for:', g.name, 'Checked:', e.target.checked);
                                      handleUserGroupChange(g.name);
                                    }}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">{g.name}</span>
                                </label>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No groups found {userGroups.length === 0 ? '(Loading...)' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {errors.userGroup && <p className="text-red-600 text-xs mt-1">{errors.userGroup}</p>}
                  </div>
                </div>
              </>
            )}

            {/* Role and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role: <span className="text-red-600">*</span></label>
                <select
                  value={formData.role}
                  onChange={(e) => { setFormData({ ...formData, role: e.target.value }); clearError('role'); }}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Select Role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
                {errors.role && <p className="text-red-600 text-xs mt-1">{errors.role}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Activation Status: <span className="text-red-600">*</span></label>
                <label className="flex items-center h-[38px] border border-gray-300 rounded px-3 py-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => { setFormData({ ...formData, isActive: e.target.checked }); clearError('isActive'); }}
                    className="w-4 h-4 text-gray-700 border-gray-300 rounded focus:ring-gray-500"
                  />
                  <span className="ml-2 text-xs text-gray-700">Activate user account</span>
                </label>
                {errors.isActive && <p className="text-red-600 text-xs mt-1">{errors.isActive}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 border-t border-gray-200 pt-4 bg-gray-100 rounded-b-md -mx-4 px-4">
              <div className="flex justify-center gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gray-800 text-white px-6 py-2 rounded text-sm hover:bg-gray-900 disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="border-2 border-gray-400 text-gray-700 px-6 py-2 rounded text-sm hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUser;