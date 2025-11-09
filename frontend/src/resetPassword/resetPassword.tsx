import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as yup from 'yup';
import { Mail, Lock, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ResetPasswordForm {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<ResetPasswordForm>({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Partial<ResetPasswordForm>>({});
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast functions (unique ids)
  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
    const newToast: Toast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Toast component styled for dark theme (black, gray, blue)
  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map(toast => (
        <div key={toast.id} className="max-w-sm w-full bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-3 flex items-start gap-3">
          <div className="mt-0.5">
            {toast.type === 'success' && <CheckCircle className="w-6 h-6 text-blue-400" />}
            {toast.type === 'error' && <AlertCircle className="w-6 h-6 text-red-400" />}
            {toast.type === 'info' && <Mail className="w-6 h-6 text-blue-300" />}
            {toast.type === 'warning' && <AlertCircle className="w-6 h-6 text-yellow-400" />}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-100">{toast.message}</p>
          </div>
          <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );

  // Pre-fill from URL params
  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    if (token && email) {
      setFormData(prev => ({ ...prev, email, otp: token }));
      showToast('Password reset form loaded with your email and token', 'info');
    } else {
      showToast('Please use the link from your email to reset your password', 'warning');
    }
  }, [searchParams]);

  const schema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    otp: yup.string().required('OTP is required'),
    newPassword: yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
    confirmPassword: yup.string()
      .oneOf([yup.ref('newPassword')], 'Passwords must match')
      .required('Confirm password is required')
  });

  const clearError = (field: keyof ResetPasswordForm) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await schema.validate(formData, { abortEarly: false });
      setErrors({});

      showToast('Resetting your password...', 'info');

      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          token: formData.otp,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Password reset successfully! Redirecting to login...', 'success');
        setTimeout(() => navigate('/login'), 1600);
      } else {
        showToast(data.message || 'Failed to reset password', 'error');
      }
    } catch (err: any) {
      if (err.inner) {
        const validationErrors: Partial<ResetPasswordForm> = {};
        err.inner.forEach((error: any) => {
          validationErrors[error.path as keyof ResetPasswordForm] = error.message;
        });
        setErrors(validationErrors);
        showToast('Please fix the validation errors', 'error');
      } else {
        showToast('An error occurred while resetting password', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
    setErrors({});
    showToast('Form reset successfully', 'info');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <ToastContainer />

      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-4 shadow-2xl">
            <Mail className="w-8 h-8 text-slate-900" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-slate-300">Enter a new password for your account</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  readOnly
                  value={formData.email}
                  onChange={(e) => { setFormData({ ...formData, email: e.target.value }); clearError('email'); }}
                  placeholder="email@example.com"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-800"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Token */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Reset Token</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  readOnly
                  value={formData.otp}
                  onChange={(e) => { setFormData({ ...formData, otp: e.target.value }); clearError('otp'); }}
                  placeholder="Reset token"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-800"
                />
              </div>
              {errors.otp && <p className="text-red-400 text-xs mt-1">{errors.otp}</p>}
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">New Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => { setFormData({ ...formData, newPassword: e.target.value }); clearError('newPassword'); }}
                  placeholder="Minimum 6 characters"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-800"
                />
              </div>
              {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); clearError('confirmPassword'); }}
                placeholder="Re-type new password"
                className="w-full h-12 pl-4 pr-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-800"
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl text-white font-semibold shadow-md disabled:opacity-60"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-36 h-12 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 hover:bg-gray-800/90"
              >
                Clear
              </button>
            </div>

            <div className="text-center">
              <button type="button" onClick={() => navigate('/login')} className="text-sm text-blue-300 hover:text-blue-200">
                Back to Login
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center">
          <p className="text-slate-400 text-xs">© {new Date().getFullYear()} Enterprise Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;