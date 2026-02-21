// ============================================================
// FineGuard — Teams Tab (React Component)
// ============================================================
//
// Embeddable tab for the FineGuard dashboard inside Teams.
// Uses @microsoft/teams-js SDK for authentication and context.
//
// Dependencies:
//   npm install @microsoft/teams-js
// ============================================================

import { useEffect, useState } from "react";

// ── Types ───────────────────────────────────────────────────

interface TeamsContext {
  userPrincipalName?: string;
  teamId?: string;
  channelId?: string;
  locale?: string;
  theme?: string;
}

interface RiskSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  lastUpdated: string;
}

interface FilingDeadline {
  id: string;
  name: string;
  dueDate: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  status: "pending" | "overdue" | "filed";
}

// ── Teams Tab Component ─────────────────────────────────────

export function FineGuardTeamsTab() {
  const [context, setContext] = useState<TeamsContext | null>(null);
  const [page, setPage] = useState<string>("dashboard");
  const [riskSummary, setRiskSummary] = useState<RiskSummary | null>(null);
  const [filings, setFilings] = useState<FilingDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Teams SDK and get context
  useEffect(() => {
    async function init() {
      try {
        // Dynamic import so it doesn't break non-Teams environments
        const teams = await import("@microsoft/teams-js");
        await teams.app.initialize();

        const ctx = await teams.app.getContext();
        setContext({
          userPrincipalName: ctx.user?.userPrincipalName,
          teamId: ctx.team?.internalId,
          channelId: ctx.channel?.id,
          locale: ctx.app?.locale,
          theme: ctx.app?.theme,
        });

        // Read page from URL query param
        const params = new URLSearchParams(window.location.search);
        setPage(params.get("page") ?? "dashboard");
      } catch {
        // Not running inside Teams — use standalone mode
        setContext({ userPrincipalName: "standalone@fineguard.io" });
      }
    }
    init();
  }, []);

  // Fetch data based on active page
  useEffect(() => {
    if (!context) return;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = import.meta.env.VITE_API_URL ?? "/api";

        if (page === "dashboard" || page === "risk-alerts") {
          const res = await fetch(`${baseUrl}/compliance/risk-summary`, {
            headers: { "X-Firm-Id": "current" },
          });
          if (!res.ok) throw new Error("Failed to load risk summary");
          setRiskSummary(await res.json());
        }

        if (page === "filings" || page === "dashboard") {
          const res = await fetch(`${baseUrl}/compliance/filings?status=upcoming`, {
            headers: { "X-Firm-Id": "current" },
          });
          if (!res.ok) throw new Error("Failed to load filings");
          const data = await res.json();
          setFilings(data.filings ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [context, page]);

  // ── Render ──────────────────────────────────────────────

  if (!context) return <div className="p-6 text-center">Initializing Teams context…</div>;
  if (loading) return <div className="p-6 text-center">Loading FineGuard data…</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: context.theme === "dark" ? "#1a1a2e" : "#f8fafc",
        color: context.theme === "dark" ? "#e2e8f0" : "#0f172a",
      }}
    >
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">FineGuard Compliance Cloud</h1>
          <p className="text-sm opacity-70">
            Signed in as {context.userPrincipalName ?? "unknown"}
          </p>
        </div>
        <nav className="flex gap-2">
          {["dashboard", "risk-alerts", "filings"].map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                page === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
              }`}
            >
              {p.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </nav>
      </header>

      {/* Risk Summary Cards */}
      {riskSummary && (page === "dashboard" || page === "risk-alerts") && (
        <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <RiskCard label="Critical" count={riskSummary.critical} color="#dc2626" />
          <RiskCard label="High" count={riskSummary.high} color="#ea580c" />
          <RiskCard label="Medium" count={riskSummary.medium} color="#ca8a04" />
          <RiskCard label="Low" count={riskSummary.low} color="#16a34a" />
        </section>
      )}

      {/* Filing Deadlines Table */}
      {filings.length > 0 && (page === "dashboard" || page === "filings") && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Upcoming Filing Deadlines</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Filing</th>
                <th className="py-2">Due Date</th>
                <th className="py-2">Risk</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filings.map((f) => (
                <tr key={f.id} className="border-b">
                  <td className="py-2 font-medium">{f.name}</td>
                  <td className="py-2">{f.dueDate}</td>
                  <td className="py-2">
                    <RiskBadge level={f.riskLevel} />
                  </td>
                  <td className="py-2 capitalize">{f.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function RiskCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="text-3xl font-bold" style={{ color }}>
        {count}
      </div>
      <div className="text-sm font-medium opacity-80">{label}</div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colorMap: Record<string, string> = {
    Critical: "bg-red-100 text-red-700",
    High: "bg-orange-100 text-orange-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
  };

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[level] ?? ""}`}>
      {level}
    </span>
  );
}
