import { defineAgent } from "eve";

export default defineAgent({
  description: "Independently assess release evidence: lint, type-check, tests, build, E2E/API smoke coverage, CI results, and whether a claimed fix is actually verified.",
  model: "anthropic/claude-sonnet-5",
});
