'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckSection } from '@/types'
import { parseMarkdownToSections } from '@/lib/parseMarkdown'
import { CHECKLIST_PROMPT, ANNUAL_GOAL_PROMPT } from '@/lib/promptTemplate'
import CheckCard from '@/components/CheckCard'

const STORAGE_KEY = 'daily_checklist_v2'
const DATE_KEY = 'daily_checklist_date'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ImportPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'paste' | 'prompt' | 'annual'>('paste')
  const [markdown, setMarkdown] = useState('')
  const [annualGoal, setAnnualGoal] = useState('')
  const [preview, setPreview] = useState<CheckSection[] | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  function handleParse() {
    setError('')
    const sections = parseMarkdownToSections(markdown)
    if (!sections.length) {
      setError('파싱된 섹션이 없어요. 마크다운 형식을 확인해주세요.')
      return
    }
    setPreview(sections)
  }

  function handleApply() {
    if (!preview) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preview))
    localStorage.setItem(DATE_KEY, todayKey())
    router.push('/dashboard')
  }

  function copyPrompt(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push('/dashboard')} className="text-sm cursor-pointer" style={{ color: 'var(--text3)' }}>← 대시보드</button>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>AI 체크리스트 임포트</h1>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: 'var(--surface)' }}>
          {([
            { key: 'paste', label: '📋 붙여넣기' },
            { key: 'prompt', label: '🤖 프롬프트 복사' },
            { key: 'annual', label: '🎯 연간 목표' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 text-xs py-2 rounded-md transition-all cursor-pointer"
              style={{
                background: tab === t.key ? 'var(--surface2)' : 'transparent',
                color: tab === t.key ? 'var(--text)' : 'var(--text3)',
                border: tab === t.key ? '1px solid var(--border2)' : '1px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 붙여넣기 탭 */}
        {tab === 'paste' && (
          <div className="flex flex-col gap-4">
            <div className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
              ChatGPT 또는 Claude에서 받은 마크다운을 아래에 붙여넣으세요.
            </div>
            <textarea
              value={markdown}
              onChange={e => { setMarkdown(e.target.value); setPreview(null); setError('') }}
              placeholder={`## 출근길\n### 영어 공부 (07:30-09:00) 📚\n- [ ] 듀오링고 10분 [10분]\n- [ ] 팟캐스트 청취 [30분] | 지하철에서\n\n## 퇴근 후\n### 홈트 (19:30-20:00) 🏃\n- [ ] 홈트 20분 [핵심]`}
              rows={12}
              className="w-full rounded-lg p-4 text-sm font-mono resize-none outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border2)',
                color: 'var(--text)',
                lineHeight: 1.8,
              }}
            />
            {error && <div className="text-xs" style={{ color: 'var(--red)' }}>{error}</div>}
            <button
              onClick={handleParse}
              disabled={!markdown.trim()}
              className="px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-40 transition-all"
              style={{ background: 'var(--purple)', color: '#fff', border: 'none' }}
            >
              미리보기
            </button>
          </div>
        )}

        {/* 프롬프트 복사 탭 */}
        {tab === 'prompt' && (
          <div className="flex flex-col gap-4">
            <div className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
              아래 프롬프트를 복사해서 ChatGPT나 Claude에 붙여넣으세요.<br />
              <strong style={{ color: 'var(--text)' }}>[목표 / 관심사] 부분만</strong> 바꿔서 사용하면 돼요.
            </div>
            <pre
              className="text-xs leading-relaxed p-4 rounded-lg overflow-auto whitespace-pre-wrap"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
            >
              {CHECKLIST_PROMPT}
            </pre>
            <button
              onClick={() => copyPrompt(CHECKLIST_PROMPT)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
              style={{ background: copied ? 'var(--teal)' : 'var(--purple)', color: '#fff', border: 'none' }}
            >
              {copied ? '✓ 복사됐어요!' : '📋 프롬프트 복사'}
            </button>
            <div className="text-xs text-center" style={{ color: 'var(--text3)' }}>
              AI 응답을 받으면 &ldquo;붙여넣기&rdquo; 탭에서 적용하세요.
            </div>
          </div>
        )}

        {/* 연간 목표 탭 */}
        {tab === 'annual' && (
          <div className="flex flex-col gap-4">
            <div className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
              올해 이루고 싶은 목표를 입력하면, AI에 던질 프롬프트를 생성해드려요.
            </div>
            <textarea
              value={annualGoal}
              onChange={e => setAnnualGoal(e.target.value)}
              placeholder="예: 영어 회화 중급 달성, 소설 1편 완성, 체중 10kg 감량, 개발 사이드 프로젝트 론칭"
              rows={4}
              className="w-full rounded-lg p-4 text-sm resize-none outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border2)',
                color: 'var(--text)',
                lineHeight: 1.8,
              }}
            />
            {annualGoal.trim() && (
              <>
                <pre
                  className="text-xs leading-relaxed p-4 rounded-lg overflow-auto whitespace-pre-wrap"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
                >
                  {ANNUAL_GOAL_PROMPT(annualGoal, today)}
                </pre>
                <button
                  onClick={() => copyPrompt(ANNUAL_GOAL_PROMPT(annualGoal, today))}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
                  style={{ background: copied ? 'var(--teal)' : 'var(--amber)', color: '#fff', border: 'none' }}
                >
                  {copied ? '✓ 복사됐어요!' : '🎯 프롬프트 복사'}
                </button>
              </>
            )}
          </div>
        )}

        {/* 미리보기 */}
        {preview && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                미리보기 — {preview.length}개 섹션, {preview.flatMap(s => s.cards.flatMap(c => c.items)).length}개 항목
              </div>
              <button
                onClick={() => setPreview(null)}
                className="text-xs cursor-pointer"
                style={{ color: 'var(--text3)' }}
              >
                닫기
              </button>
            </div>

            {preview.map(section => (
              <div key={section.id} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: section.color }} />
                  <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
                    {section.name}
                  </div>
                </div>
                {section.cards.map(card => (
                  <CheckCard key={card.id} card={card} sectionColor={section.color} onToggle={() => {}} />
                ))}
              </div>
            ))}

            <div className="flex gap-3 mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={handleApply}
                className="flex-1 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all"
                style={{ background: 'var(--purple)', color: '#fff', border: 'none' }}
              >
                ✓ 오늘 체크리스트로 적용
              </button>
              <button
                onClick={() => setPreview(null)}
                className="px-5 py-3 rounded-lg text-sm cursor-pointer"
                style={{ background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)' }}
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
