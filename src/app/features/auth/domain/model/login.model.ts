import { AuthUser } from './auth-user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  expiresInSeconds: number;
  user: AuthUser;
}
