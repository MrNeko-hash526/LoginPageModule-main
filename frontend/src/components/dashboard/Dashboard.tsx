import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckCircle, Clock, PlusSquare } from 'lucide-react';

type UserShort = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive?: boolean;
  role?: string;
};

export default function Dashboard(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [pendingUsers, setPendingUsers] = useState<number | null>(null);
  const [recentUsers, setRecentUsers] = useState<UserShort[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token') || '';

    const fetchSummary = async () => {
      try {
        // try a summary endpoint, fall back to listing if not available
        const res = await fetch('/api/manageuser/summary', {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        if (res.ok) {
          const json = await res.json();
          if (!mounted) return;
          setTotalUsers(typeof json.total === 'number' ? json.total : null);
          setActiveUsers(typeof json.active === 'number' ? json.active : null);
          setPendingUsers(typeof json.pending === 'number' ? json.pending : null);
        } else {
          // fallback: fetch first page of users and derive counts
          const r2 = await fetch('/api/manageuser/users?page=1&limit=10', {
            headers: { Authorization: token ? `Bearer ${token}` : '' },
          });
          if (!r2.ok) throw new Error('Failed to fetch users');
          const data = await r2.json();
          if (!mounted) return;
          const users = Array.isArray(data.users) ? data.users : [];
          setTotalUsers(typeof data.total === 'number' ? data.total : users.length);
          setActiveUsers(users.filter((u: any) => u.isActive).length);
          setPendingUsers(users.filter((u: any) => !u.isActive).length);
          setRecentUsers(
            users.slice(0, 5).map((u: any) => ({
              _id: String(u._id),
              firstName: u.firstName || '',
              lastName: u.lastName || '',
              email: u.email || '',
              isActive: !!u.isActive,
              role: u.role || '-',
            }))
          );
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load dashboard data');
        // provide graceful defaults
        setTotalUsers(null);
        setActiveUsers(null);
        setPendingUsers(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSummary();

    // also fetch recent users independently (if not set)
    const fetchRecent = async () => {
      try {
        const r = await fetch('/api/manageuser/users?page=1&limit=5', {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        if (!r.ok) return;
        const d = await r.json();
        if (!mounted) return;
        const users = Array.isArray(d.users) ? d.users : [];
        setRecentUsers(
          users.map((u: any) => ({
            _id: String(u._id),
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            email: u.email || '',
            isActive: !!u.isActive,
            role: u.role || '-',
          }))
        );
      } catch {
        // ignore
      }
    };

    fetchRecent();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Overview and quick actions</p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/add-user" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-900">
            <PlusSquare className="w-4 h-4" /> Add User
          </Link>
          <Link to="/manage-users" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-gray-800 text-white border-gray-200 dark:border-gray-700 text-sm">
            <Users className="w-4 h-4" /> Manage Users
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Users</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loading ? '—' : totalUsers ?? 'N/A'}
              </div>
            </div>
            <div className="p-2 rounded bg-gray-100 dark:bg-gray-700">
              <Users className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Active Users</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loading ? '—' : activeUsers ?? 'N/A'}
              </div>
            </div>
            <div className="p-2 rounded bg-gray-100 dark:bg-gray-700">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Inactive / Pending</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loading ? '—' : pendingUsers ?? 'N/A'}
              </div>
            </div>
            <div className="p-2 rounded bg-gray-100 dark:bg-gray-700">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Recent users</h2>
          <Link to="/manage-users" className="text-sm text-blue-600 dark:text-blue-400">View all</Link>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-100">Loading...</td>
              </tr>
            )}

            {!loading && recentUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-100">No recent users</td>
              </tr>
            )}

            {!loading && recentUsers.map((u, i) => (
              <tr key={u._id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-4 py-3 text-gray-100">{i + 1}</td>
                <td className="px-4 py-3 text-gray-100 dark:text-gray-100">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-gray-100">{u.email}</td>
                <td className="px-4 py-3 text-gray-100">{u.role || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                    ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
