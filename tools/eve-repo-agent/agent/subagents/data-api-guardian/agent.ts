import { defineAgent } from "eve";

export default defineAgent({
  description: "Review Next.js API, Prisma, Supabase, schema, query, data-contract, transaction, and Vercel serverless changes for correctness and architecture safety.",
  model: "anthropic/claude-sonnet-5",
});
