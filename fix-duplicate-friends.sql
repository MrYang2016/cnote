-- 修复get_friends_with_profiles函数，避免返回重复的好友记录
-- 在Supabase SQL Editor中执行此脚本

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

-- 注释：添加了DISTINCT来确保不会返回重复的好友记录
-- 同时添加了ORDER BY来确保结果的一致性
