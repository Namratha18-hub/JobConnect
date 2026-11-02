import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  MapPin,
  IndianRupee,
  Clock,
  GraduationCap,
} from "lucide-react";

import api from "../../services/api";

interface Job {
  id: number;
  title: string;
  description: string;
  location?: string;
  jobType?: string;
  workMode?: string;
  employmentType?: string;
  experienceRequired?: string;
  stipend?: number;
  salaryMin?: number;
  salaryMax?: number;
  companyId?: number;
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) {
        setError("Job ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get<Job>(`/api/jobs/${id}`);

        setJob(response.data);
      } catch (err) {
        console.error("Failed to load job:", err);
        setError("Unable to load job details.");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

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

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Job not found
          </h1>

          <p className="mt-3 text-slate-500">
            {error || "The requested job could not be found."}
          </p>

          <button
            onClick={() => navigate("/student/jobs")}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <button
            onClick={() => navigate("/student/jobs")}
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

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Job Header */}
        <section className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                <Briefcase size={16} />
                Job Opportunity
              </div>

              <h1 className="text-3xl font-bold md:text-4xl">
                {job.title}
              </h1>

              <div className="mt-5 flex flex-wrap gap-3">
                {job.location && (
                  <span className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                    <MapPin size={16} />
                    {job.location}
                  </span>
                )}

                {job.workMode && (
                  <span className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                    {job.workMode}
                  </span>
                )}

                {job.jobType && (
                  <span className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                    {job.jobType}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-indigo-100">
                Job ID
              </p>

              <p className="mt-1 text-2xl font-bold">
                #{job.id}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-8 lg:col-span-2">
            {/* Description */}
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Job Description
              </h2>

              <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">
                {job.description ||
                  "No description available."}
              </p>
            </section>

            {/* Job Information */}
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Job Information
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {job.employmentType && (
                  <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                    <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                      <Briefcase size={20} />
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Employment Type
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {job.employmentType}
                      </p>
                    </div>
                  </div>
                )}

                {job.workMode && (
                  <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                    <div className="rounded-xl bg-violet-100 p-3 text-violet-600">
                      <Building2 size={20} />
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Work Mode
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {job.workMode}
                      </p>
                    </div>
                  </div>
                )}

                {job.experienceRequired && (
                  <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                    <div className="rounded-xl bg-fuchsia-100 p-3 text-fuchsia-600">
                      <GraduationCap size={20} />
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Experience
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {job.experienceRequired}
                      </p>
                    </div>
                  </div>
                )}

                {job.location && (
                  <div className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                    <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                      <MapPin size={20} />
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Location
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {job.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right */}
          <aside className="space-y-6">
            {/* Compensation */}
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Compensation
              </h2>

              <div className="mt-5 space-y-4">
                {(job.salaryMin !== undefined ||
                  job.salaryMax !== undefined) && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-green-100 p-3 text-green-600">
                      <IndianRupee size={20} />
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Salary
                      </p>

                      <p className="font-semibold text-slate-900">
                        ₹{job.salaryMin ?? 0}
                        {" - "}
                        ₹{job.salaryMax ?? 0}
                      </p>
                    </div>
                  </div>
                )}

                {job.stipend !== undefined &&
                  job.stipend !== null && (
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
                        <IndianRupee size={20} />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Stipend
                        </p>

                        <p className="font-semibold text-slate-900">
                          ₹{job.stipend}
                        </p>
                      </div>
                    </div>
                  )}

                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                    <Clock size={20} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Application Status
                    </p>

                    <p className="font-semibold text-slate-900">
                      Open
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                    <CalendarDays size={20} />
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Apply
                    </p>

                    <p className="font-semibold text-slate-900">
                      Available Now
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Actions */}
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Interested in this job?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Review the job details and continue to the
                application process.
              </p>

              <button
                onClick={() =>
                  navigate("/student/applications", {
                    state: {
                      jobId: job.id,
                    },
                  })
                }
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-violet-700"
              >
                Apply Now
              </button>

              <button
                onClick={() => navigate("/student/jobs")}
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Jobs
              </button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}