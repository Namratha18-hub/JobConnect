
import api from "./api";

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

interface ApiMessage {
  message: string;
}

export const login = async (
  data: LoginRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    "/api/auth/login",
    data
  );

  return response.data;
};

export const register = async (
  data: RegisterRequest
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    "/api/auth/register",
    data
  );

  return response.data;
};

export const forgotPassword = async (
  data: { email: string }
): Promise<ApiMessage> => {
  const response = await api.post<ApiMessage>(
    "/api/auth/forgot-password",
    data
  );

  return response.data;
};

export const resetPassword = async (
  data: {
    token: string;
    newPassword: string;
  }
): Promise<ApiMessage> => {
  const response = await api.post<ApiMessage>(
    "/api/auth/reset-password",
    data
  );

  return response.data;
};
