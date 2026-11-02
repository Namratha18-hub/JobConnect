import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import NotificationBell from "../../components/NotificationBell";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  LogOut,
  MapPin,
  Plus,
  Users,
  Video,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  createJob,
  getAllJobs,
  getRecruiterProfiles,
  type CreateJobRequest,
  type RecruiterJob,
  type RecruiterProfile,
} from "../../services/recruiterService";

/* =========================================================
   FORM TYPES
========================================================= */
type FormJobType = "JOB" | "INTERNSHIP";
type FormWorkMode = "REMOTE" | "HYBRID" | "ONSITE";

interface FormState {
  jobType: FormJobType;
  title: string;
  description: string;
  location: string;
  workMode: FormWorkMode;
  employmentType: CreateJobRequest["employmentType"];
  experienceRequired: string;
  salaryMin: string;
  salaryMax: string;
  stipend: string;
  requirements: string;
  responsibilities: string;
  applicationDeadline: string;
  status: CreateJobRequest["status"];
}

/* =========================================================
   GET TODAY
========================================================= */
function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

/* =========================================================
   INITIAL FORM
========================================================= */
function initialForm(): FormState {
  return {
    jobType: "INTERNSHIP",
    title: "",
    description: "",
    location: "",
    workMode: "REMOTE",
    employmentType: "INTERNSHIP",
    experienceRequired: "0 years",
    salaryMin: "",
    salaryMax: "",
    stipend: "8000",
    requirements: "",
    responsibilities: "",
    applicationDeadline: "",
    status: "PUBLISHED",
  };
}

/* =========================================================
   ERROR HANDLER
========================================================= */
function normalizeError(error: unknown): string {
  const candidate = error as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };

  return (
    candidate.response?.data?.message ||
    candidate.response?.data?.error ||
    candidate.message ||
    "Unable to create the opportunity."
  );
}

/* =========================================================
   RECRUITER DASHBOARD
========================================================= */
export default function RecruiterDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* =======================================================
     RECRUITER PROFILE
  ======================================================= */
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  /* =======================================================
     POSTED JOBS
  ======================================================= */
  const [postedJobs, setPostedJobs] = useState<RecruiterJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  /* =======================================================
     POSTING FORM
  ======================================================= */
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /* =======================================================
     LOAD RECRUITER PROFILE
  ======================================================= */
  useEffect(() => {
    async function loadRecruiterProfile() {
      if (!user?.userId) {
        setProfileLoading(false);
        return;
      }

      try {
        const profiles = await getRecruiterProfiles();
        const currentProfile =
          profiles.find((item) => item.userId === user.userId) ?? null;
        setProfile(currentProfile);

        if (!currentProfile) {
          setErrorMessage("Recruiter profile was not found for this account.");
        }
      } catch (error) {
        console.error("Recruiter profile loading error:", error);
        setErrorMessage("Unable to load recruiter profile.");
      } finally {
        setProfileLoading(false);
      }
    }

    loadRecruiterProfile();
  }, [user?.userId]);

  /* =======================================================
     LOAD RECRUITER JOBS
  ======================================================= */
  useEffect(() => {
    async function loadPostedJobs() {
      if (!user?.userId) {
        setJobsLoading(false);
        return;
      }

      try {
        setJobsLoading(true);
        const allJobs = await getAllJobs();
        const recruiterJobs = allJobs.filter(
          (job) => job.postedBy === user.userId
        );
        setPostedJobs(recruiterJobs);
      } catch (error) {
        console.error("Recruiter jobs loading error:", error);
        setErrorMessage("Unable to load your posted opportunities.");
      } finally {
        setJobsLoading(false);
      }
    }

    loadPostedJobs();
  }, [user?.userId]);

  /* =======================================================
     STATISTICS
  ======================================================= */
  const publishedCount = postedJobs.filter(
    (job) => job.status === "PUBLISHED"
  ).length;
  const closedCount = postedJobs.filter(
    (job) => job.status === "CLOSED"
  ).length;
  const draftCount = postedJobs.filter(
    (job) => job.status === "DRAFT"
  ).length;

  /* =======================================================
     POSTING LABEL
  ======================================================= */
  const postingLabel = useMemo(
    () => (form.jobType === "INTERNSHIP" ? "Internship" : "Job"),
    [form.jobType]
  );

  /* =======================================================
     UPDATE FORM
  ======================================================= */
  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* =======================================================
     JOB TYPE CHANGE
  ======================================================= */
  function handleTypeChange(value: FormJobType) {
    setForm((current) => ({
      ...current,
      jobType: value,
      employmentType:
        value === "INTERNSHIP"
          ? "INTERNSHIP"
          : "FULL_TIME",
      stipend:
        value === "INTERNSHIP"
          ? current.stipend || "8000"
          : "",
      salaryMin: value === "INTERNSHIP" ? "" : current.salaryMin,
      salaryMax: value === "INTERNSHIP" ? "" : current.salaryMax,
    }));
  }

  /* =======================================================
     OPEN FORM
  ======================================================= */
  function openForm() {
    setSuccessMessage("");
    setErrorMessage("");
    setForm(initialForm());
    setShowForm(true);
  }

  /* =======================================================
     CLOSE FORM
  ======================================================= */
  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setSuccessMessage("");
    setErrorMessage("");
  }

  /* =======================================================
     CREATE JOB
  ======================================================= */
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!user?.userId) {
      setErrorMessage("You must be logged in as a recruiter.");
      return;
    }

    if (!profile) {
      setErrorMessage("Your recruiter profile/company could not be loaded.");
      return;
    }

    if (!form.title.trim()) {
      setErrorMessage("Enter a title.");
      return;
    }

    if (!form.description.trim()) {
      setErrorMessage("Enter a description.");
      return;
    }

    if (!form.location.trim()) {
      setErrorMessage("Enter the location.");
      return;
    }

    if (!form.applicationDeadline) {
      setErrorMessage("Select an application deadline.");
      return;
    }

    if (form.applicationDeadline < getToday()) {
      setErrorMessage("Application deadline cannot be in the past.");
      return;
    }

    /* -----------------------------------------------------
       STIPEND
    ----------------------------------------------------- */
    let stipend: number | null = null;

    if (form.jobType === "INTERNSHIP") {
      const parsedStipend = Number(form.stipend);

      if (!Number.isFinite(parsedStipend) || parsedStipend <= 0) {
        setErrorMessage("Enter a valid paid internship stipend.");
        return;
      }

      stipend = parsedStipend;
    }

    /* -----------------------------------------------------
       SALARY
    ----------------------------------------------------- */
    const salaryMin =
      form.jobType === "JOB" && form.salaryMin.trim()
        ? Number(form.salaryMin)
        : null;
    const salaryMax =
      form.jobType === "JOB" && form.salaryMax.trim()
        ? Number(form.salaryMax)
        : null;

    if (salaryMin != null && !Number.isFinite(salaryMin)) {
      setErrorMessage("Enter a valid minimum salary.");
      return;
    }

    if (salaryMax != null && !Number.isFinite(salaryMax)) {
      setErrorMessage("Enter a valid maximum salary.");
      return;
    }

    if (
      salaryMin != null &&
      salaryMax != null &&
      salaryMax < salaryMin
    ) {
      setErrorMessage("Maximum salary cannot be less than minimum salary.");
      return;
    }

    /* -----------------------------------------------------
       REQUEST
    ----------------------------------------------------- */
    const payload: CreateJobRequest = {
      companyId: profile.companyId,
      postedBy: user.userId,
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      jobType: form.jobType,
      workMode: form.workMode,
      employmentType:
        form.jobType === "INTERNSHIP"
          ? "INTERNSHIP"
          : form.employmentType === "INTERNSHIP"
            ? "FULL_TIME"
            : form.employmentType,
      experienceRequired: form.experienceRequired.trim(),
      salaryMin,
      salaryMax,
      stipend,
      requirements: form.requirements.trim(),
      responsibilities: form.responsibilities.trim(),
      applicationDeadline: form.applicationDeadline,
      status: form.status,
    };

    /* -----------------------------------------------------
       SAVE
    ----------------------------------------------------- */
    try {
      setSaving(true);
      await createJob(payload);

      const allJobs = await getAllJobs();
      const recruiterJobs = allJobs.filter(
        (job) => job.postedBy === user.userId
      );
      setPostedJobs(recruiterJobs);

      setSuccessMessage(
        `${postingLabel} ${
          form.status === "PUBLISHED" ? "published" : "saved as draft"
        } successfully.`
      );
      setForm(initialForm());
      setShowForm(false);
    } catch (error) {
      console.error("Opportunity creation failed:", error);
      setErrorMessage(normalizeError(error));
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     COMPENSATION
  ======================================================= */
  function getCompensation(job: RecruiterJob): string {
    if (job.jobType === "INTERNSHIP") {
      return job.stipend != null
        ? `₹${job.stipend.toLocaleString("en-IN")}`
        : "Not specified";
    }

    if (job.salaryMin != null && job.salaryMax != null) {
      return `₹${job.salaryMin.toLocaleString("en-IN")} - ₹${job.salaryMax.toLocaleString("en-IN")}`;
    }

    if (job.salaryMin != null) {
      return `₹${job.salaryMin.toLocaleString("en-IN")}+`;
    }

    if (job.salaryMax != null) {
      return `Up to ₹${job.salaryMax.toLocaleString("en-IN")}`;
    }

    return "Not specified";
  }

  /* =======================================================
     STATUS STYLE
  ======================================================= */
  function getStatusClasses(status: RecruiterJob["status"]): string {
    if (status === "PUBLISHED") {
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    }
    if (status === "DRAFT") {
      return "bg-amber-50 text-amber-700 border border-amber-200";
    }
    if (status === "CLOSED") {
      return "bg-rose-50 text-rose-700 border border-rose-200";
    }
    return "bg-slate-50 text-slate-600 border border-slate-200";
  }

  /* =======================================================
     RENDER
  ======================================================= */
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

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500">Recruiter</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              {user?.name?.charAt(0).toUpperCase() || "R"}
            </div>

            {/* NOTIFICATION BELL */}
            <NotificationBell />

            {/* LOGOUT */}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-7 text-white shadow-xl shadow-indigo-100 sm:p-9">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Recruiter Dashboard
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Welcome back, {user?.name}! 👋
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                Manage your job opportunities, paid internships and recruitment
                activities from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={openForm}
              disabled={profileLoading || !profile}
              className="relative inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-5 w-5" />
              Post Opportunity
            </button>
          </div>
        </section>

        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {errorMessage && !showForm && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* STATISTICS */}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Opportunities
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">
                  {postedJobs.length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Published
                </p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-600">
                  {publishedCount}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Drafts
                </p>
                <p className="mt-2 text-3xl font-extrabold text-amber-600">
                  {draftCount}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Closed
                </p>
                <p className="mt-2 text-3xl font-extrabold text-rose-600">
                  {closedCount}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <X className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        {/* POST FORM */}
        {showForm && (
          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                    Recruiter Posting
                  </p>
                  <h3 className="mt-2 text-2xl font-extrabold text-slate-900">
                    Post a Job or Paid Internship
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Create an opportunity for students and publish it directly
                    through JobConnect.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7 p-6 sm:p-8">
              {errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                  {errorMessage}
                </div>
              )}

              {/* TYPE */}
              <div>
                <label className="mb-3 block text-sm font-bold text-slate-700">
                  Posting Type
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("JOB")}
                    className={`rounded-2xl border p-5 text-left transition ${
                      form.jobType === "JOB"
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                        : "border-slate-200 bg-white hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                        <BriefcaseBusiness className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Full Job</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Salary-based opportunity
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange("INTERNSHIP")}
                    className={`rounded-2xl border p-5 text-left transition ${
                      form.jobType === "INTERNSHIP"
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                        : "border-slate-200 bg-white hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Paid Internship</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Direct student application
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* BASIC FIELDS */}
              <div className="grid gap-5 md:grid-cols-2">
                {/* TITLE */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    {form.jobType === "INTERNSHIP"
                      ? "Internship Title"
                      : "Job Title"}
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    placeholder={
                      form.jobType === "INTERNSHIP"
                        ? "Java Backend Development Intern"
                        : "Java Backend Developer"
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    maxLength={200}
                    required
                  />
                </div>

                {/* LOCATION */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(event) =>
                      updateField("location", event.target.value)
                    }
                    placeholder="Hyderabad, India"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    maxLength={150}
                    required
                  />
                </div>

                {/* WORK MODE */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Work Mode
                  </label>
                  <select
                    value={form.workMode}
                    onChange={(event) =>
                      updateField("workMode", event.target.value as FormWorkMode)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">On-site</option>
                  </select>
                </div>

                {/* EXPERIENCE */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Experience Required
                  </label>
                  <input
                    type="text"
                    value={form.experienceRequired}
                    onChange={(event) =>
                      updateField("experienceRequired", event.target.value)
                    }
                    placeholder="0 years"
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* STIPEND OR MINIMUM SALARY */}
                {form.jobType === "INTERNSHIP" ? (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Stipend (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.stipend}
                      onChange={(event) =>
                        updateField("stipend", event.target.value)
                      }
                      placeholder="8000"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      required
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Enter the exact monthly stipend.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Minimum Salary (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={form.salaryMin}
                      onChange={(event) =>
                        updateField("salaryMin", event.target.value)
                      }
                      placeholder="500000"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                )}

                {/* MAXIMUM SALARY */}
                {form.jobType === "JOB" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Maximum Salary (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={form.salaryMax}
                      onChange={(event) =>
                        updateField("salaryMax", event.target.value)
                      }
                      placeholder="800000"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                )}

                {/* DEADLINE */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    min={getToday()}
                    value={form.applicationDeadline}
                    onChange={(event) =>
                      updateField("applicationDeadline", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    required
                  />
                </div>

                {/* STATUS */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Publish Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value as CreateJobRequest["status"]
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="PUBLISHED">Publish Now</option>
                    <option value="DRAFT">Save as Draft</option>
                  </select>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  rows={5}
                  placeholder="Describe the role, internship duration, learning opportunities and work involved."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  required
                />
              </div>

              {/* REQUIREMENTS / RESPONSIBILITIES */}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Requirements
                  </label>
                  <textarea
                    value={form.requirements}
                    onChange={(event) =>
                      updateField("requirements", event.target.value)
                    }
                    rows={5}
                    placeholder="Java basics, OOP, SQL, REST API knowledge..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Responsibilities
                  </label>
                  <textarea
                    value={form.responsibilities}
                    onChange={(event) =>
                      updateField("responsibilities", event.target.value)
                    }
                    rows={5}
                    placeholder="Build features, test APIs, work with mentors..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* FORM ACTIONS */}
              <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || profileLoading || !profile}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
                >
                  <BriefcaseBusiness className="h-4 w-4" />
                  {saving
                    ? "Publishing..."
                    : form.status === "PUBLISHED"
                      ? `Publish ${postingLabel}`
                      : `Save ${postingLabel} Draft`}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* OPPORTUNITIES */}
        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                Your Workspace
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                My Posted Opportunities
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Jobs and internships posted by you
              </p>
            </div>
            <div className="rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
              {postedJobs.length}{" "}
              {postedJobs.length === 1 ? "Opportunity" : "Opportunities"}
            </div>
          </div>

          {/* LOADING / EMPTY / JOB CARDS */}
          {jobsLoading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-sm">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading your posted opportunities...
              </p>
            </div>
          ) : postedJobs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <BriefcaseBusiness className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-slate-900">
                No opportunities posted yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first job or paid internship and it will appear here.
              </p>
              <button
                type="button"
                onClick={openForm}
                disabled={profileLoading || !profile}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 disabled:bg-slate-400"
              >
                <Plus className="h-4 w-4" />
                Post Opportunity
              </button>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {postedJobs.map((job) => (
                <article
                  key={job.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/60"
                >
                  {/* CARD TOP */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-extrabold tracking-wide ${
                              job.jobType === "INTERNSHIP"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-indigo-50 text-indigo-700"
                            }`}
                          >
                            {job.jobType === "INTERNSHIP" ? "INTERNSHIP" : "JOB"}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${getStatusClasses(
                              job.status
                            )}`}
                          >
                            {job.status}
                          </span>
                        </div>
                        <h3 className="text-xl font-extrabold leading-tight text-slate-900">
                          {job.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location || "Location not specified"}
                          </span>
                          <span>•</span>
                          <span>{job.workMode}</span>
                        </div>
                      </div>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600 transition group-hover:scale-105">
                        <BriefcaseBusiness className="h-5 w-5" />
                      </div>
                    </div>

                    {/* DETAILS */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Employment
                        </p>
                        <p className="mt-1.5 text-sm font-bold text-slate-800">
                          {job.employmentType}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Experience
                        </p>
                        <p className="mt-1.5 text-sm font-bold text-slate-800">
                          {job.experienceRequired || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {/* COMPENSATION */}
                    <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {job.jobType === "INTERNSHIP"
                          ? "Monthly Stipend"
                          : "Salary"}
                      </p>
                      <p className="mt-1.5 text-base font-extrabold text-slate-900">
                        {getCompensation(job)}
                      </p>
                    </div>
                  </div>

                  {/* CARD FOOTER */}
                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Application Deadline
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {job.applicationDeadline || "Not specified"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/recruiter/jobs/${job.id}`)}
                      className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-slate-900">
              Recruitment Tools
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Quick access to your recruitment workflow
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {/* POST */}
            <button
              type="button"
              onClick={openForm}
              disabled={profileLoading || !profile}
              className="group rounded-2xl border border-indigo-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                <BriefcaseBusiness className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-bold text-slate-900">
                Post Jobs & Internships
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create paid internships and job opportunities for students.
              </p>
            </button>

            {/* APPLICATIONS */}
            <button
              type="button"
              onClick={() => navigate("/recruiter/applications")}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-100">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-bold text-slate-900">Applications</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Review candidate applications and manage your hiring pipeline.
              </p>
            </button>

            {/* INTERVIEWS */}
            <button
              type="button"
              onClick={() => navigate("/recruiter/applications")}
              className="group w-full rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-bold text-slate-900">Interviews</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Manage candidate interviews and recruitment activities.
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-emerald-700">
                Manage interviews →
              </span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
