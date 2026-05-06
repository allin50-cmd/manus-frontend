const stores = new Map<string, Map<string, unknown>>();

function getStore(routerName: string): Map<string, unknown> {
  if (!stores.has(routerName)) stores.set(routerName, new Map());
  return stores.get(routerName)!;
}

export function checkIdempotency<T>(
  routerName: string,
  tenantId: string,
  key: string | undefined,
): T | undefined {
  if (!key) return undefined;
  return getStore(routerName).get(`${tenantId}:${key}`) as T | undefined;
}

export function recordIdempotency<T>(
  routerName: string,
  tenantId: string,
  key: string | undefined,
  result: T,
): void {
  if (!key) return;
  getStore(routerName).set(`${tenantId}:${key}`, result);
}
