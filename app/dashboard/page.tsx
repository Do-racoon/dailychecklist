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

  // 첫 로그인 온보딩 체크
  useEffect(() => {
    if (status !== 'authenticated') return
    const onboarded = localStorage.getItem(ONBOARDED_KEY)
    if (!onboarded) {
      router.push('/import?onboarding=1')
    }
  }, [status, router])

  // 로컬스토리지 로드
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

  // sectionsRef 동기화 (자정 타이머에서 최신값 접근)
  useEffect(() => {
    sectionsRef.current = sections
  }, [sections])

  // 자정 자동 저장 + 리셋
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const ms = midnight.getTime() - now.getTime()
    const t = setTimeout(async () => {
      await saveToCloud(sectionsRef.current, true)
      resetChecklist(true)
    }, ms)
    return () => clearTimeout(t)
  }, [])

  const saveLocal = useCallback((newSections: CheckSection[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSections))
    localStorage.setItem(DATE_KEY, todayKey())
  }, [])

  async function saveToCloud(currentSections: CheckSection[], auto = false) {
    if (!session?.user) return
    const { totalPct, sectionPcts, incompleteItems } = calcStats(currentSections)
    setSaving(true)
    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayKey(), totalPct, sectionPcts, incompleteItems }),
      })
      if (!auto) {
        showToast(`✅ 저장 완료! 오늘 달성률 ${totalPct}%`)
        // 저장 후 리셋
        setTimeout(() => resetChecklist(true), 1500)
      }
    } catch {
      if (!auto) showToast('저장 실패. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  function resetChecklist(auto = false) {
    const fresh = deepClone(DEFAULT_SECTIONS)
    // 커스텀 섹션이 있으면 유지 (done만 초기화)
    const customSections = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as CheckSection[] | null
    const resetSections = customSections
      ? customSections.map(s => ({ ...s, cards: s.cards.map(c => ({ ...c, items: c.items.map(i => ({ ...i, done: false })) })) }))
      : fresh
    setSections(resetSections)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetSections))
    localStorage.setItem(DATE_KEY, todayKey())
    if (auto) showToast('🌅 새로운 하루! 체크리스트가 초기화됐어요.')
  }

  const handleToggle = useCallback((itemId: string) => {
    setSections(prev => {
      const next = deepClone(prev)
      for (const section of next) {
        for (const card of section.cards) {
          const item = card.items.find(i => i.id === itemId)
          if (item) { item.done = !item.done; break }
        }
      }
      saveLocal(next)
      return next
    })
  }, [saveLocal])

  function handleManualReset() {
    if (!confirm('체크를 모두 초기화할까요?')) return
    resetChecklist(false)
    showToast('초기화됐어요.')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sections={sections} onReset={handleManualReset} />

      <main className="flex-1 px-10 py-8 max-w-3xl">
        {/* 상단 */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm" style={{ color: 'var(--text2)' }}>
            안녕하세요, <span style={{ color: 'var(--text)' }}>{session?.user?.name}</span>님
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/import')}
              className="text-xs px-3 py-1.5 rounded-md cursor-pointer transition-all"
              style={{ border: '1px solid var(--border2)', color: 'var(--text3)', background: 'none' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--purple)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text3)'}
            >
              🤖 AI 임포트
            </button>
            <button
              onClick={() => router.push('/analytics')}
              className="text-xs px-3 py-1.5 rounded-md cursor-pointer transition-all"
              style={{ border: '1px solid var(--border2)', color: 'var(--text3)', background: 'none' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--teal)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text3)'}
            >
              📊 기록
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-xs px-3 py-1.5 rounded-md cursor-pointer"
              style={{ border: '1px solid var(--border2)', color: 'var(--text3)', background: 'none' }}
            >
              로그아웃
            </button>
          </div>
        </div>

        <TimeScrub />

        {sections.map(section => (
          <div key={section.id}>
            <div className="flex items-center gap-2.5 mt-7 mb-3">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: section.color }} />
              <div className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--text3)' }}>
                {section.name}
              </div>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>
            {section.cards.map(card => (
              <CheckCard key={card.id} card={card} sectionColor={section.color} onToggle={handleToggle} />
            ))}
          </div>
        ))}

        <div className="flex gap-2.5 mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => saveToCloud(sections, false)}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-[13px] font-medium cursor-pointer disabled:opacity-50 transition-all"
            style={{ background: 'var(--purple)', border: 'none', color: '#fff' }}
            onMouseOver={e => !saving && (e.currentTarget.style.background = '#6a5ee0')}
            onMouseOut={e => (e.currentTarget.style.background = 'var(--purple)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            {saving ? '저장 중...' : '오늘 기록 저장'}
          </button>
          <div className="text-[11px] flex items-center" style={{ color: 'var(--text3)' }}>
            저장하면 체크가 초기화돼요
          </div>
        </div>
      </main>

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
