
import type { ReactNode } from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

// Authentication pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import FindJobs from "./pages/student/FindJobs";
import JobDetails from "./pages/student/JobDetails";
import Applications from "./pages/student/Applications";
import StudentProfile from "./pages/student/StudentProfile";
import SavedJobs from "./pages/student/SavedJobs";

// Recruiter pages
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import RecruiterApplications from "./pages/recruiter/RecruiterApplications";
import RecruiterJobDetails from "./pages/recruiter/RecruiterJobDetails";
import RecruiterJobEdit from "./pages/recruiter/RecruiterJobEdit";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";

/* =========================================================
   PROTECTED ROUTE
========================================================= */

function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: ReactNode;
  allowedRole: "STUDENT" | "RECRUITER" | "ADMIN";
}) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user?.role !== allowedRole) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <>{children}</>;
}

/* =========================================================
   HOME REDIRECT
========================================================= */

function HomeRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "STUDENT":
      return <Navigate to="/student/dashboard" replace />;

    case "RECRUITER":
      return <Navigate to="/recruiter/dashboard" replace />;

    case "ADMIN":
      return <Navigate to="/admin/dashboard" replace />;

    default:
      return <Navigate to="/login" replace />;
  }
}

/* =========================================================
   APP ROUTES
========================================================= */

export default function App() {
  return (
    <Routes>

      {/* HOME */}
      <Route
        path="/"
        element={<HomeRedirect />}
      />

      {/* AUTHENTICATION */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* FORGOT PASSWORD */}
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      {/* RESET PASSWORD */}
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* STUDENT DASHBOARD */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* STUDENT PROFILE */}
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentProfile />
          </ProtectedRoute>
        }
      />

      {/* FIND JOBS */}
      <Route
        path="/student/jobs"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <FindJobs />
          </ProtectedRoute>
        }
      />

      {/* JOB DETAILS */}
      <Route
        path="/student/jobs/:id"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <JobDetails />
          </ProtectedRoute>
        }
      />

      {/* STUDENT APPLICATIONS */}
      <Route
        path="/student/applications"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <Applications />
          </ProtectedRoute>
        }
      />

      {/* SAVED JOBS */}
      <Route
        path="/student/saved-jobs"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <SavedJobs />
          </ProtectedRoute>
        }
      />

      {/* RECRUITER DASHBOARD */}
      <Route
        path="/recruiter/dashboard"
        element={
          <ProtectedRoute allowedRole="RECRUITER">
            <RecruiterDashboard />
          </ProtectedRoute>
        }
      />

      {/* RECRUITER APPLICATIONS */}
      <Route
        path="/recruiter/applications"
        element={
          <ProtectedRoute allowedRole="RECRUITER">
            <RecruiterApplications />
          </ProtectedRoute>
        }
      />

      {/* RECRUITER JOB DETAILS */}
      <Route
        path="/recruiter/jobs/:id"
        element={
          <ProtectedRoute allowedRole="RECRUITER">
            <RecruiterJobDetails />
          </ProtectedRoute>
        }
      />

      {/* RECRUITER EDIT JOB */}
      <Route
        path="/recruiter/jobs/:id/edit"
        element={
          <ProtectedRoute allowedRole="RECRUITER">
            <RecruiterJobEdit />
          </ProtectedRoute>
        }
      />

      {/* ADMIN DASHBOARD */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* UNKNOWN ROUTE */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}
