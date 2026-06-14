import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

// Server-side admin client — never expose the service role key to the browser.
// Lazily initialised so missing env vars only throw on first use, not at module load.
export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('SUPABASE_URL is not set')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  _client = createClient(url, key)
  return _client
}
