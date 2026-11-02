
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import axios from "axios";

import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  FileText,
  LogOut,
  Search,
  Upload,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  getApplications,
  getJobs,
  getNotifications,
  getResumes,
  getSavedJobs,
  getStudentProfile,
  markNotificationAsRead,
  uploadResume,
  type Application,
  type Job,
  type Notification,
  type Resume,
  type StudentProfile,
} from "../../services/studentService";

// NEW: Fetch the student's saved external internships.
import {
  getSavedExternalInternships,
} from "../../services/externalInternshipService";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);

  const [studentProfile, setStudentProfile] =
    useState<StudentProfile | null>(null);

  // Counts both internal jobs and external internships.
  const [savedJobCount, setSavedJobCount] = useState(0);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [markingNotificationId, setMarkingNotificationId] =
    useState<number | null>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");
  const [resumeError, setResumeError] = useState("");

  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const activeResume =
    resumes
      .filter((resume) => resume.studentId === user?.userId)
      .find((resume) => resume.isActive) ?? null;

  const userApplications = applications.filter(
    (application) => application.studentId === user?.userId
  );

  const appliedJobIds = new Set(
    userApplications.map((application) => application.jobId)
  );

  /*
   * Calculate profile completion from
   * Phone + Location + Bio.
   */
  const profileFields = [
    studentProfile?.phone,
    studentProfile?.location,
    studentProfile?.bio,
  ];

  const completedProfileFields = profileFields.filter(
    (value) =>
      value !== null &&
      value !== undefined &&
      value.trim().length > 0
  ).length;

  const profileCompleted = Math.round(
    (completedProfileFields / 3) * 100
  );

  useEffect(() => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    void loadDashboard();
  }, [user?.userId]);

  async function loadDashboard() {
    if (!user?.userId) {
      return;
    }

    try {
      setLoading(true);
      setDashboardError("");

      const [
        jobsData,
        applicationsData,
        resumesData,
        savedJobsData,
        profileData,
      ] = await Promise.all([
        getJobs(),
        getApplications(),
        getResumes(),
        getSavedJobs(),
        getStudentProfile(user.userId),
      ]);

      setJobs(jobsData);
      setApplications(applicationsData);
      setResumes(resumesData);
      setStudentProfile(profileData);

      // Count regular JobConnect saved jobs.
      const currentUserSavedJobs = savedJobsData.filter(
        (savedJob) => savedJob.studentId === user.userId
      );

      const internalSavedCount =
        currentUserSavedJobs.length;

      // Show the internal count immediately.
      setSavedJobCount(internalSavedCount);

      /*
       * NEW: Include saved external internships.
       *
       * If the external API is unavailable, retain the
       * regular saved-job count and keep the dashboard working.
       */
      try {
        const externalSaved =
          await getSavedExternalInternships();

        const currentUserExternalSaved =
          externalSaved.filter(
            (internship) =>
              internship.studentId === user.userId
          );

        setSavedJobCount(
          internalSavedCount +
            currentUserExternalSaved.length
        );
      } catch (externalSavedError) {
        console.error(
          "Unable to load saved external internships:",
          externalSavedError
        );

        setSavedJobCount(internalSavedCount);
      }

      /*
       * Load notifications independently so a notification
       * error does not prevent the rest of the dashboard loading.
       */
      try {
        const notificationsData = await getNotifications();

        setNotifications(notificationsData);
      } catch (notificationError) {
        console.error(
          "Notifications loading error:",
          notificationError
        );

        setNotifications([]);
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);

      setDashboardError(
        "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    setResumeMessage("");
    setResumeError("");

    if (!file) {
      setResumeFile(null);
      return;
    }

    const isPdf = file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setResumeFile(null);

      setResumeError(
        "Please upload your resume in PDF format."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setResumeFile(null);

      setResumeError(
        "Resume must be 10 MB or smaller."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setResumeFile(file);
  }

  function getBackendErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        const data = responseData as {
          message?: string;
          error?: string;
        };

        if (
          typeof data.message === "string" &&
          data.message.trim()
        ) {
          return cleanErrorMessage(data.message);
        }
      }

      if (
        typeof responseData === "string" &&
        responseData.trim()
      ) {
        return cleanErrorMessage(responseData);
      }
    }

    return "Please upload a correct resume PDF.";
  }

  function cleanErrorMessage(message: string): string {
    let cleaned = message.trim();

    cleaned = cleaned.replace(
      /^\s*\d{3}\s+[A-Z_ ]+\s*/i,
      ""
    );

    cleaned = cleaned.replace(
      /^\s*BAD_REQUEST\s*/i,
      ""
    );

    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }

    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
      cleaned = cleaned.slice(1, -1);
    }

    return cleaned.trim();
  }

  async function handleResumeUpload() {
    if (!resumeFile) {
      setResumeError(
        "Please choose your resume PDF first."
      );
      return;
    }

    setUploadingResume(true);
    setResumeMessage("");
    setResumeError("");

    try {
      const uploadedResume = await uploadResume(resumeFile);

      setResumes((current) => {
        const updated = current.map((resume) => ({
          ...resume,
          isActive: resume.id === uploadedResume.id,
        }));

        const alreadyExists = updated.some(
          (resume) => resume.id === uploadedResume.id
        );

        if (alreadyExists) {
          return updated;
        }

        return [...updated, uploadedResume];
      });

      setResumeFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setResumeMessage(
        "Resume uploaded successfully!"
      );
    } catch (error) {
      console.error("Resume upload error:", error);

      setResumeMessage("");

      setResumeError(
        getBackendErrorMessage(error)
      );
    } finally {
      setUploadingResume(false);
    }
  }

  // Mark a notification as read.
  async function handleMarkNotificationAsRead(
    notificationId: number
  ) {
    setMarkingNotificationId(notificationId);

    try {
      const updatedNotification =
        await markNotificationAsRead(notificationId);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === updatedNotification.id
            ? updatedNotification
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Unable to mark notification as read:",
        error
      );

      setDashboardError(
        "Unable to update the notification. Please try again."
      );
    } finally {
      setMarkingNotificationId(null);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function goToJobs() {
    navigate("/student/jobs");
  }

  function goToSavedJobs() {
    navigate("/student/saved-jobs");
  }

  function goToApplications() {
    navigate("/student/applications");
  }

  function goToProfile() {
    navigate("/student/profile");
  }

  function toggleNotifications() {
    setNotificationsOpen((current) => !current);
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* NAVBAR */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <BriefcaseBusiness size={20} />
            </div>

            <div className="text-left">
              <div className="font-bold">JobConnect</div>

              <div className="text-xs text-slate-500">
                Student Portal
              </div>
            </div>
          </button>

          <nav className="hidden items-center gap-7 md:flex">
            <button
              type="button"
              onClick={() => navigate("/student/dashboard")}
              className="font-medium text-indigo-600"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={goToJobs}
              className="font-medium text-slate-600 hover:text-indigo-600"
            >
              Find Jobs
            </button>

            <button
              type="button"
              onClick={goToApplications}
              className="font-medium text-slate-600 hover:text-indigo-600"
            >
              Applications
            </button>

            <button
              type="button"
              onClick={goToSavedJobs}
              className="font-medium text-slate-600 hover:text-indigo-600"
            >
              Saved Jobs
            </button>
          </nav>

          <div className="relative flex items-center gap-3">
            {/* NOTIFICATION BELL */}

            <button
              type="button"
              onClick={toggleNotifications}
              aria-label={`Notifications, ${unreadNotificationCount} unread`}
              aria-expanded={notificationsOpen}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Bell size={20} />

              {unreadNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                  {unreadNotificationCount > 99
                    ? "99+"
                    : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* NOTIFICATION PANEL */}

            {notificationsOpen && (
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 top-full z-50 mt-3 w-[min(90vw,24rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Notifications
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Updates about your applications and interviews
                    </p>
                  </div>

                  {unreadNotificationCount > 0 && (
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {unreadNotificationCount} unread
                    </span>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Bell
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-semibold text-slate-700">
                      No notifications yet
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Interview and application updates will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`border-b border-slate-100 px-5 py-4 last:border-b-0 ${
                          notification.isRead
                            ? "bg-white"
                            : "bg-indigo-50/60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                              notification.isRead
                                ? "bg-slate-300"
                                : "bg-indigo-600"
                            }`}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-slate-900">
                                {notification.title}
                              </h3>

                              {!notification.isRead && (
                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                                  New
                                </span>
                              )}
                            </div>

                            <p className="mt-1 break-words text-sm leading-5 text-slate-600">
                              {notification.message}
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
                            </p>

                            {!notification.isRead && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMarkNotificationAsRead(
                                    notification.id
                                  )
                                }
                                disabled={
                                  markingNotificationId ===
                                  notification.id
                                }
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Check size={14} />

                                {markingNotificationId ===
                                notification.id
                                  ? "Updating..."
                                  : "Mark as read"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STUDENT PROFILE */}

            <button
              type="button"
              onClick={goToProfile}
              aria-label="Open profile"
              className="hidden h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 transition hover:bg-indigo-200 sm:flex"
            >
              <UserRound size={18} />
            </button>

            {/* LOGOUT */}

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <LogOut size={16} />
                Logout
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* WELCOME */}

        <section className="mb-8">
          <h1 className="text-3xl font-bold">
            Welcome, {user.name}
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your job search,
            applications and resume
            from one place.
          </p>
        </section>

        {/* DASHBOARD ERROR */}

        {dashboardError && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {dashboardError}
          </div>
        )}

        {/* STAT CARDS */}

        <section className="grid gap-5 md:grid-cols-3">
          <button
            type="button"
            onClick={goToApplications}
            className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <BriefcaseBusiness size={21} />
            </div>

            <div className="text-3xl font-bold">
              {loading ? "..." : userApplications.length}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              Applications
            </div>
          </button>

          {/* Counts regular jobs plus external internships. */}

          <button
            type="button"
            onClick={goToSavedJobs}
            className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Bookmark size={21} />
            </div>

            <div className="text-3xl font-bold">
              {loading ? "..." : savedJobCount}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              Saved jobs & internships
            </div>
          </button>

          <button
            type="button"
            onClick={goToProfile}
            className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
              <UserRound size={21} />
            </div>

            <div className="text-3xl font-bold">
              {loading ? "..." : `${profileCompleted}%`}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              Profile completed
            </div>
          </button>
        </section>

        {/* RESUME */}

        <section className="mt-8 rounded-2xl border border-indigo-100 bg-white shadow-sm">
          <div className="border-b border-indigo-100 bg-indigo-50/60 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <FileText size={23} />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Your Resume
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Upload your resume once
                  and use it for all your
                  job and internship
                  applications.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {activeResume ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
                      <FileText size={22} />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        {activeResume.fileName}
                      </p>

                      <p className="mt-1 text-sm text-green-700">
                        Resume ready for applications
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="rounded-xl border border-green-300 bg-white px-5 py-3 text-sm font-semibold text-green-700 hover:bg-green-50"
                  >
                    Replace Resume
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Upload size={25} />
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  Upload your resume
                </h3>

                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                  Upload your latest resume
                  in PDF format. You only
                  need to upload it once.
                  The same resume will be
                  used when you apply for
                  jobs and internships.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={uploadingResume}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 text-left text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resumeFile
                  ? resumeFile.name
                  : "Choose resume PDF"}
              </button>

              <button
                type="button"
                onClick={handleResumeUpload}
                disabled={uploadingResume || !resumeFile}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  <Upload size={17} />

                  {uploadingResume
                    ? "Uploading..."
                    : activeResume
                      ? "Replace Resume"
                      : "Upload Resume"}
                </span>
              </button>
            </div>

            {resumeFile && (
              <p className="mt-3 text-sm text-slate-500">
                Selected file:{" "}
                <span className="font-medium text-slate-700">
                  {resumeFile.name}
                </span>
              </p>
            )}

            {resumeMessage && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                ✓ {resumeMessage}
              </div>
            )}

            {resumeError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {resumeError}
              </div>
            )}

            <p className="mt-4 text-xs text-slate-400">
              Accepted format: PDF only.
              Maximum size: 10 MB.
            </p>
          </div>
        </section>

        {/* QUICK ACTIONS */}

        <section className="mt-8">
          <h2 className="text-xl font-bold">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage your job search from one place.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={goToJobs}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Search
                size={22}
                className="text-indigo-600"
              />

              <h3 className="mt-4 font-bold">
                Find Jobs
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Search jobs and internships.
              </p>
            </button>

            <button
              type="button"
              onClick={goToApplications}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <BriefcaseBusiness
                size={22}
                className="text-indigo-600"
              />

              <h3 className="mt-4 font-bold">
                My Applications
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Track your applications.
              </p>
            </button>

            <button
              type="button"
              onClick={goToProfile}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <UserRound
                size={22}
                className="text-indigo-600"
              />

              <h3 className="mt-4 font-bold">
                Complete Profile
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Keep your profile updated.
              </p>
            </button>
          </div>
        </section>

        {/* RECENT JOBS */}

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Recent Jobs
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Explore available opportunities.
              </p>
            </div>

            <button
              type="button"
              onClick={goToJobs}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs
              .filter((job) => job.status === "PUBLISHED")
              .slice(0, 6)
              .map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">
                        {job.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {job.location}
                      </p>
                    </div>

                    {appliedJobIds.has(job.id) && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        Applied
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700">
                      {job.jobType}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {job.workMode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/student/jobs/${job.id}`)
                    }
                    className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    View Job
                  </button>
                </div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}