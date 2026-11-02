
import api from "./api";

export type ApplicationStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface RecruiterApplication {
  applicationId: number;
  studentId: number;
  studentName: string;
  studentLocation: string | null;

  jobId: number;
  jobTitle: string;

  resumeId: number;
  resumeFileName: string;

  coverLetter: string | null;

  status: ApplicationStatus;

  appliedAt: string;
  updatedAt: string;
}

// --------------------------------------------------
// GET RECRUITER APPLICATIONS
// --------------------------------------------------

export async function getRecruiterApplications(): Promise<
  RecruiterApplication[]
> {
  const response = await api.get<RecruiterApplication[]>(
    "/api/applications/recruiter"
  );

  return response.data;
}

// --------------------------------------------------
// UPDATE APPLICATION STATUS
// --------------------------------------------------

export async function updateApplicationStatus(
  applicationId: number,
  status: ApplicationStatus
): Promise<RecruiterApplication> {
  const response = await api.put<RecruiterApplication>(
    `/api/applications/${applicationId}/status`,
    {
      status,
    }
  );

  return response.data;
}

// --------------------------------------------------
// GET RESUME PDF
// --------------------------------------------------

export async function getResumePdf(
  resumeId: number
): Promise<Blob> {
  const response = await api.get<Blob>(
    `/api/resumes/${resumeId}/file`,
    {
      responseType: "blob",
    }
  );

  return response.data;
}
