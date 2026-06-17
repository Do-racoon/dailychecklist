'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { CheckSection } from '@/types'
import { DEFAULT_SECTIONS } from '@/lib/defaultChecklist'
import Sidebar from '@/components/Sidebar'
import TimeScrub from '@/components/TimeScrub'
import CheckCard from '@/components/CheckCard'

const STORAGE_KEY = 'daily_checklist_v2'
const DATE_KEY = 'daily_checklist_date'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [sections, setSections] = useState<CheckSection[]>(() => deepClone(DEFAULT_SECTIONS))
  const [toast, setToast] = useState('')

  // 로컬스토리지 로드 + 자정 리셋
  useEffect(() => {
    const savedDate = localStorage.getItem(DATE_KEY)
    const today = todayKey()
    if (savedDate === today) {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (saved) setSections(saved)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(DATE_KEY, today)
    }
  }, [])

  // 자정 리셋 타이머
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const ms = midnight.getTime() - now.getTime()
    const t = setTimeout(() => {
      handleReset(true)
    }, ms)
    return () => clearTimeout(t)
  }, [])

  const save = useCallback((newSections: CheckSection[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSections))
    localStorage.setItem(DATE_KEY, todayKey())
  }, [])

  const handleToggle = useCallback((itemId: string) => {
    setSections(prev => {
      const next = deepClone(prev)
      for (const section of next) {
        for (const card of section.cards) {
          const item = card.items.find(i => i.id === itemId)
          if (item) { item.done = !item.done; break }
        }
      }
      save(next)
      return next
    })
  }, [save])

  const handleReset = useCallback((auto = false) => {
    if (!auto && !confirm('체크를 모두 초기화할까요?')) return
    const fresh = deepClone(DEFAULT_SECTIONS)
    setSections(fresh)
    localStorage.removeItem(STORAGE_KEY)
    showToast(auto ? '🌅 새로운 하루! 체크리스트가 초기화됐어요.' : '초기화됐어요.')
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sections={sections} onReset={() => handleReset(false)} />

      <main className="flex-1 px-10 py-8 max-w-3xl">
        {/* 상단 유저 정보 */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm" style={{ color: 'var(--text2)' }}>
            안녕하세요, <span style={{ color: 'var(--text)' }}>{session?.user?.name}</span>님
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-xs px-3 py-1.5 rounded-md transition-all cursor-pointer"
            style={{ border: '1px solid var(--border2)', color: 'var(--text3)', background: 'none' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--text2)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text3)'}
          >
            로그아웃
          </button>
        </div>

        <TimeScrub />

        {/* 섹션별 체크리스트 */}
        {sections.map(section => (
          <div key={section.id}>
            {/* 섹션 헤더 */}
            <div className="flex items-center gap-2.5 mt-7 mb-3">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: section.color }} />
              <div className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--text3)' }}>
                {section.name}
              </div>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            {section.cards.map(card => (
              <CheckCard
                key={card.id}
                card={card}
                sectionColor={section.color}
                onToggle={handleToggle}
              />
            ))}
          </div>
        ))}

        {/* 하단 버튼 */}
        <div className="flex gap-2.5 mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-[13px] font-medium transition-all cursor-pointer"
            style={{ background: 'var(--purple)', border: 'none', color: '#fff' }}
            onMouseOver={e => e.currentTarget.style.background = '#6a5ee0'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--purple)'}
            onClick={() => showToast('Notion 연동은 /setup 에서 설정하세요.')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Notion에 저장
          </button>
        </div>
      </main>

      {/* 토스트 */}
      {toast && (
        <div
          className="fixed bottom-7 right-7 px-4 py-2.5 rounded-md text-[13px] z-50"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
