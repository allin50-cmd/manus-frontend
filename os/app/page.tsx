import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/session';

const cards = [
  {
    href: '/audit',
    title: 'Revenue Engine',
    description: 'Chambers billing leakage audit with adaptive scoring and AI narrative.',
    vertical: 'revenue',
  },
  {
    href: '/law',
    title: 'Law Clerks AI',
    description: 'Ingest briefs, extract tasks, parties, deadlines, and generate billing entries.',
    vertical: 'law',
  },
  {
    href: '/compliance',
    title: 'FineGuard Pro',
    description: 'Live Companies House compliance scoring and penalty prediction.',
    vertical: 'compliance',
  },
];

export default async function Home() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  const isPro = session?.plan === 'pro';

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Unified Intelligence OS</h1>
        <p className="max-w-3xl text-sm text-gray-600 sm:text-base">
          Multi-tenant revenue, legal ops, and compliance intelligence for chambers and law firms.
        </p>
        {!session ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/signup" className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white">
              Get started free
            </Link>
            <Link href="/login" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium">
              Sign in
            </Link>
            <Link href="/pricing" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium">
              See pricing
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/dashboard" className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white">
              Go to dashboard
            </Link>
            {!isPro && (
              <Link href="/pricing" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium">
                Upgrade to Pro
              </Link>
            )}
          </div>
        )}
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const locked = !isPro && c.vertical !== 'revenue';
          return (
            <Link
              key={c.href}
              href={locked ? '/pricing' : c.href}
              className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-400 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{c.title}</h2>
                {locked && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Pro
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600">{c.description}</p>
              <p className="mt-4 text-sm font-medium text-gray-900">
                {locked ? 'Upgrade →' : 'Open →'}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
