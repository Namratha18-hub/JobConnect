import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  BriefcaseBusiness,
   Pencil,
} from "lucide-react";

import {
  getAllJobs,
  updateJob,
  type RecruiterJob,
  type CreateJobRequest,
  type RecruiterJobType,
  type RecruiterWorkMode,
  type RecruiterEmploymentType,
} from "../../services/recruiterService";
import { useAuth } from "../../context/AuthContext";

export default function RecruiterJobEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState<RecruiterJob | null>(null);

  const [form, setForm] = useState<CreateJobRequest>({
    companyId: 0,
    postedBy: 0,
    title: "",
    description: "",
    location: "",
    jobType: "JOB",
    workMode: "ONSITE",
    employmentType: "FULL_TIME",
    experienceRequired: "",
    salaryMin: null,
    salaryMax: null,
    stipend: null,
    requirements: "",
    responsibilities: "",
    applicationDeadline: "",
    status: "PUBLISHED",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

        setForm({
          companyId: selectedJob.companyId,
          postedBy: selectedJob.postedBy,
          title: selectedJob.title,
          description: selectedJob.description,
          location: selectedJob.location || "",
          jobType: selectedJob.jobType,
          workMode: selectedJob.workMode,
          employmentType:
            selectedJob.employmentType || "FULL_TIME",
          experienceRequired:
            selectedJob.experienceRequired || "",
          salaryMin: selectedJob.salaryMin,
          salaryMax: selectedJob.salaryMax,
          stipend: selectedJob.stipend,
          requirements: selectedJob.requirements || "",
          responsibilities:
            selectedJob.responsibilities || "",
          applicationDeadline:
            selectedJob.applicationDeadline || "",
          status: selectedJob.status,
        });
      } catch (err) {
        console.error("Failed to load job:", err);
        setError("Unable to load job details.");
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id]);

  const handleChange = (
    field: keyof CreateJobRequest,
    value: string | number | null
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleJobTypeChange = (
    value: RecruiterJobType
  ) => {
    if (value === "INTERNSHIP") {
      setForm((previous) => ({
        ...previous,
        jobType: value,
        employmentType: "INTERNSHIP",
        salaryMin: null,
        salaryMax: null,
      }));
    } else {
      setForm((previous) => ({
        ...previous,
        jobType: value,
        employmentType:
          previous.employmentType === "INTERNSHIP"
            ? "FULL_TIME"
            : previous.employmentType,
        stipend: null,
      }));
    }

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!user?.userId) {
      setError("Recruiter account information is missing.");
      return;
    }

    if (!job) {
      setError("Job information is missing.");
      return;
    }

    if (!form.title.trim()) {
      setError("Job title is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Job description is required.");
      return;
    }

    if (!form.applicationDeadline) {
      setError("Application deadline is required.");
      return;
    }

    if (form.jobType === "INTERNSHIP") {
      if (
        form.stipend === null ||
        Number(form.stipend) <= 0
      ) {
        setError(
          "A paid internship must have a stipend greater than zero."
        );
        return;
      }
    }

    if (form.jobType === "JOB") {
      if (
        form.salaryMin !== null &&
        form.salaryMax !== null &&
        Number(form.salaryMax) < Number(form.salaryMin)
      ) {
        setError(
          "Maximum salary cannot be less than minimum salary."
        );
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updatedJob = await updateJob(
        job.id,
        user.userId,
        {
          ...form,
          postedBy: job.postedBy,
        }
      );

      setJob(updatedJob);

      setForm({
        companyId: updatedJob.companyId,
        postedBy: updatedJob.postedBy,
        title: updatedJob.title,
        description: updatedJob.description,
        location: updatedJob.location || "",
        jobType: updatedJob.jobType,
        workMode: updatedJob.workMode,
        employmentType:
          updatedJob.employmentType || "FULL_TIME",
        experienceRequired:
          updatedJob.experienceRequired || "",
        salaryMin: updatedJob.salaryMin,
        salaryMax: updatedJob.salaryMax,
        stipend: updatedJob.stipend,
        requirements: updatedJob.requirements || "",
        responsibilities:
          updatedJob.responsibilities || "",
        applicationDeadline:
          updatedJob.applicationDeadline || "",
        status: updatedJob.status,
      });

      setSuccess("Job updated successfully.");

      setTimeout(() => {
        navigate(`/recruiter/jobs/${job.id}`);
      }, 800);
    } catch (err: any) {
      console.error("Failed to update job:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Unable to update job.";

      setError(
        typeof message === "string"
          ? message
          : "Unable to update job."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">
          Loading job information...
        </p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <button
          onClick={() =>
            navigate("/recruiter/dashboard")
          }
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="max-w-3xl mx-auto mt-8 bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <AlertCircle
            size={45}
            className="mx-auto mb-4 text-red-500"
          />

          <h2 className="text-xl font-semibold text-slate-800">
            {error || "Job not found"}
          </h2>
        </div>
      </div>
    );
  }

  const isInternship = form.jobType === "INTERNSHIP";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <button
            type="button"
            onClick={() =>
              navigate(`/recruiter/jobs/${job.id}`)
            }
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft size={18} />
            Back to Job Details
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <BriefcaseBusiness
                size={22}
                className="text-blue-600"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Edit Job Opportunity
              </h1>

              <p className="text-sm text-slate-500">
                Update the details of your job posting.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Basic Information */}
          <section className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Basic Information
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Job Title *
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    handleChange(
                      "title",
                      e.target.value
                    )
                  }
                  maxLength={200}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. Java Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    handleChange(
                      "description",
                      e.target.value
                    )
                  }
                  rows={6}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none resize-y focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Describe the opportunity..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location
                </label>

                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    handleChange(
                      "location",
                      e.target.value
                    )
                  }
                  maxLength={150}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. Hyderabad, India"
                />
              </div>
            </div>
          </section>

          {/* Opportunity Type */}
          <section className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Opportunity Type
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type *
                </label>

                <select
                  value={form.jobType}
                  onChange={(e) =>
                    handleJobTypeChange(
                      e.target.value as RecruiterJobType
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="JOB">
                    Job
                  </option>

                  <option value="INTERNSHIP">
                    Paid Internship
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Work Mode *
                </label>

                <select
                  value={form.workMode}
                  onChange={(e) =>
                    handleChange(
                      "workMode",
                      e.target.value as RecruiterWorkMode
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ONSITE">
                    On-site
                  </option>

                  <option value="HYBRID">
                    Hybrid
                  </option>

                  <option value="REMOTE">
                    Remote
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Employment Type *
                </label>

                <select
                  value={form.employmentType}
                  disabled={isInternship}
                  onChange={(e) =>
                    handleChange(
                      "employmentType",
                      e.target.value as RecruiterEmploymentType
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white disabled:bg-slate-100 disabled:text-slate-500 px-4 py-3 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {isInternship ? (
                    <option value="INTERNSHIP">
                      Internship
                    </option>
                  ) : (
                    <>
                      <option value="FULL_TIME">
                        Full Time
                      </option>

                      <option value="PART_TIME">
                        Part Time
                      </option>

                      <option value="CONTRACT">
                        Contract
                      </option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </section>

          {/* Experience and Compensation */}
          <section className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Experience & Compensation
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Experience Required
                </label>

                <input
                  type="text"
                  value={form.experienceRequired}
                  onChange={(e) =>
                    handleChange(
                      "experienceRequired",
                      e.target.value
                    )
                  }
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. 0-2 years"
                />
              </div>

              {isInternship ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Monthly Stipend *
                  </label>
<button
  type="button"
  onClick={() =>
    navigate(`/recruiter/jobs/${job.id}/edit`)
  }
  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
>
  <Pencil size={17} />
  Edit
</button>
                  
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Minimum Salary
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.salaryMin ?? ""
                      }
                      onChange={(e) =>
                        handleChange(
                          "salaryMin",
                          e.target.value
                            ? Number(e.target.value)
                            : null
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="e.g. 600000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Maximum Salary
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.salaryMax ?? ""
                      }
                      onChange={(e) =>
                        handleChange(
                          "salaryMax",
                          e.target.value
                            ? Number(e.target.value)
                            : null
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      placeholder="e.g. 900000"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Requirements */}
          <section className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Requirements
            </h2>

            <textarea
              value={form.requirements}
              onChange={(e) =>
                handleChange(
                  "requirements",
                  e.target.value
                )
              }
              rows={6}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none resize-y focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter skills, qualifications and requirements..."
            />
          </section>

          {/* Responsibilities */}
          <section className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Responsibilities
            </h2>

            <textarea
              value={form.responsibilities}
              onChange={(e) =>
                handleChange(
                  "responsibilities",
                  e.target.value
                )
              }
              rows={6}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none resize-y focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter responsibilities..."
            />
          </section>

          {/* Deadline */}
          <section className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Application Deadline
            </h2>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Deadline *
              </label>

              <input
                type="date"
                value={form.applicationDeadline}
                onChange={(e) =>
                  handleChange(
                    "applicationDeadline",
                    e.target.value
                  )
                }
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                The deadline cannot be in the past.
              </p>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-8">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/recruiter/jobs/${job.id}`
                )
              }
              disabled={saving}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              <X size={18} />
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save size={18} />

              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}