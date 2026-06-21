import { redirect } from 'next/navigation'

// /hub is the Business Hub entry point — redirects to the main dashboard.
// All Business Hub routes remain behind auth middleware.
export default function HubPage() {
  redirect('/os')
}
