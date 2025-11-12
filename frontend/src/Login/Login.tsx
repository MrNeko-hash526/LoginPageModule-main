import React, { useState } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import CompanySelector from './CompanySelector'; // Add back import
import type { LoginCredentials, IUser, LoginStep } from '../types/user';

const Login: React.FC = () => {
  const navigate = useNavigate();
  type LocalLoginStep = LoginStep | 'companySelection' | 'complete';
  const [currentStep, setCurrentStep] = useState<LocalLoginStep>('credentials');
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      // Global login (no companyId)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Login failed (${res.status})`);
      }

      const data = await res.json();
      if (!data || !data.user) throw new Error('Invalid server response');

      setUser(data.user);
      // Only set token if it exists (not null for multi-combinations)
      if (data.token) {
        localStorage.setItem('token', data.token);
        // Notify app that auth token changed so components update immediately
        window.dispatchEvent(new Event('authChanged'));
      }
      localStorage.setItem('isAuthenticated', 'true');

      // Updated: Go to company selector after login
      setCurrentStep('companySelection');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Updated: Handle company and role selection with role-based navigation
  const handleCompanyAndRoleSelection = async (selection: { companyId: string; companyName: string; roleId: number }) => {
    setIsLoading(true);
    setError(null);

    // Validate user and userId
    if (!user || (!user.user_id && !user._id)) {
      setError('User not logged in or invalid user data. Please log in again.');
      setIsLoading(false);
      return;
    }

    const userId = user.user_id || user._id;  // Handle key mismatch (_id from sample data)

    try {
      const res = await fetch('/api/auth/select-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization needed since middleware is removed
        },
        body: JSON.stringify({
          userId,  // Add userId to the body
          ...selection,  // companyId, companyName, roleId
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Selection failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      // Store the new token from select-role response (if provided)
      if (data.token) {
        localStorage.setItem('token', data.token);
        // Notify app that auth token changed so components update immediately
        window.dispatchEvent(new Event('authChanged'));
      }

      // Updated: Role-based navigation after selection
      const userRoles = data.user?.userTypes || [];  // Assuming userTypes is in the response
      const isAdminOrManager = userRoles.some((role: string) => role.toLowerCase().includes('admin') || role.toLowerCase().includes('manager'));
      
      if (isAdminOrManager) {
        navigate('/manage-users');  // Admin/Manager: Go to management dashboard
      } else {
        navigate('/dashboard-user');  // Employee: Go to general dashboard
      }
    } catch (err: any) {
      setError(err?.message || 'Selection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep('credentials');
    setUser(null);
    setError(null);
  };

  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: 20 },
  };

  const pageTransition: Transition = { type: 'tween', ease: 'anticipate', duration: 0.3 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800">
      <AnimatePresence mode="wait">
        {currentStep === 'credentials' && (
          <motion.div
            key="login"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
          </motion.div>
        )}

        {currentStep === 'companySelection' && user && (
          <motion.div
            key="company"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <CompanySelector
              user={user}
              onSubmit={handleCompanyAndRoleSelection}
              onBack={handleBack}
              isLoading={isLoading}
              error={error}
            />
          </motion.div>
        )}

        {/* Removed: complete step (no longer needed) */}
      </AnimatePresence>
    </div>
  );
};

export default Login;