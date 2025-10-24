-- =====================================================
-- AI Note System - Complete Database Schema
-- =====================================================
-- 合并了所有阶段的SQL脚本，包括：
-- 1. Phase 1: 基础笔记系统
-- 2. Phase 2: 聊天功能
-- 3. Phase 3: 好友系统和笔记共享
-- 4. 修复脚本：profiles RLS 和重复好友问题
-- =====================================================

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 1. 基础表结构 (Phase 1)
-- =====================================================

-- Create profiles table (extended user info)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  display_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  is_shared boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create note_embeddings table for vectorized chunks
CREATE TABLE IF NOT EXISTS public.note_embeddings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id uuid REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  chunk_text text NOT NULL,
  embedding vector(1024),  -- Doubao embedding dimension
  chunk_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 2. 聊天功能表 (Phase 2)
-- =====================================================

-- Create chat_messages table for storing conversation history
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 3. 好友系统和笔记共享表 (Phase 3)
-- =====================================================

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- 确保不会重复添加相同的好友关系
  UNIQUE(user_id, friend_id),
  
  -- 确保不能添加自己为好友
  CHECK (user_id != friend_id)
);

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- 确保不会重复发送好友请求
  UNIQUE(from_user_id, to_user_id),
  
  -- 确保不能给自己发送好友请求
  CHECK (from_user_id != to_user_id)
);

-- Create note_shares table
CREATE TABLE IF NOT EXISTS note_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_with_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission text NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'write')),
  created_at timestamptz DEFAULT now(),
  
  -- 确保不会重复共享给同一个用户
  UNIQUE(note_id, shared_with_user_id),
  
  -- 确保不能共享给自己
  CHECK (owner_id != shared_with_user_id)
);

-- =====================================================
-- 4. 索引创建
-- =====================================================

-- Basic indexes for performance
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON public.notes(created_at DESC);
CREATE INDEX IF NOT EXISTS note_embeddings_note_id_idx ON public.note_embeddings(note_id);
CREATE INDEX IF NOT EXISTS note_embeddings_user_id_idx ON public.note_embeddings(user_id);

-- Chat messages index
CREATE INDEX IF NOT EXISTS chat_messages_user_id_created_at_idx 
  ON public.chat_messages(user_id, created_at DESC);

-- Friends and friend requests indexes
CREATE INDEX IF NOT EXISTS friends_user_id_idx ON friends(user_id);
CREATE INDEX IF NOT EXISTS friends_friend_id_idx ON friends(friend_id);
CREATE INDEX IF NOT EXISTS friend_requests_from_user_id_idx ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS friend_requests_to_user_id_idx ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS friend_requests_status_idx ON friend_requests(status);

-- Note shares indexes
CREATE INDEX IF NOT EXISTS note_shares_note_id_idx ON note_shares(note_id);
CREATE INDEX IF NOT EXISTS note_shares_owner_id_idx ON note_shares(owner_id);
CREATE INDEX IF NOT EXISTS note_shares_shared_with_user_id_idx ON note_shares(shared_with_user_id);

-- Vector similarity search index using HNSW
CREATE INDEX IF NOT EXISTS note_embeddings_embedding_idx ON public.note_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- =====================================================
-- 5. Row Level Security (RLS) 策略
-- =====================================================

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

-- ========== profiles 表 RLS 策略 ==========
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 修复：允许用户搜索其他用户的基本信息（用于好友搜索）
CREATE POLICY "Users can search other profiles for friend requests"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ========== notes 表 RLS 策略 ==========
-- 用户可以查看自己的笔记 + 共享给自己的笔记
CREATE POLICY "Users can view own and shared notes"
  ON notes FOR SELECT
  USING (
    auth.uid() = user_id OR
    id IN (
      SELECT note_id FROM note_shares 
      WHERE shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的笔记 + 有写权限的共享笔记
CREATE POLICY "Users can update own notes and shared with write permission"
  ON notes FOR UPDATE
  USING (
    auth.uid() = user_id OR
    id IN (
      SELECT note_id FROM note_shares 
      WHERE shared_with_user_id = auth.uid() 
        AND permission = 'write'
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    id IN (
      SELECT note_id FROM note_shares 
      WHERE shared_with_user_id = auth.uid() 
        AND permission = 'write'
    )
  );

CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- ========== note_embeddings 表 RLS 策略 ==========
-- 用户可以查看自己的嵌入 + 共享笔记的嵌入
CREATE POLICY "Users can view own and shared note embeddings"
  ON note_embeddings FOR SELECT
  USING (
    auth.uid() = user_id OR
    note_id IN (
      SELECT note_id FROM note_shares 
      WHERE shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own embeddings"
  ON public.note_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own embeddings"
  ON public.note_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- ========== chat_messages 表 RLS 策略 ==========
CREATE POLICY "Users can view their own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- ========== friends 表 RLS 策略 ==========
-- 用户可以查看自己的好友关系（作为发起方或被添加方）
CREATE POLICY "Users can view their own friendships"
  ON friends FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  );

-- 用户可以删除自己的好友关系
CREATE POLICY "Users can delete their own friendships"
  ON friends FOR DELETE
  USING (
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  );

-- 只有在接受好友请求时才能插入好友关系（通过函数处理）
CREATE POLICY "Friendships can only be created through accept function"
  ON friends FOR INSERT
  WITH CHECK (false);

-- ========== friend_requests 表 RLS 策略 ==========
-- 用户可以查看发送给自己或自己发送的好友请求
CREATE POLICY "Users can view their friend requests"
  ON friend_requests FOR SELECT
  USING (
    auth.uid() = from_user_id OR 
    auth.uid() = to_user_id
  );

-- 用户可以发送好友请求
CREATE POLICY "Users can send friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- 用户可以更新收到的好友请求（接受/拒绝）
CREATE POLICY "Users can update received friend requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- 用户可以删除自己发送的待处理请求
CREATE POLICY "Users can delete their pending requests"
  ON friend_requests FOR DELETE
  USING (
    auth.uid() = from_user_id AND 
    status = 'pending'
  );

-- ========== note_shares 表 RLS 策略 ==========
-- 用户可以查看自己分享出去的或分享给自己的笔记
CREATE POLICY "Users can view their note shares"
  ON note_shares FOR SELECT
  USING (
    auth.uid() = owner_id OR 
    auth.uid() = shared_with_user_id
  );

-- 用户可以分享自己的笔记
CREATE POLICY "Users can share their own notes"
  ON note_shares FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND
    -- 确保只能分享给好友
    EXISTS (
      SELECT 1 FROM friends 
      WHERE (user_id = auth.uid() AND friend_id = shared_with_user_id)
         OR (friend_id = auth.uid() AND user_id = shared_with_user_id)
    )
  );

-- 用户可以取消分享自己的笔记
CREATE POLICY "Users can unshare their own notes"
  ON note_shares FOR DELETE
  USING (auth.uid() = owner_id);

-- 用户可以更新分享权限
CREATE POLICY "Users can update their note share permissions"
  ON note_shares FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =====================================================
-- 6. 辅助函数
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at for friend_requests
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Accept friend request
CREATE OR REPLACE FUNCTION accept_friend_request(request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from_user_id uuid;
  v_to_user_id uuid;
  v_request_status text;
BEGIN
  -- 获取请求详情
  SELECT from_user_id, to_user_id, status 
  INTO v_from_user_id, v_to_user_id, v_request_status
  FROM friend_requests 
  WHERE id = request_id;
  
  -- 验证请求存在
  IF v_from_user_id IS NULL THEN
    RAISE EXCEPTION 'Friend request not found';
  END IF;
  
  -- 验证是接收方
  IF v_to_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the recipient can accept the request';
  END IF;
  
  -- 验证请求状态
  IF v_request_status != 'pending' THEN
    RAISE EXCEPTION 'Request has already been processed';
  END IF;
  
  -- 更新请求状态为已接受
  UPDATE friend_requests 
  SET status = 'accepted', updated_at = now()
  WHERE id = request_id;
  
  -- 创建双向好友关系
  INSERT INTO friends (user_id, friend_id)
  VALUES (v_from_user_id, v_to_user_id);
  
  INSERT INTO friends (user_id, friend_id)
  VALUES (v_to_user_id, v_from_user_id);
  
  RETURN json_build_object(
    'success', true,
    'message', 'Friend request accepted',
    'friend_id', v_from_user_id
  );
END;
$$;

-- Function: Reject friend request
CREATE OR REPLACE FUNCTION reject_friend_request(request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_to_user_id uuid;
  v_request_status text;
BEGIN
  -- 获取请求详情
  SELECT to_user_id, status 
  INTO v_to_user_id, v_request_status
  FROM friend_requests 
  WHERE id = request_id;
  
  -- 验证请求存在
  IF v_to_user_id IS NULL THEN
    RAISE EXCEPTION 'Friend request not found';
  END IF;
  
  -- 验证是接收方
  IF v_to_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the recipient can reject the request';
  END IF;
  
  -- 验证请求状态
  IF v_request_status != 'pending' THEN
    RAISE EXCEPTION 'Request has already been processed';
  END IF;
  
  -- 更新请求状态为已拒绝
  UPDATE friend_requests 
  SET status = 'rejected', updated_at = now()
  WHERE id = request_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Friend request rejected'
  );
END;
$$;

-- Function: Check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friends 
    WHERE (user_id = user1_id AND friend_id = user2_id)
       OR (user_id = user2_id AND friend_id = user1_id)
  );
END;
$$;

-- Function: Get user's friends with profiles (修复重复问题)
CREATE OR REPLACE FUNCTION get_friends_with_profiles(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  friend_id uuid,
  username text,
  display_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.username,
    p.display_name,
    f.created_at
  FROM friends f
  JOIN profiles p ON (
    CASE 
      WHEN f.user_id = p_user_id THEN p.id = f.friend_id
      ELSE p.id = f.user_id
    END
  )
  WHERE f.user_id = p_user_id OR f.friend_id = p_user_id
  ORDER BY f.created_at DESC;
END;
$$;

-- Function: Get shared notes
CREATE OR REPLACE FUNCTION get_shared_notes(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  note_id uuid,
  title text,
  content text,
  is_shared boolean,
  permission text,
  owner_id uuid,
  owner_username text,
  owner_display_name text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.content,
    n.is_shared,
    ns.permission,
    p.id,
    p.username,
    p.display_name,
    n.created_at,
    n.updated_at
  FROM note_shares ns
  JOIN notes n ON n.id = ns.note_id
  JOIN profiles p ON p.id = ns.owner_id
  WHERE ns.shared_with_user_id = p_user_id
  ORDER BY n.updated_at DESC;
END;
$$;

-- Function: Search notes with vector similarity (支持共享笔记)
CREATE OR REPLACE FUNCTION search_notes(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  note_id uuid,
  chunk_text text,
  similarity float,
  note_title text,
  note_content text,
  is_own_note boolean,
  owner_username text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ne.note_id,
    ne.chunk_text,
    1 - (ne.embedding <=> query_embedding) AS similarity,
    n.title AS note_title,
    n.content AS note_content,
    (n.user_id = auth.uid()) AS is_own_note,
    p.username AS owner_username
  FROM note_embeddings ne
  JOIN notes n ON n.id = ne.note_id
  JOIN profiles p ON p.id = n.user_id
  WHERE 
    -- 自己的笔记 OR 共享给自己的笔记
    (n.user_id = auth.uid() OR 
     n.id IN (
       SELECT note_id FROM note_shares 
       WHERE shared_with_user_id = auth.uid()
     ))
    AND 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- =====================================================
-- 7. 触发器
-- =====================================================

-- Triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. 注释和说明
-- =====================================================

-- 添加表注释
COMMENT ON TABLE public.profiles IS '用户资料表';
COMMENT ON TABLE public.notes IS '笔记表';
COMMENT ON TABLE public.note_embeddings IS '笔记向量嵌入表';
COMMENT ON TABLE public.chat_messages IS '聊天消息表';
COMMENT ON TABLE friends IS '好友关系表 - 存储已建立的好友关系';
COMMENT ON TABLE friend_requests IS '好友请求表 - 存储好友请求及状态';
COMMENT ON TABLE note_shares IS '笔记共享表 - 存储笔记共享关系';

-- 添加列注释
COMMENT ON COLUMN friends.user_id IS '发起方用户ID';
COMMENT ON COLUMN friends.friend_id IS '被添加的好友ID';
COMMENT ON COLUMN friend_requests.status IS '请求状态: pending(待处理), accepted(已接受), rejected(已拒绝)';
COMMENT ON COLUMN note_shares.permission IS '权限类型: read(只读), write(可编辑)';

-- =====================================================
-- 完成！
-- =====================================================

-- 显示成功消息
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Complete Database Schema 创建成功！';
  RAISE NOTICE '功能包括：';
  RAISE NOTICE '  - Phase 1: 基础笔记系统（笔记、向量搜索）';
  RAISE NOTICE '  - Phase 2: 聊天功能（AI对话）';
  RAISE NOTICE '  - Phase 3: 好友系统和笔记共享';
  RAISE NOTICE '  - 修复：profiles RLS 和重复好友问题';
  RAISE NOTICE '  - 完整的RLS安全策略';
  RAISE NOTICE '  - 所有必要的索引和函数';
END $$;
