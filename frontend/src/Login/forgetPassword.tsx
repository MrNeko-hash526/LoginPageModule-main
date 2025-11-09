import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

interface ForgotPasswordForm {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ForgotPasswordForm>({
    email: ''
  });
  const [errors, setErrors] = useState<Partial<ForgotPasswordForm>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const schema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required')
  });

  const clearError = (field: keyof ForgotPasswordForm) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await schema.validate(formData, { abortEarly: false });
      setErrors({});

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Reset email sent! Check your email for the reset link.');
      } else {
        setMessage(data.message || 'Failed to send reset email');
      }
    } catch (err: any) {
      if (err.inner) {
        const validationErrors: Partial<ForgotPasswordForm> = {};
        err.inner.forEach((error: any) => {
          validationErrors[error.path as keyof ForgotPasswordForm] = error.message;
        });
        setErrors(validationErrors);
      } else {
        setMessage('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ email: '' });
    setErrors({});
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-700 ease-out">
        <div className="bg-gray-800 rounded-3xl p-6 shadow-2xl shadow-black/20 animate-in slide-in-from-bottom-4 duration-700 delay-500 ease-out">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white">Forgot Password</h2>
            <p className="mt-2 text-sm text-gray-400">
              Enter your email to receive a reset link.
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-500 delay-700 ease-out">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); clearError('email'); }}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {message && (
              <div className="text-center animate-in slide-in-from-bottom-1 duration-400 delay-800 ease-out">
                <p className={`text-sm ${message.includes('sent') ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </p>
              </div>
            )}

            <div className="animate-in slide-in-from-bottom-1 duration-400 delay-900 ease-out">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>

            <div className="animate-in slide-in-from-bottom-1 duration-400 delay-1000 ease-out">
              <button
                type="button"
                onClick={handleReset}
                className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Reset Form
              </button>
            </div>

            <div className="text-center animate-in slide-in-from-bottom-1 duration-400 delay-1100 ease-out">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;