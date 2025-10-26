-- ================================================
-- 快速修复：注册错误 "Database error saving new user"
-- ================================================
-- 如果你遇到注册错误，在 Supabase SQL Editor 运行此脚本
-- ================================================

-- 步骤 1: 检查并删除旧的触发器和函数
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- 步骤 2: 重新创建 handle_new_user 函数（带错误处理）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 尝试插入用户配置
  INSERT INTO public.user_profiles (id, username, display_name)
  VALUES (NEW.id, NEW.email, NEW.email);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- 如果用户已存在，忽略错误
    RAISE NOTICE 'User profile already exists for user %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- 记录其他错误但不阻止用户创建
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 步骤 3: 重新创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 步骤 4: 确保 user_profiles 表存在
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  language TEXT DEFAULT 'zh',
  sidebar_collapsed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 步骤 5: 确保 RLS 已启用
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 步骤 6: 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- 步骤 7: 重新创建 RLS 策略
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 步骤 8: 验证设置
DO $$
DECLARE
  trigger_count INTEGER;
  table_exists BOOLEAN;
  rls_enabled BOOLEAN;
BEGIN
  -- 检查触发器
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created';

  -- 检查表
  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
  ) INTO table_exists;

  -- 检查 RLS
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'user_profiles';

  -- 输出结果
  RAISE NOTICE '========================================';
  RAISE NOTICE '修复完成！验证结果：';
  RAISE NOTICE '========================================';

  IF trigger_count > 0 THEN
    RAISE NOTICE '✓ 触发器已创建';
  ELSE
    RAISE WARNING '✗ 触发器创建失败';
  END IF;

  IF table_exists THEN
    RAISE NOTICE '✓ user_profiles 表存在';
  ELSE
    RAISE WARNING '✗ user_profiles 表不存在';
  END IF;

  IF rls_enabled THEN
    RAISE NOTICE '✓ RLS 已启用';
  ELSE
    RAISE WARNING '✗ RLS 未启用';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '现在可以尝试注册新用户了！';
  RAISE NOTICE '========================================';
END $$;
