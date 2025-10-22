/*

// src/layouts/PublicLayout.tsx
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

export default function PublicLayout() {
  const { token, role, logout } = useAuth();
  const nav = useNavigate();

  const navLink =
    "opacity-90 hover:opacity-100 px-2 py-1 rounded transition-colors";
  const navLinkActive = "text-blue-400";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          //{/* Left: brand + nav }
          <nav className="flex items-center gap-4">
            {/* Brand now routes to Welcome }
            <button
              type="button"
              onClick={() => nav("/welcome")}
              className="font-semibold tracking-tight"
            >
              Autobridge
            </button>

          //  {/* Public links }
            <NavLink
              to="/services"
              className={({ isActive }) =>
                `${navLink} ${isActive ? navLinkActive : ""}`
              }
            >
              Services
            </NavLink>
            <NavLink
              to="/vehicles"
              className={({ isActive }) =>
                `${navLink} ${isActive ? navLinkActive : ""}`
              }
            >
              Vehicles
            </NavLink>

            //{/* Authenticated-only nav items }
            {token && (
              <>
                <NavLink
                  to="/user/requests"
                  className={({ isActive }) =>
                    `${navLink} ${isActive ? navLinkActive : ""}`
                  }
                >
                  My Requests
                </NavLink>

            //    {/* Admin section }
                {role === "ADMIN" && (
                  <>
                    <NavLink
                      to="/app/admin"
                      className={({ isActive }) =>
                        `${navLink} ${isActive ? navLinkActive : ""}`
                      }
                    >
                      Admin
                    </NavLink>
                    <NavLink
                      to="/app/admin/services"
                      className={({ isActive }) =>
                        `${navLink} ${isActive ? navLinkActive : ""}`
                      }
                    >
                      Services
                    </NavLink>
                    <NavLink
                      to="/app/admin/feedback"
                      className={({ isActive }) =>
                        `${navLink} ${isActive ? navLinkActive : ""}`
                      }
                    >
                      Feedback
                    </NavLink>
                  </>
                )}

               // {/* Agent feedback (also visible to Admins) }
                {(role === "AGENT" || role === "ADMIN") && (
                  <NavLink
                    to="/app/agent/feedback"
                    className={({ isActive }) =>
                      `${navLink} ${isActive ? navLinkActive : ""}`
                    }
                  >
                    Agent Feedback
                  </NavLink>
                )}
              </>
            )}
          </nav>

       //   {/* Right: auth actions }
          <div className="flex items-center gap-3">
            {!token ? (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
             //   {/* Profile link for all authenticated roles }
              //  {/* App supports both /profile and /app/profile; using /profile }
                <Link
                  to="/profile"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  Profile
                </Link>

             //   {/* Quick role shortcuts (keep your originals) }
                {role === "ADMIN" && (
                  <Link
                    to="/app/admin"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                  >
                    Admin
                  </Link>
                )}
                {role === "AGENT" && (
                  <Link
                    to="/app/agent"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                  >
                    Agent
                  </Link>
                )}
                {role === "USER" && (
                  <Link
                    to="/app/user"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                  >
                    My Dashboard
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    nav("/login");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        <Outlet />
      </main>

      <footer className="mt-12 py-8 text-center text-sm opacity-60">
        © {new Date().getFullYear()} Autobridge
      </footer>
    </div>
  );
}

*/

// src/layouts/PublicLayout.tsx
// src/layouts/PublicLayout.tsx
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

export default function PublicLayout() {
  const { token, role, logout } = useAuth();
  const nav = useNavigate();

  const isAdmin = role === "ADMIN";
  const isAgent = role === "AGENT";
  const isUser = role === "USER" || (!isAdmin && !isAgent); // fallback to user

  const navClass = ({ isActive }: { isActive: boolean }) =>
    "hover:underline " + (isActive ? "font-semibold" : "");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-semibold text-lg">
            Autobridge
          </Link>

          <nav className="flex-1 flex gap-4 text-sm">
            <NavLink to="/services" className={navClass}>
              Services
            </NavLink>
            <NavLink to="/vehicles" className={navClass}>
              Vehicles
            </NavLink>

            {token && (
              <>
                {/* ---------- DASHBOARD ENTRY (exactly one) ---------- */}
                {isAdmin ? (
                  <NavLink to="/app/admin" className={navClass}>
                    Admin
                  </NavLink>
                ) : isAgent ? (
                  <NavLink to="/app/agent" className={navClass}>
                    Agent
                  </NavLink>
                ) : (
                  <NavLink to="/app/user" className={navClass}>
                    My Dashboard
                  </NavLink>
                )}

                {/* ---------- Admin-only shortcuts ---------- */}
                {isAdmin && (
                  <>
                    <NavLink to="/app/admin/services" className={navClass}>
                      Update Services
                    </NavLink>
                    <NavLink to="/app/admin/vehicles/photos" className={navClass}>
                      Vehicle Photos
                    </NavLink>
                  </>
                )}

                {/* ---------- Agent/Admin feedback shortcut ---------- */}
                {(isAgent) && (
                  <NavLink to="/app/agent/feedback" className={navClass}>
                    Feedback
                  </NavLink>
                )}
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            {!token ? (
              <>
                <Link to="/login" className="hover:underline">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1 rounded-lg bg-blue-600 text-white"
                >
                  Signup
                </Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="hover:underline">
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    nav("/");
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-800"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="py-10 text-center text-xs opacity-60">
        © {new Date().getFullYear()} Autobridge
      </footer>
    </div>
  );
}
