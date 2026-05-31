'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function BillingSuccessPage() {
  useEffect(() => {
    fetch('/api/auth/refresh', { method: 'POST' }).catch(() => {});
  }, []);
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-3xl font-semibold">You&apos;re on Pro</h1>
      <p className="mt-2 text-gray-600">All verticals are now unlocked for your workspace.</p>
      <Link href="/" className="mt-6 inline-block rounded bg-gray-900 px-5 py-2.5 text-sm font-medium text-white">
        Go to dashboard
      </Link>
    </div>
  );
}
