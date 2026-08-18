export type UserRole = 'ADMIN' | 'OPERATOR' | 'CUSTOMER';

export interface AuthUser {
  id: number;
  personId: number;
  names: string;
  lastNames: string;
  email: string;
  phone: string;
  documentNumber: string;
  role: UserRole;
}
