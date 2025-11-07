import React from 'react';
import { User, Mail, Shield, Building, ArrowRight, CheckCircle } from 'lucide-react';
import type { IUser } from './types/user';

interface UserProfileProps {
  user: IUser;
  onContinue: () => void;
  isLoading?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onContinue, isLoading = false }) => {
  const _userType = (user as any).userType;
  const userTypes: string[] = Array.isArray(_userType) ? _userType : (_userType ? [_userType] : []);
  const companies = user.availableCompanies || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-700 ease-out">
        {/* Logo & Header */}
        <div className="text-center mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-100 ease-out">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-4 shadow-2xl shadow-white/20 animate-in zoom-in-95 duration-500 delay-200 ease-out">
            <User className="w-10 h-10 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 animate-in slide-in-from-bottom-2 duration-500 delay-300 ease-out">Welcome Back</h1>
          <p className="text-slate-300 text-base animate-in slide-in-from-bottom-2 duration-500 delay-400 ease-out">
            Your account details have been verified
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-black/20 animate-in slide-in-from-bottom-4 duration-700 delay-500 ease-out">
          {/* Success Indicator */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Successful</h2>
            <p className="text-slate-600">Please review your account information below</p>
          </div>

          {/* User Information */}
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500 delay-600 ease-out">
            {/* Name */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">Full Name</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 ml-11">
                {user.fullName || user.firstName || 'N/A'}
              </p>
            </div>

            {/* Email */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">Email Address</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 ml-11">
                {user.email}
              </p>
            </div>

            {/* User Types/Roles */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">Access Roles</span>
              </div>
              <div className="ml-11 flex flex-wrap gap-2">
                {userTypes.map((userType, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                  >
                    <Shield className="w-3 h-3" />
                    {userType}
                  </span>
                ))}
              </div>
            </div>

            {/* Available Companies */}
            {companies.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">Available Organizations</span>
                </div>
                <div className="ml-11 space-y-2">
                  {companies.map((company, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                      <div>
                        <p className="font-medium text-slate-900">{company.name}</p>
                        <p className="text-sm text-slate-600">{company.code}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        company.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {company.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            disabled={isLoading}
            className="w-full h-14 mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl font-bold text-white text-lg transition-all duration-200 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] animate-in slide-in-from-bottom-2 duration-500 delay-900 ease-out"
          >
            <div className="flex items-center justify-center gap-3">
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Continue to Organization Selection</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center animate-in fade-in duration-500 delay-1000 ease-out">
          <p className="text-slate-400 text-xs">
            © 2024 Enterprise Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;