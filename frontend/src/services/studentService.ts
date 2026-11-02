import api from "./api";

export interface Job {
  id: number;
  companyId: number;
  postedBy: number;
  title: string;
  description: string;
  location: string;
  jobType: "JOB" | "INTERNSHIP";
  workMode: "REMOTE" | "HYBRID" | "ONSITE";
  employmentType:
    | "FULL_TIME"
    | "PART_TIME"
    | "INTERNSHIP";
  experienceRequired: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  stipend?: number | null;
  requirements?: string | null;
  responsibilities?: string | null;
  applicationDeadline: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: number;
  name: string;
  industry: string;
  description: string;
  website: string;
  location: string;
  companySize?: string | null;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: number;
  studentId: number;
  jobId: number;
  resumeId: number;
  coverLetter: string;
  status: string;
  appliedAt: string;
  updatedAt: string;
}

export interface SavedJob {
  studentId: number;
  jobId: number;
  savedAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface StudentProfile {
  userId: number;
  phone: string | null;
  location: string | null;
  bio: string | null;
}

export interface StudentProfileUpdate {
  phone: string;
  location: string;
  bio: string;
}

export interface Education {
  id: number;
  studentId: number;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade: string;
}

export interface Experience {
  id: number;
  studentId: number;
  companyName: string;
  jobTitle: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface Resume {
  id: number;
  studentId: number;
  fileName: string;
  filePath: string;
  isActive: boolean;
  uploadedAt: string;
}

export interface Interview {
  id: number;
  applicationId: number;
  scheduledDate: string;
  scheduledTime: string;
  interviewType: string;
  meetingLink: string;
  interviewerName: string;
  notes: string;
  status: string;
  createdAt: string;
}

export async function getJobs(): Promise<Job[]> {
  const response =
    await api.get<Job[]>("/api/jobs");

  return response.data;
}

export async function getJobById(
  id: number
): Promise<Job> {
  const response =
    await api.get<Job>(`/api/jobs/${id}`);

  return response.data;
}

export async function getCompanies(): Promise<Company[]> {
  const response =
    await api.get<Company[]>(
      "/api/companies"
    );

  return response.data;
}

export async function getApplications(): Promise<Application[]> {
  const response =
    await api.get<Application[]>(
      "/api/applications"
    );

  return response.data;
}

export async function getSavedJobs(): Promise<SavedJob[]> {
  const response =
    await api.get<SavedJob[]>(
      "/api/saved-jobs"
    );

  return response.data;
}

export async function saveJob(
  studentId: number,
  jobId: number
): Promise<SavedJob> {
  const response =
    await api.post<SavedJob>(
      "/api/saved-jobs",
      {
        studentId,
        jobId,
      }
    );

  return response.data;
}

export async function deleteSavedJob(
  studentId: number,
  jobId: number
): Promise<void> {
  await api.delete(
    `/api/saved-jobs/${studentId}/${jobId}`
  );
}

// Retrieve notifications for the logged-in user.
export async function getNotifications(): Promise<Notification[]> {
  const response =
    await api.get<Notification[]>(
      "/api/notifications"
    );

  return response.data;
}

// Mark one of the logged-in user's notifications as read.
export async function markNotificationAsRead(
  id: number
): Promise<Notification> {
  const response =
    await api.patch<Notification>(
      `/api/notifications/${id}/read`
    );

  return response.data;
}

export async function getStudentProfiles(): Promise<StudentProfile[]> {
  const response =
    await api.get<StudentProfile[]>(
      "/api/student-profiles"
    );

  return response.data;
}

export async function getStudentProfile(
  id: number
): Promise<StudentProfile> {
  const response =
    await api.get<StudentProfile>(
      `/api/student-profiles/${id}`
    );

  return response.data;
}

export async function updateStudentProfile(
  id: number,
  data: StudentProfileUpdate
): Promise<StudentProfile> {
  const response =
    await api.put<StudentProfile>(
      `/api/student-profiles/${id}`,
      data
    );

  return response.data;
}

export async function getEducation(): Promise<Education[]> {
  const response =
    await api.get<Education[]>(
      "/api/education"
    );

  return response.data;
}

export async function getExperience(): Promise<Experience[]> {
  const response =
    await api.get<Experience[]>(
      "/api/experience"
    );

  return response.data;
}

export async function getResumes(): Promise<Resume[]> {
  const response =
    await api.get<Resume[]>(
      "/api/resumes"
    );

  return response.data;
}

export async function getInterviews(): Promise<Interview[]> {
  const response =
    await api.get<Interview[]>(
      "/api/interviews"
    );

  return response.data;
}

export async function createApplication(data: {
  studentId: number;
  jobId: number;
  resumeId: number;
  coverLetter: string;
}): Promise<Application> {
  const response =
    await api.post<Application>(
      "/api/applications",
      data
    );

  return response.data;
}

export async function uploadResume(
  file: File
): Promise<Resume> {
  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  const response =
    await api.post<Resume>(
      "/api/resumes/upload",
      formData
    );

  return response.data;
}