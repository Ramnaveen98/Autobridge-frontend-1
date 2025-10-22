// src/App.tsx
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { useAuth } from "@/providers/AuthProvider";
import AdminRequests from "@/pages/admin/AdminRequests";

/** ---------- Public / top-level pages ---------- */
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const Services = lazy(() => import("@/pages/Services"));
const Vehicles = lazy(() => import("@/pages/Vehicles"));
const Welcome = lazy(() => import("@/pages/Welcome"));

/** ---------- Shared / profile ---------- */
const Profile = lazy(() => import("@/pages/Profile"));

/** ---------- User pages ---------- */
const UserDashboard = lazy(() => import("@/pages/user/UserDashboard"));
const RequestService = lazy(() => import("@/pages/user/RequestService"));
const FeedbackForm = lazy(() => import("@/pages/user/FeedbackForm"));
const RequestDetailsPage = lazy(() => import("@/pages/user/RequestDetailsPage"));

/** ---------- Admin pages ---------- */
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminServices = lazy(() => import("@/pages/admin/AdminServices"));
const AdminDirectory = lazy(() => import("@/pages/admin/AdminDirectory"));
const AdminFeedback = lazy(() => import("@/pages/admin/AdminFeedback"));
const AdminVehiclePhotos = lazy(() => import("@/pages/admin/AdminVehiclePhotos"));
const AdminInsights = lazy(() => import("@/pages/admin/AdminInsights")); // NEW

/** ---------- Agent pages ---------- */
const AgentDashboard = lazy(() => import("@/pages/agent/AgentDashboard"));
const AgentFeedback = lazy(() => import("@/pages/agent/AgentFeedback"));

function Fallback() {
  return <div className="p-6">Loading…</div>;
}
function NotFound() { return <div className="p-6">404 — Page not found</div>; }

/** DEV helper: log path and role whenever a protected route renders */
function DebugGuard({ where }: { where: string }) {
  const { role, token } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(
        `[RouteGuard] ${where} → path=${pathname}, role=${role ?? "null"}, token=${token ? "present" : "none"}`
      );
    }
  }, [where, role, token, pathname]);
  return null;
}

function RequireAuth({
  roles,
  children
}: {
  roles?: Array<"USER" | "ADMIN" | "AGENT">;
  children: JSX.Element;
}) {
  const { token, role } = useAuth();
  const { pathname } = useLocation();

  if (!token) return <Navigate to="/login" replace />;

  // If a specific role is required and we have a role that doesn't match → home
  if (roles && role && !roles.includes(role)) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[RequireAuth] Deny path=${pathname} for role=${role}, required=${roles.join(",")}`);
    }
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <DebugGuard where={`RequireAuth(${roles?.join(",") || "any"})`} />
      {children}
    </>
  );
}

/** Redirect /app → the correct dashboard for the current role. */
function RoleHome() {
  const { token, role } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (role === "ADMIN") return <Navigate to="/app/admin" replace />;
  if (role === "AGENT") return <Navigate to="/app/agent" replace />;
  return <Navigate to="/app/user" replace />;
}

/** Safety net: normalize a mismatched dashboard by role */
function NormalizeDashboard() {
  const { role } = useAuth();
  if (role === "ADMIN") return <Navigate to="/app/admin" replace />;
  if (role === "AGENT") return <Navigate to="/app/agent" replace />;
  return <Navigate to="/app/user" replace />;
}

/** Redirect old “My Requests” route to the user dashboard */
function RedirectUserRequests() {
  return <Navigate to="/app/user" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          {/* Default landing → /welcome */}
          <Route index element={<Navigate to="/welcome" replace />} />

          {/* Public */}
          <Route path="welcome" element={<Suspense fallback={<Fallback />}><Welcome /></Suspense>} />
          <Route path="login" element={<Suspense fallback={<Fallback />}><Login /></Suspense>} />
          <Route path="signup" element={<Suspense fallback={<Fallback />}><Signup /></Suspense>} />
          <Route path="services" element={<Suspense fallback={<Fallback />}><Services /></Suspense>} />
          <Route path="vehicles" element={<Suspense fallback={<Fallback />}><Vehicles /></Suspense>} />

          {/* Profile */}
          <Route
            path="profile"
            element={
              <RequireAuth roles={["USER", "ADMIN", "AGENT"]}>
                <Suspense fallback={<Fallback />}><Profile /></Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="app/profile"
            element={
              <RequireAuth roles={["USER", "ADMIN", "AGENT"]}>
                <Suspense fallback={<Fallback />}><Profile /></Suspense>
              </RequireAuth>
            }
          />

          {/* Force-correct dashboard by role if someone hits a wrong path */}
          <Route
            path="app/dashboard"
            element={
              <RequireAuth roles={["USER", "ADMIN", "AGENT"]}>
                <NormalizeDashboard />
              </RequireAuth>
            }
          />

          {/* App root → role home */}
          <Route path="app" element={<RoleHome />} />

          {/* User pages */}
          <Route
            path="user/request-service"
            element={
              <RequireAuth roles={["USER", "ADMIN", "AGENT"]}>
                <Suspense fallback={<Fallback />}><RequestService /></Suspense>
              </RequireAuth>
            }
          />
          <Route path="user/requests" element={<RedirectUserRequests />} />
          <Route
            path="user/feedback/:requestId"
            element={
              <RequireAuth roles={["USER", "ADMIN", "AGENT"]}>
                <Suspense fallback={<Fallback />}><FeedbackForm /></Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="app/user/requests/:id"
            element={
              <RequireAuth roles={["USER", "ADMIN", "AGENT"]}>
                <Suspense fallback={<Fallback />}><RequestDetailsPage /></Suspense>
              </RequireAuth>
            }
          />

          {/* Dashboards */}
          <Route
            path="app/user"
            element={
              <RequireAuth roles={["USER", "ADMIN", "AGENT"]}>
                <Suspense fallback={<Fallback />}><UserDashboard /></Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="app/admin"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <Suspense fallback={<Fallback />}><AdminDashboard /></Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="app/agent"
            element={
              <RequireAuth roles={["AGENT", "ADMIN"]}>
                <Suspense fallback={<Fallback />}><AgentDashboard /></Suspense>
              </RequireAuth>
            }
          />

          {/* Admin management */}
          <Route
            path="app/admin/services"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <Suspense fallback={<Fallback />}><AdminServices /></Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="app/admin/directory"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <Suspense fallback={<Fallback />}><AdminDirectory /></Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/app/admin/vehicles/photos"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <Suspense fallback={<Fallback />}><AdminVehiclePhotos /></Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="app/admin/feedback"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <Suspense fallback={<Fallback />}><AdminFeedback /></Suspense>
              </RequireAuth>
            }
          />

          {/* NEW: Admin Requests page */}
          <Route
            path="app/admin/requests"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <Suspense fallback={<Fallback />}><AdminRequests /></Suspense>
              </RequireAuth>
            }
          />

          {/* NEW: Insights route */}
          <Route
            path="app/admin/insights"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <Suspense fallback={<Fallback />}><AdminInsights /></Suspense>
              </RequireAuth>
            }
          />

          {/* Agent feedback */}
          <Route
            path="app/agent/feedback"
            element={
              <RequireAuth roles={["AGENT", "ADMIN"]}>
                <Suspense fallback={<Fallback />}><AgentFeedback /></Suspense>
              </RequireAuth>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Suspense fallback={<Fallback />}><NotFound /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
