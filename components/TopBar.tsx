'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Profile } from '@/types'

interface Props {
  profile: Profile | null
}

export default function TopBar({ profile }: Props) {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10 safe-top">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌿</span>
        <span className="font-bold text-lg">FieldPro</span>
      </div>
      <div className="flex items-center gap-3">
        {profile && (
          <span className="text-sm text-brand-100 hidden xs:block">
            {profile.name || profile.email}
          </span>
        )}
        <button
          onClick={signOut}
          className="text-brand-100 hover:text-white text-sm px-3 py-1.5 rounded-lg
                     border border-brand-500 hover:border-brand-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
