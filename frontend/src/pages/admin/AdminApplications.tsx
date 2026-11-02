import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Eye,
  X,
  FileText,
  CalendarDays,
  User,
  Building2,
  BriefcaseBusiness,
  Mail,
  MapPin,
} from "lucide-react";

import {
  getAdminApplications,
  type AdminApplication,
  type AdminApplicationStatus,
} from "../../services/adminApplicationService";

interface AdminApplicationsProps {
  onBack: () => void;
}

type StatusFilter = "ALL" | AdminApplicationStatus;

const statusOptions: AdminApplicationStatus[] = [
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
];

function formatDate(value?: string | null): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClasses(status: AdminApplicationStatus): string {
  switch (status) {
    case "APPLIED":
      return "bg-blue-100 text-blue-700";
    case "UNDER_REVIEW":
      return "bg-amber-100 text-amber-700";
    case "SHORTLISTED":
      return "bg-purple-100 text-purple-700";
    case "INTERVIEW":
      return "bg-indigo-100 text-indigo-700";
    case "SELECTED":
      return "bg-emerald-100 text-emerald-700";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    case "WITHDRAWN":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const apiError = error as {
      message?: string;
      response?: {
        status?: number;
        data?: unknown;
      };
    };

    const status = apiError.response?.status;
    const data = apiError.response?.data;

    if (typeof data === "string" && data.trim()) {
      return `Request failed (${status ?? "unknown"}): ${data}`;
    }

    if (data && typeof data === "object") {
      const message = (data as Record<string, unknown>).message;

      if (typeof message === "string") {
        return `Request failed (${status ?? "unknown"}): ${message}`;
      }
    }

    return apiError.message || "Unable to load applications.";
  }

  return "Unable to load applications.";
}

export default function AdminApplications({
  onBack,
}: AdminApplicationsProps) {
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedApplication, setSelectedApplication] =
    useState<AdminApplication | null>(null);

  // Load all applications from the Admin API.
  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminApplications();

        if (!cancelled) {
          setApplications(data);
        }
      } catch (err) {
        console.error("Unable to load Admin applications:", err);

        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadApplications();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Search and status filtering.
  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch =
        !query ||
        String(application.applicationId).includes(query) ||
        String(application.studentId).includes(query) ||
        application.studentName.toLowerCase().includes(query) ||
        application.studentEmail.toLowerCase().includes(query) ||
        application.jobTitle.toLowerCase().includes(query) ||
        application.companyName.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  // Application statistics.
  const appliedCount = applications.filter(
    (item) => item.status === "APPLIED"
  ).length;

  const shortlistedCount = applications.filter(
    (item) => item.status === "SHORTLISTED"
  ).length;

  const selectedCount = applications.filter(
    (item) => item.status === "SELECTED"
  ).length;

  return (
    <section>
      {/* Back button and heading */}

      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Application Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor student applications across JobConnect.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((previous) => previous + 1)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh applications
        </button>
      </div>

      {/* Error message */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">
            Unable to load applications
          </p>

          <p className="mt-1 text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setRefreshKey((previous) => previous + 1)}
            className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* Statistics */}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total applications</p>
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {applications.length}
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Applied</p>
          <p className="mt-3 text-3xl font-bold text-blue-600">
            {appliedCount}
          </p>
        </div>

        <div className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Shortlisted</p>
          <p className="mt-3 text-3xl font-bold text-purple-600">
            {shortlistedCount}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Selected</p>
          <p className="mt-3 text-3xl font-bold text-emerald-600">
            {selectedCount}
          </p>
        </div>
      </div>

      {/* Search and filter */}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, email, job or company..."
              className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500"
            aria-label="Filter applications by status"
          >
            <option value="ALL">All statuses</option>

            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Showing {filteredApplications.length} of {applications.length} applications
        </p>
      </div>

      {/* Application table */}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-sm text-slate-500">
              Loading applications...
            </p>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Resolve the error above and retry loading.
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-3 font-semibold text-slate-700">
              No applications found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try changing the search text or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Job and company</th>
                  <th className="px-5 py-4">Applied date</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((application) => (
                  <tr
                    key={application.applicationId}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {application.studentName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {application.studentEmail}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Student ID: {application.studentId}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {application.jobTitle}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {application.companyName}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(application.appliedAt)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          application.status
                        )}`}
                      >
                        {application.status.replaceAll("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedApplication(application)
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Application details modal */}

      {selectedApplication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setSelectedApplication(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  id="application-detail-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Application Details
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Application #{selectedApplication.applicationId}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close application details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                  selectedApplication.status
                )}`}
              >
                {selectedApplication.status.replaceAll("_", " ")}
              </span>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                  <User className="h-4 w-4" />
                  Student
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {selectedApplication.studentName}
                </p>

                <p className="mt-1 flex items-center gap-2 break-all text-sm text-slate-600">
                  <Mail className="h-4 w-4 shrink-0" />
                  {selectedApplication.studentEmail}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Student ID: {selectedApplication.studentId}
                </p>

                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {selectedApplication.studentLocation || "Location not provided"}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                  <BriefcaseBusiness className="h-4 w-4" />
                  Job
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {selectedApplication.jobTitle}
                </p>

                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <Building2 className="h-4 w-4 shrink-0" />
                  {selectedApplication.companyName}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Job ID: {selectedApplication.jobId}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                  <CalendarDays className="h-4 w-4" />
                  Application submitted
                </p>

                <p className="mt-2 text-sm text-slate-700">
                  {formatDate(selectedApplication.appliedAt)}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
                  <CalendarDays className="h-4 w-4" />
                  Last updated
                </p>

                <p className="mt-2 text-sm text-slate-700">
                  {formatDate(selectedApplication.updatedAt)}
                </p>
              </div>
            </div>

            <div className="mt-7 flex justify-end border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}