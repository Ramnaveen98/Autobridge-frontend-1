// src/pages/admin/AdminInsights.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

/* --------------------------------------------------------------------------------
   Types / helpers
--------------------------------------------------------------------------------- */

type RequestStatus = "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

type AdminRequestRow = {
  id: number;
  status: RequestStatus;
};

const COLORS = {
  completed: "#60d394",   // green
  inProgress: "#6aa8ff",  // blue
  cancelled: "#ef7272",   // red
};

const DARK_BG = "rgba(8,10,20,0.95)";

/* A subtle “glow” for the active bar (no grey block) */
function ActiveBar(props: any) {
  const { fill, x, y, width, height } = props;
  return (
    <g filter="url(#barGlow)">
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={8} ry={8} />
    </g>
  );
}

/* Custom tooltip used by BOTH charts so text is always white and readable on dark */
function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  const p = payload[0];
  const name =
    (p?.name as string) ??
    (typeof label === "string" ? label : "Count");
  const value = (p?.value ?? "") as number | string;

  return (
    <div
      style={{
        background: DARK_BG,
        border: "1px solid #293041",
        borderRadius: 12,
        padding: "8px 10px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        color: "#fff", // force white text
        minWidth: 150,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{name}</div>
      <div style={{ opacity: 0.95 }}>{String(value)}</div>
    </div>
  );
}

/* --------------------------------------------------------------------------------
   Page
--------------------------------------------------------------------------------- */

export default function AdminInsights() {
  const [rows, setRows] = useState<AdminRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // Re-use the same list endpoint we already use elsewhere
        const res = await api.get<AdminRequestRow[]>("/api/v1/admin/requests");
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (e: any) {
        setErr(e?.response?.data?.message || e?.message || "Failed to load insights.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Tally counts (memoized) */
  const { completed, cancelled, inProgress } = useMemo(() => {
    const tally = { completed: 0, cancelled: 0, inProgress: 0 };
    for (const r of rows) {
      if (r.status === "COMPLETED") tally.completed++;
      else if (r.status === "CANCELLED") tally.cancelled++;
      else tally.inProgress++; // PENDING / ASSIGNED / IN_PROGRESS
    }
    return tally;
  }, [rows]);

  const total = completed + inProgress + cancelled;

  /* Data for charts */
  const barData = [
    { key: "completed", name: "Completed", value: completed },
    { key: "inProgress", name: "In-Progress", value: inProgress },
    { key: "cancelled", name: "Cancelled", value: cancelled },
  ];

  const pieData = [
    { key: "completed", name: "Completed", value: completed },
    { key: "inProgress", name: "In-Progress", value: inProgress },
    { key: "cancelled", name: "Cancelled", value: cancelled },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Insights</h1>
        <span className="text-xs px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-300">
          Total: {total}
        </span>
      </div>
      <p className="text-sm text-zinc-400 mt-1">
        Snapshot of current request volumes.
      </p>

      {err && (
        <div className="mt-4 rounded border border-rose-800/50 bg-rose-950/30 text-rose-200 px-4 py-3">
          {err}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
        <StatCard
          title="Completed"
          value={completed}
          desc="Finished and closed"
        />
        <StatCard
          title="In-Progress"
          value={inProgress}
          desc="Pending / Assigned / In-progress"
        />
        <StatCard
          title="Cancelled"
          value={cancelled}
          desc="Cancelled by any party"
        />
      </div>

      {/* Charts: side-by-side on desktop, stacked on small screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {/* BAR */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-sm font-semibold mb-2">Requests by status</div>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <filter id="barGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#ffffff" floodOpacity="0.09" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="#2a2f3c" />
                <XAxis dataKey="name" tick={{ fill: "#cdd2e0" }} />
                <YAxis tick={{ fill: "#cdd2e0" }} />
                {/* White-text tooltip, no grey block cursor */}
                <Tooltip cursor={{ fill: "transparent" }} content={<ChartTooltip />} />
                <Legend wrapperStyle={{ color: "#cdd2e0" }} />
                <Bar
                  dataKey="value"
                  name="Count"
                  barSize={36}                 // thinner bar
                  radius={[8, 8, 0, 0]}
                  activeBar={<ActiveBar />}
                >
                  {barData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        d.key === "completed"
                          ? COLORS.completed
                          : d.key === "inProgress"
                          ? COLORS.inProgress
                          : COLORS.cancelled
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE (solid) */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-sm font-semibold mb-2">Distribution</div>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                {/* White-text tooltip */}
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ color: "#cdd2e0" }} />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={0}        // solid pie
                  outerRadius="80%"
                  paddingAngle={2}
                  stroke="#18191bff"
                  strokeWidth={4}
                >
                  {pieData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        d.key === "completed"
                          ? COLORS.completed
                          : d.key === "inProgress"
                          ? COLORS.inProgress
                          : COLORS.cancelled
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- tiny KPI card --- */
function StatCard({ title, value, desc }: { title: string; value: number; desc: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <div className="text-sm text-zinc-400">{title}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{desc}</div>
    </div>
  );
}
