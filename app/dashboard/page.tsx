'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckSection } from '@/types'
import { DEFAULT_SECTIONS } from '@/lib/defaultChecklist'
import TimeScrub from '@/components/TimeScrub'
import CheckCard from '@/components/CheckCard'
import BottomNav from '@/components/BottomNav'

const STORAGE_KEY = 'daily_checklist_v2'
const DATE_KEY = 'daily_checklist_date'
const ONBOARDED_KEY = 'daily_checklist_onboarded'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function deepClone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) }

function calcStats(sections: CheckSection[]) {
  const all = sections.flatMap(s => s.cards.flatMap(c => c.items))
  const done = all.filter(i => i.done).length
  const total = all.length
  const totalPct = total ? Math.round((done / total) * 100) : 0
  const sectionPcts: Record<string, number> = {}
  for (const s of sections) {
    const items = s.cards.flatMap(c => c.items)
    sectionPcts[s.name] = items.length ? Math.round(items.filter(i => i.done).length / items.length * 100) : 0
  }
  return { totalPct, sectionPcts, done, total, incompleteItems: all.filter(i => !i.done).map(i => i.name) }
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sections, setSections] = useState<CheckSection[]>(() => deepClone(DEFAULT_SECTIONS))
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [dateStr, setDateStr] = useState('')
  const sectionsRef = useRef(sections)

  useEffect(() => {
    const d = new Date()
    setDateStr(`${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return
    if (!localStorage.getItem(ONBOARDED_KEY)) router.push('/import?onboarding=1')
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
    const midnight = new Date(now); midnight.setHours(24, 0, 0, 0)
    const t = setTimeout(async () => {
      await doSave(sectionsRef.current, true)
      doReset(true)
    }, midnight.getTime() - now.getTime())
    return () => clearTimeout(t)
  }, [])

  const saveLocal = useCallback((s: CheckSection[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    localStorage.setItem(DATE_KEY, todayKey())
  }, [])

  async function doSave(cur: CheckSection[], auto = false) {
    if (!session?.user) return
    const stats = calcStats(cur)
    setSaving(true)
    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayKey(), totalPct: stats.totalPct, sectionPcts: stats.sectionPcts, incompleteItems: stats.incompleteItems }),
      })
      if (!auto) {
        showToast(`✅ 저장 완료! 달성률 ${stats.totalPct}%`)
        setTimeout(() => doReset(true), 1500)
      }
    } catch {
      if (!auto) showToast('저장 실패. 다시 시도해주세요.')
    } finally { setSaving(false) }
  }

  function doReset(silent = false) {
    const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as CheckSection[] | null
    const fresh = cur
      ? cur.map(s => ({ ...s, cards: s.cards.map(c => ({ ...c, items: c.items.map(i => ({ ...i, done: false })) })) }))
      : deepClone(DEFAULT_SECTIONS)
    setSections(fresh)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    localStorage.setItem(DATE_KEY, todayKey())
    if (!silent) showToast('초기화됐어요.')
    else showToast('🌅 새로운 하루! 초기화됐어요.')
  }

  const handleToggle = useCallback((id: string) => {
    setSections(prev => {
      const next = deepClone(prev)
      for (const s of next) for (const c of s.cards) {
        const item = c.items.find(i => i.id === id)
        if (item) { item.done = !item.done; break }
      }
      saveLocal(next)
      return next
    })
  }, [saveLocal])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const { totalPct, done, total } = calcStats(sections)
  const circ = 2 * Math.PI * 20
  const offset = circ - (circ * totalPct) / 100

  return (
    <div className="flex flex-col w-full min-h-screen" style={{ paddingBottom: 'calc(var(--nav-h) + var(--bar-h))' }}>

      {/* ── 상단 헤더 ── */}
      <header
        className="sticky top-0 z-30 w-full"
        style={{ background: 'rgba(15,15,17,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* 날짜 */}
          <div>
            <div className="text-xs" style={{ color: 'var(--text3)' }}>{session?.user?.name}</div>
            <div className="text-base font-semibold" style={{ color: 'var(--text)', fontFamily: 'Noto Sans KR, sans-serif' }}>{dateStr}</div>
          </div>

          {/* 링 게이지 + % */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono text-xl font-bold" style={{ color: 'var(--purple)' }}>{totalPct}%</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{done} / {total}</div>
            </div>
            <div className="relative w-12 h-12">
              <svg width="48" height="48" viewBox="0 0 48 48" className="absolute inset-0">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5"/>
                <circle cx="24" cy="24" r="20" fill="none" stroke="var(--purple)" strokeWidth="3.5"
                  strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                  transform="rotate(-90 24 24)" style={{ transition: 'stroke-dashoffset 0.4s ease' }}/>
              </svg>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="text-xs px-2.5 py-1.5 rounded-lg cursor-pointer" style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text3)' }}>
              로그아웃
            </button>
          </div>
        </div>

        {/* 섹션별 미니 진행률 바 */}
        <div className="flex px-4 pb-2 gap-2">
          {sections.map(s => {
            const items = s.cards.flatMap(c => c.items)
            const pct = items.length ? Math.round(items.filter(i => i.done).length / items.length * 100) : 0
            return (
              <div key={s.id} className="flex-1">
                <div className="text-[9px] mb-0.5 flex justify-between" style={{ color: 'var(--text3)' }}>
                  <span>{s.name}</span><span>{pct}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border2)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </header>

      {/* ── 메인 콘텐츠 ── */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4">
        <TimeScrub />

        {sections.map(section => (
          <div key={section.id}>
            <div className="flex items-center gap-2 mt-6 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: section.color }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>{section.name}</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>
            {section.cards.map(card => (
              <CheckCard key={card.id} card={card} sectionColor={section.color} onToggle={handleToggle} />
            ))}
          </div>
        ))}
      </main>

      {/* ── 저장 바 (바텀 탭 위에 고정) ── */}
      <div
        className="fixed left-0 right-0 z-40 flex items-center gap-3 px-4"
        style={{
          bottom: 'var(--nav-h)',
          height: 'var(--bar-h)',
          background: 'rgba(15,15,17,0.97)',
          borderTop: '1px solid var(--border2)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* 리셋 버튼 */}
        <button
          onClick={() => { if (confirm('체크를 초기화할까요?')) doReset() }}
          className="flex items-center justify-center w-12 h-12 rounded-xl cursor-pointer transition-all shrink-0"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text3)' }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
          </svg>
        </button>

        {/* 저장 버튼 */}
        <button
          onClick={() => doSave(sections)}
          disabled={saving}
          className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl text-base font-bold cursor-pointer disabled:opacity-50 transition-all"
          style={{ background: 'var(--purple)', border: 'none', color: '#fff' }}
          onMouseOver={e => !saving && (e.currentTarget.style.background = '#6a5ee0')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--purple)')}
        >
          {saving ? '저장 중...' : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              오늘 기록 저장
            </>
          )}
        </button>
      </div>

      <BottomNav />

      {/* 토스트 */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap"
          style={{ bottom: 'calc(var(--nav-h) + var(--bar-h) + 12px)', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
