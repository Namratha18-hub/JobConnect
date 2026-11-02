import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ExternalLink,
  BriefcaseBusiness,
  MapPin,
  Clock3,
  WalletCards,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import {
  getApplications,
  getSavedJobs,
  saveJob,
  type Job,
} from "../../services/studentService";
import {
  getExternalInternships,
  type ExternalInternship,
} from "../../services/externalInternshipService";

type StipendFilter =
  | "ALL"
  | "PAID"
  | "UP_TO_10K"
  | "10K_TO_20K"
  | "ABOVE_20K";

interface InternshipSectionProps {
  jobs: Job[];
  onViewDetails: (jobId: number) => void;
}

function parseAmount(
  value: string | null | undefined
): number | null {
  if (!value) {
    return null;
  }

  const cleaned = value
    .replace(/₹/g, "")
    .replace(/,/g, "");

  const matches = cleaned.match(
    /\d+(?:\.\d+)?/g
  );

  if (!matches || matches.length === 0) {
    return null;
  }

  const numbers = matches
    .map(Number)
    .filter((number) =>
      Number.isFinite(number)
    );

  if (numbers.length === 0) {
    return null;
  }

  return Math.max(...numbers);
}

function isPaidExternal(
  internship: ExternalInternship
): boolean {
  const amount = parseAmount(
    internship.stipend
  );

  return amount != null && amount > 0;
}

function isPaidJob(job: Job): boolean {
  return (
    job.stipend != null &&
    Number(job.stipend) > 0
  );
}

function matchesExternalFilter(
  internship: ExternalInternship,
  filter: StipendFilter
): boolean {
  const amount = parseAmount(
    internship.stipend
  );

  if (filter === "ALL") {
    return true;
  }

  if (filter === "PAID") {
    return amount != null && amount > 0;
  }

  if (amount == null) {
    return false;
  }

  if (filter === "UP_TO_10K") {
    return amount <= 10000;
  }

  if (filter === "10K_TO_20K") {
    return (
      amount > 10000 &&
      amount < 20000
    );
  }

  return amount >= 20000;
}

function matchesJobFilter(
  job: Job,
  filter: StipendFilter
): boolean {
  const amount = Number(
    job.stipend ?? 0
  );

  if (filter === "ALL") {
    return true;
  }

  if (filter === "PAID") {
    return amount > 0;
  }

  if (amount <= 0) {
    return false;
  }

  if (filter === "UP_TO_10K") {
    return amount <= 10000;
  }

  if (filter === "10K_TO_20K") {
    return (
      amount > 10000 &&
      amount < 20000
    );
  }

  return amount >= 20000;
}

function getJobModeLabel(
  workMode?: string
): string {
  if (workMode === "REMOTE") {
    return "Remote";
  }

  if (workMode === "HYBRID") {
    return "Hybrid";
  }

  return "On-site";
}

function formatJobStipend(
  stipend?: number | null
): string {
  if (
    stipend == null ||
    Number(stipend) <= 0
  ) {
    return "Stipend not disclosed";
  }

  return `₹${Number(stipend).toLocaleString(
    "en-IN"
  )}`;
}

function getExternalCategory(
  internship: ExternalInternship
): string {
  return (
    internship.category?.trim() ||
    internship.domain?.trim() ||
    "General"
  );
}

function getEligibleYears(
  internship: ExternalInternship
): string {
  return (
    internship.eligibleYears?.trim() ||
    "Not specified"
  );
}

export default function InternshipSection({
  jobs,
  onViewDetails,
}: InternshipSectionProps) {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [
    externalInternships,
    setExternalInternships,
  ] = useState<ExternalInternship[]>([]);

  const [
    externalLoading,
    setExternalLoading,
  ] = useState(true);

  const [
    externalError,
    setExternalError,
  ] = useState("");

  const [
    stipendFilter,
    setStipendFilter,
  ] = useState<StipendFilter>("ALL");

  const [
    appliedJobIds,
    setAppliedJobIds,
  ] = useState<number[]>([]);

    const [
    savedJobIds,
    setSavedJobIds,
  ] = useState<Set<number>>(
    new Set()
  );

  const [
    savingJobId,
    setSavingJobId,
  ] = useState<number | null>(null);
  useEffect(() => {
    async function loadExternalInternships() {
      try {
        setExternalLoading(true);

        setExternalError("");

        const data =
          await getExternalInternships();

        setExternalInternships(data);
      } catch (error) {
        console.error(
          "Unable to load external internships:",
          error
        );

        setExternalError(
          "Live external internships are temporarily unavailable."
        );
      } finally {
        setExternalLoading(false);
      }
    }

    loadExternalInternships();
  }, []);

  useEffect(() => {
    async function loadApplications() {
      if (!user?.userId) {
        return;
      }

      try {
        const applications =
          await getApplications();

        setAppliedJobIds(
          applications
            .filter(
              (application) =>
                application.studentId ===
                user.userId
            )
            .map(
              (application) =>
                application.jobId
            )
        );
      } catch (error) {
        console.error(
          "Unable to load student applications:",
          error
        );
      }
    }

    loadApplications();
  }, [user?.userId]);
  useEffect(() => {
    async function loadSavedJobs() {
      if (!user?.userId) {
        setSavedJobIds(new Set());
        return;
      }

      try {
        const savedJobs =
          await getSavedJobs();

        const savedIds =
          savedJobs
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
      } catch (error) {
        console.error(
          "Unable to load saved jobs:",
          error
        );
      }
    }

    loadSavedJobs();
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
    } catch (error) {
      console.error(
        "Unable to save job:",
        error
      );

      alert(
        "Unable to save this internship. Please try again."
      );
    } finally {
      setSavingJobId(null);
    }
  }
  const internalInternships =
    useMemo(() => {
      return jobs
        .filter(
          (job) =>
            job.jobType ===
              "INTERNSHIP" &&
            job.status ===
              "PUBLISHED"
        )
        .filter((job) =>
          matchesJobFilter(
            job,
            stipendFilter
          )
        )
        .sort((a, b) => {
          const aPaid = isPaidJob(a)
            ? 1
            : 0;

          const bPaid = isPaidJob(b)
            ? 1
            : 0;

          if (aPaid !== bPaid) {
            return bPaid - aPaid;
          }

          return (
            Number(b.stipend ?? 0) -
            Number(a.stipend ?? 0)
          );
        });
    }, [jobs, stipendFilter]);

  const filteredExternalInternships =
    useMemo(() => {
      return externalInternships
        .filter((internship) =>
          matchesExternalFilter(
            internship,
            stipendFilter
          )
        )
        .sort((a, b) => {
          const aPaid =
            isPaidExternal(a)
              ? 1
              : 0;

          const bPaid =
            isPaidExternal(b)
              ? 1
              : 0;

          if (aPaid !== bPaid) {
            return bPaid - aPaid;
          }

          return (
            (parseAmount(
              b.stipend
            ) ?? 0) -
            (parseAmount(
              a.stipend
            ) ?? 0)
          );
        });
    }, [
      externalInternships,
      stipendFilter,
    ]);

  function applyToJob(jobId: number) {
    navigate(
      "/student/applications",
      {
        state: {
          jobId,
        },
      }
    );
  }

  return (
    <section className="mt-10 space-y-8">

      {/* =====================================================
          INTERNSHIP HEADER
          ===================================================== */}

      <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Internship Hub
            </p>

            <h3 className="mt-1 text-2xl font-bold text-slate-900">
              Paid internships & fresh opportunities
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              JobConnect internships support
              direct applications. External
              listings remain linked to their
              original source.
            </p>
          </div>

          {/* Stipend filters */}

          <div className="flex flex-wrap gap-2">

            {[
              ["ALL", "All"],
              ["PAID", "Paid"],
              [
                "UP_TO_10K",
                "Up to ₹10k",
              ],
              [
                "10K_TO_20K",
                "₹10k–₹20k",
              ],
              [
                "ABOVE_20K",
                "₹20k+",
              ],
            ].map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setStipendFilter(
                      value as StipendFilter
                    )
                  }
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    stipendFilter === value
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  {label}
                </button>
              )
            )}

          </div>

        </div>
      </div>

      {/* =====================================================
          JOBCONNECT INTERNSHIPS
          ===================================================== */}

      <div>

        <div className="mb-4 flex items-center justify-between">

          <div>
            <h4 className="text-xl font-bold text-slate-900">
              JobConnect Internships
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Apply directly inside JobConnect
              using your active resume.
            </p>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Direct Apply
          </span>

        </div>

        {internalInternships.length ===
        0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

            <BriefcaseBusiness className="mx-auto h-8 w-8 text-slate-300" />

            <p className="mt-3 font-semibold text-slate-800">
              No JobConnect internships
              match this stipend filter.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Recruiters can post paid
              internships with ₹8,000,
              ₹9,000 or other stipend
              amounts.
            </p>

          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {internalInternships.map(
              (job) => {
                const alreadyApplied =
                  appliedJobIds.includes(
                    job.id
                  );

                return (
                  <article
                    key={job.id}
                    className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                  >

                    {/* Card top */}

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                        <BriefcaseBusiness className="h-5 w-5" />
                      </div>

                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        JobConnect
                      </span>

                    </div>

                    {/* Title */}

                    <h5 className="mt-5 text-lg font-bold text-slate-900">
                      {job.title}
                    </h5>

                    {/* Location */}

                    {job.location && (
                      <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">

                        <MapPin className="h-4 w-4" />

                        <span>
                          {job.location}
                        </span>

                      </div>
                    )}

                    {/* Tags */}

                    <div className="mt-4 flex flex-wrap gap-2">

                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                        {getJobModeLabel(
                          job.workMode
                        )}
                      </span>

                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Stipend:{" "}
                        {formatJobStipend(
                          job.stipend
                        )}
                      </span>

                    </div>

                    {/* Description */}

                    {job.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                        {job.description}
                      </p>
                    )}

                    {/* Experience */}

                    {job.experienceRequired && (
                      <p className="mt-3 text-xs text-slate-500">
                        Experience:{" "}
                        <span className="font-medium text-slate-700">
                          {
                            job.experienceRequired
                          }
                        </span>
                      </p>
                    )}

                    {/* Deadline */}

                    {job.applicationDeadline && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">

                        <Clock3 className="h-4 w-4" />

                        Apply by{" "}
                        {
                          job.applicationDeadline
                        }

                      </div>
                    )}
{/* Buttons */}

<div className="mt-5 grid grid-cols-3 gap-2">

  {/* Details */}

  <button
    type="button"
    onClick={() =>
      onViewDetails(
        job.id
      )
    }
    className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
  >
    Details
  </button>

  {/* Save */}

  <button
    type="button"
    disabled={
      savingJobId === job.id
    }
    onClick={() =>
      handleSaveJob(
        job.id
      )
    }
    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
      savedJobIds.has(job.id)
        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
        : "border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
    } disabled:cursor-not-allowed disabled:opacity-60`}
  >
    {savingJobId === job.id
      ? "Saving..."
      : savedJobIds.has(job.id)
        ? "Saved"
        : "Save"}
  </button>

  {/* Apply */}

  <button
    type="button"
    disabled={
      alreadyApplied
    }
    onClick={() =>
      applyToJob(
        job.id
      )
    }
    className={`rounded-xl px-3 py-3 text-sm font-semibold text-white transition ${
      alreadyApplied
        ? "cursor-not-allowed bg-slate-400"
        : "bg-indigo-600 hover:bg-indigo-700"
    }`}
  >
    {alreadyApplied
      ? "Applied"
      : "Apply"}
  </button>

</div>


                  </article>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* =====================================================
          EXTERNAL INTERNSHIPS
          ===================================================== */}

      <div>

        <div className="mb-4 flex items-center justify-between">

          <div>
            <h4 className="text-xl font-bold text-slate-900">
              Live External Internships
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Live source listings. Application
              continues on the original listing.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            External Source
          </span>

        </div>

        {externalLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

            <p className="mt-3 text-sm text-slate-500">
              Loading live internships...
            </p>

          </div>
        )}

        {externalError &&
          !externalLoading && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
              {externalError}
            </div>
          )}

        {!externalLoading &&
          !externalError &&
          filteredExternalInternships.length ===
            0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

              <WalletCards className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 font-semibold text-slate-800">
                No external internships
                match this stipend filter.
              </p>

            </div>
          )}

        {!externalLoading &&
          !externalError &&
          filteredExternalInternships.length >
            0 && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {filteredExternalInternships.map(
                (internship) => (
                  <article
                    key={internship.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
                  >

                    {/* Top */}

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <ExternalLink className="h-5 w-5" />
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {internship.source}
                      </span>

                    </div>

                    {/* Title */}

                    <h5 className="mt-5 text-lg font-bold text-slate-900">
                      {internship.title}
                    </h5>

                    {/* Company */}

                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {internship.company}
                    </p>

                    {/* Mode / stipend */}

                    <div className="mt-4 flex flex-wrap gap-2">

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {internship.mode ||
                          "Mode not disclosed"}
                      </span>

                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {internship.stipend ||
                          "Stipend not disclosed"}
                      </span>

                    </div>

                    {/* Location */}

                    <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-500">

                      <MapPin className="h-4 w-4" />

                      {internship.location ||
                        "India"}

                    </p>

                    {/* Category */}

                    <p className="mt-2 text-xs text-slate-400">

                      Category:{" "}

                      {getExternalCategory(
                        internship
                      ).replaceAll(
                        "_",
                        " "
                      )}

                    </p>

                    {/* Eligible years */}

                    <p className="mt-2 text-xs text-slate-400">

                      Eligible years:{" "}

                      {getEligibleYears(
                        internship
                      )}

                    </p>

                    {/* Deadline */}

                    {internship.deadline && (
                      <p className="mt-2 text-xs text-slate-400">

                        Apply by:{" "}
                        {internship.deadline}

                      </p>
                    )}

                    {/* Availability */}

                    <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">

                      {internship.availabilityNote ||
                        "Automatically updated from live source."}

                    </div>

                    {/* Original listing */}

                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          internship.sourceUrl,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Open Original Listing

                      <ExternalLink className="h-4 w-4" />
                    </button>

                  </article>
                )
              )}

            </div>
          )}

      </div>

      {/* =====================================================
          APPLICATION INFORMATION
          ===================================================== */}

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm text-emerald-900">

        <div className="flex gap-3">

          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div>

            <p className="font-semibold">
              How applications work
            </p>

            <p className="mt-1 leading-6">
              JobConnect internships use
              the existing resume/application
              workflow. External internships
              stay clearly external and open
              the original source listing.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}