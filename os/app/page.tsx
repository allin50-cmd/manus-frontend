export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold">Unified Intelligence OS</h1>
        <p className="mt-4 text-gray-600">
          Multi-tenant revenue, legal ops, and compliance intelligence. API surface lives under{' '}
          <code>/api/gateway</code>, <code>/api/revenue/*</code>, <code>/api/law/*</code>, and{' '}
          <code>/api/compliance/*</code>.
        </p>
      </div>
    </main>
  );
}
