export type UserRole = "STUDENT" | "RECRUITER" | "ADMIN";

export interface User {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}