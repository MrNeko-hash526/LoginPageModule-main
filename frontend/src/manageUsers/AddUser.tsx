import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

interface UserGroup { id: string; name: string; }
interface User { id: string; _id?: string; name: string; email: string; firstName: string; lastName: string; phoneNo?: string; phone_no?: string; }  // Changed from Contact
interface Company { id: string; name: string; parentId?: string; }

interface NewUserForm {
  firstName: string; lastName: string; email: string; confirmEmail: string;
  phoneNo?: string; role: string; userGroup?: string; isActive: boolean;
}
interface ExistingUserForm {
  existingUserId: string; role: string; userGroup?: string; isActive: boolean;  // Changed from existingContactId
}

// Define user groups as a constant array (or enum)
const USER_GROUPS = [
  { id: '1', name: 'Admin Group' },
  { id: '2', name: 'Sales Team' },
  { id: '3', name: 'IT Department' }
];

// If you prefer an enum for type safety:
// enum UserGroupEnum {
//   AdminGroup = 'Admin Group',
//   SalesTeam = 'Sales Team',
//   ITDepartment = 'IT Department'
// }
// const USER_GROUPS = Object.values(UserGroupEnum).map((name, index) => ({ id: (index + 1).toString(), name }));

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);  // Changed from existingContacts
  const [companies, setCompanies] = useState<Company[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    companyId: '',
    existingUserId: '',  // Changed from existingContactId
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    phoneNo: '',
    role: '',
    userGroup: '',
    isActive: true
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUsers();  // Changed from fetchExistingContacts
    fetchCompanies();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        console.log('API response:', data); // Debug log
        setUsers(data.users || []);
        console.log('Users state set to:', data.users); // Debug log
      } else {
        console.error('Failed to fetch users, status:', res.status);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/companies', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCompanies((await res.json()).companies || []);
    } catch {}
  };

  const handleExistingUserChange = (userId: string) => {
    console.log('Selected userId:', userId);
    console.log('Available users:', users);
    
    if (!userId) return; // Guard against empty selection
    
    const selectedUser = users.find(u => ((u._id ?? u.id).toString() === userId.toString())); // Use _id if present, otherwise fallback to id
    console.log('Found user:', selectedUser);
    
    if (selectedUser) {
      setFormData({
        ...formData,
        existingUserId: userId,
        firstName: selectedUser.firstName || '',
        lastName: selectedUser.lastName || '',
        email: selectedUser.email || '',
        phoneNo: selectedUser.phone_no || ''
      });
      console.log('Form data updated');
    } else {
      console.log('User not found for ID:', userId);
    }
  };

  const getCompanyOptions = () => {
    return companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>);
  };

  const newUserSchema = yup.object().shape({
    companyId: yup.string().required('Company is required'),  // Updated message
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    confirmEmail: yup.string().oneOf([yup.ref('email')], 'Emails must match').required('Confirm email is required'),
    phoneNo: yup.string().required('Phone is required').matches(/^\d{10}$/, 'Must be 10 digits'),
    role: yup.string().required('Role is required'),
    userGroup: yup.string().required('User group is required'),
    isActive: yup.boolean().oneOf([true], 'Must be active')
  });
  const existingUserSchema = yup.object().shape({
    companyId: yup.string().required('Company is required'),  // Updated message
    existingUserId: yup.string().required('Existing user is required'),  // Changed from existingContactId
    role: yup.string().required('Role is required'),
    userGroup: yup.string().required('User group is required'),
    isActive: yup.boolean().oneOf([true], 'Must be active')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const isExisting = formData.existingUserId.trim() !== '';  // Changed from existingContactId
      const schema = isExisting ? existingUserSchema : newUserSchema;
      const validated = await schema.validate(formData, { abortEarly: false });

      setIsSubmitting(true);
      const token = localStorage.getItem('token');

      let payload: NewUserForm | ExistingUserForm;
      if (isExisting) {
        const v = validated as ExistingUserForm;
        payload = {
          existingUserId: v.existingUserId,  // Changed from existingContactId
          role: v.role,
          userGroup: v.userGroup,
          isActive: v.isActive
        };
      } else {
        const v = validated as NewUserForm;
        payload = {
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          confirmEmail: v.confirmEmail,  // Fixed typo
          phoneNo: v.phoneNo,
          role: v.role,
          userGroup: v.userGroup,
          isActive: v.isActive
        };
      }

      const companyId = (validated as any).companyId;
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...payload, companyId })
      });
      if (!res.ok) throw new Error('Failed to create user');
      alert('User registered successfully!');
      navigate('/manage-users');
    } catch (err: any) {
      if (err.name === 'ValidationError') {
        const obj: Record<string, string> = {};
        err.inner.forEach((e: any) => { obj[e.path] = e.message; });
        setErrors(obj);
      } else {
        alert(err.message || 'Error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      companyId: '',
      existingUserId: '',  // Changed from existingContactId
      firstName: '',
      lastName: '',
      email: '',
      confirmEmail: '',
      phoneNo: '',
      role: '',
      userGroup: '',
      isActive: true
    });
    setErrors({});
  };

  const clearError = (field: string) => errors[field] && setErrors({ ...errors, [field]: '' });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white text-sm font-bold">AU</div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Register User</h1>
                <p className="text-xs text-gray-600">Add a new user with role and group</p>
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
            {/* Row 1: Type, Existing Users */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company: <span className="text-red-600">*</span></label> 
                <select
                  value={formData.companyId}
                  onChange={(e) => { setFormData({ ...formData, companyId: e.target.value }); clearError('companyId'); }}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Select</option>
                  {getCompanyOptions()}
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
                    <option key={u._id} value={u._id}>  {/* Use _id for both key and value */}
                      {`${u.firstName} ${u.lastName}`}  {/* Create name from firstName + lastName */}
                    </option>
                  ))}
                </select>
                {errors.existingUserId && <p className="text-red-600 text-xs mt-1">{errors.existingUserId}</p>}
              </div>
            </div>

            {/* Read-only fields for existing user */}
            {formData.existingUserId && (  // Show only if user selected
              <>
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Name:</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    readOnly
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name:</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    readOnly
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email:</label>
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number:</label>
                  <input
                    type="text"
                    value={formData.phoneNo}
                    readOnly
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm"
                  />
                </div>
              </>
            )}

            {/* Row 2: First, Last (hide if existing user selected) */}
            {!formData.existingUserId && (  // Hide if existing user is selected
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
            )}

            {/* Row 3: Email, Confirm Email (hide if existing user selected) */}
            {!formData.existingUserId && (  // Hide if existing user is selected
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
            )}

            {/* Row 4: Phone, Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {!formData.existingUserId && (  // Hide phone if existing user selected
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
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role: <span className="text-red-600">*</span></label>
                <select
                  value={formData.role}
                  onChange={(e) => { setFormData({ ...formData, role: e.target.value }); clearError('role'); }}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Select</option>
                  <option value="admin">System Administrator</option>
                  <option value="manager">Department Manager</option>
                  <option value="executive">Executive User</option>
                  <option value="user">Standard User</option>
                </select>
                {errors.role && <p className="text-red-600 text-xs mt-1">{errors.role}</p>}
              </div>
            </div>

            {/* Row 5: User Group, Active */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">User Group: <span className="text-red-600">*</span></label>
                <select
                  value={formData.userGroup}
                  onChange={(e) => { setFormData({ ...formData, userGroup: e.target.value }); clearError('userGroup'); }}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">None Selected</option>
                  {USER_GROUPS.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                </select>
                {errors.userGroup && <p className="text-red-600 text-xs mt-1">{errors.userGroup}</p>}
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