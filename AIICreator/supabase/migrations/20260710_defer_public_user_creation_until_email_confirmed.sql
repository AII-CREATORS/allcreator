-- 기존 트리거는 auth.users INSERT 즉시(이메일 인증 여부와 무관하게) 발동해
-- public.users 프로필을 생성했음. 이메일 인증을 켠 이후에는 미인증 계정도
-- public.users에 프로필이 생겨버리는 문제가 있어, 인증 완료 시점에만
-- 프로필이 생성되도록 수정.
--   - OAuth(google/kakao): 가입 즉시 email_confirmed_at이 채워지므로 기존과 동일하게 동작
--   - 이메일/비밀번호: INSERT 시점엔 email_confirmed_at이 null이라 스킵되고,
--     사용자가 인증 링크를 클릭해 GoTrue가 email_confirmed_at을 UPDATE할 때 생성됨
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider  text;
  v_name      text;
  v_avatar    text;
  v_email     text;
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  v_email    := COALESCE(NEW.email, '');

  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(v_email, '@', 1)
  );
  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  INSERT INTO public.users (id, email, username, display_name, avatar_url, auth_provider)
  VALUES (
    NEW.id,
    v_email,
    'user_' || substr(NEW.id::text, 1, 8),
    COALESCE(v_name, 'user'),
    v_avatar,
    v_provider
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();
