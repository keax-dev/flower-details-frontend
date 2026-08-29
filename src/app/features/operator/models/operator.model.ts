export interface Operator {
  id: number;
  personId: number;
  names: string;
  lastNames: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'OPERATOR';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
