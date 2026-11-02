import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle,
  MapPin,
  Phone,
  Save,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  getStudentProfile,
  updateStudentProfile,
  type StudentProfileUpdate,
} from "../../services/studentService";

export default function StudentProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [phone, setPhone] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    async function loadProfile() {

      if (!user?.userId) {
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const profile =
          await getStudentProfile(
            user.userId
          );

        setPhone(
          profile.phone ?? ""
        );

        setLocation(
          profile.location ?? ""
        );

        setBio(
          profile.bio ?? ""
        );

      } catch (error) {

        console.error(
          "Failed to load profile:",
          error
        );

        setErrorMessage(
          "Unable to load your profile."
        );

      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user?.userId]);

  const completedFields = [
    phone.trim(),
    location.trim(),
    bio.trim(),
  ].filter(
    (value) => value.length > 0
  ).length;

  const profilePercentage =
    Math.round(
      (completedFields / 3) * 100
    );

  async function handleSave() {

    if (!user?.userId) {
      setErrorMessage(
        "Please log in again."
      );
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const data:
        StudentProfileUpdate = {
        phone:
          phone.trim(),
        location:
          location.trim(),
        bio:
          bio.trim(),
      };

      await updateStudentProfile(
        user.userId,
        data
      );

      setSuccessMessage(
        "Profile updated successfully!"
      );

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);

    } catch (error) {

      console.error(
        "Profile update failed:",
        error
      );

      setErrorMessage(
        "Unable to update your profile. Please try again."
      );

    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">

        <div className="mx-auto max-w-4xl px-6 py-12">

          <div className="animate-pulse space-y-6">

            <div className="h-8 w-48 rounded bg-slate-200" />

            <div className="h-64 rounded-3xl bg-slate-200" />

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">

          <button
            onClick={() =>
              navigate(
                "/student/dashboard"
              )
            }
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600"
          >
            <ArrowLeft size={18} />

            Back to Dashboard
          </button>

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">

              <UserRound size={20} />

            </div>

            <div>

              <p className="font-bold text-slate-900">
                JobConnect
              </p>

              <p className="text-xs text-slate-500">
                Student Profile
              </p>

            </div>

          </div>

        </div>

      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* TITLE */}

        <div>

          <h1 className="text-3xl font-bold text-slate-900">
            Complete Your Profile
          </h1>

          <p className="mt-2 text-slate-500">
            Keep your profile updated so
            recruiters can understand your
            background.
          </p>

        </div>

        {/* SUCCESS */}

        {successMessage && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">

            <CheckCircle size={19} />

            {successMessage}

          </div>
        )}

        {/* ERROR */}

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

            {errorMessage}

          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">

          {/* PROFILE COMPLETION */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold text-slate-900">
              Profile Completion
            </h2>

            <div className="mt-6 text-center">

              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-[10px] border-indigo-100">

                <span className="text-3xl font-bold text-indigo-600">
                  {profilePercentage}%
                </span>

              </div>

              <p className="mt-5 text-sm text-slate-500">
                {profilePercentage ===
                100
                  ? "Your profile is complete!"
                  : "Complete your profile information."}
              </p>

            </div>

            <div className="mt-6 space-y-3">

              <div className="flex items-center justify-between text-sm">

                <span className="text-slate-600">
                  Phone
                </span>

                <span
                  className={
                    phone.trim()
                      ? "font-semibold text-green-600"
                      : "font-semibold text-slate-400"
                  }
                >
                  {phone.trim()
                    ? "Complete"
                    : "Missing"}
                </span>

              </div>

              <div className="flex items-center justify-between text-sm">

                <span className="text-slate-600">
                  Location
                </span>

                <span
                  className={
                    location.trim()
                      ? "font-semibold text-green-600"
                      : "font-semibold text-slate-400"
                  }
                >
                  {location.trim()
                    ? "Complete"
                    : "Missing"}
                </span>

              </div>

              <div className="flex items-center justify-between text-sm">

                <span className="text-slate-600">
                  About / Bio
                </span>

                <span
                  className={
                    bio.trim()
                      ? "font-semibold text-green-600"
                      : "font-semibold text-slate-400"
                  }
                >
                  {bio.trim()
                    ? "Complete"
                    : "Missing"}
                </span>

              </div>

            </div>

          </section>

          {/* PROFILE FORM */}

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm lg:col-span-2">

            <h2 className="text-xl font-bold text-slate-900">
              Personal Information
            </h2>

            {/* NAME */}

            <div className="mt-6">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Name
              </label>

              <input
                value={user?.name ?? ""}
                readOnly
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none"
              />

            </div>

            {/* EMAIL */}

            <div className="mt-5">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>

              <input
                value={user?.email ?? ""}
                readOnly
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 outline-none"
              />

            </div>

            {/* PHONE */}

            <div className="mt-5">

              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">

                <Phone size={16} />

                Phone

              </label>

              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                placeholder="Enter your phone number"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

            </div>

            {/* LOCATION */}

            <div className="mt-5">

              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">

                <MapPin size={16} />

                Location

              </label>

              <input
                type="text"
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value
                  )
                }
                placeholder="Example: Bhimavaram, Andhra Pradesh"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

            </div>

            {/* BIO */}

            <div className="mt-5">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                About / Bio
              </label>

              <textarea
                value={bio}
                onChange={(event) =>
                  setBio(
                    event.target.value
                  )
                }
                rows={6}
                placeholder="Tell recruiters about your skills, interests, education and career goals."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

            </div>

            {/* SAVE */}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Save size={18} />

              {saving
                ? "Saving..."
                : "Save Profile"}

            </button>

          </section>

        </div>

      </main>

    </div>
  );
}