// src/pages/admin/AdminDashboard.tsx
import { Link } from "react-router-dom";
import "./AdminDashboard.css"; // 👈 we'll add animation styles here

/** Animated section card with unique glow color */
function SectionCard({
  title,
  desc,
  to,
  glow,
}: {
  title: string;
  desc: string;
  to: string;
  glow: string;
}) {
  const hoverGlow = {
    cyan: "hover:shadow-[0_0_25px_-5px_rgba(56,189,248,0.5)] hover:border-cyan-500/60 hover:text-cyan-400",
    violet: "hover:shadow-[0_0_25px_-5px_rgba(139,92,246,0.5)] hover:border-violet-500/60 hover:text-violet-400",
    blue: "hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.5)] hover:border-blue-500/60 hover:text-blue-400",
    emerald: "hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.5)] hover:border-emerald-500/60 hover:text-emerald-400",
    amber: "hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.5)] hover:border-amber-500/60 hover:text-amber-400",
    pink: "hover:shadow-[0_0_25px_-5px_rgba(236,72,153,0.5)] hover:border-pink-500/60 hover:text-pink-400",
  }[glow];

  return (
    <Link
      to={to}
      className={`group block rounded-2xl border border-slate-700/60 
                 bg-slate-900/40 p-6 sm:p-7 backdrop-blur-md
                 transition-all duration-300 ease-out
                 hover:-translate-y-1 hover:bg-slate-800/60 ${hoverGlow}`}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-white transition-colors duration-300 group-hover:opacity-90">
          {title}
        </h3>
        <span
          className={`text-xs rounded-full border border-slate-700/80 px-3 py-0.5 
                      text-gray-400 transition-all duration-300 
                      group-hover:border-current group-hover:opacity-90`}
        >
          Open →
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-400 leading-relaxed">{desc}</p>
    </Link>
  );
}

export default function AdminDashboard() {
  return (
    <div className="admin-gradient min-h-screen text-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="text-center sm:text-left mb-10">
          <h1 className="text-3xl font-bold text-white tracking-wide mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Manage your platform through quick-access tools for services, photos, feedback, users, requests, and insights.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          <SectionCard
            title="Update Services"
            desc="Create, edit, and activate/deactivate service offerings."
            to="/app/admin/services"
            glow="cyan"
          />
          <SectionCard
            title="Vehicle Photos"
            desc="Upload or update the latest car photos and external links."
            to="/app/admin/vehicles/photos"
            glow="violet"
          />
          <SectionCard
            title="Feedback"
            desc="Review customer and agent feedback for completed requests."
            to="/app/admin/feedback"
            glow="blue"
          />
          <SectionCard
            title="Directory"
            desc="View and manage details of all Users and Agents."
            to="/app/admin/directory"
            glow="emerald"
          />
          <SectionCard
            title="Admin Requests"
            desc="Assign or reassign service requests to agents efficiently."
            to="/app/admin/requests"
            glow="amber"
          />
          <SectionCard
            title="Insights"
            desc="Monitor totals of Completed, In-Progress, and Cancelled requests in real-time."
            to="/app/admin/insights"
            glow="pink"
          />
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Autobridge. All rights reserved.
        </div>
      </div>
    </div>
  );
}







/*
//working code
// src/pages/admin/AdminDashboard.tsx
import { Link } from "react-router-dom";


function SectionCard({
  title,
  desc,
  to,
}: {
  title: string;
  desc: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 hover:border-zinc-700 hover:bg-zinc-900/40 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="text-xs rounded-full border border-zinc-800 px-2 py-0.5 group-hover:border-zinc-700">
          Open →
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-400">{desc}</p>
    </Link>
  );
}

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-1">Admin Dashboard</h1>
      <p className="text-sm text-zinc-400 mb-6">
        Quick links to manage services, photos, feedback, directory, requests, and insights.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Update Services"
          desc="Create, edit, activate/deactivate service offerings."
          to="/app/admin/services"
        />
        <SectionCard
          title="Vehicle Photos"
          desc="Upload or update latest car photos and external links."
          to="/app/admin/vehicles/photos"
        />
        <SectionCard
          title="Feedback"
          desc="Review customer and agent feedback for completed requests."
          to="/app/admin/feedback"
        />
        <SectionCard
          title="Directory"
          desc="View and edit Users & Agents details."
          to="/app/admin/directory"
        />
        <SectionCard
          title="Admin Requests"
          desc="Assign or reassign service requests to agents."
          to="/app/admin/requests"
        />
       // {/* NEW: Insights }
        <SectionCard
          title="Insights"
          desc="See totals of Completed, In-Progress, and Cancelled requests."
          to="/app/admin/insights"
        />
      </div>
    </div>
  );
}

*/




