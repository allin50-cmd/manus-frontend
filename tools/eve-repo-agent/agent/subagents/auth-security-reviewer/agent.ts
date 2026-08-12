import { defineAgent } from "eve";

export default defineAgent({
  description: "Review authentication, cookies, middleware, API authorization, passcodes, secrets, Supabase service credentials, and external integration changes for exploitable security risk.",
  model: "anthropic/claude-sonnet-5",
});
