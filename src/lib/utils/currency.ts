export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2).replace(/\.00$/, '')}`;
}
