// Auth is a single shared passcode with no roles (see AGENTS.md), so any
// authenticated person may run any transition.
export function canTransitionStatus(person: string): boolean {
  return typeof person === 'string' && person.trim().length > 0
}
