import { CheckSection, CheckCard, CheckItem } from '@/types'

const SECTION_MAP: Record<string, { id: string; color: string }> = {
  '출근길':     { id: 'commute_morning', color: '#4fa3e0' },
  '퇴근길':     { id: 'commute_evening', color: '#4fa3e0' },
  '퇴근 후':    { id: 'after',           color: '#3ecfae' },
  '마무리 루틴': { id: 'wind_down',       color: '#7c6ef7' },
  '집안일':     { id: 'house',           color: '#f5a623' },
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function parseTimeTag(text: string): { name: string; timeTag?: string; tip?: string } {
  const tipMatch = text.match(/\|(.+)$/)
  const tip = tipMatch ? tipMatch[1].trim() : undefined
  const nameWithTag = tipMatch ? text.slice(0, tipMatch.index).trim() : text.trim()

  const tagMatch = nameWithTag.match(/\[([^\]]+)\]$/)
  const timeTag = tagMatch ? tagMatch[1].trim() : undefined
  const name = tagMatch ? nameWithTag.slice(0, tagMatch.index).trim() : nameWithTag

  return { name, timeTag, tip }
}

function parseCardHeader(line: string): { title: string; timeRange?: string; icon?: string } {
  const timeMatch = line.match(/\((\d{2}:\d{2}[-–]\d{2}:\d{2})\)/)
  const timeRange = timeMatch ? timeMatch[1].replace('–', ' – ') : undefined

  const emojiMatch = line.match(/(\p{Emoji})/u)
  const icon = emojiMatch ? emojiMatch[1] : undefined

  let title = line
    .replace(/\(.*?\)/, '')
    .replace(/\p{Emoji}/gu, '')
    .trim()

  return { title, timeRange, icon }
}

export function parseMarkdownToSections(md: string): CheckSection[] {
  const lines = md.split('\n')
  const sections: CheckSection[] = []
  let currentSection: CheckSection | null = null
  let currentCard: CheckCard | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith('## ')) {
      const name = line.slice(3).trim()
      const meta = SECTION_MAP[name]
      if (!meta) continue

      currentSection = {
        id: meta.id,
        name,
        color: meta.color,
        cards: [],
      }
      sections.push(currentSection)
      currentCard = null
      continue
    }

    if (line.startsWith('### ') && currentSection) {
      const { title, timeRange, icon } = parseCardHeader(line.slice(4))
      currentCard = { id: uid(), title, timeRange, icon, items: [] }
      currentSection.cards.push(currentCard)
      continue
    }

    if (line.startsWith('- [ ]') && currentSection) {
      if (!currentCard) {
        currentCard = { id: uid(), title: currentSection.name, items: [] }
        currentSection.cards.push(currentCard)
      }
      const rawItem = line.slice(5).trim()
      const { name, timeTag, tip } = parseTimeTag(rawItem)
      const item: CheckItem = { id: uid(), name, timeTag, tip, done: false }
      currentCard.items.push(item)
      continue
    }

    if (line.startsWith('- [x]') && currentSection) {
      if (!currentCard) {
        currentCard = { id: uid(), title: currentSection.name, items: [] }
        currentSection.cards.push(currentCard)
      }
      const rawItem = line.slice(5).trim()
      const { name, timeTag, tip } = parseTimeTag(rawItem)
      currentCard.items.push({ id: uid(), name, timeTag, tip, done: true })
    }
  }

  return sections.filter(s => s.cards.some(c => c.items.length > 0))
}
