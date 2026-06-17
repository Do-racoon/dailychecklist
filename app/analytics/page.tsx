'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DailyRecord } from '@/types'
import CompletionChart from '@/components/CompletionChart'
import AnalyticsCard, { Recommendation } from '@/components/AnalyticsCard'

function buildRecommendations(records: DailyRecord[]): Recommendation[] {
  if (!records.length) return []
  const recs: Recommendation[] = []

  // 최근 7일 평균
  const recent7 = records.slice(-7)
  const avg7 = recent7.reduce((s, r) => s + r.totalPct, 0) / recent7.length
  const recent30avg = records.reduce((s, r) => s + r.totalPct, 0) / records.length

  if (avg7 >= 80) {
    recs.push({
      type: 'success',
      title: `최근 7일 평균 ${Math.round(avg7)}% — 잘 하고 있어요!`,
      body: '이 페이스라면 연간 목표의 핵심 습관이 자리잡히는 중이에요. 항목을 조금 더 늘려볼 수도 있어요.',
    })
  } else if (avg7 < 50) {
    recs.push({
      type: 'warning',
      title: `최근 7일 평균 ${Math.round(avg7)}% — 난이도를 낮춰보세요`,
      body: '/import 에서 AI에게 "항목 수를 줄이고 각 항목을 15분 이내로 쪼개줘"라고 요청해보세요.',
    })
  }

  // 미완료 항목 패턴 (최근 7일 기록 기반)
  const itemMissCount: Record<string, number> = {}
  for (const r of recent7) {
    for (const item of r.incompleteItems ?? []) {
      itemMissCount[item] = (itemMissCount[item] ?? 0) + 1
    }
  }

  const chronic = Object.entries(itemMissCount)
    .filter(([, cnt]) => cnt >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  for (const [item, cnt] of chronic) {
    recs.push({
      type: 'warning',
      title: `"${item}" — ${cnt}일 연속 미완료`,
      body: '시간을 절반으로 줄이거나, 더 쉬운 버전으로 바꿔보세요. 작은 버전을 완료하는 게 아예 안 하는 것보다 훨씬 낫습니다.',
    })
  }

  // 섹션별 가장 약한 섹션
  if (records.length >= 3) {
    const sectionAvgs: Record<string, number[]> = {}
    for (const r of records) {
      for (const [sec, pct] of Object.entries(r.sectionPcts ?? {})) {
        sectionAvgs[sec] = [...(sectionAvgs[sec] ?? []), pct as number]
      }
    }
    const weakest = Object.entries(sectionAvgs)
      .map(([sec, vals]) => ({ sec, avg: vals.reduce((a, b) => a + b, 0) / vals.length }))
      .sort((a, b) => a.avg - b.avg)[0]

    if (weakest && weakest.avg < 60) {
      recs.push({
        type: 'info',
        title: `"${weakest.sec}" 섹션이 평균 ${Math.round(weakest.avg)}%로 가장 낮아요`,
        body: '이 섹션의 항목들이 현실과 맞지 않을 수 있어요. /import 에서 해당 섹션만 다시 생성해보세요.',
      })
    }
  }

  // 7일 연속 완료 체크
  const last7pcts = recent7.map(r => r.totalPct)
  if (last7pcts.length === 7 && last7pcts.every(p => p === 100)) {
    recs.push({
      type: 'success',
      title: '7일 연속 100% 달성! 🎉',
      body: '이제 새 도전 항목을 추가할 타이밍이에요. /import 에서 난이도를 높인 루틴을 만들어보세요.',
    })
  }

  if (!recs.length) {
    recs.push({
      type: 'info',
      title: '아직 분석할 데이터가 부족해요',
      body: '3일 이상 기록을 저장하면 패턴 분석과 추천이 시작돼요.',
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
      .then(data => {
        // snake_case → camelCase
        const normalized = (data as Record<string, unknown>[]).map(r => ({
          id: r.id,
          userId: r.user_id,
          date: r.date,
          totalPct: r.total_pct,
          sectionPcts: r.section_pcts,
          incompleteItems: r.incomplete_items ?? [],
          memo: r.memo,
          savedAt: r.saved_at,
        })) as DailyRecord[]
        setRecords(normalized)
      })
      .finally(() => setLoading(false))
  }, [days])

  const recs = buildRecommendations(records)
  const avg = records.length ? Math.round(records.reduce((s, r) => s + r.totalPct, 0) / records.length) : 0
  const streak = (() => {
    let s = 0
    for (let i = records.length - 1; i >= 0; i--) {
      if (records[i].totalPct === 100) s++
      else break
    }
    return s
  })()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/dashboard')} className="text-sm cursor-pointer" style={{ color: 'var(--text3)' }}>← 대시보드</button>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>기록 & 분석</h1>
        </div>

        {/* 요약 수치 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: `${days}일 평균`, value: `${avg}%` },
            { label: '기록 일수', value: `${records.length}일` },
            { label: '연속 완료', value: `${streak}일` },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="font-mono text-xl font-medium" style={{ color: 'var(--text)' }}>{stat.value}</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 기간 선택 */}
        <div className="flex gap-2 mb-4">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className="text-xs px-3 py-1.5 rounded-md cursor-pointer transition-all"
              style={{
                background: days === d ? 'var(--purple-dim)' : 'var(--surface)',
                border: `1px solid ${days === d ? 'var(--purple)' : 'var(--border2)'}`,
                color: days === d ? 'var(--purple)' : 'var(--text3)',
              }}
            >
              {d}일
            </button>
          ))}
        </div>

        {/* 차트 */}
        <div className="rounded-lg p-4 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-xs mb-3 font-medium" style={{ color: 'var(--text2)' }}>달성률 추세</div>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-xs" style={{ color: 'var(--text3)' }}>로딩 중...</div>
          ) : (
            <CompletionChart records={records} days={days} />
          )}
          <div className="flex gap-4 mt-3 text-[10px]" style={{ color: 'var(--text3)' }}>
            <span><span style={{ color: '#7c6ef7' }}>■</span> 80% 이상</span>
            <span><span style={{ color: '#3ecfae' }}>■</span> 50~79%</span>
            <span><span style={{ color: '#f5a623' }}>■</span> 50% 미만</span>
          </div>
        </div>

        {/* 추천 카드 */}
        <div className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: 'var(--text3)' }}>분석 & 추천</div>
        {loading ? (
          <div className="text-xs" style={{ color: 'var(--text3)' }}>로딩 중...</div>
        ) : (
          <div className="flex flex-col gap-3">
            {recs.map((r, i) => <AnalyticsCard key={i} rec={r} />)}
          </div>
        )}
      </div>
    </div>
  )
}
