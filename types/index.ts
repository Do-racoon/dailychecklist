export interface CheckItem {
  id: string
  name: string
  timeTag?: string
  tip?: string
  done: boolean
}

export interface CheckCard {
  id: string
  title: string
  timeRange?: string
  icon?: string
  items: CheckItem[]
}

export interface CheckSection {
  id: string
  name: string
  color: string
  cards: CheckCard[]
}

export interface UserSettings {
  userId: string
  notionToken: string
  notionDbId: string
  sections: CheckSection[]
}

export interface DailyRecord {
  date: string
  totalPct: number
  sectionPcts: Record<string, number>
  incompleteItems: string[]
  memo?: string
}
