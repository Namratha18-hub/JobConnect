import api from "./api";

export type InterviewType = "ONLINE" | "OFFLINE";

export type InterviewStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export interface Interview {
  id: number;
  applicationId: number;
  scheduledDate: string;
  scheduledTime: string | null;
  interviewType: InterviewType;
  meetingLink: string | null;
  interviewerName: string | null;
  notes: string | null;
  status: InterviewStatus;
  createdAt: string;
}

export interface CreateInterviewRequest {
  applicationId: number;
  scheduledDate: string;
  scheduledTime: string | null;
  interviewType: InterviewType;
  meetingLink: string | null;
  interviewerName: string;
  notes: string;
  status?: InterviewStatus;
}

// Get interviews available to the logged-in user.
export async function getInterviews(): Promise<Interview[]> {
  const response = await api.get<Interview[]>("/api/interviews");
  return response.data;
}

// Get one interview.
export async function getInterviewById(
  id: number
): Promise<Interview> {
  const response = await api.get<Interview>(
    `/api/interviews/${id}`
  );
  return response.data;
}

// Schedule a new interview.
export async function scheduleInterview(
  data: CreateInterviewRequest
): Promise<Interview> {
  const response = await api.post<Interview>(
    "/api/interviews",
    data
  );
  return response.data;
}

// Reschedule an existing interview.
export async function rescheduleInterview(
  id: number,
  data: CreateInterviewRequest
): Promise<Interview> {
  const response = await api.put<Interview>(
    `/api/interviews/${id}`,
    data
  );
  return response.data;
}

// Cancel an interview or mark it as completed.
export async function updateInterviewStatus(
  id: number,
  status: "COMPLETED" | "CANCELLED"
): Promise<Interview> {
  const response = await api.patch<Interview>(
    `/api/interviews/${id}/status`,
    null,
    {
      params: { status },
    }
  );
  return response.data;
}