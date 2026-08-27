import { defineAgent } from "eve";

export default defineAgent({
  description: "Review UltraCore architecture changes for violations of AGENTS.md, CLAUDE.md, platform boundaries, approved technology choices, and duplicate systems.",
  model: "anthropic/claude-sonnet-5",
});
