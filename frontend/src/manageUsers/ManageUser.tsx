import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone_no: string;
  user_group: string;
  role: string;
  isActive: boolean;
  lastLogin: string;
  companies: string;
  roles: string;
  userType: string;
  code: string;
  companyStatus: string;
  isDeleted: boolean; // Added for completeness
}

const ManageUser: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // controls
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // sorting
  const [sortColumn, setSortColumn] = useState<
    'name' | 'email' | 'phone_no' | 'userType' | 'user_group' | 'code' | 'companyStatus' | 'isActive' | 'role'
  >('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // fetch users
  const fetchUsers = async (page = 1) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login'); // Redirect if no token
        return;
      }
      const res = await fetch(`/api/auth/users?page=${page}&limit=${itemsPerPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        // Token expired or invalid, clear and redirect
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(currentPage); }, [currentPage]);

  // filters + sorting (client-side, since pagination is server-side)
  const filteredAndSorted = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const filtered = (users || []).filter(u => {
      const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim().toLowerCase();
      const matchesSearch =
        !q ||
        name.includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q);

      const matchesRole =
        roleFilter === 'all' ||
        (u.role || '').toLowerCase() === roleFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !!u.isActive) ||
        (statusFilter === 'inactive' && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });

    const getVal = (u: User) => {
      switch (sortColumn) {
        case 'name':
          return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim().toLowerCase();
        case 'email':
          return (u.email || '').toLowerCase();
        case 'phone_no':
          return u.phone_no || '';
        case 'userType':
          return u.userType || '';
        case 'user_group':
          return u.user_group || '';
        case 'code':
          return u.code || '';
        case 'companyStatus':
          return u.companyStatus || '';
        case 'isActive':
          return u.isActive ? 1 : 0;
        case 'role':
          return u.role || '';
        default:
          return '';
      }
    };

    filtered.sort((a, b) => {
      const A = getVal(a);
      const B = getVal(b);
      if (A < B) return sortDirection === 'asc' ? -1 : 1;
      if (A > B) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, roleFilter, statusFilter, sortColumn, sortDirection]);

  const handleSort = (
    column: 'name' | 'email' | 'phone_no' | 'userType' | 'user_group' | 'code' | 'companyStatus' | 'isActive' | 'role'
  ) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    // Note: Sorting is client-side; for server-side, would need to refetch with sort params
  };

  // pagination
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filteredAndSorted.slice(0, itemsPerPage); // Since server sends only current page, but filtered client-side

  // actions
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const res = await fetch(`/api/auth/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to update status');
      fetchUsers(currentPage); // Refresh the current page
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Delete ${userName}?`)) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const res = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to delete user');
      fetchUsers(currentPage); // Refresh the current page
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  // New function to resend reset email
  const resendResetEmail = async (userId: string, userEmail: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const res = await fetch(`/api/auth/users/${userId}/resend-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: userEmail }) // Optional, if backend needs email
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to resend reset email');
      alert(`Reset email sent to ${userEmail}`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend reset email');
    }
  };

  const TableSkeleton = () => (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm">
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: 11 }).map((_, i) => (
                <th key={i} className="px-3 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide text-left">
                  &nbsp;
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, r) => (
              <tr key={r} className="animate-pulse">
                {Array.from({ length: 11 }).map((__, c) => (
                  <td key={c} className="px-3 py-2">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <TableSkeleton />
        </div>
      </div>
    );
  }

  const sortIcon = (key:
    'name' | 'email' | 'phone_no' | 'userType' | 'user_group' | 'code' | 'companyStatus' | 'isActive' | 'role'
  ) => sortColumn === key ? (sortDirection === 'asc' ? '▲' : '▼') : '↕';

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-3">
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm px-3 py-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-gray-800">Users</div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder="Search name, email, username"
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
                <span className="absolute left-2 top-1.5 text-gray-400">🔍</span>
              </div>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white"
              >
                <option value="all">All roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="executive">Executive</option>
                <option value="user">User</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={() => navigate('/add-user')}
                className="ml-auto bg-gray-800 text-white text-sm px-3 py-1.5 rounded-md hover:bg-gray-900"
              >
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left uppercase text-[11px] tracking-wide text-gray-600">#</th>

                  <th
                    role="button"
                    aria-sort={sortColumn === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onClick={() => handleSort('name')}
                    className="px-3 py-2 text-left uppercase text-[11px] tracking-wide text-gray-600 cursor-pointer select-none"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>Name</span>
                      <span>{sortIcon('name')}</span>
                    </span>
                  </th>

                  <th
                    role="button"
                    aria-sort={sortColumn === 'email' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onClick={() => handleSort('email')}
                    className="px-3 py-2 text-left uppercase text-[11px] tracking-wide text-gray-600 cursor-pointer select-none"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>Email</span>
                      <span>{sortIcon('email')}</span>
                    </span>
                  </th>

                  <th
                    role="button"
                    aria-sort={sortColumn === 'phone_no' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onClick={() => handleSort('phone_no')}
                    className="px-3 py-2 text-left uppercase text-[11px] tracking-wide text-gray-600 cursor-pointer select-none"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>Phone No.</span>
                      <span>{sortIcon('phone_no')}</span>
                    </span>
                  </th>

                  <th
                    role="button"
                    aria-sort={sortColumn === 'userType' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onClick={() => handleSort('userType')}
                    className="px-3 py-2 text-left uppercase text-[11px] tracking-wide text-gray-600 cursor-pointer select-none"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>User Type</span>
                      <span>{sortIcon('userType')}</span>
                    </span>
                  </th>

                  <th
                    role="button"
                    aria-sort={sortColumn === 'user_group' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onClick={() => handleSort('user_group')}
                    className="px-3 py-2 text-left uppercase text-[11px] tracking-wide text-gray-600 cursor-pointer select-none"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>User Group</span>
                      <span>{sortIcon('user_group')}</span>
                    </span>
                  </th>

                  <th
                    role="button"
                    aria-sort={sortColumn === 'code' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onClick={() => handleSort('code')}
                    className="px-3 py-2 text-left uppercase text-[11px] tracking-wide text-gray-600 cursor-pointer select-none"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>Code</span>
                      <span>{sortIcon('code')}</span>
                    </span>
                  </th>

                  <th
                    role="button"
                    aria-sort={sortColumn === 'companyStatus' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onClick={() => handleSort('companyStatus')}
                    className="px-3 py-2 text-left uppercase text-[11px] tracking-wide text-gray-600 cursor-pointer select-none"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>Company Status</span>
                      <span>{sortIcon('companyStatus')}</span>
                    </span>
                  </th>

                  <th
                    role="button"
                    aria-sort={sortColumn === 'isActive' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onClick={() => handleSort('isActive')}
                    className="px-3 py-2 text-left uppercase text-[11px] tracking-wide text-gray-600 cursor-pointer select-none"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>User Status</span>
                      <span>{sortIcon('isActive')}</span>
                    </span>
                  </th>

                  <th
                    role="button"
                    aria-sort={sortColumn === 'role' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onClick={() => handleSort('role')}
                    className="px-3 py-2 text-left uppercase text-[11px] tracking-wide text-gray-600 cursor-pointer select-none"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>Role</span>
                      <span>{sortIcon('role')}</span>
                    </span>
                  </th>

                  <th className="px-3 py-2 text-center uppercase text-[11px] tracking-wide text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((u, idx) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-800">{startIndex + idx + 1}</td>
                    <td className="px-3 py-2 text-gray-900 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="px-3 py-2 text-gray-700">{u.email}</td>
                    <td className="px-3 py-2 text-gray-700">{u.phone_no || '-'}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                        {u.userType || 'CONV'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700 max-w-[220px] truncate">{u.user_group || '-'}</td>
                    <td className="px-3 py-2 text-gray-700">{u.code || 'ALL'}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold
                        ${u.companyStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.companyStatus || 'Active'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold gap-1
                        ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? (
                          <>
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            Active
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold
                        ${u.role === 'Admin' ? 'bg-red-100 text-red-700'
                          : u.role === 'Manager' ? 'bg-yellow-100 text-yellow-700'
                          : u.role === 'Executive' ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'}`}>
                        {u.role || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="View">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5c5 0 9 4.5 10 7-1 2.5-5 7-10 7S3 14.5 2 12c1-2.5 5-7 10-7Zm0 2C8.5 7 5.6 9.9 4.4 12 5.6 14.1 8.5 17 12 17s6.4-2.9 7.6-5C18.4 9.9 15.5 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"/></svg>
                        </button>
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Edit">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm14.71-9.04a1 1 0 0 0 0-1.41l-1.5-1.5a1 1 0 0 0-1.41 0l-1.12 1.12 3.75 3.75 1.28-1.96Z"/></svg>
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                          onClick={() => toggleUserStatus(u._id, u.isActive)}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {u.isActive ? (
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17 8V7a5 5 0 1 0-10 0v1H5v14h14V8h-2Zm-8 0V7a3 3 0 1 1 6 0v1H9Zm-1 4h8v8H8v-8Z"/></svg>
                          ) : (
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17 8V7a5 5 0 0 0-9.58-1.88L9 6.7V7h8v1h2v14H5V9h2V8h10Zm-9 5v7h8v-7H8Z"/></svg>
                          )}
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                          onClick={() => resendResetEmail(u._id, u.email)}
                          title="Resend Reset Email"
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-sm text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 py-2 border-t border-gray-200 bg-gray-50">
            <div className="text-[12px] text-gray-700">
              Showing {total === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, total)} of {total} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 text-[12px] border border-gray-300 rounded bg-white text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-2.5 py-1 text-[12px] rounded border ${
                    currentPage === p ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 text-[12px] border border-gray-300 rounded bg-white text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUser;