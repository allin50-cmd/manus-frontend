export function riskColour(level: string): string {
  switch (level) {
    case 'high': return 'text-red-700 bg-red-100';
    case 'medium': return 'text-orange-700 bg-orange-100';
    case 'low': return 'text-yellow-700 bg-yellow-100';
    default: return 'text-green-700 bg-green-100';
  }
}

export function statusColour(status: string): string {
  switch (status) {
    case 'overdue': return 'text-red-700 bg-red-100';
    case 'warning': return 'text-orange-700 bg-orange-100';
    default: return 'text-green-700 bg-green-100';
  }
}
