
import api from "./api";

export type VerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export interface AdminCompany {
  id: number;
  name: string;
  industry: string | null;
  description: string | null;
  website: string | null;
  location: string | null;
  companySize: string | null;
  verificationStatus: VerificationStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export async function getAdminCompanies(): Promise<AdminCompany[]> {
  const response = await api.get<AdminCompany[]>(
    "/api/admin/companies"
  );

  return response.data;
}

export async function updateCompanyVerification(
  companyId: number,
  verificationStatus: VerificationStatus
): Promise<AdminCompany> {
  const response = await api.patch<AdminCompany>(
    `/api/admin/companies/${companyId}/verification`,
    { verificationStatus }
  );

  return response.data;
}
