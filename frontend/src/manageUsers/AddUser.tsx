import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

interface UserGroup { id: string; name: string; }
interface Contact { id: string; name: string; email: string; }
interface Company { id: string; name: string; parentId?: string; }

interface NewUserForm {
  firstName: string; lastName: string; email: string; confirmEmail: string;
  phoneNo?: string; role: string; userGroup?: string; isActive: boolean;
}
interface ExistingUserForm {
  existingContactId: string; role: string; userGroup?: string; isActive: boolean;
}

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [existingContacts, setExistingContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    companyId: '',
    existingContactId: '',
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
    fetchUserGroups();
    fetchExistingContacts();
    fetchCompanies();
  }, []);

  const fetchUserGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/user-groups', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUserGroups((await res.json()).userGroups || []);
    } catch {}
  };
  const fetchExistingContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/contacts', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setExistingContacts((await res.json()).contacts || []);
    } catch {}
  };
  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/companies', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCompanies((await res.json()).companies || []);
    } catch {}
  };

  const getCompanyOptions = () => {
    const parent = companies.filter(c => !c.parentId);
    const subs = companies.filter(c => c.parentId);
    const out: React.ReactElement[] = [];
    parent.forEach(p => {
      out.push(<option key={p.id} value={p.id}>{p.name}</option>);
      subs.filter(s => s.parentId === p.id).forEach(s => {
        out.push(<option key={s.id} value={s.id}>&nbsp;&nbsp;└─ {s.name}</option>);
      });
    });
    return out;
  };

  const newUserSchema = yup.object().shape({
    companyId: yup.string().required('Type is required'),
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
    companyId: yup.string().required('Type is required'),
    existingContactId: yup.string().required('Existing contact is required'),
    role: yup.string().required('Role is required'),
    userGroup: yup.string().required('User group is required'),
    isActive: yup.boolean().oneOf([true], 'Must be active')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      const isExisting = formData.existingContactId.trim() !== '';
      const schema = isExisting ? existingUserSchema : newUserSchema;
      const validated = await schema.validate(formData, { abortEarly: false });

      setIsSubmitting(true);
      const token = localStorage.getItem('token');

      let payload: NewUserForm | ExistingUserForm;
      if (isExisting) {
        const v = validated as ExistingUserForm;
        payload = {
          existingContactId: v.existingContactId,
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
          confirmEmail: v.confirmEmail,
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
      existingContactId: '',
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
            {/* Row 1: Type, Existing Contacts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Type: <span className="text-red-600">*</span></label>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Existing Contacts:</label>
                <select
                  value={formData.existingContactId}
                  onChange={(e) => { setFormData({ ...formData, existingContactId: e.target.value }); clearError('existingContactId'); }}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">Select Existing Contact</option>
                  {existingContacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.email}</option>
                  ))}
                </select>
                {errors.existingContactId && <p className="text-red-600 text-xs mt-1">{errors.existingContactId}</p>}
              </div>
            </div>

            {/* Row 2: First, Last */}
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

            {/* Row 3: Email, Confirm Email */}
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

            {/* Row 4: Phone, Role */}
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
                  {userGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
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