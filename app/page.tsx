'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard')
  }, [status, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center max-w-md px-6">
        <div className="mb-3 text-4xl">✅</div>
        <h1
          className="text-3xl font-semibold mb-3 tracking-tight"
          style={{ color: 'var(--text)', fontFamily: 'Noto Sans KR, sans-serif' }}
        >
          데일리 체크리스트
        </h1>
        <p className="mb-10 text-sm leading-7" style={{ color: 'var(--text2)' }}>
          매일 자기 관리 루틴을 체크하고<br />
          Notion에 자동으로 기록하세요.
        </p>

        <button
          onClick={() => signIn('google')}
          disabled={status === 'loading'}
          className="flex items-center gap-3 mx-auto px-6 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border2)',
            color: 'var(--text)',
          }}
          onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--purple)')}
          onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 시작하기
        </button>

        <p className="mt-8 text-xs" style={{ color: 'var(--text3)' }}>
          로그인 후 Notion 연동 한 번이면 매일 자동 기록
        </p>
      </div>
    </div>
  )
}
