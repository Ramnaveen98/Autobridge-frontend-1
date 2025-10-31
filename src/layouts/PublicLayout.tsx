// src/layouts/PublicLayout.tsx
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";

export default function PublicLayout() {
  const { token, role, logout } = useAuth();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const isAdmin = role === "ADMIN";
  const isAgent = role === "AGENT";
  const isUser = role === "USER" || (!isAdmin && !isAgent);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    "block px-3 py-2 rounded-md hover:text-blue-400 " +
    (isActive ? "font-semibold text-blue-400" : "text-gray-300");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Left group: Logo + main links */}
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              to="/"
              className="font-bold text-2xl md:text-3xl text-white hover:text-blue-400 transition"
            >
              Autobridge
            </Link>

            {/* Desktop main nav beside brand (desktop only from lg) */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm font-medium">
              <NavLink to="/services" className={navClass}>
                Services
              </NavLink>
              <NavLink to="/vehicles" className={navClass}>
                Vehicles
              </NavLink>

              {token && (
                <>
                  {/* Dashboard */}
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

                  {/* Admin Shortcuts */}
                  {isAdmin && (
                    <>
                      <NavLink to="/app/admin/services" className={navClass}>
                        Update Services
                      </NavLink>
                      <NavLink
                        to="/app/admin/vehicles/photos"
                        className={navClass}
                      >
                        Vehicle Photos
                      </NavLink>
                    </>
                  )}

                  {/* Agent Feedback */}
                  {isAgent && (
                    <NavLink to="/app/agent/feedback" className={navClass}>
                      Feedback
                    </NavLink>
                  )}
                </>
              )}
            </nav>
          </div>

          {/* Right side buttons (Desktop only from lg) */}
          <div className="hidden lg:flex items-center gap-3 text-sm">
            {!token ? (
              <>
                <Link to="/login" className="hover:text-blue-400">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                >
                  Signup
                </Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="hover:text-blue-400">
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    nav("/");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Hamburger (no highlight ever; styling-only change) */}
          <button
            ref={btnRef}
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onPointerDown={(e) => e.preventDefault()} // prevent focus on mouse/touch
            onMouseDown={(e) => e.preventDefault()}   // extra guard
            onFocus={(e) => e.currentTarget.blur()}   // blur if anything focuses it
            onClick={() => {
              setMenuOpen(!menuOpen);
              btnRef.current?.blur();
            }}
            className="lg:hidden relative inline-flex items-center justify-center w-11 h-11 rounded-lg
                       border border-white/10 bg-white/5 backdrop-blur-sm shadow-sm
                       hover:bg-white/10 active:scale-[0.98] transition
                       outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <span className="relative inline-block w-6 h-6 text-white">
              {/* Hamburger */}
              <svg
                className={`absolute inset-0 transition-all duration-200 ease-out ${
                  menuOpen ? "opacity-0 scale-90" : "opacity-100 scale-100"
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden={menuOpen}
              >
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
              {/* Close (X) */}
              <svg
                className={`absolute inset-0 transition-all duration-200 ease-out ${
                  menuOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden={!menuOpen}
              >
                <path d="M6 6l12 12" />
                <path d="M18 6l-12 12" />
              </svg>
            </span>
          </button>
        </div>

        {/* Collapsible menu for mobile & tablet (below lg) */}
        {menuOpen && (
          <div
            id="mobile-nav"
            className="lg:hidden bg-gray-900 border-t border-gray-800 text-center py-4 space-y-3 animate-fade-in"
          >
            <NavLink
              to="/services"
              onClick={() => setMenuOpen(false)}
              className={navClass}
            >
              Services
            </NavLink>
            <NavLink
              to="/vehicles"
              onClick={() => setMenuOpen(false)}
              className={navClass}
            >
              Vehicles
            </NavLink>

            {token && (
              <>
                {isAdmin ? (
                  <NavLink
                    to="/app/admin"
                    onClick={() => setMenuOpen(false)}
                    className={navClass}
                  >
                    Admin
                  </NavLink>
                ) : isAgent ? (
                  <NavLink
                    to="/app/agent"
                    onClick={() => setMenuOpen(false)}
                    className={navClass}
                  >
                    Agent
                  </NavLink>
                ) : (
                  <NavLink
                    to="/app/user"
                    onClick={() => setMenuOpen(false)}
                    className={navClass}
                  >
                    My Dashboard
                  </NavLink>
                )}

                {isAdmin && (
                  <>
                    <NavLink
                      to="/app/admin/services"
                      onClick={() => setMenuOpen(false)}
                      className={navClass}
                    >
                      Update Services
                    </NavLink>
                    <NavLink
                      to="/app/admin/vehicles/photos"
                      onClick={() => setMenuOpen(false)}
                      className={navClass}
                    >
                      Vehicle Photos
                    </NavLink>
                  </>
                )}

                {isAgent && (
                  <NavLink
                    to="/app/agent/feedback"
                    onClick={() => setMenuOpen(false)}
                    className={navClass}
                  >
                    Feedback
                  </NavLink>
                )}
              </>
            )}

            <div className="border-t border-gray-800 mx-6 my-3" />

            {!token ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-gray-300 hover:text-blue-400"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="block mx-auto w-fit bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-500"
                >
                  Signup
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block text-gray-300 hover:text-blue-400"
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    nav("/");
                    setMenuOpen(false);
                  }}
                  className="block mx-auto w-fit bg-zinc-800 text-white px-4 py-1.5 rounded-lg hover:bg-zinc-700"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-10 text-center text-xs text-gray-500 border-t border-gray-800">
        © {new Date().getFullYear()} Autobridge
      </footer>
    </div>
  );
}



/*
//Working code

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
                // ---------- DASHBOARD ENTRY (exactly one) ----------
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

                // ---------- Admin-only shortcuts ---------- 
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

                // ---------- Agent/Admin feedback shortcut ---------- 
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

*/
