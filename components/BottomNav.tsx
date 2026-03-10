'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  role: UserRole
}

export default function BottomNav({ role }: Props) {
  const pathname = usePathname()

  const technicianLinks = [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/opportunities/new', label: 'New', icon: PlusIcon },
    { href: '/opportunities', label: 'My Work', icon: ListIcon },
  ]

  const officeLinks = [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/office', label: 'Pipeline', icon: ChartIcon },
    { href: '/opportunities', label: 'My Work', icon: ListIcon },
  ]

  const links = role === 'office' ? officeLinks : technicianLinks

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-10">
      <div className="flex items-stretch">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          const isNew = link.href === '/opportunities/new'

          if (isNew) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
              >
                <div className="bg-brand-600 text-white rounded-2xl p-3 -mt-5 shadow-lg">
                  <link.icon className="w-6 h-6" />
                </div>
                <span className="text-xs text-brand-600 font-semibold mt-1">{link.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors',
                isActive ? 'text-brand-600' : 'text-gray-400'
              )}
            >
              <link.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
