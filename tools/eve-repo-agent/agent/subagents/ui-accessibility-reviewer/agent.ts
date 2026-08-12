import { defineAgent } from "eve";

export default defineAgent({
  description: "Review React/Next.js user-interface changes for UltraTech design consistency, semantics, keyboard/focus behavior, form accessibility, and correctness-oriented lint issues.",
  model: "anthropic/claude-sonnet-5",
});
