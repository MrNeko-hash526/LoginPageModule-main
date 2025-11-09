import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, ArrowRight, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';  // Add this import
import type { LoginCredentials } from '../types/user';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading, error }) => {
  const navigate = useNavigate();  // Add this
  const [formData, setFormData] = useState<LoginCredentials>({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await onSubmit(formData);
    } catch (err) {
      // handled by parent
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-700 ease-out">
        {/* Logo & Header */}
        <div className="text-center mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-100 ease-out">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-4 shadow-2xl shadow-white/20 animate-in zoom-in-95 duration-500 delay-200 ease-out">
            <Building className="w-10 h-10 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 animate-in slide-in-from-bottom-2 duration-500 delay-300 ease-out">Welcome Back</h1>
          <p className="text-slate-300 text-base animate-in slide-in-from-bottom-2 duration-500 delay-400 ease-out">Sign in to your enterprise account</p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800 rounded-3xl p-6 shadow-2xl shadow-black/20 animate-in slide-in-from-bottom-4 duration-700 delay-500 ease-out">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300 ease-out">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-300">Authentication Failed</h3>
                    <p className="text-sm text-red-400 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-500 delay-600 ease-out">
              <label htmlFor="email" className="block text-sm font-bold text-gray-300 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border-2 bg-gray-700 border-gray-600 transition-all duration-200 text-white placeholder-gray-400 font-medium focus:outline-none focus:ring-0 focus:bg-gray-600 focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  required
                />
              </div>
              {validationErrors.email && (
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium animate-in slide-in-from-top-1 duration-300 ease-out">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-500 delay-700 ease-out">
              <label htmlFor="password" className="block text-sm font-bold text-gray-300 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full h-12 pl-12 pr-4 rounded-2xl border-2 bg-gray-700 border-gray-600 transition-all duration-200 text-white placeholder-gray-400 font-medium focus:outline-none focus:ring-0 focus:bg-gray-600 focus:border-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  required
                />
              </div>
              {validationErrors.password && (
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium animate-in slide-in-from-top-1 duration-300 ease-out">
                  <AlertCircle className="w-4 h-4" />
                  <span>{validationErrors.password}</span>
                </div>
              )}
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end animate-in slide-in-from-bottom-1 duration-400 delay-800 ease-out">
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')}
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl font-bold text-white text-base transition-all duration-200 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] animate-in slide-in-from-bottom-2 duration-500 delay-900 ease-out"
            >
              <div className="flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing you in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Simple Footer */}
        <div className="mt-4 text-center animate-in fade-in duration-500 delay-1000 ease-out">
          <p className="text-slate-400 text-xs">
            © 2024 Enterprise Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;