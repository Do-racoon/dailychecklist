'use client'

import { CheckSection } from '@/types'
import { useEffect, useState } from 'react'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  sections: CheckSection[]
  onReset: () => void
}

function calcPct(section: CheckSection) {
  const items = section.cards.flatMap(c => c.items)
  if (!items.length) return { done: 0, total: 0, pct: 0 }
  const done = items.filter(i => i.done).length
  return { done, total: items.length, pct: Math.round((done / items.length) * 100) }
}

export default function Sidebar({ sections, onReset }: Props) {
  const [dateStr, setDateStr] = useState('')
  const [weekday, setWeekday] = useState('')

  useEffect(() => {
    const d = new Date()
    setDateStr(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`)
    setWeekday(DAYS[d.getDay()] + '요일')
  }, [])

  const allItems = sections.flatMap(s => s.cards.flatMap(c => c.items))
  const total = allItems.length
  const done = allItems.filter(i => i.done).length
  const pct = total ? Math.round((done / total) * 100) : 0

  const circ = 2 * Math.PI * 32
  const offset = circ - (circ * pct) / 100

  const encourageMsgs = ['오늘도 화이팅!', '잘 하고 있어요 👍', '절반 왔어요!', '거의 다 왔어요!', '오늘 완벽해요! 🎉']
  const encourageIdx = Math.min(4, Math.floor(pct / 25))

  return (
    <aside
      className="w-[260px] shrink-0 sticky top-0 h-screen overflow-y-auto flex flex-col gap-6 px-5 py-7 border-r"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* 날짜 */}
      <div>
        <div className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--text3)' }}>오늘</div>
        <div className="font-mono text-[22px] font-medium tracking-tight" style={{ color: 'var(--text)' }}>{dateStr}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{weekday}</div>
      </div>

      {/* 링 게이지 */}
      <div
        className="flex flex-col items-center gap-2.5 p-4 rounded-[10px] border"
        style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
      >
        <div className="relative w-20 h-20">
          <svg width="80" height="80" viewBox="0 0 80 80" className="absolute inset-0">
            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
            <circle
              cx="40" cy="40" r="32" fill="none"
              stroke="#7c6ef7" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-[18px] font-medium" style={{ color: 'var(--text)' }}>{pct}%</div>
            <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{done} / {total}</div>
          </div>
        </div>
        <div className="text-xs text-center" style={{ color: 'var(--text2)' }}>{encourageMsgs[encourageIdx]}</div>
      </div>

      {/* 섹션별 진행률 */}
      <div>
        <div className="text-[11px] font-semibold tracking-widest uppercase mb-2.5" style={{ color: 'var(--text3)' }}>섹션별</div>
        <div className="flex flex-col gap-2.5">
          {sections.map(section => {
            const { done: sd, total: st, pct: sp } = calcPct(section)
            return (
              <div key={section.id}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text2)' }}>
                    <span style={{ color: section.color }}>●</span>
                    {section.name}
                  </div>
                  <div className="font-mono text-[11px]" style={{ color: 'var(--text3)' }}>{sd}/{st}</div>
                </div>
                <div className="h-[3px] rounded-sm overflow-hidden" style={{ background: 'var(--border2)' }}>
                  <div
                    className="h-full rounded-sm transition-all duration-300"
                    style={{ width: `${sp}%`, background: section.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 자동 리셋 안내 */}
      <div>
        <div className="text-[11px] font-semibold tracking-widest uppercase mb-2 flex items-center gap-2" style={{ color: 'var(--text3)' }}>
          자동 리셋
          <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--teal-dim)', color: 'var(--teal)' }}>
            <span className="w-[5px] h-[5px] rounded-full animate-pulse-dot" style={{ background: 'var(--teal)' }} />
            매일 자정
          </span>
        </div>
        <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text3)' }}>
          자정이 되면 체크가 초기화돼요.<br />기록은 Notion에 저장하세요.
        </div>
      </div>

      {/* 리셋 버튼 */}
      <button
        onClick={onReset}
        className="mt-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-xs transition-all cursor-pointer"
        style={{ border: '1px solid var(--border2)', color: 'var(--text2)', background: 'none' }}
        onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
        onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text2)' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        지금 리셋
      </button>
    </aside>
  )
}
