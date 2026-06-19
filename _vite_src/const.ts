export function getLoginUrl(): string {
  // Azure B2C login URL — override via VITE_LOGIN_URL at build time
  const configured = import.meta.env.VITE_LOGIN_URL as string | undefined;
  if (configured) return configured;
  return '/login';
}
