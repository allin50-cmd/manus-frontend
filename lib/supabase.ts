import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) throw new Error('SUPABASE_URL is not set')
if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')

// Server-side admin client — never expose the service role key to the browser.
export const supabase = createClient(url, key)
