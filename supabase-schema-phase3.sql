-- =====================================================
-- Phase 3: 好友系统 & 笔记共享
-- =====================================================
-- 功能:
-- 1. 好友系统（添加好友、接受/拒绝请求）
-- 2. 笔记共享（选择性共享给好友）
-- 3. 多人协作（好友可访问共享笔记）
-- =====================================================

-- =====================================================
-- 1. 创建好友关系表
-- =====================================================

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

-- 创建索引以加速查询
CREATE INDEX IF NOT EXISTS friends_user_id_idx ON friends(user_id);
CREATE INDEX IF NOT EXISTS friends_friend_id_idx ON friends(friend_id);

-- 添加注释
COMMENT ON TABLE friends IS '好友关系表 - 存储已建立的好友关系';
COMMENT ON COLUMN friends.user_id IS '发起方用户ID';
COMMENT ON COLUMN friends.friend_id IS '被添加的好友ID';

-- =====================================================
-- 2. 创建好友请求表
-- =====================================================

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

-- 创建索引
CREATE INDEX IF NOT EXISTS friend_requests_from_user_id_idx ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS friend_requests_to_user_id_idx ON friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS friend_requests_status_idx ON friend_requests(status);

-- 添加注释
COMMENT ON TABLE friend_requests IS '好友请求表 - 存储好友请求及状态';
COMMENT ON COLUMN friend_requests.status IS '请求状态: pending(待处理), accepted(已接受), rejected(已拒绝)';

-- =====================================================
-- 3. 创建笔记共享表
-- =====================================================

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

-- 创建索引
CREATE INDEX IF NOT EXISTS note_shares_note_id_idx ON note_shares(note_id);
CREATE INDEX IF NOT EXISTS note_shares_owner_id_idx ON note_shares(owner_id);
CREATE INDEX IF NOT EXISTS note_shares_shared_with_user_id_idx ON note_shares(shared_with_user_id);

-- 添加注释
COMMENT ON TABLE note_shares IS '笔记共享表 - 存储笔记共享关系';
COMMENT ON COLUMN note_shares.permission IS '权限类型: read(只读), write(可编辑)';

-- =====================================================
-- 4. Row Level Security (RLS) 策略
-- =====================================================

-- 启用 RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_shares ENABLE ROW LEVEL SECURITY;

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
-- 5. 辅助函数
-- =====================================================

-- 函数：接受好友请求
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

-- 函数：拒绝好友请求
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

-- 函数：检查两个用户是否是好友
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

-- 函数：获取用户的所有好友（包含用户信息）
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
  SELECT 
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
  WHERE f.user_id = p_user_id OR f.friend_id = p_user_id;
END;
$$;

-- 函数：获取共享给我的笔记（包含笔记内容和所有者信息）
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

-- =====================================================
-- 6. 触发器 - 自动更新 updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. 更新 notes 表的 RLS 策略以支持共享笔记访问
-- =====================================================

-- 删除旧的 SELECT 策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;

-- 新策略：用户可以查看自己的笔记 + 共享给自己的笔记
CREATE POLICY "Users can view own and shared notes"
  ON notes FOR SELECT
  USING (
    auth.uid() = user_id OR
    id IN (
      SELECT note_id FROM note_shares 
      WHERE shared_with_user_id = auth.uid()
    )
  );

-- 删除旧的 UPDATE 策略（如果存在）  
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;

-- 新策略：用户可以更新自己的笔记 + 有写权限的共享笔记
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

-- =====================================================
-- 8. 更新 note_embeddings 表的 RLS 策略以支持共享笔记
-- =====================================================

-- 删除旧的 SELECT 策略
DROP POLICY IF EXISTS "Users can view their own note embeddings" ON note_embeddings;

-- 新策略：用户可以查看自己的嵌入 + 共享笔记的嵌入
CREATE POLICY "Users can view own and shared note embeddings"
  ON note_embeddings FOR SELECT
  USING (
    auth.uid() = user_id OR
    note_id IN (
      SELECT note_id FROM note_shares 
      WHERE shared_with_user_id = auth.uid()
    )
  );

-- =====================================================
-- 9. 向量搜索函数更新 - 支持搜索共享笔记
-- =====================================================

-- 删除旧函数
DROP FUNCTION IF EXISTS search_notes(vector(1024), int);

-- 新函数：搜索个人笔记 + 共享笔记
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
-- 完成！
-- =====================================================

-- 添加总体注释
COMMENT ON SCHEMA public IS 'Phase 3: 好友系统和笔记共享功能已添加';

-- 显示成功消息
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Phase 3 Schema 创建成功！';
  RAISE NOTICE '功能包括：';
  RAISE NOTICE '  - 好友系统（发送/接受/拒绝好友请求）';
  RAISE NOTICE '  - 笔记共享（选择性共享给好友）';
  RAISE NOTICE '  - 多人协作（好友可访问共享笔记）';
  RAISE NOTICE '  - 向量搜索支持共享笔记';
END $$;

