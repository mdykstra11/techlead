import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import TopBar from '@/components/TopBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col min-h-screen-safe bg-gray-50">
      <TopBar profile={profile} />
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      <BottomNav role={profile?.role ?? 'technician'} />
    </div>
  )
}
