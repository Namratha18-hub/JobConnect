import api from "./api";

export type AdminApplicationStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface AdminApplication {
  applicationId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentLocation: string | null;
  jobId: number;
  jobTitle: string;
  companyName: string;
  status: AdminApplicationStatus;
  appliedAt: string;
  updatedAt: string;
}

export async function getAdminApplications(): Promise<
  AdminApplication[]
> {
  const response = await api.get<AdminApplication[]>(
    "/api/admin/applications"
  );

  return response.data;
}