'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckSection } from '@/types'
import { parseMarkdownToSections } from '@/lib/parseMarkdown'
import { CHECKLIST_PROMPT, ANNUAL_GOAL_PROMPT } from '@/lib/promptTemplate'
import CheckCard from '@/components/CheckCard'
import BottomNav from '@/components/BottomNav'

const STORAGE_KEY = 'daily_checklist_v2'
const DATE_KEY = 'daily_checklist_date'
const ONBOARDED_KEY = 'daily_checklist_onboarded'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function ImportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === '1'

  const [tab, setTab] = useState<'paste' | 'prompt' | 'annual'>(isOnboarding ? 'prompt' : 'paste')
  const [markdown, setMarkdown] = useState('')
  const [annualGoal, setAnnualGoal] = useState('')
  const [preview, setPreview] = useState<CheckSection[] | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<'prompt' | 'paste' | 'preview'>(isOnboarding ? 'prompt' : 'paste')

  function handleParse() {
    setError('')
    const sections = parseMarkdownToSections(markdown)
    if (!sections.length) {
      setError('파싱된 섹션이 없어요. 마크다운 형식을 확인해주세요.')
      return
    }
    setPreview(sections)
    setStep('preview')
  }

  function handleApply() {
    if (!preview) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preview))
    localStorage.setItem(DATE_KEY, todayKey())
    localStorage.setItem(ONBOARDED_KEY, '1')
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
    <div className="min-h-screen w-full" style={{ background: 'var(--bg)', paddingBottom: isOnboarding ? 24 : 'calc(var(--nav-h) + 24px)' }}>

      {/* 상단 헤더 */}
      {!isOnboarding && (
        <header className="sticky top-0 z-30 flex items-center px-4 py-4"
          style={{ background: 'rgba(15,15,17,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>
          <div className="text-base font-semibold" style={{ color: 'var(--text)' }}>🤖 AI 임포트</div>
        </header>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* 헤더 */}
        {isOnboarding ? (
          <div className="mb-8">
            <div className="text-2xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
              👋 환영해요!
            </div>
            <div className="text-sm leading-7" style={{ color: 'var(--text2)' }}>
              딱 3단계로 오늘 루틴을 만들어요.<br />
              <span style={{ color: 'var(--purple)' }}>①</span> 아래 프롬프트 복사 →{' '}
              <span style={{ color: 'var(--purple)' }}>②</span> ChatGPT/Claude에 붙여넣기 →{' '}
              <span style={{ color: 'var(--purple)' }}>③</span> 결과를 여기에 붙여넣기
            </div>
            {/* 스텝 인디케이터 */}
            <div className="flex items-center gap-2 mt-4">
              {(['prompt', 'paste', 'preview'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium"
                    style={{
                      background: step === s ? 'var(--purple)' : step > s ? 'var(--purple-dim)' : 'var(--surface2)',
                      color: step === s ? '#fff' : step > s ? 'var(--purple)' : 'var(--text3)',
                      border: `1px solid ${step >= s ? 'var(--purple)' : 'var(--border2)'}`,
                    }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-[11px]" style={{ color: step === s ? 'var(--text)' : 'var(--text3)' }}>
                    {s === 'prompt' ? '프롬프트 복사' : s === 'paste' ? '결과 붙여넣기' : '확인 & 적용'}
                  </span>
                  {i < 2 && <span style={{ color: 'var(--text3)' }}>›</span>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => router.push('/dashboard')} className="text-sm cursor-pointer" style={{ color: 'var(--text3)' }}>← 대시보드</button>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>AI 체크리스트 임포트</h1>
          </div>
        )}

        {/* 온보딩: 스텝1 - 프롬프트 */}
        {isOnboarding && step === 'prompt' && (
          <div className="flex flex-col gap-4">
            <div
              className="text-xs leading-relaxed p-3 rounded-lg"
              style={{ background: 'var(--purple-bg)', border: '1px solid var(--purple-dim)', color: 'var(--text2)' }}
            >
              💡 <strong style={{ color: 'var(--text)' }}>프롬프트 안에 [목표/관심사]만 바꿔서</strong> ChatGPT나 Claude에 붙여넣으면 돼요.
            </div>
            <pre
              className="text-xs leading-relaxed p-4 rounded-lg overflow-auto whitespace-pre-wrap"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
            >
              {CHECKLIST_PROMPT}
            </pre>
            <button
              onClick={() => { copyPrompt(CHECKLIST_PROMPT); }}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all"
              style={{ background: copied ? 'var(--teal)' : 'var(--purple)', color: '#fff', border: 'none' }}
            >
              {copied ? '✓ 복사됐어요!' : '📋 프롬프트 복사하기'}
            </button>
            <button
              onClick={() => setStep('paste')}
              className="text-sm cursor-pointer py-2"
              style={{ color: 'var(--text3)', background: 'none', border: 'none' }}
            >
              AI 응답을 받았어요 → 다음 단계 ›
            </button>
          </div>
        )}

        {/* 온보딩: 스텝2 - 붙여넣기 / 일반 탭 */}
        {(!isOnboarding || step === 'paste') && step !== 'preview' && (
          <div className="flex flex-col gap-4">
            {!isOnboarding && (
              <div className="flex gap-1 mb-2 p-1 rounded-lg" style={{ background: 'var(--surface)' }}>
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
            )}

            {(tab === 'paste' || isOnboarding) && (
              <>
                {isOnboarding && (
                  <div className="text-sm" style={{ color: 'var(--text2)' }}>
                    AI가 만들어준 마크다운을 아래에 붙여넣으세요.
                  </div>
                )}
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
                  미리보기 →
                </button>
                {isOnboarding && (
                  <button onClick={() => setStep('prompt')} className="text-xs cursor-pointer" style={{ color: 'var(--text3)', background: 'none', border: 'none' }}>
                    ← 프롬프트 다시 복사
                  </button>
                )}
              </>
            )}

            {tab === 'prompt' && !isOnboarding && (
              <>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
                  아래 프롬프트를 복사해서 ChatGPT나 Claude에 붙여넣으세요.
                </div>
                <pre className="text-xs leading-relaxed p-4 rounded-lg overflow-auto whitespace-pre-wrap"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
                  {CHECKLIST_PROMPT}
                </pre>
                <button
                  onClick={() => copyPrompt(CHECKLIST_PROMPT)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer"
                  style={{ background: copied ? 'var(--teal)' : 'var(--purple)', color: '#fff', border: 'none' }}
                >
                  {copied ? '✓ 복사됐어요!' : '📋 프롬프트 복사'}
                </button>
              </>
            )}

            {tab === 'annual' && !isOnboarding && (
              <>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
                  올해 이루고 싶은 목표를 입력하면 AI에 던질 프롬프트를 만들어드려요.
                </div>
                <textarea
                  value={annualGoal}
                  onChange={e => setAnnualGoal(e.target.value)}
                  placeholder="예: 영어 회화 중급 달성, 소설 1편 완성, 체중 10kg 감량"
                  rows={4}
                  className="w-full rounded-lg p-4 text-sm resize-none outline-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text)', lineHeight: 1.8 }}
                />
                {annualGoal.trim() && (
                  <>
                    <pre className="text-xs leading-relaxed p-4 rounded-lg overflow-auto whitespace-pre-wrap"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
                      {ANNUAL_GOAL_PROMPT(annualGoal, today)}
                    </pre>
                    <button
                      onClick={() => copyPrompt(ANNUAL_GOAL_PROMPT(annualGoal, today))}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer"
                      style={{ background: copied ? 'var(--teal)' : 'var(--amber)', color: '#fff', border: 'none' }}
                    >
                      {copied ? '✓ 복사됐어요!' : '🎯 프롬프트 복사'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* 미리보기 */}
        {preview && step === 'preview' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                ✓ {preview.length}개 섹션 · {preview.flatMap(s => s.cards.flatMap(c => c.items)).length}개 항목
              </div>
              <button onClick={() => { setPreview(null); setStep('paste') }} className="text-xs cursor-pointer" style={{ color: 'var(--text3)' }}>
                ← 다시 수정
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
                className="flex-1 py-3 rounded-lg text-sm font-medium cursor-pointer"
                style={{ background: 'var(--purple)', color: '#fff', border: 'none' }}
              >
                {isOnboarding ? '✓ 시작하기!' : '✓ 오늘 체크리스트로 적용'}
              </button>
              <button
                onClick={() => { setPreview(null); setStep('paste') }}
                className="px-5 py-3 rounded-lg text-sm cursor-pointer"
                style={{ background: 'none', border: '1px solid var(--border2)', color: 'var(--text2)' }}
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {!isOnboarding && <BottomNav />}
    </div>
  )
}

export default function ImportPage() {
  return (
    <Suspense>
      <ImportContent />
    </Suspense>
  )
}
