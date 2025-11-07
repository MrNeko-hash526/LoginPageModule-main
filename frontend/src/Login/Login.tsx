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
      if (data.token) localStorage.setItem('token', data.token);
      localStorage.setItem('isAuthenticated', 'true');

      // Updated: Go to company selector after login
      setCurrentStep('companySelection');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Add back: Handle company and role selection
  const handleCompanyAndRoleSelection = async (selection: { companyId: string; companyName: string; roleId: number }) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/select-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(selection),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Selection failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      // Updated: Redirect to ManageUser after selection
      navigate('/manage-users');
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