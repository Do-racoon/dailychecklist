-- Supabase SQL Editor에서 실행하세요

create table if not exists user_settings (
  user_id         text primary key,
  notion_token_enc text,
  notion_db_id    text,
  sections_json   jsonb,
  updated_at      timestamptz default now()
);

-- RLS (Row Level Security) 비활성화 (서버사이드에서만 접근)
alter table user_settings disable row level security;
