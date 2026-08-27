import { defineAgent } from "eve";

export default defineAgent({
  description: "Review WorkItem, filings, deadlines, decisions, alerts, recipients, escalation, acknowledgement, retry, and audit-log changes for UltraCore/FineGuard domain correctness.",
  model: "anthropic/claude-sonnet-5",
});
