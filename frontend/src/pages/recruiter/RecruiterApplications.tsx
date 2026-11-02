
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Search,
  UserRound,
  Video,
  X,
} from "lucide-react";

import {
  getRecruiterApplications,
  getResumePdf,
  updateApplicationStatus,
  type ApplicationStatus,
  type RecruiterApplication,
} from "../../services/applicationService";

import {
  getInterviews,
  scheduleInterview,
  rescheduleInterview,
  updateInterviewStatus,
  type CreateInterviewRequest,
  type Interview,
  type InterviewType,
} from "../../services/interviewService";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
];

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClasses(status: ApplicationStatus): string {
  switch (status) {
    case "APPLIED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "UNDER_REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "SHORTLISTED":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "INTERVIEW":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "SELECTED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "WITHDRAWN":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function formatDate(value: string): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type InterviewFormState = {
  scheduledDate: string;
  scheduledTime: string;
  interviewType: InterviewType;
  meetingLink: string;
  interviewerName: string;
  notes: string;
};

function getTodayLocalDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function initialInterviewForm(): InterviewFormState {
  return {
    scheduledDate: getTodayLocalDate(),
    scheduledTime: "10:00",
    interviewType: "ONLINE",
    meetingLink: "",
    interviewerName: "",
    notes: "",
  };
}

function formatInterviewDate(value: string): string {
  if (!value) return "Date not set";

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatInterviewTime(value: string | null): string {
  return value ? value.slice(0, 5) : "Time not set";
}

function sortInterviewsNewestFirst(items: Interview[]): Interview[] {
  return [...items].sort((a, b) => {
    const aKey =
      `${a.scheduledDate || ""}T${a.scheduledTime || "00:00"}`;
    const bKey =
      `${b.scheduledDate || ""}T${b.scheduledTime || "00:00"}`;

    return bKey.localeCompare(aKey);
  });
}

function getRequestErrorMessage(
  error: unknown,
  fallback: string
): string {
  const candidate = error as {
    response?: {
      data?: {
        message?: string;
        error?: string;
      };
    };
    message?: string;
  };

  return (
    candidate.response?.data?.message ||
    candidate.response?.data?.error ||
    candidate.message ||
    fallback
  );
}

export default function RecruiterApplications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<
    RecruiterApplication[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [interviewLoadMessage, setInterviewLoadMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [scheduleApplication, setScheduleApplication] =
    useState<RecruiterApplication | null>(null);

  const [editingInterview, setEditingInterview] =
    useState<Interview | null>(null);

  const [scheduleForm, setScheduleForm] =
    useState<InterviewFormState>(initialInterviewForm);

  const [scheduling, setScheduling] = useState(false);
  const [schedulingError, setSchedulingError] = useState("");

  const [updatingInterviewId, setUpdatingInterviewId] =
    useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    ApplicationStatus | "ALL"
  >("ALL");

  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Track which applicant's resume is currently opening.
  const [openingResumeId, setOpeningResumeId] =
    useState<number | null>(null);

  // --------------------------------------------------
  // LOAD APPLICATIONS
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    async function loadApplications() {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getRecruiterApplications();

        if (active) {
          setApplications(data);
        }
      } catch (error: unknown) {
        console.error(
          "Recruiter applications loading error:",
          error
        );

        if (active) {
          setErrorMessage(
            getRequestErrorMessage(
              error,
              "Unable to load applications."
            )
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadApplications();

    return () => {
      active = false;
    };
  }, []);

  // --------------------------------------------------
  // LOAD INTERVIEW HISTORY
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    async function loadInterviewData() {
      try {
        setInterviewLoadMessage("");

        const data = await getInterviews();

        if (active) {
          setInterviews(data);
        }
      } catch (error: unknown) {
        console.error(
          "Recruiter interviews loading error:",
          error
        );

        if (active) {
          setInterviewLoadMessage(
            getRequestErrorMessage(
              error,
              "Applications loaded, but scheduled interviews could not be loaded."
            )
          );
        }
      }
    }

    void loadInterviewData();

    return () => {
      active = false;
    };
  }, []);

  // --------------------------------------------------
  // FILTER APPLICATIONS
  // --------------------------------------------------

  const filteredApplications = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        application.status === statusFilter;

      const matchesSearch =
        !search ||
        application.studentName?.toLowerCase().includes(search) ||
        application.studentLocation?.toLowerCase().includes(search) ||
        application.jobTitle?.toLowerCase().includes(search) ||
        application.resumeFileName?.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [applications, searchTerm, statusFilter]);

  // --------------------------------------------------
  // APPLICATION COUNTS
  // --------------------------------------------------

  const counts = useMemo(() => {
    return {
      total: applications.length,
      applied: applications.filter(
        (item) => item.status === "APPLIED"
      ).length,
      shortlisted: applications.filter(
        (item) => item.status === "SHORTLISTED"
      ).length,
      interview: applications.filter(
        (item) => item.status === "INTERVIEW"
      ).length,
      selected: applications.filter(
        (item) => item.status === "SELECTED"
      ).length,
    };
  }, [applications]);

  // --------------------------------------------------
  // VIEW APPLICANT RESUME
  // --------------------------------------------------

  async function handleViewResume(
    application: RecruiterApplication
  ) {
    if (!application.resumeId) {
      setErrorMessage(
        "Resume ID is missing for this application. Please check the recruiter application API response."
      );
      return;
    }

    // Open the tab immediately in response to the click.
    // This helps avoid browser pop-up blocking.
    const resumeTab = window.open("about:blank", "_blank");

    if (!resumeTab) {
      setErrorMessage(
        "The resume tab was blocked. Allow pop-ups for JobConnect and try again."
      );
      return;
    }

    // Prevent the opened tab from controlling this page.
    resumeTab.opener = null;

    try {
      setOpeningResumeId(application.applicationId);
      setErrorMessage("");
      setSuccessMessage("");

      resumeTab.document.title = "Opening resume";
      resumeTab.document.body.innerHTML =
        "<p style='font-family: sans-serif; padding: 24px'>Loading resume...</p>";

      // Fetch the file through the authenticated API client.
      // Backend permissions are checked for every request.
      const pdfBlob = await getResumePdf(application.resumeId);

      if (!(pdfBlob instanceof Blob) || pdfBlob.size === 0) {
        throw new Error("The server returned an empty resume file.");
      }

      const pdfUrl = URL.createObjectURL(
        new Blob([pdfBlob], {
          type: "application/pdf",
        })
      );

      resumeTab.location.href = pdfUrl;

      // Allow time for the browser PDF viewer to load the file.
      window.setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 5 * 60 * 1000);
    } catch (error: unknown) {
      console.error("Unable to open applicant resume:", error);

      if (!resumeTab.closed) {
        resumeTab.close();
      }

      setErrorMessage(
        getRequestErrorMessage(
          error,
          "Unable to open the student's resume. Check that the backend file endpoint is running and that you have permission to access this resume."
        )
      );
    } finally {
      setOpeningResumeId(null);
    }
  }

  // --------------------------------------------------
  // UPDATE INTERVIEW FORM
  // --------------------------------------------------

  function updateScheduleField<K extends keyof InterviewFormState>(
    field: K,
    value: InterviewFormState[K]
  ) {
    setScheduleForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // --------------------------------------------------
  // OPEN SCHEDULE FORM
  // --------------------------------------------------

  function openScheduleModal(
    application: RecruiterApplication
  ) {
    setScheduleApplication(application);
    setEditingInterview(null);
    setScheduleForm(initialInterviewForm());
    setSchedulingError("");
    setSuccessMessage("");
  }

  // --------------------------------------------------
  // OPEN RESCHEDULE FORM
  // --------------------------------------------------

  function openRescheduleModal(
    application: RecruiterApplication,
    interview: Interview
  ) {
    setScheduleApplication(application);
    setEditingInterview(interview);
    setSchedulingError("");
    setSuccessMessage("");

    setScheduleForm({
      scheduledDate: interview.scheduledDate,
      scheduledTime: interview.scheduledTime || "10:00",
      interviewType: interview.interviewType,
      meetingLink: interview.meetingLink || "",
      interviewerName: interview.interviewerName || "",
      notes: interview.notes || "",
    });
  }

  // --------------------------------------------------
  // CLOSE INTERVIEW FORM
  // --------------------------------------------------

  function closeScheduleModal() {
    if (scheduling) return;

    setScheduleApplication(null);
    setEditingInterview(null);
    setSchedulingError("");
  }

  // --------------------------------------------------
  // SCHEDULE OR RESCHEDULE INTERVIEW
  // --------------------------------------------------

  async function handleScheduleInterview(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!scheduleApplication) return;

    setSchedulingError("");
    setSuccessMessage("");

    if (
      !scheduleForm.scheduledDate ||
      scheduleForm.scheduledDate < getTodayLocalDate()
    ) {
      setSchedulingError(
        "Choose today or a future date for the interview."
      );
      return;
    }

    if (!scheduleForm.scheduledTime) {
      setSchedulingError("Choose an interview time.");
      return;
    }

    if (!scheduleForm.interviewerName.trim()) {
      setSchedulingError("Enter the interviewer's name.");
      return;
    }

    if (
      scheduleForm.interviewType === "ONLINE" &&
      !scheduleForm.meetingLink.trim()
    ) {
      setSchedulingError(
        "A meeting link is required for online interviews."
      );
      return;
    }

    if (scheduleForm.interviewType === "ONLINE") {
      try {
        const meetingUrl = new URL(
          scheduleForm.meetingLink.trim()
        );

        if (
          meetingUrl.protocol !== "https:" &&
          meetingUrl.protocol !== "http:"
        ) {
          throw new Error("Invalid URL protocol");
        }
      } catch {
        setSchedulingError(
          "Enter a valid meeting URL beginning with https:// or http://."
        );
        return;
      }
    }

    const request: CreateInterviewRequest = {
      applicationId: scheduleApplication.applicationId,
      scheduledDate: scheduleForm.scheduledDate,
      scheduledTime: scheduleForm.scheduledTime,
      interviewType: scheduleForm.interviewType,
      meetingLink:
        scheduleForm.interviewType === "ONLINE"
          ? scheduleForm.meetingLink.trim()
          : null,
      interviewerName: scheduleForm.interviewerName.trim(),
      notes: scheduleForm.notes.trim(),
    };

    try {
      setScheduling(true);

      let savedInterview: Interview;

      if (editingInterview) {
        savedInterview = await rescheduleInterview(
          editingInterview.id,
          request
        );

        setInterviews((current) =>
          current.map((item) =>
            item.id === savedInterview.id
              ? savedInterview
              : item
          )
        );

        setSuccessMessage("Interview rescheduled successfully.");
      } else {
        savedInterview = await scheduleInterview(request);

        setInterviews((current) => [
          ...current,
          savedInterview,
        ]);

        setApplications((current) =>
          current.map((application) =>
            application.applicationId ===
            scheduleApplication.applicationId
              ? {
                  ...application,
                  status: "INTERVIEW" as ApplicationStatus,
                }
              : application
          )
        );

        setSuccessMessage("Interview scheduled successfully.");
      }

      setScheduleApplication(null);
      setEditingInterview(null);
      setSchedulingError("");
    } catch (error: unknown) {
      console.error("Interview save failed:", error);

      setSchedulingError(
        getRequestErrorMessage(
          error,
          editingInterview
            ? "Unable to reschedule the interview."
            : "Unable to schedule the interview."
        )
      );
    } finally {
      setScheduling(false);
    }
  }

  // --------------------------------------------------
  // UPDATE APPLICATION STATUS
  // --------------------------------------------------

  async function handleStatusChange(
    applicationId: number,
    status: ApplicationStatus
  ) {
    try {
      setUpdatingId(applicationId);
      setErrorMessage("");
      setSuccessMessage("");

      const updated = await updateApplicationStatus(
        applicationId,
        status
      );

      setApplications((current) =>
        current.map((application) =>
          application.applicationId === applicationId
            ? updated
            : application
        )
      );

      setSuccessMessage(
        "Application status updated successfully."
      );
    } catch (error: unknown) {
      console.error(
        "Application status update error:",
        error
      );

      setErrorMessage(
        getRequestErrorMessage(
          error,
          "Unable to update application status."
        )
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // --------------------------------------------------
  // GET INTERVIEWS FOR AN APPLICATION
  // --------------------------------------------------

  function getInterviewsForApplication(
    applicationId: number
  ): Interview[] {
    return sortInterviewsNewestFirst(
      interviews.filter(
        (interview) =>
          interview.applicationId === applicationId
      )
    );
  }

  // --------------------------------------------------
  // COMPLETE OR CANCEL INTERVIEW
  // --------------------------------------------------

  async function handleInterviewStatus(
    interview: Interview,
    status: "COMPLETED" | "CANCELLED"
  ) {
    const action =
      status === "CANCELLED" ? "cancel" : "mark as completed";

    if (
      !window.confirm(
        `Are you sure you want to ${action} this interview?`
      )
    ) {
      return;
    }

    try {
      setUpdatingInterviewId(interview.id);
      setErrorMessage("");
      setSuccessMessage("");

      const updated = await updateInterviewStatus(
        interview.id,
        status
      );

      setInterviews((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      setSuccessMessage(
        status === "CANCELLED"
          ? "Interview cancelled successfully."
          : "Interview marked as completed."
      );
    } catch (error: unknown) {
      console.error(
        "Interview status update failed:",
        error
      );

      setErrorMessage(
        getRequestErrorMessage(
          error,
          "Unable to update the interview status."
        )
      );
    } finally {
      setUpdatingInterviewId(null);
    }
  }

  // --------------------------------------------------
  // PAGE UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                JobConnect
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Recruiter Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/recruiter/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-7 text-white shadow-xl shadow-indigo-100 sm:p-9">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Candidate Applications
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Manage Applications
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
              Review candidates, view submitted resumes, manage
              application statuses, and track interview outcomes.
            </p>
          </div>
        </section>

        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
          >
            {successMessage}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700"
          >
            {errorMessage}
          </div>
        )}

        {interviewLoadMessage && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            {interviewLoadMessage}
          </div>
        )}

        {/* SUMMARY */}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Applications
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {counts.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Applied
            </p>
            <p className="mt-2 text-3xl font-extrabold text-blue-600">
              {counts.applied}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Shortlisted
            </p>
            <p className="mt-2 text-3xl font-extrabold text-violet-600">
              {counts.shortlisted}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Interview
            </p>
            <p className="mt-2 text-3xl font-extrabold text-cyan-600">
              {counts.interview}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Selected
            </p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600">
              {counts.selected}
            </p>
          </div>
        </section>

        {/* SEARCH AND FILTERS */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by student, job, location or resume..."
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as ApplicationStatus | "ALL"
                  )
                }
                className="appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="ALL">All Applications</option>

                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </section>

        {/* APPLICATION LIST */}
        <section className="mt-8">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-sm">
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-indigo-600" />
              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading candidate applications...
              </p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">
              <UserRound className="mx-auto h-10 w-10 text-indigo-500" />

              <h3 className="mt-5 text-xl font-extrabold text-slate-900">
                No applications found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                No applications match your current search or filter.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredApplications.map((application) => {
                const applicationInterviews =
                  getInterviewsForApplication(application.applicationId);

                const terminalStatus =
                  application.status === "REJECTED" ||
                  application.status === "WITHDRAWN";

                return (
                  <article
                    key={application.applicationId}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-lg"
                  >
                    {/* CANDIDATE HEADER */}
                    <div className="border-b border-slate-100 p-6">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                            <UserRound className="h-6 w-6" />
                          </div>

                          <div>
                            <h3 className="text-xl font-extrabold text-slate-900">
                              {application.studentName}
                            </h3>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                              {application.studentLocation && (
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin className="h-4 w-4" />
                                  {application.studentLocation}
                                </span>
                              )}

                              <span className="inline-flex items-center gap-1.5">
                                <BriefcaseBusiness className="h-4 w-4" />
                                {application.jobTitle}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-extrabold ${getStatusClasses(application.status)}`}
                        >
                          {formatStatus(application.status)}
                        </span>
                      </div>
                    </div>

                    {/* APPLICATION DETAILS */}
                    <div className="grid gap-5 p-6 lg:grid-cols-3">
                      {/* RESUME AND VIEW BUTTON */}
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <FileText className="h-4 w-4" />

                          <p className="text-[11px] font-semibold uppercase tracking-wide">
                            Resume
                          </p>
                        </div>

                        <p className="mt-2 break-all text-sm font-bold text-slate-800">
                          {application.resumeFileName || "Resume submitted"}
                        </p>

                        <button
                          type="button"
                          onClick={() => void handleViewResume(application)}
                          disabled={
                            openingResumeId === application.applicationId ||
                            !application.resumeId
                          }
                          className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {openingResumeId === application.applicationId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}

                          {openingResumeId === application.applicationId
                            ? "Opening Resume..."
                            : "View Resume"}
                        </button>
                      </div>

                      {/* APPLIED DATE */}
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <CalendarDays className="h-4 w-4" />

                          <p className="text-[11px] font-semibold uppercase tracking-wide">
                            Applied On
                          </p>
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-800">
                          {formatDate(application.appliedAt)}
                        </p>
                      </div>

                      {/* APPLICATION ID */}
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <CheckCircle2 className="h-4 w-4" />

                          <p className="text-[11px] font-semibold uppercase tracking-wide">
                            Application ID
                          </p>
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-800">
                          #{application.applicationId}
                        </p>
                      </div>
                    </div>

                    {/* COVER LETTER */}
                    {application.coverLetter && (
                      <div className="px-6 pb-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Cover Letter
                          </p>

                          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                            {application.coverLetter}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* INTERVIEW HISTORY */}
                    <div className="px-6 pb-6">
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                            <Video className="h-4 w-4 text-indigo-600" />
                            Interview History ({applicationInterviews.length})
                          </h4>
                        </div>

                        {applicationInterviews.length === 0 ? (
                          <p className="mt-3 text-sm text-slate-500">
                            No interviews scheduled yet.
                          </p>
                        ) : (
                          <div className="mt-4 space-y-4">
                            {applicationInterviews.map((interview) => (
                              <div
                                key={interview.id}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="font-bold text-slate-900">
                                      Interview #{interview.id}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-600">
                                      {formatInterviewDate(interview.scheduledDate)}
                                      {" · "}
                                      {formatInterviewTime(interview.scheduledTime)}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-600">
                                      {interview.interviewType} ·{" "}
                                      {interview.interviewerName ||
                                        "Interviewer not specified"}
                                    </p>
                                  </div>

                                  <span
                                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                                      interview.status === "SCHEDULED"
                                        ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                                        : interview.status === "COMPLETED"
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-rose-200 bg-rose-50 text-rose-700"
                                    }`}
                                  >
                                    {formatStatus(interview.status)}
                                  </span>
                                </div>

                                {interview.meetingLink && (
                                  <a
                                    href={interview.meetingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Open Meeting
                                  </a>
                                )}

                                {interview.notes && (
                                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                                    {interview.notes}
                                  </p>
                                )}

                                {interview.status === "SCHEDULED" && (
                                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openRescheduleModal(application, interview)
                                      }
                                      disabled={updatingInterviewId === interview.id}
                                      className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-60"
                                    >
                                      Reschedule
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleInterviewStatus(
                                          interview,
                                          "COMPLETED"
                                        )
                                      }
                                      disabled={updatingInterviewId === interview.id}
                                      className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                                    >
                                      {updatingInterviewId === interview.id
                                        ? "Updating..."
                                        : "Mark Completed"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleInterviewStatus(
                                          interview,
                                          "CANCELLED"
                                        )
                                      }
                                      disabled={updatingInterviewId === interview.id}
                                      className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                                    >
                                      Cancel Interview
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* APPLICATION FOOTER */}
                    <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Job
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {application.jobTitle}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {!terminalStatus && (
                          <button
                            type="button"
                            onClick={() => openScheduleModal(application)}
                            disabled={scheduling}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <CalendarDays className="h-4 w-4" />

                            {applicationInterviews.length > 0 ||
                            application.status === "INTERVIEW"
                              ? "Schedule Another Round"
                              : "Schedule Interview"}
                          </button>
                        )}

                        <div className="relative">
                          <select
                            value={application.status}
                            disabled={
                              updatingId === application.applicationId
                            }
                            onChange={(event) =>
                              void handleStatusChange(
                                application.applicationId,
                                event.target.value as ApplicationStatus
                              )
                            }
                            className="appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>

                          {updatingId === application.applicationId ? (
                            <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-indigo-600" />
                          ) : (
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* SCHEDULE / RESCHEDULE INTERVIEW MODAL */}
      {scheduleApplication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeScheduleModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-interview-title"
            className="my-6 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-slate-100 p-6 sm:p-7">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                  <Video className="h-4 w-4" />
                  Interview management
                </div>

                <h2
                  id="schedule-interview-title"
                  className="text-2xl font-extrabold text-slate-900"
                >
                  {editingInterview
                    ? "Reschedule Interview"
                    : "Schedule Interview"}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {scheduleApplication.studentName}
                  {" · "}
                  {scheduleApplication.jobTitle}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Application #{scheduleApplication.applicationId}
                </p>

                {editingInterview && (
                  <p className="mt-2 text-xs font-semibold text-indigo-600">
                    Editing interview #{editingInterview.id}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={closeScheduleModal}
                disabled={scheduling}
                aria-label="Close interview form"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* INTERVIEW FORM */}
            <form
              onSubmit={handleScheduleInterview}
              className="space-y-5 p-6 sm:p-7"
            >
              {schedulingError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700"
                >
                  {schedulingError}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Interview date *
                  </span>

                  <input
                    type="date"
                    required
                    min={getTodayLocalDate()}
                    value={scheduleForm.scheduledDate}
                    onChange={(event) =>
                      updateScheduleField(
                        "scheduledDate",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Clock3 className="h-4 w-4 text-slate-400" />
                    Interview time *
                  </span>

                  <input
                    type="time"
                    required
                    value={scheduleForm.scheduledTime}
                    onChange={(event) =>
                      updateScheduleField(
                        "scheduledTime",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Interview type *
                </span>

                <select
                  required
                  value={scheduleForm.interviewType}
                  onChange={(event) =>
                    updateScheduleField(
                      "interviewType",
                      event.target.value as InterviewType
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="ONLINE">Online interview</option>
                  <option value="OFFLINE">
                    Offline / in-person interview
                  </option>
                </select>
              </label>

              {scheduleForm.interviewType === "ONLINE" && (
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Meeting link *
                  </span>

                  <input
                    type="url"
                    required
                    value={scheduleForm.meetingLink}
                    onChange={(event) =>
                      updateScheduleField(
                        "meetingLink",
                        event.target.value
                      )
                    }
                    placeholder="https://meet.google.com/..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />

                  <span className="mt-1.5 block text-xs text-slate-400">
                    Enter the real meeting URL for Google Meet,
                    Microsoft Teams, Zoom, or another service.
                  </span>
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Interviewer name *
                </span>

                <input
                  type="text"
                  required
                  maxLength={120}
                  value={scheduleForm.interviewerName}
                  onChange={(event) =>
                    updateScheduleField(
                      "interviewerName",
                      event.target.value
                    )
                  }
                  placeholder="Enter the interviewer's name"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Instructions / notes
                </span>

                <textarea
                  rows={3}
                  maxLength={2000}
                  value={scheduleForm.notes}
                  onChange={(event) =>
                    updateScheduleField(
                      "notes",
                      event.target.value
                    )
                  }
                  placeholder={
                    scheduleForm.interviewType === "OFFLINE"
                      ? "Enter the office address, room number, documents to bring, or other instructions..."
                      : "Enter preparation guidance or other instructions..."
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              {/* FORM ACTIONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeScheduleModal}
                  disabled={scheduling}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={scheduling}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {scheduling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarDays className="h-4 w-4" />
                  )}

                  {scheduling
                    ? "Saving..."
                    : editingInterview
                    ? "Save Rescheduled Interview"
                    : "Schedule Interview"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
