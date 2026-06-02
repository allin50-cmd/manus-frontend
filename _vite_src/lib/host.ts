const FINEGUARD_HOSTS = new Set(['thefineguard.com', 'www.thefineguard.com']);

export function isFineGuardHost(hostname = globalThis.location?.hostname): boolean {
  return FINEGUARD_HOSTS.has(hostname.toLowerCase());
}
