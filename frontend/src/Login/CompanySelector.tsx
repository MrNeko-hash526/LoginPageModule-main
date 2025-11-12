import React, { useState, useEffect } from 'react';
import { Building, ArrowRight, ArrowLeft, AlertCircle, Users, Shield } from 'lucide-react';
import type { IUser, ICompany, IRole } from '../types/user';

// Define the interface for available combinations (moved outside for reusability)
interface IAvailableCombination {
  company_id: number;
  company_name: string;
  company_code?: string;
  entity_type?: string;   // added
  entity_code?: string;   // added
  role_id?: number;
  role_name?: string;
}

// Updated props to include availableCombinations for type safety
interface CompanySelectorProps {
  user: IUser & { availableCombinations?: IAvailableCombination[] };
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
  const [selectedCompany, setSelectedCompany] = useState<ICompany | null>(null);
  const [selectedRole, setSelectedRole] = useState<IRole | null>(null);
  const [availableRoles, setAvailableRoles] = useState<IRole[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(null); // NEW

  // Access availableCombinations safely (now typed)
  const availableCombinations = user.availableCombinations || [];

  useEffect(() => {
    const uniqueCompanies = Array.from(new Map(availableCombinations.map(combo => [combo.company_id, combo])).values());
    if (uniqueCompanies.length === 1 && !selectedCompany) {
      const combo = uniqueCompanies[0];
      setSelectedCompany({
        id: combo.company_id,
        name: combo.company_name,
        code: combo.entity_code || combo.company_name,
      });
    }
  }, [availableCombinations, selectedCompany]);

  useEffect(() => {
    if (selectedCompany) {
      const companyCombos = availableCombinations.filter(combo => combo.company_id === selectedCompany.id);
      const rolesMap = new Map<number, IRole>();
      companyCombos.forEach(combo => {
        if (combo.role_id && combo.role_name) {
          rolesMap.set(combo.role_id, {
            id: combo.role_id,
            name: combo.role_name,
            code: combo.role_name,
            description: `${combo.role_name} access`,
          } as IRole);
        }
      });
      const roles: IRole[] = Array.from(rolesMap.values());
      setAvailableRoles(roles);
      if (roles.length === 1 && !selectedRole) setSelectedRole(roles[0]);
      else if (roles.length > 1) setSelectedRole(null);
    } else {
      setAvailableRoles([]);
      setSelectedRole(null);
    }
  }, [selectedCompany, availableCombinations]);

  const handleSubmit = async () => {
    if (!selectedCompany || !selectedRole) return;
    try {
      await onSubmit({
        companyId: String(selectedCompany.id),
        companyName: selectedCompany.name,
        roleId: selectedRole.id,
      });
    } catch (err) {
      console.error('Company/Role selection error:', err);
    }
  };

  const getRoleIcon = (roleCode: string) => {
    switch ((roleCode || '').toUpperCase()) {
      case 'ADMIN': return <Shield className="w-4 h-4" />;
      case 'EXECUTIVE': case 'EXEC': return <Users className="w-4 h-4" />;
      case 'USER': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  // Derived lists for entity types and companies
  const entityTypes = Array.from(new Set(availableCombinations.map(c => (c.entity_type || c.entity_code || 'Other'))));
  const uniqueCompanies = Array.from(new Map(availableCombinations.map(combo => [combo.company_id, combo])).values());
  const companiesToShow = selectedEntityType
    ? uniqueCompanies.filter(c => ((c.entity_type || c.entity_code || 'Other').toLowerCase() === selectedEntityType.toLowerCase()))
    : uniqueCompanies;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 duration-700 ease-out">
        {/* Logo & Header */}
        <div className="text-center mb-6 animate-in slide-in-from-bottom-4 duration-700 delay-100 ease-out">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-4 shadow-2xl shadow-white/20 animate-in zoom-in-95 duration-500 delay-200 ease-out">
            <Building className="w-10 h-10 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Select Access</h1>
          <p className="text-slate-300 text-base">Welcome {user.fullName || user.firstName}! Choose your organization and role.</p>
        </div>

        <div className={`
          bg-gray-800 rounded-3xl shadow-2xl shadow-black/20 transition-all duration-300
          ${isLoading ? 'animate-pulse scale-[0.98] shadow-blue-500/20' : 'hover:shadow-3xl'}
          flex flex-col
        `}>
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-300">Selection Failed</h3>
                    <p className="text-sm text-red-400 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {availableCombinations.length === 0 && (
              <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-700 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-800 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-300">No Access Available</h3>
                    <p className="text-sm text-yellow-400 mt-1">Your account does not have assigned organizations or roles. Please contact your administrator.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {/* Entity Type Radios */}
              {entityTypes.length > 0 && (
                <div className="animate-in slide-in-from-bottom-2 duration-500 delay-600 ease-out">
                  <label className="block text-sm font-bold text-gray-300 uppercase tracking-wide mb-3">Select Entity Type</label>

                  <div className="flex flex-wrap gap-2">
                    <label
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer border ${selectedEntityType === null ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-700 text-gray-200 border-gray-600'}`}
                      onClick={() => {
                        if (isLoading) return;
                        setSelectedEntityType(null);
                        setSelectedCompany(null);
                        setSelectedRole(null);
                      }}
                    >
                      <input type="radio" name="entityType" className="hidden" checked={selectedEntityType === null} readOnly />
                      All
                    </label>

                    {entityTypes.map((et, idx) => (
                      <label
                        key={`et-${String(et)}-${idx}`}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer border ${selectedEntityType?.toLowerCase() === (et || '').toLowerCase() ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-700 text-gray-200 border-gray-600'}`}
                        onClick={() => {
                          if (isLoading) return;
                          setSelectedEntityType(et || null);
                          setSelectedCompany(null);
                          setSelectedRole(null);
                        }}
                      >
                        <input type="radio" name="entityType" className="hidden" checked={selectedEntityType === et} readOnly />
                        {et}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Company list appears after selecting a type (or All) */}
              <div className="animate-in slide-in-from-bottom-2 duration-500 delay-700 ease-out">
                <label className="block text-sm font-bold text-gray-300 uppercase tracking-wide mb-3">Organization</label>
                {selectedEntityType === null && entityTypes.length > 1 && <p className="text-sm text-gray-400 mb-3">Showing all entity types. Click a type above to filter.</p>}
                <div className="space-y-3">
                  {companiesToShow.map((combo, idx) => {
                    const companyId = combo.company_id;
                    // no expansion on company click — only select company
                    const isSelected = selectedCompany?.id === companyId;
                    const rolesMap = new Map<number, IRole>();
                    availableCombinations.filter(c => c.company_id === companyId).forEach(c => {
                      if (c.role_id && c.role_name) {
                        rolesMap.set(c.role_id, { id: c.role_id, name: c.role_name, code: c.role_name, description: `${c.role_name} access` } as IRole);
                      }
                    });
                    const roles = Array.from(rolesMap.values());
                    const isRoot = (combo.entity_type || '').toLowerCase() === 'root' || (combo.entity_code || '').toLowerCase() === 'root';

                    return (
                      <div key={`company-${companyId}-${idx}`} className="rounded-2xl overflow-hidden border-2 transition-all">
                        <div
                          role="button"
                          onClick={() => {
                            if (isLoading) return;
                            // do NOT expand — only set the company selection
                            setSelectedCompany({ id: companyId, name: combo.company_name, code: combo.entity_code || combo.company_name });
                            // availableRoles will be populated by the useEffect that watches selectedCompany
                          }}
                          className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-gray-700 border-blue-500' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'} ${isLoading ? 'cursor-not-allowed opacity-75' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-800">
                              <Building className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{combo.company_name}</h3>
                              <p className="text-sm text-gray-400">{combo.entity_code}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {isRoot && <span className="text-xs px-2 py-1 rounded-full bg-yellow-600 text-white">Root</span>}
                            <div className={`text-sm font-medium ${isSelected ? 'text-blue-300' : 'text-gray-300'}`}>{`${roles.length} role${roles.length !== 1 ? 's' : ''}`}</div>
                          </div>
                        </div>

                        {/* no inline role dropdown here — roles will appear in the separate Role section below */}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Role Selection (keeps existing behavior as fallback) */}
              {selectedCompany && availableRoles.length > 0 && (
                <div className="animate-in slide-in-from-bottom-2 duration-500 delay-700 ease-out">
                  <label className="block text-sm font-bold text-gray-300 uppercase tracking-wide mb-3">Role</label>
                  {availableRoles.length > 1 ? (
                    <div className="space-y-3">
                      {availableRoles.map((role, idx) => (
                        <div
                          key={`role-${role.id}-${idx}`}
                          className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${selectedRole?.id === role.id ? 'border-blue-500 bg-gray-700 shadow-lg shadow-blue-500/20' : 'border-gray-600 hover:border-gray-500 bg-gray-700 hover:bg-gray-600'} ${isLoading ? 'cursor-not-allowed opacity-75' : ''}`}
                          onClick={() => !isLoading && setSelectedRole(role)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">{getRoleIcon(role.code)}</div>
                            <div>
                              <h3 className="font-semibold text-white">{role.name}</h3>
                              <p className="text-sm text-gray-400">{role.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-700 border border-gray-600 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center">{getRoleIcon(availableRoles[0].code)}</div>
                        <div>
                          <h3 className="font-semibold text-white">{availableRoles[0].name}</h3>
                          <p className="text-sm text-gray-400">{availableRoles[0].description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-600 p-6 bg-gray-800 rounded-b-3xl">
            <div className="flex gap-4">
              <button type="button" onClick={onBack} disabled={isLoading} className="flex-1 h-12 px-6 border-2 border-gray-600 rounded-2xl font-semibold text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button type="button" onClick={handleSubmit} disabled={!selectedCompany || !selectedRole || isLoading} className="flex-[2] h-12 px-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl font-bold text-white">
                <div className="flex items-center justify-center gap-3">
                  {isLoading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> <span>Proceeding...</span></> : <><span>Continue</span><ArrowRight className="w-5 h-5" /></>}
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-slate-400 text-xs">© 2024 Enterprise Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default CompanySelector;