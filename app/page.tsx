import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  // Demo mode : pas de Supabase, on va directement sur /home
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') redirect('/home')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  redirect('/home')
}
