export type CommandCorpusEntry = {
  area: string;
  input: string;
  expected: {
    action: string;
    needs_confirmation?: boolean;
    missing_fields?: string[];
  };
};

export const commandCorpus: CommandCorpusEntry[] = [
  { area: 'Reminders', input: 'Remind me tomorrow at 2pm to call Dagon about FineGuard.', expected: { action: 'create_reminder', needs_confirmation: false } },
  { area: 'Reminders', input: 'Remind me today at 5pm to check the Accuracy quote.', expected: { action: 'create_reminder', needs_confirmation: false } },
  { area: 'Reminders', input: 'Set a reminder to call Michelle tomorrow at 9am.', expected: { action: 'create_reminder', needs_confirmation: false } },
  { area: 'Reminders', input: 'Remember to review FineGuard tomorrow at 10am.', expected: { action: 'create_reminder', needs_confirmation: false } },
  { area: 'Reminders', input: 'Remind me to call Chris.', expected: { action: 'create_reminder', needs_confirmation: true } },
  { area: 'Reminders', input: 'Reminder: chase the garage paperwork tomorrow at 4pm.', expected: { action: 'create_reminder', needs_confirmation: false } },
  { area: 'Tasks', input: 'Create a task for Michelle to chase the Accuracy quote.', expected: { action: 'create_task', needs_confirmation: false } },
  { area: 'Tasks', input: 'Add a task to update the FineGuard landing page.', expected: { action: 'create_task', needs_confirmation: false } },
  { area: 'Tasks', input: 'Task Dagon to follow up with the accountant.', expected: { action: 'create_task', needs_confirmation: false } },
  { area: 'Tasks', input: 'Chase the Companies House alert list tomorrow.', expected: { action: 'create_task', needs_confirmation: false } },
  { area: 'Tasks', input: 'Follow up with Shakeel about the parser repo.', expected: { action: 'create_task', needs_confirmation: false } },
  { area: 'Tasks', input: 'Create a task.', expected: { action: 'create_task', needs_confirmation: true } },
  { area: 'Meetings', input: 'Schedule a meeting with Chris and Dagon next Tuesday at 11am about FineGuard.', expected: { action: 'schedule_meeting', needs_confirmation: false } },
  { area: 'Meetings', input: 'Set up a meeting with Michelle tomorrow at 3pm regarding operations.', expected: { action: 'schedule_meeting', needs_confirmation: false } },
  { area: 'Meetings', input: 'Arrange a meeting with Shakeel next Friday at 10am about UltraTech OS.', expected: { action: 'schedule_meeting', needs_confirmation: false } },
  { area: 'Meetings', input: 'Meeting with Dagon tomorrow at 1pm about Accuracy.', expected: { action: 'schedule_meeting', needs_confirmation: false } },
  { area: 'Meetings', input: 'Sync with Chris next Monday at 9am regarding voice input.', expected: { action: 'schedule_meeting', needs_confirmation: false } },
  { area: 'Meetings', input: 'Schedule a meeting tomorrow at 3pm.', expected: { action: 'schedule_meeting', needs_confirmation: true, missing_fields: ['participants'] } },
  { area: 'Callbacks', input: 'Book a callback with Chris next Friday at 10am.', expected: { action: 'book_callback', needs_confirmation: false } },
  { area: 'Callbacks', input: 'Book a call with Helen tomorrow at 2pm.', expected: { action: 'book_callback', needs_confirmation: false } },
  { area: 'Callbacks', input: 'Arrange a phone call with Dagon tomorrow at 11am.', expected: { action: 'book_callback', needs_confirmation: false } },
  { area: 'Callbacks', input: 'Callback with Michelle tomorrow at 4pm.', expected: { action: 'book_callback', needs_confirmation: false } },
  { area: 'Callbacks', input: 'Book a callback tomorrow.', expected: { action: 'book_callback', needs_confirmation: true } },
  { area: 'Email', input: 'Draft an email to Shakeel saying Thursday at 3pm works.', expected: { action: 'draft_email', needs_confirmation: false } },
  { area: 'Email', input: 'Send email to Dagon about the sales plan.', expected: { action: 'draft_email', needs_confirmation: false } },
  { area: 'Email', input: 'Write to Michelle about the operations checklist.', expected: { action: 'draft_email', needs_confirmation: false } },
  { area: 'Email', input: 'Draft email to Chris regarding voice input testing.', expected: { action: 'draft_email', needs_confirmation: false } },
  { area: 'Email', input: 'Email the accountant.', expected: { action: 'draft_email', needs_confirmation: true } },
  { area: 'Invoices', input: 'Create an invoice for £450 for website updates.', expected: { action: 'create_invoice', needs_confirmation: false } },
  { area: 'Invoices', input: 'Invoice Accuracy for £1200 for repair works.', expected: { action: 'create_invoice', needs_confirmation: false } },
  { area: 'Invoices', input: 'Bill Dagon £300 for FineGuard setup.', expected: { action: 'create_invoice', needs_confirmation: false } },
  { area: 'Invoices', input: 'Charge £99 for monthly support.', expected: { action: 'create_invoice', needs_confirmation: false } },
  { area: 'Invoices', input: 'Create an invoice for Accuracy.', expected: { action: 'create_invoice', needs_confirmation: true } },
  { area: 'Unknown', input: 'Book me an Uber to Croydon tomorrow at 9am.', expected: { action: 'unknown', needs_confirmation: true } },
  { area: 'Unknown', input: 'Order me a sandwich from the cafe.', expected: { action: 'unknown', needs_confirmation: true } },
  { area: 'Unknown', input: 'Ping Sarah about the contract.', expected: { action: 'unknown', needs_confirmation: true } },
  { area: 'Unknown', input: 'Find the cheapest flight to Spain.', expected: { action: 'unknown', needs_confirmation: true } },
  { area: 'Unknown', input: 'Make the app look more premium.', expected: { action: 'unknown', needs_confirmation: true } },
  { area: 'Unknown', input: 'Can you sort this out?', expected: { action: 'unknown', needs_confirmation: true } },
];
