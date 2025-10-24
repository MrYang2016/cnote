-- AI Note System Phase 2 - Chat Database Schema
-- Execute this SQL in your Supabase SQL Editor (after Phase 1 schema)

-- Create chat_messages table for storing conversation history
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for efficient message retrieval
create index if not exists chat_messages_user_id_created_at_idx 
  on public.chat_messages(user_id, created_at desc);

-- Enable RLS for chat_messages
alter table public.chat_messages enable row level security;

-- RLS Policies for chat_messages
create policy "Users can view their own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own chat messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- Create RPC function for vector similarity search
create or replace function search_notes(
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  user_id uuid
)
returns table (
  note_id uuid,
  chunk_text text,
  similarity float,
  note_title text,
  note_content text
)
language plpgsql
as $$
begin
  return query
  select
    ne.note_id,
    ne.chunk_text,
    1 - (ne.embedding <=> query_embedding) as similarity,
    n.title as note_title,
    n.content as note_content
  from note_embeddings ne
  join notes n on n.id = ne.note_id
  where ne.user_id = search_notes.user_id
    and 1 - (ne.embedding <=> query_embedding) > match_threshold
  order by ne.embedding <=> query_embedding
  limit match_count;
end;
$$;

