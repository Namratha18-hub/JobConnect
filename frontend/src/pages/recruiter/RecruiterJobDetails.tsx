import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Pencil,
  XCircle,
} from "lucide-react";

import {
  closeJob,
  getAllJobs,
  type RecruiterJob,
} from "../../services/recruiterService";

import { useAuth } from "../../context/AuthContext";

export default function RecruiterJobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState<RecruiterJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true);
        setError("");

        const jobs = await getAllJobs();

        const selectedJob = jobs.find(
          (item) => item.id === Number(id)
        );

        if (!selectedJob) {
          setError("Job opportunity not found.");
          return;
        }

        setJob(selectedJob);
      } catch (err) {
        console.error("Failed to load job:", err);
        setError("Unable to load job details.");
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id]);

  const formatDate = (date: string) => {
    if (!date) return "Not specified";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatSalary = () => {
    if (!job) return "Not specified";

    if (job.jobType === "INTERNSHIP") {
      return job.stipend
        ? `₹${job.stipend.toLocaleString("en-IN")} / month`
        : "Not specified";
    }

    if (job.salaryMin && job.salaryMax) {
      return `₹${job.salaryMin.toLocaleString(
        "en-IN"
      )} - ₹${job.salaryMax.toLocaleString("en-IN")}`;
    }

    if (job.salaryMin) {
      return `₹${job.salaryMin.toLocaleString("en-IN")}+`;
    }

    if (job.salaryMax) {
      return `Up to ₹${job.salaryMax.toLocaleString("en-IN")}`;
    }

    return "Not specified";
  };

  const handleCloseJob = async () => {
    if (!job || !user) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to close this job opportunity?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const updatedJob = await closeJob(
        job.id,
        user.userId
      );

      setJob(updatedJob);

      alert("Job opportunity closed successfully.");
    } catch (err) {
      console.error("Failed to close job:", err);
      alert("Unable to close the job opportunity.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">
          Loading job details...
        </p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <button
          onClick={() => navigate("/recruiter/dashboard")}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <XCircle
            size={48}
            className="mx-auto mb-4 text-red-500"
          />

          <h2 className="text-xl font-semibold text-slate-800">
            {error || "Job not found"}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <button
            onClick={() => navigate("/recruiter/dashboard")}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Job Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <BriefcaseBusiness
                    size={24}
                    className="text-blue-600"
                  />
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    job.status === "PUBLISHED"
                      ? "bg-green-100 text-green-700"
                      : job.status === "CLOSED"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {job.status}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-slate-900">
                {job.title}
              </h1>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <MapPin size={17} />
                  {job.location || "Location not specified"}
                </span>

                <span className="flex items-center gap-2">
                  <BriefcaseBusiness size={17} />
                  {job.workMode}
                </span>

                <span className="flex items-center gap-2">
                  <CalendarDays size={17} />
                  Deadline: {formatDate(job.applicationDeadline)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {/* Edit Button */}
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/recruiter/jobs/${job.id}/edit`
                  )
                }
                disabled={job.status === "CLOSED"}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pencil size={17} />
                Edit
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseJob}
                disabled={job.status === "CLOSED"}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle size={17} />
                {job.status === "CLOSED"
                  ? "Closed"
                  : "Close"}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <section className="bg-white rounded-2xl border border-slate-200 p-7">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Job Description
              </h2>

              <p className="text-slate-600 leading-7 whitespace-pre-line">
                {job.description ||
                  "No description provided."}
              </p>
            </section>

            {/* Requirements */}
            <section className="bg-white rounded-2xl border border-slate-200 p-7">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Requirements
              </h2>

              <p className="text-slate-600 leading-7 whitespace-pre-line">
                {job.requirements ||
                  "No requirements provided."}
              </p>
            </section>

            {/* Responsibilities */}
            <section className="bg-white rounded-2xl border border-slate-200 p-7">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Responsibilities
              </h2>

              <p className="text-slate-600 leading-7 whitespace-pre-line">
                {job.responsibilities ||
                  "No responsibilities provided."}
              </p>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-5">
                Opportunity Details
              </h2>

              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Type
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {job.jobType}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Employment
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {job.employmentType ||
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Work Mode
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {job.workMode}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Experience
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {job.experienceRequired ||
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Salary / Stipend
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {formatSalary()}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Application Deadline
                  </p>

                  <p className="mt-1 font-medium text-slate-800">
                    {formatDate(
                      job.applicationDeadline
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* Job ID */}
            <section className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
              <h2 className="text-lg font-semibold text-blue-900">
                Job ID
              </h2>

              <p className="mt-2 text-blue-700 font-mono">
                #{job.id}
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}