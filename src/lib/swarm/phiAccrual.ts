const HISTORY_SIZE = 60;

export class PhiAccrualDetector {
  private intervals = new Map<string, number[]>();
  private lastHeard = new Map<string, number>();

  record(peerId: string, now: number) {
    const prev = this.lastHeard.get(peerId);
    if (prev !== undefined) {
      const hist = this.intervals.get(peerId) ?? [];
      hist.push(now - prev);
      if (hist.length > HISTORY_SIZE) hist.shift();
      this.intervals.set(peerId, hist);
    }
    this.lastHeard.set(peerId, now);
  }

  phi(peerId: string, now: number): number {
    const last = this.lastHeard.get(peerId);
    if (last === undefined) return Infinity;
    const hist = this.intervals.get(peerId);
    if (!hist || hist.length < 2) return 0;
    const mean = hist.reduce((a, b) => a + b, 0) / hist.length;
    if (mean === 0) return Infinity;
    const elapsed = now - last;
    const p = Math.exp(-elapsed / mean);
    return p <= 0 ? Infinity : -Math.log10(p);
  }

  status(phi: number): 'green' | 'yellow' | 'orange' | 'red' {
    if (phi < 1) return 'green';
    if (phi < 4) return 'yellow';
    if (phi < 8) return 'orange';
    return 'red';
  }
}
