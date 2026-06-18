'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckSection } from '@/types'
import { DEFAULT_SECTIONS } from '@/lib/defaultChecklist'
import Sidebar from '@/components/Sidebar'
import TimeScrub from '@/components/TimeScrub'
import CheckCard from '@/components/CheckCard'

const STORAGE_KEY = 'daily_checklist_v2'
const DATE_KEY = 'daily_checklist_date'
const ONBOARDED_KEY = 'daily_checklist_onboarded'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function calcStats(sections: CheckSection[]) {
  const allItems = sections.flatMap(s => s.cards.flatMap(c => c.items))
  const total = allItems.length
  const done = allItems.filter(i => i.done).length
  const totalPct = total ? Math.round((done / total) * 100) : 0
  const sectionPcts: Record<string, number> = {}
  for (const s of sections) {
    const items = s.cards.flatMap(c => c.items)
    sectionPcts[s.name] = items.length
      ? Math.round(items.filter(i => i.done).length / items.length * 100)
      : 0
  }
  const incompleteItems = allItems.filter(i => !i.done).map(i => i.name)
  return { totalPct, sectionPcts, incompleteItems }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sections, setSections] = useState<CheckSection[]>(() => deepClone(DEFAULT_SECTIONS))
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const sectionsRef = useRef(sections)

  useEffect(() => {
    if (status !== 'authenticated') return
    if (!localStorage.getItem(ONBOARDED_KEY)) {
      router.push('/import?onboarding=1')
    }
  }, [status, router])

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

  useEffect(() => { sectionsRef.current = sections }, [sections])

  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const t = setTimeout(async () => {
      await saveToCloud(sectionsRef.current, true)
      resetChecklist(true)
    }, midnight.getTime() - now.getTime())
    return () => clearTimeout(t)
  }, [])

  const saveLocal = useCallback((s: CheckSection[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    localStorage.setItem(DATE_KEY, todayKey())
  }, [])

  async function saveToCloud(cur: CheckSection[], auto = false) {
    if (!session?.user) return
    const stats = calcStats(cur)
    setSaving(true)
    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayKey(), ...stats }),
      })
      if (!auto) {
        showToast(`✅ 저장 완료! 오늘 달성률 ${stats.totalPct}%`)
        setTimeout(() => resetChecklist(true), 1500)
      }
    } catch {
      if (!auto) showToast('저장 실패. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  function resetChecklist(auto = false) {
    const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as CheckSection[] | null
    const fresh = cur
      ? cur.map(s => ({ ...s, cards: s.cards.map(c => ({ ...c, items: c.items.map(i => ({ ...i, done: false })) })) }))
      : deepClone(DEFAULT_SECTIONS)
    setSections(fresh)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    localStorage.setItem(DATE_KEY, todayKey())
    if (auto) showToast('🌅 새로운 하루! 체크리스트가 초기화됐어요.')
  }

  const handleToggle = useCallback((itemId: string) => {
    setSections(prev => {
      const next = deepClone(prev)
      for (const s of next) for (const c of s.cards) {
        const item = c.items.find(i => i.id === itemId)
        if (item) { item.done = !item.done; break }
      }
      saveLocal(next)
      return next
    })
  }, [saveLocal])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const { totalPct, incompleteItems } = calcStats(sections)
  const allItems = sections.flatMap(s => s.cards.flatMap(c => c.items))
  const doneCount = allItems.filter(i => i.done).length

  return (
    <div className="flex min-h-screen" style={{ paddingBottom: 80 }}>
      <Sidebar sections={sections} onReset={() => { if (confirm('체크를 모두 초기화할까요?')) { resetChecklist(false); showToast('초기화됐어요.') } }} />

      <main className="flex-1 px-8 py-6 max-w-3xl">

        {/* 상단 네비게이션 */}
        <div className="flex justify-between items-center mb-5">
          <div className="text-sm" style={{ color: 'var(--text2)' }}>
            {session?.user?.name}님의 오늘
          </div>
          <div className="flex items-center gap-2">
            {/* AI 임포트 */}
            <button
              onClick={() => router.push('/import')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all"
              style={{ background: 'var(--purple-dim)', border: '1px solid var(--purple)', color: 'var(--purple)' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--purple-bg)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--purple-dim)'}
            >
              <span>🤖</span> AI 임포트
            </button>
            {/* 기록 */}
            <button
              onClick={() => router.push('/analytics')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text2)' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text2)' }}
            >
              <span>📊</span> 기록
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-3 py-2 rounded-lg text-sm cursor-pointer"
              style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text3)' }}
            >
              로그아웃
            </button>
          </div>
        </div>

        <TimeScrub />

        {sections.map(section => (
          <div key={section.id}>
            <div className="flex items-center gap-2.5 mt-7 mb-3">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: section.color }} />
              <div className="text-xs font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--text3)' }}>
                {section.name}
              </div>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>
            {section.cards.map(card => (
              <CheckCard key={card.id} card={card} sectionColor={section.color} onToggle={handleToggle} />
            ))}
          </div>
        ))}

        {/* 하단 여백 (fixed bar 높이만큼) */}
        <div className="h-6" />
      </main>

      {/* ── 항상 보이는 저장 바 (fixed bottom) ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3"
        style={{
          background: 'rgba(15,15,17,0.92)',
          borderTop: '1px solid var(--border2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* 진행률 텍스트 */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-xl font-medium" style={{ color: 'var(--purple)' }}>
            {totalPct}%
          </div>
          <div className="text-xs" style={{ color: 'var(--text3)' }}>
            {doneCount} / {allItems.length} 완료
            {incompleteItems.length > 0 && (
              <span className="ml-2" style={{ color: 'var(--text3)' }}>
                · 미완료 {incompleteItems.length}개
              </span>
            )}
          </div>
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={() => saveToCloud(sections, false)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-50 transition-all"
          style={{ background: 'var(--purple)', border: 'none', color: '#fff', minWidth: 140 }}
          onMouseOver={e => !saving && (e.currentTarget.style.background = '#6a5ee0')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--purple)')}
        >
          {saving ? (
            <span>저장 중...</span>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              오늘 기록 저장
            </>
          )}
        </button>
      </div>

      {/* 토스트 */}
      {toast && (
        <div
          className="fixed bottom-20 right-6 px-4 py-2.5 rounded-lg text-sm z-50"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
