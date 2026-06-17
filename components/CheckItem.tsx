'use client'

import { CheckItem as CheckItemType } from '@/types'

interface Props {
  item: CheckItemType
  sectionColor: string
  onToggle: (id: string) => void
}

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  필수: { bg: 'var(--teal-dim)', color: 'var(--teal)' },
  핵심: { bg: 'var(--purple-dim)', color: 'var(--purple)' },
}

function getTagStyle(tag: string) {
  if (TAG_STYLES[tag]) return TAG_STYLES[tag]
  if (tag.includes('분')) return { bg: 'var(--blue-dim)', color: 'var(--blue)' }
  return { bg: 'var(--amber-dim)', color: 'var(--amber)' }
}

export default function CheckItem({ item, sectionColor, onToggle }: Props) {
  const tagStyle = item.timeTag ? getTagStyle(item.timeTag) : null

  return (
    <div
      onClick={() => onToggle(item.id)}
      className="flex items-start gap-3 px-4 py-[11px] cursor-pointer select-none transition-colors border-b last:border-b-0"
      style={{
        borderColor: 'var(--border)',
        background: 'transparent',
        opacity: item.done ? 0.45 : 1,
      }}
      onMouseOver={e => (e.currentTarget.style.background = 'var(--surface2)')}
      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* 체크박스 */}
      <div
        className="w-4 h-4 shrink-0 mt-[2px] rounded flex items-center justify-center transition-all"
        style={{
          border: item.done ? 'none' : '1.5px solid var(--border2)',
          background: item.done ? 'var(--purple)' : 'transparent',
        }}
      >
        {item.done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* 내용 */}
      <div className="flex-1">
        <div className="text-[13px] leading-snug" style={{ color: item.done ? 'var(--text3)' : 'var(--text)', textDecoration: item.done ? 'line-through' : 'none' }}>
          {item.name}
          {tagStyle && (
            <span
              className="inline-flex items-center text-[10px] font-medium px-[7px] py-[1px] rounded-lg ml-1.5 align-middle"
              style={{ background: tagStyle.bg, color: tagStyle.color }}
            >
              {item.timeTag}
            </span>
          )}
        </div>
        {item.tip && (
          <div className="text-[11px] mt-[2px]" style={{ color: 'var(--text3)' }}>{item.tip}</div>
        )}
      </div>
    </div>
  )
}
