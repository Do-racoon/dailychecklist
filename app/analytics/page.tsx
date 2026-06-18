'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DailyRecord } from '@/types'
import CompletionChart from '@/components/CompletionChart'
import AnalyticsCard, { Recommendation } from '@/components/AnalyticsCard'

const DIFFICULTY_LEVELS = [
  { level: 1, label: '너무 많아요',   emoji: '😵', color: '#e05555', action: '항목을 절반으로 줄이거나, AI 임포트로 루틴을 다시 만들어보세요.' },
  { level: 2, label: '조금 버거워요', emoji: '😓', color: '#f5a623', action: '자주 못하는 항목 1~2개를 삭제하거나 시간을 줄여보세요.' },
  { level: 3, label: '딱 맞아요',     emoji: '😊', color: '#3ecfae', action: '지금 이 리듬을 유지하세요. 쌓이면 연간 목표에 닿아요.' },
  { level: 4, label: '여유 있어요',   emoji: '💪', color: '#7c6ef7', action: '항목을 1~2개 더 추가하거나 시간을 늘려볼 타이밍이에요.' },
  { level: 5, label: '마스터!',       emoji: '🔥', color: '#e06b9a', action: 'AI 임포트로 다음 단계 루틴을 만들어보세요.' },
]

function getDifficulty(avg7: number, streak: number) {
  if (streak >= 7 && avg7 >= 95) return DIFFICULTY_LEVELS[4]
  if (avg7 >= 85) return DIFFICULTY_LEVELS[3]
  if (avg7 >= 65) return DIFFICULTY_LEVELS[2]
  if (avg7 >= 40) return DIFFICULTY_LEVELS[1]
  return DIFFICULTY_LEVELS[0]
}

function getDayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86400000)
}

function buildRecs(records: DailyRecord[], avg7: number): Recommendation[] {
  if (!records.length) return [{ type: 'info', title: '아직 기록이 없어요', body: '"오늘 기록 저장"을 누르면 분석이 시작돼요.' }]

  const recs: Recommendation[] = []
  const recent7 = records.slice(-7)
  const missCount: Record<string, number> = {}
  for (const r of recent7)
    for (const item of r.incompleteItems ?? [])
      missCount[item] = (missCount[item] ?? 0) + 1

  for (const [item, cnt] of Object.entries(missCount).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 2))
    recs.push({ type: 'warning', title: `"${item}" ${cnt}일 연속 미완료`, body: '시간을 절반으로 줄이거나 AI 임포트에서 더 쉬운 버전으로 바꿔보세요.' })

  if (records.length >= 3) {
    const secAvgs: Record<string, number[]> = {}
    for (const r of records.slice(-14))
      for (const [k, v] of Object.entries(r.sectionPcts ?? {}))
        secAvgs[k] = [...(secAvgs[k] ?? []), v as number]

    const weakest = Object.entries(secAvgs)
      .map(([k, v]) => ({ k, avg: v.reduce((a, b) => a + b, 0) / v.length }))
      .sort((a, b) => a.avg - b.avg)[0]

    if (weakest && weakest.avg < 55)
      recs.push({ type: 'info', title: `"${weakest.k}" 섹션이 평균 ${Math.round(weakest.avg)}%로 가장 낮아요`, body: 'AI 임포트 → 연간 목표 탭에서 이 섹션을 집중 보강해보세요.' })
  }

  if (!recs.length && avg7 >= 80)
    recs.push({ type: 'success', title: '잘 하고 있어요!', body: '특별히 개선할 항목이 없어요. 이 페이스를 유지하세요.' })

  return recs
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/records?days=${days}`)
      .then(r => r.json())
      .then((data: Record<string, unknown>[]) =>
        setRecords(data.map(r => ({
          id: r.id as string,
          date: r.date as string,
          totalPct: r.total_pct as number,
          sectionPcts: r.section_pcts as Record<string, number>,
          incompleteItems: (r.incomplete_items as string[]) ?? [],
          savedAt: r.saved_at as string,
        })))
      )
      .finally(() => setLoading(false))
  }, [days])

  const dayOfYear = getDayOfYear()
  const daysLeft = 365 - dayOfYear
  const recent7 = records.slice(-7)
  const avg7 = recent7.length ? Math.round(recent7.reduce((s, r) => s + r.totalPct, 0) / recent7.length) : 0
  const avgAll = records.length ? Math.round(records.reduce((s, r) => s + r.totalPct, 0) / records.length) : 0
  const streak = (() => {
    let s = 0
    for (const r of [...records].sort((a, b) => b.date.localeCompare(a.date))) {
      if (r.totalPct > 0) s++; else break
    }
    return s
  })()
  const difficulty = getDifficulty(avg7, streak)
  const attendPct = dayOfYear > 0 ? Math.round((records.length / dayOfYear) * 100) : 0
  const recs = buildRecs(records, avg7)

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl mx-auto px-5 py-8">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg cursor-pointer transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
          >
            ← 대시보드
          </button>
          <div className="font-mono text-xs" style={{ color: 'var(--text3)' }}>
            올해 {dayOfYear}일째 · {daysLeft}일 남음
          </div>
        </div>

        {/* ① 지금 나는 어디쯤? — 핵심 카드 */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: 'var(--surface)', border: `2px solid ${difficulty.color}44` }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
            지금 나는 어디쯤?
          </div>

          {/* 1년 타임라인 */}
          <div className="relative mb-1">
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border2)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${(dayOfYear / 365) * 100}%`, background: `linear-gradient(90deg, var(--purple), ${difficulty.color})` }}
              />
            </div>
            {/* 현재 위치 마커 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px]"
              style={{
                left: `calc(${(dayOfYear / 365) * 100}% - 8px)`,
                background: difficulty.color,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono mt-1 mb-4" style={{ color: 'var(--text3)' }}>
            <span>1/1</span><span>4/1</span><span>7/1</span><span>10/1</span><span>12/31</span>
          </div>

          {/* 핵심 3가지 숫자 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
              <div className="font-mono text-2xl font-bold" style={{ color: difficulty.color }}>{dayOfYear}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>경과일</div>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
              <div className="font-mono text-2xl font-bold" style={{ color: 'var(--teal)' }}>{records.length}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>기록한 날</div>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
              <div className="font-mono text-2xl font-bold" style={{ color: attendPct >= 70 ? 'var(--teal)' : attendPct >= 40 ? 'var(--amber)' : 'var(--red)' }}>
                {attendPct}%
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>출석률</div>
            </div>
          </div>

          {/* 출석률 설명 */}
          <div className="text-xs text-center" style={{ color: 'var(--text3)' }}>
            {dayOfYear}일 중 {records.length}일 기록 —{' '}
            {attendPct >= 80 ? '아주 꾸준해요 🎉' : attendPct >= 50 ? '절반 이상 해냈어요' : '조금 더 꾸준히 해봐요'}
          </div>
        </div>

        {/* ② 현재 난이도 */}
        <div
          className="rounded-2xl p-5 mb-4 flex gap-4 items-start"
          style={{ background: difficulty.color + '14', border: `1px solid ${difficulty.color}33` }}
        >
          <div className="text-4xl">{difficulty.emoji}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>현재 난이도</div>
              <div
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: difficulty.color + '22', color: difficulty.color }}
              >
                Lv.{difficulty.level}
              </div>
            </div>
            <div className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>{difficulty.label}</div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>{difficulty.action}</div>

            {/* 난이도 바 */}
            <div className="flex gap-1 mt-3">
              {DIFFICULTY_LEVELS.map(l => (
                <div
                  key={l.level}
                  className="flex-1 h-1.5 rounded-full"
                  style={{ background: l.level <= difficulty.level ? difficulty.color : 'var(--border2)' }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] mt-1" style={{ color: 'var(--text3)' }}>
              <span>너무 많음</span><span>마스터</span>
            </div>

            {avg7 > 0 && (
              <div className="text-[11px] mt-2 font-mono" style={{ color: 'var(--text3)' }}>
                7일 평균 {avg7}% · 연속 {streak}일
              </div>
            )}
          </div>
        </div>

        {/* ③ 달성률 차트 */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>달성률 추세</div>
            <div className="flex gap-1.5">
              {[7, 30, 90].map(d => (
                <button key={d} onClick={() => setDays(d)}
                  className="text-[11px] px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: days === d ? 'var(--purple-dim)' : 'transparent',
                    border: `1px solid ${days === d ? 'var(--purple)' : 'var(--border2)'}`,
                    color: days === d ? 'var(--purple)' : 'var(--text3)',
                  }}
                >{d}일</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-36 flex items-center justify-center text-xs" style={{ color: 'var(--text3)' }}>로딩 중...</div>
          ) : records.length === 0 ? (
            <div className="h-36 flex flex-col items-center justify-center gap-2">
              <div className="text-3xl">📭</div>
              <div className="text-xs" style={{ color: 'var(--text3)' }}>첫 기록을 저장하면 차트가 나타나요</div>
            </div>
          ) : (
            <CompletionChart records={records} days={days} />
          )}

          {/* 범례 + 평균 */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-3 text-[10px]" style={{ color: 'var(--text3)' }}>
              <span><span style={{ color: '#7c6ef7' }}>■</span> 85%+</span>
              <span><span style={{ color: '#3ecfae' }}>■</span> 65~84%</span>
              <span><span style={{ color: '#f5a623' }}>■</span> ~64%</span>
            </div>
            {avgAll > 0 && (
              <div className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>
                전체 평균 <span style={{ color: 'var(--text)' }}>{avgAll}%</span>
              </div>
            )}
          </div>
        </div>

        {/* ④ 개선 포인트 */}
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>개선 포인트</div>
        <div className="flex flex-col gap-3 mb-6">
          {recs.map((r, i) => <AnalyticsCard key={i} rec={r} />)}
        </div>

        {/* AI 임포트 CTA */}
        <button
          onClick={() => router.push('/import')}
          className="w-full py-3.5 rounded-xl text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-2"
          style={{ background: 'var(--purple)', color: '#fff', border: 'none' }}
          onMouseOver={e => e.currentTarget.style.background = '#6a5ee0'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--purple)'}
        >
          🤖 AI로 루틴 업그레이드하기
        </button>

      </div>
    </div>
  )
}
