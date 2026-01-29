import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function getServiceClient() {
  if (!supabaseServiceKey) {
    throw new Error('Missing Supabase service role key')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export async function getOwnedChild(childId: string, userId: string) {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('wr_child_profiles')
    .select('id, user_id, is_active')
    .eq('id', childId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data || data.is_active === false) {
    return null
  }

  return data
}
