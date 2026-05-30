export default function SitemapPage() {
  const pages = [
    { title: 'Home', path: '/', desc: 'Main dashboard with module overview' },
    { title: 'Revenue Engine', path: '/audit', desc: 'Chambers billing leakage audit with AI scoring and narrative' },
    { title: 'Law Clerks AI', path: '/law', desc: 'Document processing and billing entry extraction' },
    { title: 'FineGuard Pro', path: '/compliance', desc: 'Companies House compliance scoring and alerts' },
  ];

  const api = [
    { title: 'Unified Gateway', path: '/api/gateway', method: 'POST', desc: 'Single entry point for all modules' },
    { title: 'Revenue Submit', path: '/api/revenue/submit', method: 'POST', desc: 'Audit and lead capture' },
    { title: 'Revenue Narrative', path: '/api/revenue/narrative', method: 'POST', desc: 'AI summary generation' },
    { title: 'Revenue Outcome', path: '/api/revenue/outcome', method: 'POST', desc: 'Sales outcome feedback loop' },
    { title: 'Law Process Document', path: '/api/law/process-document', method: 'POST', desc: 'Extract tasks, parties, deadlines' },
    { title: 'Law Generate Billing', path: '/api/law/generate-billing', method: 'POST', desc: 'Billing entry generation' },
    { title: 'Compliance Check Company', path: '/api/compliance/check-company', method: 'POST', desc: 'Companies House scoring' },
    { title: 'Compliance Register Webhook', path: '/api/compliance/register-webhook', method: 'POST', desc: 'Alert subscription' },
  ];

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold">Sitemap</h1>
        <p className="text-gray-600">Unified Intelligence OS platform structure and available endpoints.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Pages</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {pages.map((p) => (
            <a
              key={p.path}
              href={p.path}
              className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-400 hover:bg-gray-50"
            >
              <h3 className="font-semibold text-gray-900">{p.title}</h3>
              <p className="text-sm text-gray-600">{p.desc}</p>
              <code className="mt-2 inline-block text-xs font-mono text-gray-500">{p.path}</code>
            </a>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">API Endpoints</h2>
        <p className="text-sm text-gray-600">All endpoints require <code className="font-mono">x-api-key</code> header.</p>
        <div className="space-y-2">
          {api.map((e) => (
            <div key={e.path} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono font-semibold text-gray-900">{e.method}</code>
                <code className="break-all font-mono text-sm text-gray-700">{e.path}</code>
              </div>
              <h3 className="mt-2 font-medium text-gray-900">{e.title}</h3>
              <p className="text-sm text-gray-600">{e.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="text-lg font-semibold">Documentation</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            <strong>Authentication:</strong> Set <code className="font-mono">x-api-key</code> header on all API requests.
            API keys are generated per tenant and persisted in the database.
          </li>
          <li>
            <strong>Validation:</strong> All input is validated with Zod schemas. Invalid requests return 400 with detailed error paths.
          </li>
          <li>
            <strong>Idempotency:</strong> Revenue audit submissions use SHA-256 hashing of tenant+email+sizeTier+painPoints to prevent duplicate leads.
            Same payload always returns the same leadId.
          </li>
          <li>
            <strong>AI Fallback:</strong> All AI-powered endpoints (narrative, document extraction, billing generation) have deterministic fallbacks when OpenAI is unavailable.
          </li>
          <li>
            <strong>Webhooks:</strong> Compliance alerts are delivered via HMAC-signed POST to registered webhook URLs. Supports retry with exponential backoff.
          </li>
          <li>
            <strong>Events:</strong> All actions emit events to Upstash Redis for audit trail and async processing.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Stack</h2>
        <div className="text-sm text-gray-700">
          <p><strong>Frontend:</strong> Next.js 14 (App Router), React 18, Tailwind CSS</p>
          <p><strong>Backend:</strong> Next.js API Routes, Node.js 20</p>
          <p><strong>Database:</strong> PostgreSQL + Prisma ORM</p>
          <p><strong>Cache & Queue:</strong> Upstash Redis (pub/sub), QStash (async jobs)</p>
          <p><strong>AI:</strong> OpenAI (gpt-4o-mini) with deterministic fallbacks</p>
          <p><strong>External APIs:</strong> Companies House, Stripe, Resend, OpenAI</p>
          <p><strong>Deploy:</strong> Azure Container Apps with Docker, GitHub Actions CI/CD</p>
        </div>
      </section>
    </div>
  );
}
