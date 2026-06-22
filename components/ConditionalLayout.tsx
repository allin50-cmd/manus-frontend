'use client'

// FineGuard production — all routes manage their own layout.
// Homepage, /check, and /portal use product-specific nav components.
// No shared NavBar shell is needed on this branch.
export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
