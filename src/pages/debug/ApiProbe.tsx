// src/pages/debug/ApiProbe.tsx
import { useEffect, useState } from "react";
import { getFirstOk } from "@/services/client";

// Local no-op unwrap to replace missing import from client.ts
function unwrap<T>(x: T): T {
  return x;
}

const CAR_CANDIDATES = [
  "/api/v1/vehicles/inventory",
  "/api/v1/vehicles",
  "/api/v1/cars",
  "/api/cars",
  "/cars",
  "/vehicles",
  "/api/v1/public/cars",
  "/api/v1/public/vehicles",
  // extra guesses
  "/api/v1/vehicles/all",
  "/api/v1/vehicles/list",
  "/api/v1/catalog/vehicles",
  "/api/v1/catalog/cars",
  "/api/vehicles",
];

const SRV_CANDIDATES = [
  "/api/v1/services",
  "/api/services",
  "/services",
  "/api/v1/public/services",
];

type Row = { url: string; ok: boolean; status?: number; size?: number; note?: string };

export default function ApiProbe() {
  const [rows, setRows] = useState<Row[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const out: Row[] = [];

      // Vehicles scan
      for (const url of CAR_CANDIDATES) {
        try {
          const data = await getFirstOk([url]); // single try
          const arr = unwrap<any>(data);
          out.push({
            url,
            ok: true,
            status: 200,
            size: Array.isArray(arr) ? arr.length : 0,
          });
          break; // first OK is enough
        } catch (e: any) {
          out.push({
            url,
            ok: false,
            status: e?.response?.status,
            note: e?.response?.data ? JSON.stringify(e.response.data) : "",
          });
        }
      }

      out.push({ url: "---", ok: true, status: undefined, note: "Services scan" });

      // Services scan
      for (const url of SRV_CANDIDATES) {
        try {
          const data = await getFirstOk([url]);
          const arr = unwrap<any>(data);
          out.push({
            url,
            ok: true,
            status: 200,
            size: Array.isArray(arr) ? arr.length : 0,
          });
          break;
        } catch (e: any) {
          out.push({
            url,
            ok: false,
            status: e?.response?.status,
            note: e?.response?.data ? JSON.stringify(e.response.data) : "",
          });
        }
      }

      setRows(out);
      setDone(true);
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h2 className="text-xl font-semibold mb-4">API Probe</h2>
      <p className="text-sm mb-4 text-blue-200/80">
        Checks multiple candidate endpoints and shows which one responds.
      </p>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div
            key={i}
            className={`p-3 rounded ${r.ok ? "bg-blue-800/40" : "bg-blue-900/40"}`}
          >
            <div className="text-sm">
              <span className="font-mono">{r.url}</span>
              {" — "}
              <span className={r.ok ? "text-green-300" : "text-red-300"}>
                {r.ok ? "OK" : "FAIL"}
              </span>
              {r.status !== undefined && (
                <span className="ml-2 text-blue-200/70">status: {r.status}</span>
              )}
              {r.size !== undefined && (
                <span className="ml-2 text-blue-200/70">items: {r.size}</span>
              )}
            </div>
            {!!r.note && (
              <div className="text-xs opacity-70 break-all mt-1">{r.note}</div>
            )}
          </div>
        ))}
      </div>
      {!done && <div className="mt-4">Scanning…</div>}
    </div>
  );
}
