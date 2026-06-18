'use client'

import { useRouter, usePathname } from 'next/navigation'

const TABS = [
  {
    path: '/dashboard',
    label: '체크리스트',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    path: '/import',
    label: 'AI 임포트',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10"/>
        <path d="M12 8v4l3 3"/>
        <path d="M18 2v6h6"/>
      </svg>
    ),
  },
  {
    path: '/analytics',
    label: '기록',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        height: 'var(--nav-h)',
        background: 'rgba(15,15,17,0.96)',
        borderTop: '1px solid var(--border2)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {TABS.map(tab => {
        const active = pathname.startsWith(tab.path)
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
            style={{
              background: 'none',
              border: 'none',
              color: active ? 'var(--purple)' : 'var(--text3)',
            }}
          >
            {tab.icon(active)}
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: '0.02em' }}>
              {tab.label}
            </span>
            {active && (
              <div
                className="absolute top-0"
                style={{ width: 32, height: 2, background: 'var(--purple)', borderRadius: '0 0 2px 2px' }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
