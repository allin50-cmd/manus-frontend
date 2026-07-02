// Auth is a single shared passcode with no roles (see AGENTS.md), so any
// authenticated person may run any transition. Role rules slot in here later
// without touching the engine or routes.
export function canTransitionStatus(person: string): boolean {
  return typeof person === 'string' && person.trim().length > 0
}
