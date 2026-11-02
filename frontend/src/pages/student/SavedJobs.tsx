
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  BriefcaseBusiness,
  ExternalLink,
  MapPin,
  Search,
  Trash2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import {
  getJobs,
  getSavedJobs,
  deleteSavedJob,
  type Job,
} from "../../services/studentService";

import {
  getSavedExternalInternships,
  deleteSavedExternalInternship,
  type SavedExternalInternship,
} from "../../services/externalInternshipService";

type SavedFilter = "ALL" | "JOBCONNECT" | "EXTERNAL";

export default function SavedJobs() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userId = user?.userId;

  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [savedExternalInternships, setSavedExternalInternships] =
    useState<SavedExternalInternship[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SavedFilter>("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [processingId, setProcessingId] = useState<string | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSavedItems() {
      if (userId == null) {
        setSavedJobs([]);
        setSavedExternalInternships([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [allJobs, savedJobRecords, savedExternalRecords] =
          await Promise.all([
            getJobs(),
            getSavedJobs(),
            getSavedExternalInternships(),
          ]);

        if (cancelled) return;

        const savedJobIds = new Set(
          savedJobRecords
            .filter((item) => item.studentId === userId)
            .map((item) => item.jobId)
        );

        setSavedJobs(
          allJobs.filter((job) => savedJobIds.has(job.id))
        );

        setSavedExternalInternships(
          savedExternalRecords.filter(
            (internship) => internship.studentId === userId
          )
        );
      } catch (err) {
        console.error("Unable to load saved items:", err);

        if (!cancelled) {
          setError(
            "Unable to load your saved jobs. Please refresh and try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSavedItems();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return savedJobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.title?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query);

      return matchesSearch;
    });
  }, [savedJobs, search]);

  const filteredExternalInternships = useMemo(() => {
    const query = search.trim().toLowerCase();

    return savedExternalInternships.filter((internship) => {
      const matchesSearch =
        !query ||
        internship.title?.toLowerCase().includes(query) ||
        internship.company?.toLowerCase().includes(query) ||
        internship.location?.toLowerCase().includes(query) ||
        internship.domain?.toLowerCase().includes(query);

      return matchesSearch;
    });
  }, [savedExternalInternships, search]);

  async function handleUnsaveJob(job: Job) {
    if (userId == null) {
      alert("Please log in as a student.");
      return;
    }

    const key = `job-${job.id}`;

    try {
      setProcessingId(key);

      await deleteSavedJob(userId, job.id);

      setSavedJobs((previous) =>
        previous.filter((item) => item.id !== job.id)
      );
    } catch (err) {
      console.error("Unable to unsave job:", err);
      alert("Unable to remove this saved job. Please try again.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleUnsaveExternal(
    internship: SavedExternalInternship
  ) {
    const internshipId = String(internship.id);
    const key = `external-${internshipId}`;

    try {
      setProcessingId(key);

      await deleteSavedExternalInternship(internshipId);

      setSavedExternalInternships((previous) =>
        previous.filter(
          (item) => String(item.id) !== internshipId
        )
      );
    } catch (err) {
      console.error("Unable to unsave external internship:", err);
      alert(
        "Unable to remove this saved internship. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  }

  const showJobConnect = filter !== "EXTERNAL";
  const showExternal = filter !== "JOBCONNECT";

  const totalSaved =
    savedJobs.length + savedExternalInternships.length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => navigate("/student/dashboard")}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <header className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Bookmark className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    Saved Jobs & Internships
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Keep track of opportunities you want to revisit.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-indigo-50 px-5 py-3">
              <p className="text-sm text-indigo-700">Total saved</p>
              <p className="text-2xl font-bold text-indigo-900">
                {totalSaved}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, company or location..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as SavedFilter)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500"
              aria-label="Filter saved opportunities"
            >
              <option value="ALL">All saved opportunities</option>
              <option value="JOBCONNECT">JobConnect only</option>
              <option value="EXTERNAL">External only</option>
            </select>
          </div>
        </header>

        {loading && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <p className="mt-3 text-sm text-slate-500">
              Loading your saved opportunities...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-8 space-y-10">
            {showJobConnect && (
              <section>
                <div className="mb-4 flex items-center gap-3">
                  <BriefcaseBusiness className="h-5 w-5 text-indigo-600" />

                  <h2 className="text-xl font-bold text-slate-900">
                    JobConnect Opportunities
                  </h2>

                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {filteredJobs.length}
                  </span>
                </div>

                {filteredJobs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="font-semibold text-slate-700">
                      No saved JobConnect jobs found.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Save an opportunity from Find Jobs or the internship section.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/student/jobs")}
                      className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Explore Jobs
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {filteredJobs.map((job) => {
                      const key = `job-${job.id}`;
                      const isProcessing = processingId === key;

                      return (
                        <article
                          key={job.id}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-bold text-slate-900">
                              {job.title}
                            </h3>

                            <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                              JobConnect
                            </span>
                          </div>

                          {job.location && (
                            <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </p>
                          )}

                          {job.description && (
                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                              {job.description}
                            </p>
                          )}

                          {job.stipend != null &&
                            Number(job.stipend) > 0 && (
                              <p className="mt-3 text-sm font-semibold text-emerald-700">
                                Stipend: ₹
                                {Number(job.stipend).toLocaleString("en-IN")}
                              </p>
                            )}

                          <div className="mt-5 flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/student/jobs/${job.id}`)
                              }
                              className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                              View Details
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => void handleUnsaveJob(job)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                              aria-label={`Unsave ${job.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              {isProcessing ? "Removing..." : "Unsave"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {showExternal && (
              <section>
                <div className="mb-4 flex items-center gap-3">
                  <ExternalLink className="h-5 w-5 text-emerald-600" />

                  <h2 className="text-xl font-bold text-slate-900">
                    External Internships
                  </h2>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {filteredExternalInternships.length}
                  </span>
                </div>

                {filteredExternalInternships.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="font-semibold text-slate-700">
                      No saved external internships found.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Save an external internship from the Internship Hub.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/student/dashboard")}
                      className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Explore Internships
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {filteredExternalInternships.map((internship) => {
                      const internshipId = String(internship.id);
                      const key = `external-${internshipId}`;
                      const isProcessing = processingId === key;

                      return (
                        <article
                          key={internshipId}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-bold text-slate-900">
                              {internship.title}
                            </h3>

                            <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              External
                            </span>
                          </div>

                          <p className="mt-1 text-sm font-medium text-slate-600">
                            {internship.company}
                          </p>

                          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="h-4 w-4" />
                            {internship.location || "Location not specified"}
                          </p>

                          <p className="mt-3 text-sm text-emerald-700">
                            {internship.stipend || "Stipend not disclosed"}
                          </p>

                          {internship.duration && (
                            <p className="mt-2 text-sm text-slate-500">
                              Duration: {internship.duration}
                            </p>
                          )}

                          <div className="mt-5 space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (internship.sourceUrl) {
                                  window.open(
                                    internship.sourceUrl,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                }
                              }}
                              disabled={!internship.sourceUrl}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Open Original Listing
                              <ExternalLink className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                void handleUnsaveExternal(internship)
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {isProcessing ? "Removing..." : "Unsave Internship"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
