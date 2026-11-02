
import api from "./api";

export type AccountStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED";

export type UserRole =
  | "STUDENT"
  | "RECRUITER"
  | "ADMIN";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await api.get<AdminUser[]>("/api/admin/users");
  return response.data;
}

export async function updateAdminUserStatus(
  userId: number,
  status: AccountStatus
): Promise<AdminUser> {
  const response = await api.patch<AdminUser>(
    `/api/admin/users/${userId}/status`,
    { status }
  );

  return response.data;
}
