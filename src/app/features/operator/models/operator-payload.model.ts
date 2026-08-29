export interface CreateOperatorPayload {
  names: string;
  lastNames: string;
  email: string;
  password: string;
  phone: string;
  active: boolean;
}

export interface UpdateOperatorPayload {
  names: string;
  lastNames: string;
  email: string;
  phone: string;
  active: boolean;
}
