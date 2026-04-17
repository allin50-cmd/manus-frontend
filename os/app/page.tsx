import Link from 'next/link';

const cards = [
  {
    href: '/audit',
    title: 'Revenue Engine',
    description: 'Chambers billing leakage audit with adaptive scoring and AI narrative.',
  },
  {
    href: '/law',
    title: 'Law Clerks AI',
    description: 'Ingest briefs, extract tasks, parties, deadlines, and generate billing entries.',
  },
  {
    href: '/compliance',
    title: 'FineGuard Pro',
    description: 'Live Companies House compliance scoring and penalty prediction.',
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Unified Intelligence OS</h1>
        <p className="max-w-3xl text-gray-600">
          Multi-tenant revenue, legal ops, and compliance intelligence. Set your API key in the top
          bar, then run any of the three modules.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-400 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">{c.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{c.description}</p>
            <p className="mt-4 text-sm font-medium text-gray-900">Open &rarr;</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
