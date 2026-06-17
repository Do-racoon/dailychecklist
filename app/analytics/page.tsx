'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DailyRecord } from '@/types'
import CompletionChart from '@/components/CompletionChart'
import AnalyticsCard, { Recommendation } from '@/components/AnalyticsCard'

// 난이도 레벨 정의
const DIFFICULTY_LEVELS = [
  { level: 1, label: '너무 많아요', emoji: '😵', color: '#e05555', desc: '항목 수를 절반으로 줄여보세요. 지속 가능한 루틴이 우선이에요.' },
  { level: 2, label: '조금 버거워요', emoji: '😓', color: '#f5a623', desc: '가장 잘 못하는 항목 1~2개를 제거하거나 시간을 줄여보세요.' },
  { level: 3, label: '딱 맞아요', emoji: '😊', color: '#3ecfae', desc: '지금 페이스를 유지하세요. 이 리듬이 쌓이면 연간 목표에 닿아요.' },
  { level: 4, label: '잘 하고 있어요', emoji: '💪', color: '#7c6ef7', desc: '항목 1~2개를 더 추가하거나 시간을 늘려볼 타이밍이에요.' },
  { level: 5, label: '마스터 레벨', emoji: '🔥', color: '#e06b9a', desc: '7일 연속 고달성! 루틴을 업그레이드하세요.' },
]

function getDifficultyLevel(avg7: number, streak: number): (typeof DIFFICULTY_LEVELS)[number] {
  if (streak >= 7 && avg7 >= 95) return DIFFICULTY_LEVELS[4]
  if (avg7 >= 85) return DIFFICULTY_LEVELS[3]
  if (avg7 >= 65) return DIFFICULTY_LEVELS[2]
  if (avg7 >= 40) return DIFFICULTY_LEVELS[1]
  return DIFFICULTY_LEVELS[0]
}

function getDayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function buildRecommendations(records: DailyRecord[], avg7: number, streak: number): Recommendation[] {
  if (!records.length) return [{
    type: 'info',
    title: '아직 기록이 없어요',
    body: '체크리스트를 완료하고 "오늘 기록 저장"을 누르면 분석이 시작돼요.',
  }]

  const recs: Recommendation[] = []

  // 미완료 항목 패턴 (최근 7일)
  const recent7 = records.slice(-7)
  const itemMissCount: Record<string, number> = {}
  for (const r of recent7) {
    for (const item of r.incompleteItems ?? []) {
      itemMissCount[item] = (itemMissCount[item] ?? 0) + 1
    }
  }

  const chronic = Object.entries(itemMissCount)
    .filter(([, cnt]) => cnt >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)

  for (const [item, cnt] of chronic) {
    recs.push({
      type: 'warning',
      title: `"${item}" — ${cnt}일 연속 미완료`,
      body: '시간을 절반으로 줄이거나, AI 임포트에서 더 쉬운 버전으로 교체해보세요.',
    })
  }

  // 섹션별 약점
  if (records.length >= 3) {
    const sectionAvgs: Record<string, number[]> = {}
    for (const r of records.slice(-14)) {
      for (const [sec, pct] of Object.entries(r.sectionPcts ?? {})) {
        sectionAvgs[sec] = [...(sectionAvgs[sec] ?? []), pct as number]
      }
    }
    const weakest = Object.entries(sectionAvgs)
      .map(([sec, vals]) => ({ sec, avg: vals.reduce((a, b) => a + b, 0) / vals.length }))
      .sort((a, b) => a.avg - b.avg)[0]

    if (weakest && weakest.avg < 55) {
      recs.push({
        type: 'info',
        title: `"${weakest.sec}" 섹션 평균 ${Math.round(weakest.avg)}% — 가장 취약`,
        body: 'AI 임포트의 연간 목표 탭에서 이 섹션 위주로 루틴을 재구성해보세요.',
      })
    }
  }

  if (avg7 >= 80 && streak >= 5) {
    recs.push({
      type: 'success',
      title: `${streak}일 연속 고달성 중! 🎉`,
      body: '습관이 자리잡히고 있어요. AI 임포트로 다음 레벨 루틴을 만들어볼 타이밍이에요.',
    })
  }

  if (!recs.length) {
    recs.push({
      type: 'info',
      title: '패턴 분석 중',
      body: '3일 이상 꾸준히 기록하면 구체적인 개선 포인트를 보여드려요.',
    })
  }

  return recs
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/records?days=${days}`)
      .then(r => r.json())
      .then((data: Record<string, unknown>[]) => {
        const normalized = data.map(r => ({
          id: r.id as string,
          date: r.date as string,
          totalPct: r.total_pct as number,
          sectionPcts: r.section_pcts as Record<string, number>,
          incompleteItems: (r.incomplete_items as string[]) ?? [],
          savedAt: r.saved_at as string,
        })) as DailyRecord[]
        setRecords(normalized)
      })
      .finally(() => setLoading(false))
  }, [days])

  // 핵심 통계
  const recent7 = records.slice(-7)
  const avg7 = recent7.length ? Math.round(recent7.reduce((s, r) => s + r.totalPct, 0) / recent7.length) : 0
  const avgAll = records.length ? Math.round(records.reduce((s, r) => s + r.totalPct, 0) / records.length) : 0

  const streak = (() => {
    let s = 0
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date))
    for (const r of sorted) {
      if (r.totalPct > 0) s++
      else break
    }
    return s
  })()

  const dayOfYear = getDayOfYear()
  const daysLeft = 365 - dayOfYear
  const difficulty = getDifficultyLevel(avg7, streak)
  const recs = buildRecommendations(records, avg7, streak)

  // 연간 진행률 (기록된 날 / 올해 경과 일수)
  const annualProgress = dayOfYear > 0 ? Math.round((records.length / dayOfYear) * 100) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="text-sm cursor-pointer" style={{ color: 'var(--text3)' }}>← 대시보드</button>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>기록 & 분석</h1>
          </div>
          <div className="text-xs font-mono" style={{ color: 'var(--text3)' }}>
            올해 {dayOfYear}일째 · {daysLeft}일 남음
          </div>
        </div>

        {/* 연간 진행률 카드 */}
        <div
          className="rounded-xl p-5 mb-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text3)' }}>
                1년 중 오늘은
              </div>
              <div className="font-mono text-3xl font-medium tracking-tight" style={{ color: 'var(--text)' }}>
                {dayOfYear}<span className="text-lg ml-1" style={{ color: 'var(--text3)' }}>/ 365</span>
              </div>
            </div>
            <div
              className="text-right px-3 py-1.5 rounded-lg"
              style={{ background: difficulty.color + '18', border: `1px solid ${difficulty.color}44` }}
            >
              <div className="text-lg">{difficulty.emoji}</div>
              <div className="text-[11px] font-medium mt-0.5" style={{ color: difficulty.color }}>{difficulty.label}</div>
            </div>
          </div>

          {/* 연간 진행 바 */}
          <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--border2)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(dayOfYear / 365) * 100}%`, background: 'var(--purple)' }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono mb-4" style={{ color: 'var(--text3)' }}>
            <span>1월 1일</span>
            <span>12월 31일</span>
          </div>

          {/* 기록 출석률 */}
          <div
            className="rounded-lg p-3 flex items-center justify-between"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            <div className="text-[12px]" style={{ color: 'var(--text2)' }}>
              경과 {dayOfYear}일 중 <strong style={{ color: 'var(--text)' }}>{records.length}일</strong> 기록
            </div>
            <div
              className="font-mono text-sm font-medium px-2 py-0.5 rounded"
              style={{
                background: annualProgress >= 70 ? 'var(--teal-dim)' : annualProgress >= 40 ? 'var(--amber-dim)' : 'var(--border)',
                color: annualProgress >= 70 ? 'var(--teal)' : annualProgress >= 40 ? 'var(--amber)' : 'var(--text3)',
              }}
            >
              출석률 {annualProgress}%
            </div>
          </div>
        </div>

        {/* 난이도 추천 */}
        <div
          className="rounded-xl p-4 mb-5 flex gap-3"
          style={{ background: difficulty.color + '12', border: `1px solid ${difficulty.color}33` }}
        >
          <div className="text-2xl">{difficulty.emoji}</div>
          <div>
            <div className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              현재 난이도: <span style={{ color: difficulty.color }}>Lv.{difficulty.level} {difficulty.label}</span>
            </div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>{difficulty.desc}</div>
            {avg7 > 0 && (
              <div className="text-[11px] mt-2 font-mono" style={{ color: 'var(--text3)' }}>
                최근 7일 평균 {avg7}% · 연속 {streak}일
              </div>
            )}
          </div>
        </div>

        {/* 요약 수치 */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: '7일 평균', value: avg7 ? `${avg7}%` : '-' },
            { label: '전체 평균', value: avgAll ? `${avgAll}%` : '-' },
            { label: '연속 기록', value: streak ? `${streak}일` : '-' },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="font-mono text-xl font-medium" style={{ color: 'var(--text)' }}>{stat.value}</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 기간 선택 + 차트 */}
        <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium" style={{ color: 'var(--text2)' }}>달성률 추세</div>
            <div className="flex gap-1.5">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => { setDays(d); setLoading(true) }}
                  className="text-[11px] px-2.5 py-1 rounded cursor-pointer"
                  style={{
                    background: days === d ? 'var(--purple-dim)' : 'transparent',
                    border: `1px solid ${days === d ? 'var(--purple)' : 'var(--border2)'}`,
                    color: days === d ? 'var(--purple)' : 'var(--text3)',
                  }}
                >
                  {d}일
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-xs" style={{ color: 'var(--text3)' }}>로딩 중...</div>
          ) : records.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2">
              <div className="text-2xl">📭</div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>아직 기록이 없어요. 첫 기록을 저장해보세요!</div>
            </div>
          ) : (
            <CompletionChart records={records} days={days} />
          )}
          <div className="flex gap-4 mt-3 text-[10px]" style={{ color: 'var(--text3)' }}>
            <span><span style={{ color: '#7c6ef7' }}>■</span> 85% 이상</span>
            <span><span style={{ color: '#3ecfae' }}>■</span> 65~84%</span>
            <span><span style={{ color: '#f5a623' }}>■</span> 64% 이하</span>
          </div>
        </div>

        {/* 분석 & 추천 */}
        <div className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: 'var(--text3)' }}>분석 & 추천</div>
        <div className="flex flex-col gap-3 mb-8">
          {recs.map((r, i) => <AnalyticsCard key={i} rec={r} />)}
        </div>

        {/* AI 임포트 CTA */}
        <button
          onClick={() => router.push('/import')}
          className="w-full py-3 rounded-xl text-sm font-medium cursor-pointer transition-all"
          style={{ background: 'var(--purple-dim)', border: '1px solid var(--purple)', color: 'var(--purple)' }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--purple-bg)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--purple-dim)'}
        >
          🤖 AI로 루틴 업그레이드하기 →
        </button>

      </div>
    </div>
  )
}
