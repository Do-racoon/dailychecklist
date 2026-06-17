import { CheckCard as CheckCardType } from '@/types'
import CheckItem from './CheckItem'

interface Props {
  card: CheckCardType
  sectionColor: string
  onToggle: (id: string) => void
}

export default function CheckCard({ card, sectionColor, onToggle }: Props) {
  return (
    <div
      className="rounded-[10px] mb-2 overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* 카드 헤더 */}
      <div
        className="px-4 py-[10px] flex items-center gap-2.5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-sm">{card.icon}</span>
        <span className="text-[13px] font-medium flex-1" style={{ color: 'var(--text)' }}>
          {card.title}
        </span>
        {card.timeRange && (
          <span className="font-mono text-[11px]" style={{ color: 'var(--text3)' }}>
            {card.timeRange}
          </span>
        )}
      </div>

      {/* 체크 항목들 */}
      {card.items.map(item => (
        <CheckItem key={item.id} item={item} sectionColor={sectionColor} onToggle={onToggle} />
      ))}
    </div>
  )
}
