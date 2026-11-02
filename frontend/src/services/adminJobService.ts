
import api from "./api";

export type JobStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "CLOSED"
  | "REMOVED";

export type JobType = "JOB" | "INTERNSHIP";

export type WorkMode =
  | "REMOTE"
  | "HYBRID"
  | "ONSITE";

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP";

export interface AdminJob {
  id: number;
  companyId: number;
  companyName: string;
  recruiterUserId: number;

  title: string;
  description: string;
  location: string | null;

  jobType: JobType;
  workMode: WorkMode;
  employmentType: EmploymentType | null;
  status: JobStatus;

  experienceRequired: string | null;

  salaryMin: number | null;
  salaryMax: number | null;
  stipend: number | null;

  applicationDeadline: string | null;

  createdAt: string;
  updatedAt: string;
}

export async function getAdminJobs(): Promise<AdminJob[]> {
  const response = await api.get<AdminJob[]>(
    "/api/admin/jobs"
  );

  return response.data;
}

export async function updateAdminJobStatus(
  jobId: number,
  status: JobStatus
): Promise<AdminJob> {
  const response = await api.patch<AdminJob>(
    `/api/admin/jobs/${jobId}/status`,
    { status }
  );

  return response.data;
}
