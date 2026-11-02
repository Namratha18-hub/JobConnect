import api from "./api";

/* =========================================================
   RECRUITER PROFILE
========================================================= */

export interface RecruiterProfile {
  userId: number;
  companyId: number;
  designation: string;
}


/* =========================================================
   JOB TYPES
========================================================= */

export type RecruiterJobType =
  | "JOB"
  | "INTERNSHIP";

export type RecruiterWorkMode =
  | "REMOTE"
  | "HYBRID"
  | "ONSITE";

export type RecruiterEmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP";

export type RecruiterJobStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "CLOSED";


/* =========================================================
   APPLICATION STATUS
========================================================= */

export type RecruiterApplicationStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN";


/* =========================================================
   CREATE / UPDATE JOB REQUEST
========================================================= */

export interface CreateJobRequest {
  companyId: number;
  postedBy: number;

  title: string;
  description: string;
  location: string;

  jobType: RecruiterJobType;
  workMode: RecruiterWorkMode;
  employmentType: RecruiterEmploymentType;

  experienceRequired: string;

  salaryMin: number | null;
  salaryMax: number | null;
  stipend: number | null;

  requirements: string;
  responsibilities: string;

  applicationDeadline: string;

  status: RecruiterJobStatus;
}


/* =========================================================
   RECRUITER JOB RESPONSE
========================================================= */

export interface RecruiterJob {
  id: number;

  companyId: number;
  postedBy: number;

  title: string;
  description: string;
  location: string;

  jobType: RecruiterJobType;
  workMode: RecruiterWorkMode;
  employmentType: RecruiterEmploymentType;

  experienceRequired: string;

  salaryMin: number | null;
  salaryMax: number | null;
  stipend: number | null;

  requirements: string;
  responsibilities: string;

  applicationDeadline: string;

  status: RecruiterJobStatus;

  createdAt: string;
  updatedAt: string;
}


/* =========================================================
   RECRUITER APPLICATION
========================================================= */

export interface RecruiterApplication {
  id: number;

  studentId: number;
  studentName: string;
  studentLocation: string | null;

  jobId: number;
  jobTitle: string;

  resumeId: number;
  resumeFileName: string;

  coverLetter: string | null;

  status: RecruiterApplicationStatus;

  appliedAt: string;
  updatedAt: string;
}


/* =========================================================
   GET RECRUITER PROFILES
========================================================= */

export async function getRecruiterProfiles(): Promise<
  RecruiterProfile[]
> {
  const response =
    await api.get<RecruiterProfile[]>(
      "/api/recruiter-profiles"
    );

  return response.data;
}


/* =========================================================
   CREATE JOB / INTERNSHIP
========================================================= */

export async function createJob(
  data: CreateJobRequest
): Promise<RecruiterJob> {

  const response =
    await api.post<RecruiterJob>(
      "/api/jobs",
      data
    );

  return response.data;
}


/* =========================================================
   GET ALL JOBS
========================================================= */

export async function getAllJobs(): Promise<
  RecruiterJob[]
> {

  const response =
    await api.get<RecruiterJob[]>(
      "/api/jobs"
    );

  return response.data;
}


/* =========================================================
   UPDATE JOB
========================================================= */

export async function updateJob(
  jobId: number,
  recruiterUserId: number,
  data: CreateJobRequest
): Promise<RecruiterJob> {

  const response =
    await api.put<RecruiterJob>(
      `/api/jobs/${jobId}`,
      data,
      {
        params: {
          recruiterUserId,
        },
      }
    );

  return response.data;
}


/* =========================================================
   CLOSE JOB
========================================================= */

export async function closeJob(
  jobId: number,
  recruiterUserId: number
): Promise<RecruiterJob> {

  const response =
    await api.patch<RecruiterJob>(
      `/api/jobs/${jobId}/close`,
      null,
      {
        params: {
          recruiterUserId,
        },
      }
    );

  return response.data;
}


/* =========================================================
   GET RECRUITER APPLICATIONS
========================================================= */

export async function getRecruiterApplications(): Promise<
  RecruiterApplication[]
> {

  const response =
    await api.get<RecruiterApplication[]>(
      "/api/applications/recruiter"
    );

  return response.data;
}


/* =========================================================
   UPDATE APPLICATION STATUS
========================================================= */

export async function updateRecruiterApplicationStatus(
  applicationId: number,
  status: RecruiterApplicationStatus
): Promise<RecruiterApplication> {

  const response =
    await api.put<RecruiterApplication>(
      `/api/applications/${applicationId}/status`,
      {
        status,
      }
    );

  return response.data;
}