-- 修复profiles表的RLS策略，允许用户搜索其他用户
-- 在Supabase SQL Editor中执行此脚本

-- 添加新策略：允许用户搜索其他用户的基本信息（用于好友搜索）
CREATE POLICY "Users can search other profiles for friend requests"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 或者更严格的策略：只允许搜索username和display_name字段
-- CREATE POLICY "Users can search other profiles for friend requests"
--   ON public.profiles FOR SELECT
--   USING (auth.uid() IS NOT NULL AND auth.uid() != id);

-- 注释：这个策略允许已登录的用户搜索所有其他用户的profile信息
-- 这对于好友搜索功能是必要的
