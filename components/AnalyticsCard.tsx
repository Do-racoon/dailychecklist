interface Recommendation {
  type: 'warning' | 'success' | 'info'
  title: string
  body: string
}

interface Props {
  rec: Recommendation
}

const STYLES = {
  warning: { border: 'var(--amber)', bg: 'var(--amber-dim)', icon: '⚠️' },
  success: { border: 'var(--teal)', bg: 'var(--teal-dim)', icon: '✅' },
  info:    { border: 'var(--blue)', bg: 'var(--blue-dim)',  icon: '💡' },
}

export default function AnalyticsCard({ rec }: Props) {
  const s = STYLES[rec.type]
  return (
    <div
      className="rounded-lg p-4 flex gap-3"
      style={{ background: s.bg, border: `1px solid ${s.border}33` }}
    >
      <div className="text-base mt-0.5">{s.icon}</div>
      <div>
        <div className="text-[13px] font-medium mb-1" style={{ color: 'var(--text)' }}>{rec.title}</div>
        <div className="text-[12px] leading-relaxed" style={{ color: 'var(--text2)' }}>{rec.body}</div>
      </div>
    </div>
  )
}

export type { Recommendation }
