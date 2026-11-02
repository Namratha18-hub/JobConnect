import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import InternshipSection from "../../components/student/InternshipSection";

import {
  getJobs,
  getSavedJobs,
  saveJob,
  type Job,
} from "../../services/studentService";

import { useAuth } from "../../context/AuthContext";

function BriefcaseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-5 w-5"
    >
      <rect
        x="3"
        y="7"
        width="18"
        height="13"
        rx="2"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3 12h18"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-5 w-5"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
      />

      <path
        strokeLinecap="round"
        d="m16 16 4.5 4.5"
      />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"
      />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 12H5M11 18l-6-6 6-6"
      />
    </svg>
  );
}

function getJobTypeLabel(job: Job): string {
  return job.jobType === "INTERNSHIP"
    ? "Internship"
    : "Job";
}

function getWorkModeLabel(
  workMode: Job["workMode"]
): string {
  if (workMode === "REMOTE") {
    return "Remote";
  }

  if (workMode === "HYBRID") {
    return "Hybrid";
  }

  return "On-site";
}

export default function FindJobs() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);

  const [savedJobIds, setSavedJobIds] =
    useState<Set<number>>(new Set());

  const [savingJobId, setSavingJobId] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        setError(null);

        const [
          jobsResult,
          savedJobsResult,
        ] = await Promise.all([
          getJobs(),
          getSavedJobs(),
        ]);

        setJobs(jobsResult);

        if (user?.userId != null) {
          const savedIds =
            savedJobsResult
              .filter(
                (savedJob) =>
                  savedJob.studentId ===
                  user.userId
              )
              .map(
                (savedJob) =>
                  savedJob.jobId
              );

          setSavedJobIds(
            new Set(savedIds)
          );
        } else {
          setSavedJobIds(
            new Set()
          );
        }
      } catch (loadError) {
        console.error(
          "Unable to load jobs:",
          loadError
        );

        setError(
          "Unable to load jobs. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, [user?.userId]);

  async function handleSaveJob(
    jobId: number
  ) {
    if (user?.userId == null) {
      alert(
        "Please login as a student first."
      );

      return;
    }

    if (savedJobIds.has(jobId)) {
      return;
    }

    try {
      setSavingJobId(jobId);

      await saveJob(
        user.userId,
        jobId
      );

      setSavedJobIds(
        (previous) =>
          new Set([
            ...previous,
            jobId,
          ])
      );
    } catch (saveError) {
      console.error(
        "Unable to save job:",
        saveError
      );

      alert(
        "Unable to save this job. Please try again."
      );
    } finally {
      setSavingJobId(null);
    }
  }

  const searchText =
    search.toLowerCase().trim();

  const filteredJobs =
    jobs.filter((job) => {
      if (!searchText) {
        return true;
      }

      return (
        job.title
          ?.toLowerCase()
          .includes(searchText) ||

        job.description
          ?.toLowerCase()
          .includes(searchText) ||

        job.location
          ?.toLowerCase()
          .includes(searchText) ||

        job.jobType
          ?.toLowerCase()
          .includes(searchText) ||

        job.workMode
          ?.toLowerCase()
          .includes(searchText) ||

        job.employmentType
          ?.toLowerCase()
          .includes(searchText) ||

        job.experienceRequired
          ?.toLowerCase()
          .includes(searchText) ||

        job.stipend
          ?.toString()
          .includes(searchText) ||

        job.salaryMin
          ?.toString()
          .includes(searchText) ||

        job.salaryMax
          ?.toString()
          .includes(searchText)
      );
    });

  const filteredRegularJobs =
    filteredJobs.filter(
      (job) =>
        job.jobType !== "INTERNSHIP"
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">

      {/* ================= NAVBAR ================= */}

      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">

              <BriefcaseIcon />

            </div>

            <div>

              <h1 className="text-lg font-bold text-slate-900">
                JobConnect
              </h1>

              <p className="text-xs text-slate-500">
                Student Portal
              </p>

            </div>

          </div>

          <nav className="hidden items-center gap-6 md:flex">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/student/dashboard"
                )
              }
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              Dashboard
            </button>

            <button
              type="button"
              className="text-sm font-medium text-indigo-600"
            >
              Find Jobs
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/student/applications"
                )
              }
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              Applications
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/student/saved-jobs"
                )
              }
              className="text-sm font-medium text-slate-600 transition hover:text-indigo-600"
            >
              Saved Jobs
            </button>

          </nav>

        </div>

      </header>

      {/* ================= MAIN ================= */}

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* Back */}

        <button
          type="button"
          onClick={() =>
            navigate(
              "/student/dashboard"
            )
          }
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
        >
          <ArrowLeftIcon />
          Back to Dashboard
        </button>

        {/* ================= HERO ================= */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-8 text-white shadow-xl shadow-indigo-500/20">

          <div className="relative z-10 max-w-2xl">

            <p className="text-sm font-medium text-indigo-100">
              Career Opportunities
            </p>

            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Find Jobs
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
              Explore jobs and internships
              that match your skills and
              career interests.
            </p>

          </div>

          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />

          <div className="absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-purple-400/20" />

        </section>

        {/* ================= SEARCH ================= */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <label
            htmlFor="job-search"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Search jobs and internships
          </label>

          <div className="relative">

            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-indigo-500">
              <SearchIcon />
            </span>

            <input
              id="job-search"
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search by title, company, location, type, domain..."
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

          </div>

        </section>

        {/* ================= INTERNSHIP HUB ================= */}

        {!loading && !error && (
          <InternshipSection
            jobs={
              searchText
                ? filteredJobs
                : jobs
            }
            onViewDetails={(
              jobId: number
            ) =>
              navigate(
                `/student/jobs/${jobId}`
              )
            }
          />
        )}

        {/* ================= AVAILABLE JOBS ================= */}

        <div className="mt-10">

          <h3 className="text-xl font-bold text-slate-900">
            Available Opportunities
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? "Loading jobs..."
              : `${filteredRegularJobs.length} ${
                  filteredRegularJobs.length === 1
                    ? "job"
                    : "jobs"
                } found`}
          </p>

        </div>

        {/* ================= LOADING ================= */}

        {loading && (
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

            <p className="mt-4 text-sm text-slate-500">
              Loading available jobs and
              internships...
            </p>

          </div>
        )}

        {/* ================= ERROR ================= */}

        {error && !loading && (
          <div
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* ================= REGULAR JOBS ================= */}

        {!loading &&
          !error &&
          filteredRegularJobs.length > 0 && (

            <section className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {filteredRegularJobs.map(
                (job) => (

                  <article
                    key={job.id}
                    className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">

                        <BriefcaseIcon />

                      </div>

                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {getJobTypeLabel(job)}
                      </span>

                    </div>

                    <h4 className="mt-5 text-lg font-bold text-slate-900">
                      {job.title}
                    </h4>

                    {job.location && (
                      <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">

                        <MapPinIcon />

                        <span>
                          {job.location}
                        </span>

                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">

                      {job.workMode && (
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                          {getWorkModeLabel(
                            job.workMode
                          )}
                        </span>
                      )}

                      {job.employmentType && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {job.employmentType.replace(
                            "_",
                            " "
                          )}
                        </span>
                      )}

                    </div>

                    {job.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                        {job.description}
                      </p>
                    )}

                    {job.experienceRequired && (
                      <p className="mt-3 text-xs font-medium text-slate-500">

                        Experience:{" "}

                        <span className="text-slate-700">
                          {
                            job.experienceRequired
                          }
                        </span>

                      </p>
                    )}

                    {(job.salaryMin != null ||
                      job.salaryMax != null) && (

                      <p className="mt-2 text-sm font-semibold text-emerald-600">

                        Salary: ₹
                        {job.salaryMin?.toLocaleString(
                          "en-IN"
                        ) ?? "0"}

                        {" - "}

                        ₹
                        {job.salaryMax?.toLocaleString(
                          "en-IN"
                        ) ?? "0"}

                      </p>
                    )}

                    {/* ================= ACTION BUTTONS ================= */}

                    <div className="mt-6 flex gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/student/jobs/${job.id}`
                          )
                        }
                        className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-violet-700"
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        disabled={
                          savingJobId ===
                          job.id
                        }
                        onClick={() =>
                          handleSaveJob(
                            job.id
                          )
                        }
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                          savedJobIds.has(
                            job.id
                          )
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                            : "border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {savingJobId ===
                        job.id
                          ? "Saving..."
                          : savedJobIds.has(
                              job.id
                            )
                            ? "Saved"
                            : "Save"}
                      </button>

                    </div>

                  </article>

                )
              )}

            </section>
          )}

        {/* ================= NO JOBS ================= */}

        {!loading &&
          !error &&
          filteredRegularJobs.length === 0 && (

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">

                <SearchIcon />

              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No jobs found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try a different search term.
              </p>

            </div>
          )}

      </main>

    </div>
  );
}