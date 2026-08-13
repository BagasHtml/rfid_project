export interface UserRow {
  id: number;
  username: string;
  passwordHash: string;
  class: string | null;
  createdAt: Date | null;
}

export type UserRole = 'admin' | 'class';

export interface AuthUser {
  id: number;
  username: string;
  class: string | null;
  role: UserRole;
}

export interface LoginResult {
  success: boolean;
  message: string;
  statusCode: number;
  user?: AuthUser;
  cookie?: string;
}

export interface ChangePasswordResult {
  success: boolean;
  message: string;
  statusCode: number;
}
