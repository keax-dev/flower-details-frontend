export interface Customer {
  id: number;
  personId: number;
  names: string;
  lastNames: string;
  email: string;
  phone: string | null;
  documentNumber: string | null;
  role: 'CUSTOMER';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
