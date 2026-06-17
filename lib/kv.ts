import { supabase } from './supabase'
import { CheckSection, UserSettings } from '@/types'
import { DEFAULT_SECTIONS } from './defaultChecklist'

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return {
      userId,
      notionToken: '',
      notionDbId: '',
      sections: DEFAULT_SECTIONS,
    }
  }

  return {
    userId,
    notionToken: data.notion_token_enc ?? '',
    notionDbId: data.notion_db_id ?? '',
    sections: (data.sections_json as CheckSection[]) ?? DEFAULT_SECTIONS,
  }
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  await supabase.from('user_settings').upsert({
    user_id: settings.userId,
    notion_token_enc: settings.notionToken,
    notion_db_id: settings.notionDbId,
    sections_json: settings.sections,
    updated_at: new Date().toISOString(),
  })
}
