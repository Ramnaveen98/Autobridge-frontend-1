// src/pages/admin/AdminDashboard.tsx
import { Link } from "react-router-dom";

/** Reusable card for the hub */
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
        {/* NEW: Insights */}
        <SectionCard
          title="Insights"
          desc="See totals of Completed, In-Progress, and Cancelled requests."
          to="/app/admin/insights"
        />
      </div>
    </div>
  );
}








/*
// The below code is working and here , i am updating 
// the dashboard for admin page 

// src/pages/admin/AdminDashboard.tsx
import { Link } from "react-router-dom";

// Reusable card for the hub
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
        Quick links to manage services, photos, feedback, directory, and requests.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Update Services"
          desc="Create, edit, activate/deactivate service offerings."
          to="/app/admin/services"
        />
        // Issue #2 fix: correct route for Vehicle Photos 
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
      </div>
    </div>
  );
}

*/