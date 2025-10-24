-- AI Note System Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- Enable pgvector extension for vector embeddings
create extension if not exists vector;

-- Create profiles table (extended user info)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notes table
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null default '',
  is_shared boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create note_embeddings table for vectorized chunks
create table if not exists public.note_embeddings (
  id uuid default gen_random_uuid() primary key,
  note_id uuid references public.notes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  chunk_text text not null,
  embedding vector(1024),  -- Doubao embedding dimension
  chunk_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists notes_created_at_idx on public.notes(created_at desc);
create index if not exists note_embeddings_note_id_idx on public.note_embeddings(note_id);
create index if not exists note_embeddings_user_id_idx on public.note_embeddings(user_id);

-- Create vector similarity search index using HNSW (Hierarchical Navigable Small World)
create index if not exists note_embeddings_embedding_idx on public.note_embeddings 
  using hnsw (embedding vector_cosine_ops);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.note_embeddings enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- RLS Policies for notes
create policy "Users can view their own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- RLS Policies for note_embeddings
create policy "Users can view their own embeddings"
  on public.note_embeddings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own embeddings"
  on public.note_embeddings for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own embeddings"
  on public.note_embeddings for delete
  using (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger handle_notes_updated_at
  before update on public.notes
  for each row
  execute function public.handle_updated_at();

