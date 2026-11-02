

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import {
  getAdminUsers,
  updateAdminUserStatus,
  type AdminUser,
  type AccountStatus,
  type UserRole,
} from "../../services/adminService";

import {
  getAdminCompanies,
  updateCompanyVerification,
  type AdminCompany,
  type VerificationStatus,
} from "../../services/adminCompanyService";

import {
  getAdminJobs,
  updateAdminJobStatus,
  type AdminJob,
  type JobStatus,
  type JobType,
} from "../../services/adminJobService";
import AdminApplications from "./AdminApplications";

import {
  Users,
  Building2,
  BriefcaseBusiness,
  FileText,
  ArrowLeft,
  ShieldCheck,
  Search,
  RefreshCw,
  ExternalLink,
  CalendarDays,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type AdminSection =
  | "dashboard"
  | "users"
  | "companies"
  | "jobs"
  | "applications";

type RoleFilter = "ALL" | UserRole;
type AccountFilter = "ALL" | AccountStatus;
type CompanyStatusFilter = "ALL" | VerificationStatus;
type JobStatusFilter = "ALL" | JobStatus;
type JobTypeFilter = "ALL" | JobType;

/* =========================================================
   DASHBOARD CARDS
========================================================= */

const adminSections = [
  {
    id: "users" as const,
    title: "Users",
    description: "View and manage registered students and recruiters.",
    icon: Users,
  },
  {
    id: "companies" as const,
    title: "Companies",
    description: "Review and verify registered companies.",
    icon: Building2,
  },
  {
    id: "jobs" as const,
    title: "Jobs",
    description: "Monitor jobs and internship postings.",
    icon: BriefcaseBusiness,
  },
  {
    id: "applications" as const,
    title: "Applications",
    description: "Review platform applications.",
    icon: FileText,
  },
];

/* =========================================================
   COMMON HELPERS
========================================================= */

function formatDate(value?: string | null): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getApiErrorMessage(
  error: unknown,
  action: string
): string {
  if (typeof error !== "object" || error === null) {
    return `${action} failed: ${String(error)}`;
  }

  const apiError = error as {
    message?: string;
    response?: {
      status?: number;
      data?: unknown;
    };
  };

  const statusCode = apiError.response?.status;
  const responseData = apiError.response?.data;

  let details = "";

  if (typeof responseData === "string") {
    details = responseData;
  } else if (
    responseData &&
    typeof responseData === "object"
  ) {
    const data = responseData as Record<string, unknown>;

    details =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : JSON.stringify(responseData);
  } else {
    details =
      apiError.message || "No server response received.";
  }

  return `${action} failed (${statusCode ?? "Network error"}): ${details}`;
}

function getAccountStatusClasses(status: AccountStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "INACTIVE":
      return "bg-slate-100 text-slate-700";
    case "SUSPENDED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getVerificationClasses(
  status: VerificationStatus
): string {
  switch (status) {
    case "VERIFIED":
      return "bg-emerald-100 text-emerald-700";
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getJobStatusClasses(status: JobStatus): string {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-100 text-emerald-700";
    case "DRAFT":
      return "bg-amber-100 text-amber-700";
    case "CLOSED":
      return "bg-slate-100 text-slate-700";
    case "REMOVED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatAmount(value: number | null): string {
  if (value == null) return "Not disclosed";

  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function formatJobCompensation(job: AdminJob): string {
  if (job.jobType === "INTERNSHIP") {
    return job.stipend != null
      ? `${formatAmount(job.stipend)} stipend`
      : "Stipend not disclosed";
  }

  if (job.salaryMin != null && job.salaryMax != null) {
    return `${formatAmount(job.salaryMin)} – ${formatAmount(job.salaryMax)}`;
  }

  if (job.salaryMin != null) {
    return `From ${formatAmount(job.salaryMin)}`;
  }

  if (job.salaryMax != null) {
    return `Up to ${formatAmount(job.salaryMax)}`;
  }

  return "Salary not disclosed";
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [activeSection, setActiveSection] =
    useState<AdminSection>("dashboard");

  /* ---------------- USERS STATE ---------------- */

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>("ALL");

  const [statusFilter, setStatusFilter] =
    useState<AccountFilter>("ALL");

  const [updatingUserId, setUpdatingUserId] =
    useState<number | null>(null);

  /* ---------------- COMPANIES STATE ---------------- */

  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState("");

  const [companySearch, setCompanySearch] = useState("");

  const [companyStatusFilter, setCompanyStatusFilter] =
    useState<CompanyStatusFilter>("ALL");

  const [updatingCompanyId, setUpdatingCompanyId] =
    useState<number | null>(null);

  /* ---------------- JOBS STATE ---------------- */

  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");

  const [jobSearch, setJobSearch] = useState("");

  const [jobStatusFilter, setJobStatusFilter] =
    useState<JobStatusFilter>("ALL");

  const [jobTypeFilter, setJobTypeFilter] =
    useState<JobTypeFilter>("ALL");

  const [updatingJobId, setUpdatingJobId] =
    useState<number | null>(null);

  const [selectedJob, setSelectedJob] =
    useState<AdminJob | null>(null);

  /* ---------------- COMMON STATE ---------------- */

  const [successMessage, setSuccessMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  /* =======================================================
     LOAD USERS
  ======================================================= */

  useEffect(() => {
    if (activeSection !== "users") return;

    let cancelled = false;

    async function loadUsers() {
      try {
        setUsersLoading(true);
        setUsersError("");
        setSuccessMessage("");

        const data = await getAdminUsers();

        if (!cancelled) {
          setUsers(data);
        }
      } catch (error) {
        console.error("Unable to load Admin users:", error);

        if (!cancelled) {
          setUsersError(
            getApiErrorMessage(error, "Loading users")
          );
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [activeSection, refreshKey]);

  /* =======================================================
     LOAD COMPANIES
  ======================================================= */

  useEffect(() => {
    if (activeSection !== "companies") return;

    let cancelled = false;

    async function loadCompanies() {
      try {
        setCompaniesLoading(true);
        setCompaniesError("");
        setSuccessMessage("");

        const data = await getAdminCompanies();

        if (!cancelled) {
          setCompanies(data);
        }
      } catch (error) {
        console.error("Unable to load Admin companies:", error);

        if (!cancelled) {
          setCompaniesError(
            getApiErrorMessage(error, "Loading companies")
          );
        }
      } finally {
        if (!cancelled) {
          setCompaniesLoading(false);
        }
      }
    }

    void loadCompanies();

    return () => {
      cancelled = true;
    };
  }, [activeSection, refreshKey]);

  /* =======================================================
     LOAD JOBS
  ======================================================= */

  useEffect(() => {
    if (activeSection !== "jobs") return;

    let cancelled = false;

    async function loadJobs() {
      try {
        setJobsLoading(true);
        setJobsError("");
        setSuccessMessage("");

        const data = await getAdminJobs();

        if (!cancelled) {
          setJobs(data);
        }
      } catch (error) {
        console.error("Unable to load Admin jobs:", error);

        if (!cancelled) {
          setJobsError(
            getApiErrorMessage(error, "Loading jobs")
          );
        }
      } finally {
        if (!cancelled) {
          setJobsLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      cancelled = true;
    };
  }, [activeSection, refreshKey]);

  /* =======================================================
     FILTER USERS
  ======================================================= */

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "ALL" || item.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        item.accountStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  /* =======================================================
     FILTER COMPANIES
  ======================================================= */

  const filteredCompanies = useMemo(() => {
    const query = companySearch.trim().toLowerCase();

    return companies.filter((company) => {
      const matchesSearch =
        !query ||
        company.name.toLowerCase().includes(query) ||
        (company.industry || "").toLowerCase().includes(query) ||
        (company.location || "").toLowerCase().includes(query);

      const matchesStatus =
        companyStatusFilter === "ALL" ||
        company.verificationStatus === companyStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [companies, companySearch, companyStatusFilter]);

  /* =======================================================
     FILTER JOBS
  ======================================================= */

  const filteredJobs = useMemo(() => {
    const query = jobSearch.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.companyName.toLowerCase().includes(query) ||
        (job.location || "").toLowerCase().includes(query);

      const matchesStatus =
        jobStatusFilter === "ALL" ||
        job.status === jobStatusFilter;

      const matchesType =
        jobTypeFilter === "ALL" ||
        job.jobType === jobTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [jobs, jobSearch, jobStatusFilter, jobTypeFilter]);

  /* =======================================================
     UPDATE USER STATUS
  ======================================================= */

  async function handleStatusChange(
    target: AdminUser,
    newStatus: AccountStatus
  ) {
    if (target.role === "ADMIN") return;
    if (target.accountStatus === newStatus) return;

    try {
      setUpdatingUserId(target.id);
      setUsersError("");
      setSuccessMessage("");

      const updatedUser = await updateAdminUserStatus(
        target.id,
        newStatus
      );

      setUsers((previous) =>
        previous.map((item) =>
          item.id === target.id ? updatedUser : item
        )
      );

      setSuccessMessage(
        `${updatedUser.name}'s account status changed to ${updatedUser.accountStatus}.`
      );
    } catch (error) {
      console.error("User status update failed:", error);

      setUsersError(
        getApiErrorMessage(error, "Updating account status")
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  /* =======================================================
     UPDATE COMPANY VERIFICATION
  ======================================================= */

  async function handleCompanyVerificationChange(
    company: AdminCompany,
    newStatus: VerificationStatus
  ) {
    if (company.verificationStatus === newStatus) return;

    try {
      setUpdatingCompanyId(company.id);
      setCompaniesError("");
      setSuccessMessage("");

      const updatedCompany = await updateCompanyVerification(
        company.id,
        newStatus
      );

      setCompanies((previous) =>
        previous.map((item) =>
          item.id === company.id ? updatedCompany : item
        )
      );

      setSuccessMessage(
        `${updatedCompany.name} verification changed to ${updatedCompany.verificationStatus}.`
      );
    } catch (error) {
      console.error("Company verification update failed:", error);

      setCompaniesError(
        getApiErrorMessage(error, "Updating company verification")
      );
    } finally {
      setUpdatingCompanyId(null);
    }
  }

  /* =======================================================
     UPDATE JOB STATUS
  ======================================================= */

  async function handleJobStatusChange(
    job: AdminJob,
    newStatus: JobStatus
  ) {
    if (job.status === newStatus) return;

    if (newStatus === "REMOVED") {
      const confirmed = window.confirm(
        `Are you sure you want to mark "${job.title}" as REMOVED?`
      );

      if (!confirmed) return;
    }

    try {
      setUpdatingJobId(job.id);
      setJobsError("");
      setSuccessMessage("");

      const updatedJob = await updateAdminJobStatus(
        job.id,
        newStatus
      );

      setJobs((previous) =>
        previous.map((item) =>
          item.id === job.id ? updatedJob : item
        )
      );

      setSelectedJob((previous) =>
        previous?.id === job.id ? updatedJob : previous
      );

      setSuccessMessage(
        `"${updatedJob.title}" status changed to ${updatedJob.status}.`
      );
    } catch (error) {
      console.error("Job status update failed:", error);

      setJobsError(
        getApiErrorMessage(error, "Updating job status")
      );
    } finally {
      setUpdatingJobId(null);
    }
  }

  /* =======================================================
     STATISTICS
  ======================================================= */

  const activeUsers = users.filter(
    (item) => item.accountStatus === "ACTIVE"
  ).length;

  const inactiveUsers = users.filter(
    (item) => item.accountStatus === "INACTIVE"
  ).length;

  const suspendedUsers = users.filter(
    (item) => item.accountStatus === "SUSPENDED"
  ).length;

  const pendingCompanies = companies.filter(
    (item) => item.verificationStatus === "PENDING"
  ).length;

  const verifiedCompanies = companies.filter(
    (item) => item.verificationStatus === "VERIFIED"
  ).length;

  const rejectedCompanies = companies.filter(
    (item) => item.verificationStatus === "REJECTED"
  ).length;

  const publishedJobs = jobs.filter(
    (item) => item.status === "PUBLISHED"
  ).length;

  const draftJobs = jobs.filter(
    (item) => item.status === "DRAFT"
  ).length;

  const closedJobs = jobs.filter(
    (item) => item.status === "CLOSED"
  ).length;

  const removedJobs = jobs.filter(
    (item) => item.status === "REMOVED"
  ).length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            JobConnect
          </h1>
          <p className="text-sm text-slate-500">
            Admin Dashboard
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm font-medium text-slate-600 sm:block">
            {user?.name || "Admin User"}
          </span>

          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* =================================================
            MAIN DASHBOARD
        ================================================= */}

        {activeSection === "dashboard" && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <ShieldCheck className="h-7 w-7" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Welcome, {user?.name || "Admin User"}!
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage users, companies, jobs and platform activity.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {adminSections.map((section) => {
                const Icon = section.icon;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className="group rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="mt-5 font-semibold text-slate-900">
                      {section.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      {section.description}
                    </p>

                    <p className="mt-4 text-sm font-semibold text-indigo-600">
                      Open section →
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* =================================================
            USERS MANAGEMENT
        ================================================= */}

        {activeSection === "users" && (
          <section>
            <button
              type="button"
              onClick={() => setActiveSection("dashboard")}
              className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  User Management
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  View and manage registered JobConnect accounts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRefreshKey((previous) => previous + 1)}
                disabled={usersLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh users
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Total users</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {users.length}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-white p-5">
                <p className="text-sm text-slate-500">Active</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {activeUsers}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Inactive</p>
                <p className="mt-2 text-2xl font-bold text-slate-700">
                  {inactiveUsers}
                </p>
              </div>

              <div className="rounded-xl border border-red-100 bg-white p-5">
                <p className="text-sm text-slate-500">Suspended</p>
                <p className="mt-2 text-2xl font-bold text-red-600">
                  {suspendedUsers}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name or email..."
                    className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(event.target.value as RoleFilter)
                  }
                  className="rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                  aria-label="Filter by role"
                >
                  <option value="ALL">All roles</option>
                  <option value="STUDENT">Students</option>
                  <option value="RECRUITER">Recruiters</option>
                  <option value="ADMIN">Administrators</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as AccountFilter)
                  }
                  className="rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-500"
                  aria-label="Filter by account status"
                >
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            {usersError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Request failed:</strong> {usersError}
              </div>
            )}

            {successMessage && (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            {usersLoading && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center">
                Loading users...
              </div>
            )}

            {!usersLoading && !usersError && (
              <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    Registered Users
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Showing {filteredUsers.length} of {users.length} accounts
                  </p>
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="p-10 text-center">
                    <Users className="mx-auto h-9 w-9 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-700">
                      No users found
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-4">User</th>
                          <th className="px-5 py-4">Role</th>
                          <th className="px-5 py-4">Joined</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Manage account</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((item) => {
                          const isAdmin = item.role === "ADMIN";
                          const isUpdating = updatingUserId === item.id;

                          return (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-5 py-4">
                                <p className="font-semibold text-slate-900">
                                  {item.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {item.email}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  ID: {item.id}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                {item.role}
                              </td>

                              <td className="px-5 py-4 text-slate-600">
                                {formatDate(item.createdAt)}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getAccountStatusClasses(item.accountStatus)}`}
                                >
                                  {item.accountStatus}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                {isAdmin ? (
                                  <span className="text-xs text-slate-400">
                                    Protected admin
                                  </span>
                                ) : (
                                  <select
                                    value={item.accountStatus}
                                    disabled={isUpdating}
                                    onChange={(event) =>
                                      void handleStatusChange(
                                        item,
                                        event.target.value as AccountStatus
                                      )
                                    }
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs disabled:opacity-50"
                                  >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="SUSPENDED">Suspended</option>
                                  </select>
                                )}
                                {isUpdating && (
                                  <p className="mt-1 text-xs text-indigo-600">
                                    Updating...
                                  </p>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* =================================================
            COMPANIES MANAGEMENT
        ================================================= */}

        {activeSection === "companies" && (
          <section>
            <button
              type="button"
              onClick={() => setActiveSection("dashboard")}
              className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Company Management
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review registered companies and manage verification.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRefreshKey((previous) => previous + 1)}
                disabled={companiesLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh companies
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Total companies</p>
                <p className="mt-2 text-2xl font-bold">{companies.length}</p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-white p-5">
                <p className="text-sm text-slate-500">Pending</p>
                <p className="mt-2 text-2xl font-bold text-amber-600">
                  {pendingCompanies}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-white p-5">
                <p className="text-sm text-slate-500">Verified</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {verifiedCompanies}
                </p>
              </div>

              <div className="rounded-xl border border-red-100 bg-white p-5">
                <p className="text-sm text-slate-500">Rejected</p>
                <p className="mt-2 text-2xl font-bold text-red-600">
                  {rejectedCompanies}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="search"
                  value={companySearch}
                  onChange={(event) =>
                    setCompanySearch(event.target.value)
                  }
                  placeholder="Search company, industry or location..."
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                />

                <select
                  value={companyStatusFilter}
                  onChange={(event) =>
                    setCompanyStatusFilter(
                      event.target.value as CompanyStatusFilter
                    )
                  }
                  className="rounded-lg border border-slate-200 px-3 py-3 text-sm"
                >
                  <option value="ALL">All verification statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {companiesError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Request failed:</strong> {companiesError}
              </div>
            )}

            {successMessage && (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            {companiesLoading && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center">
                Loading companies...
              </div>
            )}

            {!companiesLoading && !companiesError && (
              <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    Registered Companies
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Showing {filteredCompanies.length} of {companies.length} companies
                  </p>
                </div>

                {filteredCompanies.length === 0 ? (
                  <div className="p-10 text-center">
                    <Building2 className="mx-auto h-9 w-9 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-700">
                      No companies found
                    </p>
                  </div>
                ) : (
                  <table className="w-full min-w-[1000px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Company</th>
                        <th className="px-5 py-4">Industry</th>
                        <th className="px-5 py-4">Location</th>
                        <th className="px-5 py-4">Website</th>
                        <th className="px-5 py-4">Joined</th>
                        <th className="px-5 py-4">Verification</th>
                        <th className="px-5 py-4">Manage</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredCompanies.map((company) => {
                        const isUpdating =
                          updatingCompanyId === company.id;

                        return (
                          <tr key={company.id} className="hover:bg-slate-50">
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              {company.name}
                            </td>

                            <td className="px-5 py-4">
                              {company.industry || "Not specified"}
                            </td>

                            <td className="px-5 py-4">
                              {company.location || "Not specified"}
                            </td>

                            <td className="px-5 py-4">
                              {company.website ? (
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                                >
                                  Visit
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              ) : (
                                "Not provided"
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {formatDate(company.createdAt)}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getVerificationClasses(company.verificationStatus)}`}
                              >
                                {company.verificationStatus}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <select
                                value={company.verificationStatus}
                                disabled={isUpdating}
                                onChange={(event) =>
                                  void handleCompanyVerificationChange(
                                    company,
                                    event.target.value as VerificationStatus
                                  )
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs disabled:opacity-50"
                              >
                                <option value="PENDING">Pending</option>
                                <option value="VERIFIED">Verified</option>
                                <option value="REJECTED">Rejected</option>
                              </select>

                              {isUpdating && (
                                <p className="mt-1 text-xs text-indigo-600">
                                  Updating...
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </section>
        )}

        {/* =================================================
            JOB MANAGEMENT
        ================================================= */}

        {activeSection === "jobs" && (
          <section>
            <button
              type="button"
              onClick={() => {
                setSelectedJob(null);
                setActiveSection("dashboard");
              }}
              className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Job Management
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  View and manage job and internship postings.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRefreshKey((previous) => previous + 1)}
                disabled={jobsLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                {jobsLoading ? "Refreshing..." : "Refresh jobs"}
              </button>
            </div>

            {/* JOB STATISTICS */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Total jobs</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {jobs.length}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-white p-5">
                <p className="text-sm text-slate-500">Published</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {publishedJobs}
                </p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-white p-5">
                <p className="text-sm text-slate-500">Draft</p>
                <p className="mt-2 text-2xl font-bold text-amber-600">
                  {draftJobs}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Closed</p>
                <p className="mt-2 text-2xl font-bold text-slate-700">
                  {closedJobs}
                </p>
              </div>

              <div className="rounded-xl border border-red-100 bg-white p-5">
                <p className="text-sm text-slate-500">Removed</p>
                <p className="mt-2 text-2xl font-bold text-red-600">
                  {removedJobs}
                </p>
              </div>
            </div>

            {/* JOB SEARCH AND FILTERS */}

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={jobSearch}
                    onChange={(event) =>
                      setJobSearch(event.target.value)
                    }
                    placeholder="Search title, company or location..."
                    className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={jobTypeFilter}
                  onChange={(event) =>
                    setJobTypeFilter(event.target.value as JobTypeFilter)
                  }
                  className="rounded-lg border border-slate-200 px-3 py-3 text-sm"
                  aria-label="Filter jobs by type"
                >
                  <option value="ALL">All types</option>
                  <option value="JOB">Jobs</option>
                  <option value="INTERNSHIP">Internships</option>
                </select>

                <select
                  value={jobStatusFilter}
                  onChange={(event) =>
                    setJobStatusFilter(
                      event.target.value as JobStatusFilter
                    )
                  }
                  className="rounded-lg border border-slate-200 px-3 py-3 text-sm"
                  aria-label="Filter jobs by status"
                >
                  <option value="ALL">All statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REMOVED">Removed</option>
                </select>
              </div>
            </div>

            {/* JOB ERRORS AND SUCCESS */}

            {jobsError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Request failed:</strong> {jobsError}
              </div>
            )}

            {successMessage && (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            {jobsLoading && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center">
                Loading jobs from the database...
              </div>
            )}

            {/* JOB TABLE */}

            {!jobsLoading && !jobsError && (
              <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">
                    Registered Jobs and Internships
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Showing {filteredJobs.length} of {jobs.length} postings
                  </p>
                </div>

                {filteredJobs.length === 0 ? (
                  <div className="p-10 text-center">
                    <BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-700">
                      No jobs found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your search or filters.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-4">Job</th>
                          <th className="px-5 py-4">Company</th>
                          <th className="px-5 py-4">Type</th>
                          <th className="px-5 py-4">Compensation</th>
                          <th className="px-5 py-4">Deadline</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Manage</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {filteredJobs.map((job) => {
                          const isUpdating = updatingJobId === job.id;

                          return (
                            <tr key={job.id} className="hover:bg-slate-50">
                              <td className="px-5 py-4">
                                <p className="font-semibold text-slate-900">
                                  {job.title}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  ID: {job.id}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {job.location || "Location not specified"}
                                </p>
                              </td>

                              <td className="px-5 py-4 text-slate-700">
                                {job.companyName}
                              </td>

                              <td className="px-5 py-4">
                                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                  {job.jobType}
                                </span>
                                <p className="mt-2 text-xs text-slate-500">
                                  {job.workMode}
                                </p>
                              </td>

                              <td className="px-5 py-4 text-slate-700">
                                {formatJobCompensation(job)}
                              </td>

                              <td className="px-5 py-4 text-slate-600">
                                {formatDate(job.applicationDeadline)}
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getJobStatusClasses(job.status)}`}
                                >
                                  {job.status}
                                </span>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex flex-col gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedJob(job)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                  >
                                    View details
                                  </button>

                                  <select
                                    value={job.status}
                                    disabled={isUpdating}
                                    onChange={(event) =>
                                      void handleJobStatusChange(
                                        job,
                                        event.target.value as JobStatus
                                      )
                                    }
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs disabled:opacity-50"
                                    aria-label={`Change status for ${job.title}`}
                                  >
                                    <option value="DRAFT">Draft</option>
                                    <option value="PUBLISHED">Published</option>
                                    <option value="CLOSED">Closed</option>
                                    <option value="REMOVED">Removed</option>
                                  </select>

                                  {isUpdating && (
                                    <p className="text-xs text-indigo-600">
                                      Updating...
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* =================================================
            JOB DETAILS MODAL
        ================================================= */}

        {selectedJob && activeSection === "jobs" && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={() => setSelectedJob(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Job details"
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Job details
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {selectedJob.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedJob.companyName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close job details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {selectedJob.jobType}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getJobStatusClasses(selectedJob.status)}`}
                >
                  {selectedJob.status}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {selectedJob.workMode}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedJob.location || "Not specified"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Compensation</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatJobCompensation(selectedJob)}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Experience</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedJob.experienceRequired || "Not specified"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Employment type</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedJob.employmentType || "Not specified"}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Application deadline</p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(selectedJob.applicationDeadline)}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Recruiter user ID</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedJob.recruiterUserId}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-slate-900">
                  Description
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedJob.description}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            APPLICATION MANAGEMENT
        ================================================= */}

        {activeSection === "applications" && (
          <AdminApplications
            onBack={() => setActiveSection("dashboard")}
          />
        )}
      </main>
    </div>
  );
}
