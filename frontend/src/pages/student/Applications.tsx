import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
  Building2,
  CalendarDays,
  Clock3,
  Video,
} from "lucide-react";
import axios from "axios";

import { useAuth } from "../../context/AuthContext";

import {
  createApplication,
  getApplications,
  getCompanies,
  getInterviews,
  getJobs,
  getResumes,
  type Application,
  type Company,
  type Interview,
  type Job,
  type Resume,
} from "../../services/studentService";

interface LocationState {
  jobId?: number;
}

export default function Applications() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const locationState =
    location.state as LocationState | null;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [applications, setApplications] =
    useState<Application[]>([]);
  const [interviews, setInterviews] =
    useState<Interview[]>([]);

  const [selectedJobId, setSelectedJobId] =
    useState<number>(
      locationState?.jobId ?? 0
    );

  const [coverLetter, setCoverLetter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  /*
   * Green success popup.
   */
  const [showSuccessPopup, setShowSuccessPopup] =
    useState(false);

  const [successPopupMessage, setSuccessPopupMessage] =
    useState("");

  /*
   * Job currently inside the 6-second
   * success period.
   */
  const [successWaitingJobId, setSuccessWaitingJobId] =
    useState<number | null>(null);

  /*
   * Jobs for which the button has changed
   * to "Already Applied" after the 6-second
   * success period.
   */
  const [completedJobIds, setCompletedJobIds] =
    useState<number[]>([]);

  /*
   * Applications that already existed when
   * this page was loaded.
   *
   * IMPORTANT:
   * Newly submitted applications are NOT added
   * to this list immediately. This is what lets
   * the 6-second popup happen before the button
   * changes to "Already Applied".
   */
  const [initialAppliedJobIds, setInitialAppliedJobIds] =
    useState<number[]>([]);

  /*
   * Load all required data.
   */
  useEffect(() => {
    async function loadData() {
      if (!user?.userId) {
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const [
          jobsData,
          companiesData,
          resumesData,
          applicationsData,
          interviewsData,
        ] = await Promise.all([
          getJobs(),
          getCompanies(),
          getResumes(),
          getApplications(),
          getInterviews(),
        ]);

        setJobs(jobsData);
        setCompanies(companiesData);
        setResumes(resumesData);
        setApplications(
          applicationsData
        );
        setInterviews(
          interviewsData
        );

        /*
         * Store applications that existed BEFORE
         * this page session.
         */
        const existingStudentJobIds =
          applicationsData
            .filter(
              (application) =>
                application.studentId ===
                user.userId
            )
            .map(
              (application) =>
                application.jobId
            );

        setInitialAppliedJobIds(
          existingStudentJobIds
        );
      } catch (error) {
        console.error(
          "Failed to load application data:",
          error
        );

        setErrorMessage(
          "Unable to load application information."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.userId]);

  /*
   * Keep the green popup for exactly 6 seconds.
   *
   * ONLY AFTER those 6 seconds:
   * - popup disappears
   * - button becomes "Already Applied"
   */
  useEffect(() => {
    if (successWaitingJobId === null) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        const completedJobId =
          successWaitingJobId;

        setShowSuccessPopup(false);
        setSuccessWaitingJobId(null);

        setCompletedJobIds(
          (previous) => {
            if (
              previous.includes(
                completedJobId
              )
            ) {
              return previous;
            }

            return [
              ...previous,
              completedJobId,
            ];
          }
        );
      }, 6000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [successWaitingJobId]);

  /*
   * Current student's applications.
   */
  const studentApplications =
    applications.filter(
      (application) =>
        application.studentId ===
        user?.userId
    );

  /*
   * Current student's resumes.
   */
  const studentResumes =
    resumes.filter(
      (resume) =>
        resume.studentId ===
        user?.userId
    );

  /*
   * Active uploaded resume.
   */
  const activeResume =
    studentResumes.find(
      (resume) =>
        resume.isActive === true
    ) ?? null;

  /*
   * Selected job.
   */
  const selectedJob =
    jobs.find(
      (job) =>
        job.id === selectedJobId
    );

  /*
   * Existing application from the time
   * the page was loaded.
   */
  const alreadyAppliedFromPreviousLoad =
    selectedJobId > 0 &&
    initialAppliedJobIds.includes(
      selectedJobId
    );

  /*
   * Application whose 6-second success
   * period has completed.
   */
  const alreadyAppliedAfterSuccess =
    completedJobIds.includes(
      selectedJobId
    );

  /*
   * Has this application completed the
   * success period?
   */
  const buttonShouldSayAlreadyApplied =
    alreadyAppliedFromPreviousLoad ||
    alreadyAppliedAfterSuccess;

  /*
   * Is this selected job currently inside
   * the 6-second success period?
   */
  const isWaitingForSuccessPeriod =
    successWaitingJobId ===
    selectedJobId;

  /*
   * Find company name from companyId.
   */
  function getCompanyName(
    companyId: number
  ): string {
    return (
      companies.find(
        (company) =>
          company.id === companyId
      )?.name ??
      "Company"
    );
  }

  /*
   * Find resume used by an application.
   */
  function getResumeName(
    resumeId: number
  ): string {
    return (
      resumes.find(
        (resume) =>
          resume.id === resumeId
      )?.fileName ??
      "Resume"
    );
  }

  /*
   * Find interview for an application.
   */
  function getInterviewForApplication(
    applicationId: number
  ): Interview | null {
    return (
      interviews.find(
        (interview) =>
          interview.applicationId ===
          applicationId
      ) ?? null
    );
  }

  /*
   * Status badge styling.
   */
  function getStatusClasses(
    status: string
  ): string {
    switch (status) {
      case "APPLIED":
        return "bg-blue-100 text-blue-700";

      case "UNDER_REVIEW":
        return "bg-amber-100 text-amber-700";

      case "SHORTLISTED":
        return "bg-purple-100 text-purple-700";

      case "INTERVIEW":
        return "bg-cyan-100 text-cyan-700";

      case "SELECTED":
        return "bg-green-100 text-green-700";

      case "REJECTED":
        return "bg-red-100 text-red-700";

      case "WITHDRAWN":
        return "bg-slate-200 text-slate-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  /*
   * Format date.
   */
  function formatDate(
    value: string
  ): string {
    if (!value) {
      return "Not available";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  /*
   * Format time.
   */
  function formatTime(
    value: string
  ): string {
    if (!value) {
      return "Not available";
    }

    return value.slice(0, 5);
  }

  /*
   * Friendly backend error.
   */
  function getApplicationErrorMessage(
    error: unknown
  ): string {
    if (axios.isAxiosError(error)) {
      if (
        error.response?.status ===
        409
      ) {
        return "You have already applied for this job.";
      }

      const responseData =
        error.response?.data;

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        const data =
          responseData as {
            message?: string;
          };

        if (
          typeof data.message ===
          "string" &&
          data.message.trim()
        ) {
          return data.message.trim();
        }
      }
    }

    return "Unable to submit your application. Please try again.";
  }

  /*
   * Submit application.
   */
  async function handleSubmit() {
    setErrorMessage("");

    if (!user?.userId) {
      setErrorMessage(
        "Please log in again."
      );
      return;
    }

    if (!selectedJobId) {
      setErrorMessage(
        "Please select a job."
      );
      return;
    }

    if (!activeResume) {
      setErrorMessage(
        "Please upload your resume from the Dashboard before applying."
      );
      return;
    }

    if (
      buttonShouldSayAlreadyApplied
    ) {
      setErrorMessage(
        "You have already applied for this job."
      );
      return;
    }

    if (isWaitingForSuccessPeriod) {
      return;
    }

    try {
      setSubmitting(true);

      /*
       * Automatically use the active resume.
       */
      const application =
        await createApplication({
          studentId:
            user.userId,
          jobId:
            selectedJobId,
          resumeId:
            activeResume.id,
          coverLetter:
            coverLetter.trim(),
        });

      /*
       * Add the new application to the
       * My Applications section immediately.
       *
       * But do NOT add its jobId to
       * initialAppliedJobIds.
       *
       * Therefore the button does NOT
       * change immediately.
       */
      setApplications(
        (previous) => [
          ...previous,
          application,
        ]
      );

      setCoverLetter("");

      /*
       * Show the green popup.
       */
      setSuccessPopupMessage(
        "Application submitted successfully!"
      );

      setShowSuccessPopup(true);

      /*
       * Start the exact 6-second period.
       *
       * Only after 6 seconds will the
       * button become "Already Applied".
       */
      setSuccessWaitingJobId(
        selectedJobId
      );

    } catch (error) {
      console.error(
        "Application submission failed:",
        error
      );

      setShowSuccessPopup(false);
      setSuccessWaitingJobId(null);

      setErrorMessage(
        getApplicationErrorMessage(
          error
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * Change selected job.
   */
  function handleJobChange(
    jobId: number
  ) {
    if (
      successWaitingJobId !==
      null
    ) {
      return;
    }

    setSelectedJobId(jobId);
    setErrorMessage("");
  }

  /*
   * Close popup visually.
   *
   * IMPORTANT:
   * Closing it manually does NOT make the
   * button change early.
   */
  function closeSuccessPopup() {
    setShowSuccessPopup(false);
  }

  /*
   * Loading screen.
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-12">

          <div className="animate-pulse space-y-6">

            <div className="h-8 w-48 rounded bg-slate-200" />

            <div className="h-48 rounded-3xl bg-slate-200" />

            <div className="h-64 rounded-3xl bg-slate-200" />

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =====================================================
          SUCCESS POPUP
          ===================================================== */}

      {showSuccessPopup && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-8 pointer-events-none">

          <div className="pointer-events-auto w-full max-w-lg">

            <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-2xl">

              <div className="flex items-center gap-4 px-6 py-5">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">

                  <CheckCircle size={28} />

                </div>

                <div className="flex-1">

                  <p className="text-lg font-bold text-green-800">
                    Success!
                  </p>

                  <p className="mt-1 text-sm font-medium text-green-700">
                    {successPopupMessage}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeSuccessPopup
                  }
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close success message"
                >
                  <X size={19} />
                </button>

              </div>

              {/* 6-second progress bar */}

              <div className="h-1.5 bg-green-100">

                <div
                  className="h-full bg-green-500"
                  style={{
                    width: "100%",
                    animation:
                      "successProgress 6s linear forwards",
                  }}
                />

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <button
            onClick={() =>
              navigate(
                "/student/jobs"
              )
            }
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
          >
            <ArrowLeft size={18} />
            Back to Jobs
          </button>

          <div className="flex items-center gap-2">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <Briefcase size={20} />
            </div>

            <div>
              <p className="font-bold text-slate-900">
                JobConnect
              </p>

              <p className="text-xs text-slate-500">
                Student Portal
              </p>
            </div>

          </div>

        </div>

      </header>

      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="mx-auto max-w-6xl px-6 py-10">

        <div>

          <h1 className="text-3xl font-bold text-slate-900">
            Apply for a Job
          </h1>

          <p className="mt-2 text-slate-500">
            Select a job and submit your
            application using your uploaded
            resume.
          </p>

        </div>

        {/* ERROR */}

        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <span className="font-medium">
              {errorMessage}
            </span>

          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">

          {/* =================================================
              APPLICATION FORM
              ================================================= */}

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm lg:col-span-2">

            <h2 className="text-xl font-bold text-slate-900">
              Application Form
            </h2>

            {/* JOB */}

            <div className="mt-6">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Select Job
              </label>

              <select
                value={selectedJobId}
                onChange={(event) =>
                  handleJobChange(
                    Number(
                      event.target.value
                    )
                  )
                }
                disabled={
                  successWaitingJobId !==
                  null
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value={0}>
                  Select a job
                </option>

                {jobs
                  .filter(
                    (job) =>
                      job.status ===
                      "PUBLISHED"
                  )
                  .map((job) => (
                    <option
                      key={job.id}
                      value={job.id}
                    >
                      {job.title} -{" "}
                      {job.location}
                    </option>
                  ))}
              </select>

            </div>

            {/* SELECTED JOB */}

            {selectedJob && (
              <div className="mt-5 rounded-2xl bg-indigo-50 p-5">

                <div className="flex items-start gap-4">

                  <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                    <Briefcase size={22} />
                  </div>

                  <div>

                    <h3 className="font-bold text-slate-900">
                      {selectedJob.title}
                    </h3>

                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <Building2 size={15} />
                      {getCompanyName(
                        selectedJob.companyId
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      {selectedJob.location}
                      {" · "}
                      {selectedJob.workMode}
                    </p>

                    {selectedJob.stipend !==
                      null &&
                      selectedJob.stipend !==
                        undefined && (
                        <p className="mt-2 text-sm font-semibold text-indigo-700">
                          Stipend: ₹
                          {selectedJob.stipend}
                        </p>
                      )}

                  </div>

                </div>

              </div>
            )}

            {/* RESUME */}

            <div className="mt-6">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Resume
              </label>

              {activeResume ? (

                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                      <FileText size={21} />
                    </div>

                    <div>

                      <p className="font-semibold text-slate-900">
                        {activeResume.fileName}
                      </p>

                      <p className="mt-1 text-sm text-green-700">
                        Active resume will
                        be used automatically
                        for this application.
                      </p>

                    </div>

                  </div>

                </div>

              ) : (

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-start gap-3">

                      <AlertCircle
                        size={21}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />

                      <div>

                        <p className="font-semibold text-amber-800">
                          No active resume found
                        </p>

                        <p className="mt-1 text-sm text-amber-700">
                          Please upload your
                          resume from the
                          Student Dashboard
                          before applying.
                        </p>

                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/student/dashboard"
                        )
                      }
                      className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
                    >
                      <Upload size={17} />
                      Upload Resume
                    </button>

                  </div>

                </div>

              )}

            </div>

            {/* COVER LETTER */}

            <div className="mt-6">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Cover Letter
              </label>

              <textarea
                value={coverLetter}
                onChange={(event) => {
                  setCoverLetter(
                    event.target.value
                  );

                  setErrorMessage("");
                }}
                rows={7}
                disabled={
                  successWaitingJobId !==
                  null
                }
                placeholder="Write a short cover letter for this application..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

            </div>

            {/* SUBMIT BUTTON */}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                submitting ||
                !selectedJobId ||
                !activeResume ||
                buttonShouldSayAlreadyApplied ||
                isWaitingForSuccessPeriod
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Send size={18} />

              {submitting
                ? "Submitting..."
                : buttonShouldSayAlreadyApplied
                  ? "Already Applied"
                  : isWaitingForSuccessPeriod
                    ? "Application Submitted"
                    : "Submit Application"}

            </button>

            {isWaitingForSuccessPeriod &&
              !buttonShouldSayAlreadyApplied && (
                <p className="mt-3 text-center text-sm text-green-600">
                  Application submitted successfully.
                </p>
              )}

          </section>

          {/* =================================================
              MY APPLICATIONS
              ================================================= */}

          <aside className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

            <h2 className="text-lg font-bold text-slate-900">
              My Applications
            </h2>

            {studentApplications.length ===
            0 ? (

              <div className="mt-6 text-center">

                <FileText
                  size={36}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm text-slate-500">
                  You haven't submitted
                  any applications yet.
                </p>

              </div>

            ) : (

              <div className="mt-5 space-y-5">

                {studentApplications.map(
                  (application) => {

                    const job =
                      jobs.find(
                        (item) =>
                          item.id ===
                          application.jobId
                      );

                    const interview =
                      getInterviewForApplication(
                        application.id
                      );

                    return (
                      <div
                        key={application.id}
                        className="rounded-2xl border border-slate-200 p-5"
                      >

                        {/* Job title */}

                        <p className="font-semibold text-slate-900">
                          {job?.title ??
                            `Job #${application.jobId}`}
                        </p>

                        {/* Company */}

                        {job && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">

                            <Building2 size={14} />

                            {getCompanyName(
                              job.companyId
                            )}

                          </div>
                        )}

                        {/* Status */}

                        <div className="mt-4">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              application.status
                            )}`}
                          >
                            {application.status.replace(
                              "_",
                              " "
                            )}
                          </span>

                        </div>

                        {/* Applied date */}

                        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">

                          <CalendarDays
                            size={15}
                          />

                          Applied on{" "}
                          {formatDate(
                            application.appliedAt
                          )}

                        </div>

                        {/* Resume */}

                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">

                          <FileText
                            size={15}
                          />

                          {getResumeName(
                            application.resumeId
                          )}

                        </div>

                        {/* Interview */}

                        {interview && (
                          <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4">

                            <div className="flex items-center gap-2 font-semibold text-cyan-800">

                              <Video size={17} />

                              Interview Scheduled

                            </div>

                            <div className="mt-3 space-y-2 text-sm text-cyan-700">

                              <div className="flex items-center gap-2">

                                <CalendarDays
                                  size={14}
                                />

                                {formatDate(
                                  interview.scheduledDate
                                )}

                              </div>

                              <div className="flex items-center gap-2">

                                <Clock3
                                  size={14}
                                />

                                {formatTime(
                                  interview.scheduledTime
                                )}

                              </div>

                              {interview.interviewerName && (
                                <p>
                                  Interviewer:{" "}
                                  <span className="font-medium">
                                    {
                                      interview.interviewerName
                                    }
                                  </span>
                                </p>
                              )}

                              {interview.interviewType && (
                                <p>
                                  Type:{" "}
                                  <span className="font-medium">
                                    {
                                      interview.interviewType
                                    }
                                  </span>
                                </p>
                              )}

                              {interview.meetingLink && (
                                <a
                                  href={
                                    interview.meetingLink
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-block rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
                                >
                                  Join Interview
                                </a>
                              )}

                            </div>

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </aside>

        </div>

      </main>

      {/* SUCCESS POPUP ANIMATION */}

      <style>{`
        @keyframes successProgress {
          from {
            width: 100%;
          }

          to {
            width: 0%;
          }
        }
      `}</style>

    </div>
  );
}