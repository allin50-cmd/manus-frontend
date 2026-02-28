const API_BASE = "https://fineguard-api.azurewebsites.net";

export interface RiskItem {
  CompanyName: string;
  CompanyNumber: string;
  ServiceType: string;
  Status: "OVERDUE" | "DUE SOON";
  NextDeadline: string;
}

export interface SummaryData {
  overdue: number;
  dueSoon: number;
  compliant: number;
}

export async function fetchRisks(tenantId: string): Promise<RiskItem[]> {
  const res = await fetch(`${API_BASE}/api/risks?tenantId=${encodeURIComponent(tenantId)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSummary(tenantId: string): Promise<SummaryData> {
  const res = await fetch(`${API_BASE}/api/summary?tenantId=${encodeURIComponent(tenantId)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
