import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this for navigation
import { Building, ArrowRight, ArrowLeft, AlertCircle, Users, Shield } from 'lucide-react';
import type { IUser, ICompany, IRole } from '../types/user';

interface CompanySelectorProps {
  user: IUser;
  onSubmit: (selection: { companyId: string; companyName: string; roleId: number }) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({
  user,
  onSubmit,
  onBack,
  isLoading,
  error,
}) => {
  const navigate = useNavigate(); // Add this
  const [selectedCompany, setSelectedCompany] = useState<ICompany | null>(null);
  const [selectedRole, setSelectedRole] = useState<IRole | null>(null);
  const [availableRoles, setAvailableRoles] = useState<IRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const availableCompanies = user.availableCompanies || [];

  // Auto-select company if only one available (no pre-selection from login)
  useEffect(() => {
    if (availableCompanies.length === 1 && !selectedCompany) {
      setSelectedCompany(availableCompanies[0]);
    }
  }, [availableCompanies, selectedCompany]);

  // Fetch roles when company changes
  useEffect(() => {
    if (selectedCompany) {
      fetchRolesForCompany(selectedCompany.id);
    } else {
      setAvailableRoles([]);
      setSelectedRole(null);
    }
  }, [selectedCompany]);

  // Add auto-submit for single selections
  useEffect(() => {
    if (selectedCompany && availableRoles.length === 1 && !selectedRole) {
      setSelectedRole(availableRoles[0]);
      // Auto-submit after a short delay
      setTimeout(() => {
        handleSubmit();
      }, 500);  // Adjust delay as needed
    }
  }, [selectedCompany, availableRoles, selectedRole]);

  const fetchRolesForCompany = async (companyId: string | number) => {
    setLoadingRoles(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/companies/${companyId}/roles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.roles) {
        setAvailableRoles(data.roles);
        
        // Auto-select role if only one available
        if (data.roles.length === 1) {
          setSelectedRole(data.roles[0]);
        } else {
          setSelectedRole(null);
        }
      } else {
        setAvailableRoles([]);
        setSelectedRole(null);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setAvailableRoles([]);
      setSelectedRole(null);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCompany || !selectedRole) return;
    
    try {
      await onSubmit({
        companyId: String(selectedCompany.id),
        companyName: selectedCompany.name,
        roleId: selectedRole.id,
      });
      
      // Updated: Navigate to ManageUser after selection
      navigate('/manage-users');
    } catch (err) {
      console.error('Company/Role selection error:', err);
    }
  };

  const getRoleIcon = (roleCode: string) => {
    switch (roleCode.toUpperCase()) {
      case 'ADMIN': return <Shield className="w-4 h-4" />;
      case 'EXECUTIVE': case 'EXEC': return <Users className="w-4 h-4" />;
      case 'USER': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-700 ease-out">
        {/* Logo & Header */}
        <div className="text-center mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-100 ease-out">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-4 shadow-2xl shadow-white/20 animate-in zoom-in-95 duration-500 delay-200 ease-out">
            <Building className="w-10 h-10 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 animate-in slide-in-from-bottom-2 duration-500 delay-300 ease-out">Select Access</h1>
          <p className="text-slate-300 text-base animate-in slide-in-from-bottom-2 duration-500 delay-400 ease-out">
            Welcome {user.fullName || user.firstName}! Choose your organization and role.
          </p>
        </div>

        {/* Main Card with Scrollable Content */}
        <div className={`
          bg-gray-800 rounded-3xl shadow-2xl shadow-black/20 transition-all duration-300
          animate-in slide-in-from-bottom-4 duration-700 delay-500 ease-out
          ${isLoading ? 'animate-pulse scale-[0.98] shadow-blue-500/20' : 'hover:shadow-3xl'}
          flex flex-col
        `}>
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-2xl animate-in slide-in-from-top-2 duration-300 ease-out">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-300">Selection Failed</h3>
                    <p className="text-sm text-red-400 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {/* Company Selection */}
              {availableCompanies.length > 1 ? (
                <div className="animate-in slide-in-from-bottom-2 duration-500 delay-600 ease-out">
                  <label className="block text-sm font-bold text-gray-300 uppercase tracking-wide mb-3">
                    Select Organization
                  </label>
                  <div className="space-y-3">
                    {availableCompanies.map((company) => (
                      <div
                        key={company.id}
                        className={`
                          p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200
                          ${selectedCompany?.id === company.id
                            ? 'border-blue-500 bg-gray-700 shadow-lg shadow-blue-500/20'
                            : 'border-gray-600 hover:border-gray-500 bg-gray-700 hover:bg-gray-600'
                          }
                          ${isLoading ? 'cursor-not-allowed opacity-75' : ''}
                        `}
                        onClick={() => !isLoading && setSelectedCompany(company)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center
                            ${company.code === 'AACA' ? 'bg-red-800' : 'bg-blue-800'}
                          `}>
                            <Building className={`
                              w-5 h-5 
                              ${company.code === 'AACA' ? 'text-red-400' : 'text-blue-400'}
                            `} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{company.name}</h3>
                            <p className="text-sm text-gray-400">{company.code}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Single Company Display */
                selectedCompany && (
                  <div className="p-4 bg-gray-700 border border-gray-600 rounded-2xl animate-in slide-in-from-bottom-2 duration-500 delay-600 ease-out">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-800 rounded-xl flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{selectedCompany.name}</h3>
                        <p className="text-sm text-gray-400">{selectedCompany.code}</p>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Role Selection */}
              {selectedCompany && (
                <div className="animate-in slide-in-from-bottom-2 duration-500 delay-700 ease-out">
                  <label className="block text-sm font-bold text-gray-300 uppercase tracking-wide mb-3">
                    Select Role
                    {loadingRoles && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2 inline-block" />
                    )}
                  </label>
                  
                  {loadingRoles ? (
                    <div className="p-4 text-center text-gray-400">Loading roles...</div>
                  ) : availableRoles.length > 1 ? (
                    <select
                      value={selectedRole?.id || ''}
                      onChange={(e) => {
                        const roleId = parseInt(e.target.value);
                        const role = availableRoles.find(r => r.id === roleId);
                        setSelectedRole(role || null);
                      }}
                      className="w-full h-12 px-4 border-2 border-gray-600 rounded-2xl bg-gray-700 transition-all duration-200 text-white placeholder-gray-400 font-medium focus:outline-none focus:ring-0 focus:border-blue-500 focus:bg-gray-600 disabled:opacity-75 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      <option value="" className="bg-gray-700 text-white">Choose your role...</option>
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.id} className="bg-gray-700 text-white">
                          {role.name} - {role.description}
                        </option>
                      ))}
                    </select>
                  ) : availableRoles.length === 1 ? (
                    /* Single Role Display */
                    <div className="p-4 bg-gray-700 border border-gray-600 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">
                          {getRoleIcon(availableRoles[0].code)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{availableRoles[0].name}</h3>
                          <p className="text-sm text-gray-400">{availableRoles[0].description}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* No Roles Available */
                    <div className="p-4 bg-red-900/50 border border-red-700 rounded-2xl text-center">
                      <p className="text-red-400">No roles available for this organization.</p>
                    </div>
                  )}

                  {/* Selected Role Summary */}
                  {selectedRole && (
                    <div className="mt-4 p-4 bg-gray-700 border border-gray-600 rounded-2xl animate-in slide-in-from-bottom-1 duration-400 delay-800 ease-out">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-blue-400" />
                        <span className="font-semibold text-sm text-gray-300">Access Summary</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Organization:</span>
                          <span className="font-medium text-white">{selectedCompany.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Role:</span>
                          <span className="font-medium text-white">{selectedRole.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Access Level:</span>
                          <span className="font-medium text-white">{selectedRole.code}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fixed Action Buttons at Bottom */}
          <div className="flex-shrink-0 border-t border-gray-600 p-6 bg-gray-800 rounded-b-3xl">
            <div className="flex gap-4 animate-in slide-in-from-bottom-2 duration-500 delay-900 ease-out">
              <button
                type="button"
                onClick={onBack}
                disabled={isLoading}
                className="flex-1 h-12 px-6 border-2 border-gray-600 rounded-2xl font-semibold text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedCompany || !selectedRole || isLoading || loadingRoles}
                className="flex-[2] h-12 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl font-bold text-white text-base transition-all duration-200 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Proceeding...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
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

export default CompanySelector;