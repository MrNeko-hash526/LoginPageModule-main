export interface IUser {
  id: number;
  email: string;
  firstName?: string;
  fullName?: string;
  lastName?: string;
  LastName?: string;
  phoneNo?: string;
  companyId?: string;
  userType?: string;
  role?: number | null;                 // allow null
  availableRoles?: IRole[];             // optional
  availableCompanies?: ICompany[];      // optional
  selectedCompany?: ICompany;
  selectedRole?: IRole;
}

export interface IRole {
  id: number;  // Changed from string to number
  name: string;
  code: string;
  description: string;
  companyId: number;
  isGlobal: boolean;
}

export interface ICompany {
  id: number;  // Changed from string to number
  name: string;
  code: string;
  status: boolean;
  parentId?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  companyId?: number;  // Changed from string to number | undefined
}

export interface CompanySelectionData {
  companyId: string;
  companyName: string;
}

export interface RoleSelectionData {
  roleId: number;
  companyId: string;
}

export type LoginStep = 'credentials' | 'userProfile' | 'companySelection' | 'complete';