-- ─────────────────────────────────────────────────────────
-- 댓글 테이블
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id  uuid        NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    user_id    uuid        NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
    content    text        NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 500),
    like_count integer     NOT NULL DEFAULT 0,
    is_edited  boolean     NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_prompt_id ON public.comments(prompt_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id   ON public.comments(user_id);

CREATE TRIGGER trg_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 댓글은 프롬프트를 볼 수 있는 사람(공개/본인/관리자)에게만 노출
CREATE POLICY comments_select_visible ON public.comments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.prompts p
        WHERE p.id = comments.prompt_id
        AND (
            p.status = 'published'
            OR p.user_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('main_admin','sub_admin'))
        )
    )
);

-- 로그인한 회원 누구나 공개된 프롬프트에 댓글 작성 가능
CREATE POLICY comments_insert_own ON public.comments
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = prompt_id AND p.status = 'published')
);

CREATE POLICY comments_update_own ON public.comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 본인 또는 관리자(모더레이션)만 삭제 가능
CREATE POLICY comments_delete_own_or_admin ON public.comments
FOR DELETE
USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('main_admin','sub_admin'))
);

-- ─────────────────────────────────────────────────────────
-- 댓글 좋아요 테이블
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id uuid        NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id    uuid        NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY comment_likes_select_own ON public.comment_likes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY comment_likes_insert_own ON public.comment_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY comment_likes_delete_own ON public.comment_likes
FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- notifications.type에 comment_liked 추가
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'prompt_approved', 'prompt_rejected', 'system', 'prompt_liked',
    'purchase_completed', 'sale_completed', 'comment_liked'
  ]));

-- 신규 가입자 알림 설정 기본값에 comment_like 추가 (기존 회원은 키가 없으면 앱/RPC에서 true로 취급)
ALTER TABLE public.users
  ALTER COLUMN notification_settings SET DEFAULT '{"like": true, "purchase": true, "comment_like": true}'::jsonb;

-- ─────────────────────────────────────────────────────────
-- 댓글 좋아요 토글 (좋아요 시 댓글 작성자에게 알림, 누른 사람은 노출하지 않음)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.toggle_comment_like(p_comment_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      uuid := auth.uid();
  v_exists       boolean;
  v_author_id    uuid;
  v_prompt_id    uuid;
  v_noti_enabled boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '로그인이 필요합니다';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM comment_likes WHERE comment_id = p_comment_id AND user_id = v_user_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM comment_likes WHERE comment_id = p_comment_id AND user_id = v_user_id;
    UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = p_comment_id;
    RETURN 'unliked';
  ELSE
    INSERT INTO comment_likes(comment_id, user_id) VALUES (p_comment_id, v_user_id);
    UPDATE comments SET like_count = like_count + 1 WHERE id = p_comment_id;

    SELECT user_id, prompt_id INTO v_author_id, v_prompt_id FROM comments WHERE id = p_comment_id;

    IF v_author_id IS NOT NULL AND v_author_id <> v_user_id THEN
      SELECT COALESCE((notification_settings->>'comment_like')::boolean, true)
      INTO v_noti_enabled
      FROM users WHERE id = v_author_id;

      IF v_noti_enabled THEN
        INSERT INTO notifications(user_id, type, title, body, prompt_id)
        VALUES (v_author_id, 'comment_liked', '댓글에 좋아요가 달렸어요!', NULL, v_prompt_id);
      END IF;
    END IF;

    RETURN 'liked';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_comment_like(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_comment_like(uuid) TO authenticated;

-- Supabase의 기본 권한 부여(default privileges)로 인해 REVOKE ALL FROM PUBLIC만으로는
-- anon 역할의 실행 권한이 남아있어 명시적으로 제거 (댓글 좋아요는 로그인 필수 기능)
REVOKE EXECUTE ON FUNCTION public.toggle_comment_like(uuid) FROM anon;
