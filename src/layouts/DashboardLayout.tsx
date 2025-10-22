import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

export default function DashboardLayout() {
  const { role, logout } = useAuth();
  const loc = useLocation();

  const navs: { label: string; to: string; show: boolean }[] = [
    { label: "User Home", to: "/app/user", show: role === "USER" },
    { label: "Book Test Drive", to: "/app/user/book-test-drive", show: role === "USER" },
    { label: "Request Service", to: "/app/user/request-service", show: role === "USER" },

    { label: "Admin Home", to: "/app/admin", show: role === "ADMIN" },
    { label: "Agents", to: "/app/admin/agents", show: role === "ADMIN" },
    { label: "Services", to: "/app/admin/services", show: role === "ADMIN" },

    { label: "Agent Home", to: "/app/agent", show: role === "AGENT" }
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-r border-blue-800 bg-blue-900">
        <div className="h-16 flex items-center px-4 font-semibold">Autobridge</div>
        <nav className="px-2 py-2 space-y-1">
          {navs.filter(n => n.show).map(n => (
            <Link key={n.to} to={n.to}
              className={`block rounded-lg px-3 py-2 text-sm ${loc.pathname===n.to ? "bg-blue-800/60 text-blue-100" : "hover:bg-blue-800/60"}`}>
              {n.label}
            </Link>
          ))}
          <Link to="/services" className="block rounded-lg px-3 py-2 text-sm hover:bg-blue-800/60">Public Services</Link>
          <Link to="/cars" className="block rounded-lg px-3 py-2 text-sm hover:bg-blue-800/60">Public Cars</Link>
          <Link to="/app/user/profile" className="block rounded-lg px-3 py-2 text-sm hover:bg-blue-800/60">Profile</Link>
          <button onClick={logout} className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-blue-800/60">
            Logout
          </button>
        </nav>
      </aside>
      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
