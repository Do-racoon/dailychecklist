'use client'

import { useEffect, useState } from 'react'

const BLOCKS = [
  { id: 'sleep',  label: '수면',      start: 0,    end: 390,  color: '#888894' },
  { id: 'comm1',  label: '출근길',    start: 390,  end: 540,  color: '#4fa3e0' },
  { id: 'work',   label: '업무',      start: 540,  end: 1080, color: '#3ecfae' },
  { id: 'comm2',  label: '퇴근길',    start: 1080, end: 1140, color: '#4fa3e0' },
  { id: 'dinner', label: '저녁/홈트', start: 1140, end: 1230, color: '#f5a623' },
  { id: 'create', label: '창작',      start: 1230, end: 1320, color: '#7c6ef7' },
  { id: 'wind',   label: '마무리',    start: 1320, end: 1440, color: '#888894' },
]

function minsToStr(m: number) {
  const h = Math.floor(m / 60) % 24
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function getBlock(m: number) {
  return BLOCKS.find(b => m >= b.start && m < b.end) ?? BLOCKS[BLOCKS.length - 1]
}

function nowMins() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export default function TimeScrub() {
  const [mins, setMins] = useState(() => Math.max(390, Math.min(1439, nowMins())))

  useEffect(() => {
    const id = setInterval(() => {
      setMins(Math.max(390, Math.min(1439, nowMins())))
    }, 60000)
    return () => clearInterval(id)
  }, [])

  const block = getBlock(mins)

  return (
    <div
      className="rounded-[10px] p-[18px_20px] mb-7"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* 시각 + 배지 */}
      <div className="flex justify-between items-start mb-3.5">
        <div>
          <div className="font-mono text-[32px] font-medium leading-none tracking-tight" style={{ color: 'var(--text)' }}>
            {minsToStr(mins)}
          </div>
          <div className="text-xs mt-1.5" style={{ color: 'var(--text2)' }}>{block.label}</div>
        </div>
        <div
          className="text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ background: block.color + '22', color: block.color, border: `1px solid ${block.color}55` }}
        >
          {block.label}
        </div>
      </div>

      {/* 슬라이더 */}
      <input
        type="range"
        min={390}
        max={1440}
        step={5}
        value={mins}
        onChange={e => setMins(parseInt(e.target.value))}
      />
      <div className="flex justify-between font-mono text-[10px] mt-1.5" style={{ color: 'var(--text3)' }}>
        {['06:30','09:00','12:00','15:00','18:00','21:00','24:00'].map(t => (
          <span key={t}>{t}</span>
        ))}
      </div>

      {/* 블록 태그 */}
      <div className="flex gap-1.5 flex-wrap mt-3">
        {BLOCKS.map(b => {
          const active = b.id === block.id
          return (
            <button
              key={b.id}
              onClick={() => setMins(b.start === 0 ? 390 : b.start)}
              className="text-[11px] px-2.5 py-1 rounded-full transition-all cursor-pointer"
              style={{
                border: `1px solid ${active ? b.color : 'var(--border2)'}`,
                background: active ? b.color + '22' : 'transparent',
                color: active ? b.color : 'var(--text3)',
              }}
            >
              {b.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
