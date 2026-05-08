function haversineDistance(
  p1: { lat: number; lon: number },
  p2: { lat: number; lon: number },
): number {
  const R = 6_371_000;
  const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
  const dLon = (p2.lon - p1.lon) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(p1.lat * (Math.PI / 180)) *
      Math.cos(p2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Navigation integrity from multi-source disagreement (0–100).
 * Low score indicates possible spoofing or sensor conflict.
 */
export function calcNavIntegrity(
  gpsPos: { lat: number; lon: number },
  inertialPos: { lat: number; lon: number },
  peerPos: { lat: number; lon: number } | null,
  mapConsistency: number,
): number {
  const gpsVsInertialM = haversineDistance(gpsPos, inertialPos);
  let conflict = Math.min(100, gpsVsInertialM);

  if (peerPos) {
    const gpsVsPeerM = haversineDistance(gpsPos, peerPos);
    conflict += Math.min(100, gpsVsPeerM) * 0.7;
  }

  conflict += (100 - mapConsistency) * 0.5;

  return Math.max(0, Math.min(100, Math.round(100 - conflict / 2)));
}

/**
 * Clock health from timing metrics (0–100).
 * Low score indicates timing corruption or loss of sync.
 */
export function calcClockHealth(
  ntpOffsetMs: number,
  driftRatePpm: number,
  lastSyncAgeSec: number,
  eventTimestampConsistency: number,
): number {
  let penalty = 0;
  penalty += Math.min(100, Math.max(0, (Math.abs(ntpOffsetMs) - 50) * 0.2));
  penalty += Math.min(100, Math.max(0, (driftRatePpm - 20) * 2));
  penalty += Math.min(100, Math.max(0, (lastSyncAgeSec - 60) * 0.5));
  penalty += (100 - eventTimestampConsistency) * 0.5;

  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}
