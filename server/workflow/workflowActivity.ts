export interface StatusChangeActivity {
  person: string
  eventType: 'StatusChanged'
  summary: string
  oldStatus: string
  newStatus: string
}

// The summary format must stay `Status changed to <status>` — existing activity
// history and the /activity page filters were built around it.
export function statusChangeActivity(input: {
  person: string
  from: string
  to: string
  note?: string
}): StatusChangeActivity {
  return {
    person: input.person,
    eventType: 'StatusChanged',
    summary: input.note ? `Status changed to ${input.to} — ${input.note}` : `Status changed to ${input.to}`,
    oldStatus: input.from,
    newStatus: input.to,
  }
}
