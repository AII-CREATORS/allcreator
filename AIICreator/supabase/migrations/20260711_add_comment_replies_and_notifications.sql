-- ─────────────────────────────────────────────────────────
-- 답글: 1단계 depth만 허용 (답글에는 답글 불가)
--
-- 공개/비공개 판정: "유효 소유자"(답글이면 부모 댓글 작성자, 아니면 본인)를
-- effective_owner_id 컬럼에 생성 시점에 저장해둔다. 부모-자식 관계는 생성 후
-- 절대 바뀌지 않으므로 미리 계산해도 안전하고, 구매 여부만 조회 시점마다
-- 다시 판정하므로 "나중에 구매하면 자동 공개 전환"은 그대로 유지된다.
--
-- 주의: RLS 정책(USING/WITH CHECK) 안에서 comments 테이블 자기 자신을 다시
-- 조회하면 SECURITY DEFINER 함수를 거치더라도 Postgres가
-- "infinite recursion detected in policy"로 막는다. 그래서 답글 권한 검증은
-- 전부 BEFORE INSERT 트리거로 처리하고, INSERT 정책 자체는 comments를
-- 절대 참조하지 않도록 구성했다.
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS effective_owner_id uuid;

UPDATE public.comments SET effective_owner_id = user_id WHERE effective_owner_id IS NULL;

ALTER TABLE public.comments ALTER COLUMN effective_owner_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON public.comments(parent_comment_id);

-- 공개 범위 판정 헬퍼: prompts/orders/users만 조회하므로 comments 재귀 문제 없음
CREATE OR REPLACE FUNCTION public.comment_visible_for_owner(p_prompt_id uuid, p_effective_owner uuid, p_viewer uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- 공개(후기): 유효 소유자가 판매자/구매자/관리자
    EXISTS (SELECT 1 FROM prompts p WHERE p.id = p_prompt_id AND p.user_id = p_effective_owner)
    OR EXISTS (SELECT 1 FROM orders o WHERE o.prompt_id = p_prompt_id AND o.buyer_id = p_effective_owner AND o.status = 'completed')
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = p_effective_owner AND u.role IN ('main_admin','sub_admin'))
    -- 비공개(문의): 조회자가 유효 소유자 본인 / 판매자 본인 / 관리자
    OR p_effective_owner = p_viewer
    OR EXISTS (SELECT 1 FROM prompts p WHERE p.id = p_prompt_id AND p.user_id = p_viewer)
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = p_viewer AND u.role IN ('main_admin','sub_admin'))
$$;

REVOKE ALL ON FUNCTION public.comment_visible_for_owner(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.comment_visible_for_owner(uuid, uuid, uuid) TO anon, authenticated;

-- 답글 검증(1단계 depth, 권한) + effective_owner_id 계산을 트리거에서 처리
CREATE OR REPLACE FUNCTION public.fn_prevent_nested_replies()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_owner      uuid;
  v_parent_has_parent boolean;
BEGIN
  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT user_id, (parent_comment_id IS NOT NULL)
    INTO v_parent_owner, v_parent_has_parent
    FROM comments
    WHERE id = NEW.parent_comment_id AND prompt_id = NEW.prompt_id;

    IF v_parent_owner IS NULL THEN
      RAISE EXCEPTION '잘못된 댓글 참조입니다';
    END IF;

    IF v_parent_has_parent THEN
      RAISE EXCEPTION '답글에는 답글을 달 수 없습니다';
    END IF;

    IF NOT public.comment_visible_for_owner(NEW.prompt_id, v_parent_owner, auth.uid()) THEN
      RAISE EXCEPTION '이 댓글에는 답글을 작성할 권한이 없습니다';
    END IF;

    NEW.effective_owner_id := v_parent_owner;
  ELSE
    NEW.effective_owner_id := NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_prevent_nested_replies ON public.comments;
CREATE TRIGGER trg_comments_prevent_nested_replies
  BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_nested_replies();

-- ─────────────────────────────────────────────────────────
-- RLS 재정의: comments 자기참조 없이 effective_owner_id 컬럼만 사용
-- ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS comments_select_visible ON public.comments;
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
    AND public.comment_visible_for_owner(comments.prompt_id, comments.effective_owner_id, auth.uid())
);

DROP POLICY IF EXISTS comments_insert_own ON public.comments;
CREATE POLICY comments_insert_own ON public.comments
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = prompt_id AND p.status = 'published')
);

-- ─────────────────────────────────────────────────────────
-- notifications.type에 댓글/답글 알림 타입 추가
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[
    'prompt_approved', 'prompt_rejected', 'system', 'prompt_liked',
    'purchase_completed', 'sale_completed', 'comment_liked',
    'prompt_commented', 'comment_replied'
  ]));

ALTER TABLE public.users
  ALTER COLUMN notification_settings SET DEFAULT
    '{"like": true, "purchase": true, "comment_like": true, "comment_posted": true, "comment_replied": true}'::jsonb;

-- ─────────────────────────────────────────────────────────
-- 댓글 활동 알림: 내 프롬프트에 댓글이 달렸을 때 / 내 댓글에 답글이 달렸을 때
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_notify_comment_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prompt_owner uuid;
  v_prompt_title text;
  v_parent_owner uuid;
  v_noti_enabled boolean;
BEGIN
  IF NEW.parent_comment_id IS NULL THEN
    SELECT user_id, title INTO v_prompt_owner, v_prompt_title FROM prompts WHERE id = NEW.prompt_id;

    IF v_prompt_owner IS NOT NULL AND v_prompt_owner <> NEW.user_id THEN
      SELECT COALESCE((notification_settings->>'comment_posted')::boolean, true)
      INTO v_noti_enabled FROM users WHERE id = v_prompt_owner;

      IF v_noti_enabled THEN
        INSERT INTO notifications(user_id, type, title, body, prompt_id)
        VALUES (v_prompt_owner, 'prompt_commented', '내 프롬프트에 댓글이 달렸어요', '"' || COALESCE(v_prompt_title, '') || '"', NEW.prompt_id);
      END IF;
    END IF;
  ELSE
    SELECT user_id INTO v_parent_owner FROM comments WHERE id = NEW.parent_comment_id;

    IF v_parent_owner IS NOT NULL AND v_parent_owner <> NEW.user_id THEN
      SELECT COALESCE((notification_settings->>'comment_replied')::boolean, true)
      INTO v_noti_enabled FROM users WHERE id = v_parent_owner;

      IF v_noti_enabled THEN
        INSERT INTO notifications(user_id, type, title, body, prompt_id)
        VALUES (v_parent_owner, 'comment_replied', '내 댓글에 답글이 달렸어요', NULL, NEW.prompt_id);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_notify_activity ON public.comments;
CREATE TRIGGER trg_comments_notify_activity
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_comment_activity();

-- 트리거 전용 함수는 RPC로 직접 호출될 필요가 없으므로 실행 권한 제거
REVOKE EXECUTE ON FUNCTION public.fn_prevent_nested_replies() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_notify_comment_activity() FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────
-- get_prompt_comments 재정의: 답글을 각 최상위 댓글의 replies 배열로 포함,
-- effective_owner_id 컬럼을 그대로 사용
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_prompt_comments(p_prompt_id uuid, p_sort text DEFAULT 'oldest')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_result jsonb;
BEGIN
  WITH all_comments AS (
    SELECT
      c.id, c.parent_comment_id, c.content, c.like_count, c.is_edited, c.created_at, c.user_id,
      c.effective_owner_id,
      u.display_name, u.avatar_url,
      EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = v_uid) AS liked_by_me
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.prompt_id = p_prompt_id
  ),
  classified AS (
    SELECT ac.*,
      (
        EXISTS(SELECT 1 FROM prompts p WHERE p.id = p_prompt_id AND p.user_id = ac.effective_owner_id)
        OR EXISTS(SELECT 1 FROM orders o WHERE o.prompt_id = p_prompt_id AND o.buyer_id = ac.effective_owner_id AND o.status = 'completed')
        OR EXISTS(SELECT 1 FROM users ur WHERE ur.id = ac.effective_owner_id AND ur.role IN ('main_admin','sub_admin'))
      ) AS is_public
    FROM all_comments ac
  ),
  viewer AS (
    SELECT
      EXISTS(SELECT 1 FROM prompts p WHERE p.id = p_prompt_id AND p.user_id = v_uid) AS is_seller,
      EXISTS(SELECT 1 FROM users ur WHERE ur.id = v_uid AND ur.role IN ('main_admin','sub_admin')) AS is_admin
  ),
  replies_agg AS (
    SELECT
      parent_comment_id,
      jsonb_agg(
        jsonb_build_object(
          'id', id, 'content', content, 'like_count', like_count, 'is_edited', is_edited,
          'created_at', created_at, 'user_id', user_id, 'display_name', display_name,
          'avatar_url', avatar_url, 'liked_by_me', liked_by_me
        ) ORDER BY created_at ASC
      ) AS replies
    FROM classified
    WHERE parent_comment_id IS NOT NULL
    GROUP BY parent_comment_id
  ),
  top_level AS (
    SELECT c.*, ROW_NUMBER() OVER (ORDER BY like_count DESC, created_at ASC) AS like_rank
    FROM classified c
    WHERE parent_comment_id IS NULL AND is_public
  )
  SELECT jsonb_build_object(
    'reviews', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', r.id, 'content', r.content, 'like_count', r.like_count, 'is_edited', r.is_edited,
          'created_at', r.created_at, 'user_id', r.user_id, 'display_name', r.display_name,
          'avatar_url', r.avatar_url, 'liked_by_me', r.liked_by_me,
          'replies', COALESCE(ra.replies, '[]'::jsonb)
        )
        ORDER BY
          (r.like_rank <= 3) DESC,
          CASE WHEN r.like_rank <= 3 THEN r.like_rank END ASC,
          CASE WHEN r.like_rank > 3 AND p_sort = 'popular' THEN r.like_count END DESC,
          CASE WHEN r.like_rank > 3 AND p_sort = 'latest'  THEN r.created_at  END DESC,
          CASE WHEN r.like_rank > 3 AND (p_sort IS NULL OR p_sort = 'oldest') THEN r.created_at END ASC
      )
      FROM top_level r
      LEFT JOIN replies_agg ra ON ra.parent_comment_id = r.id
    ), '[]'::jsonb),
    'questions', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', q.id, 'content', q.content, 'like_count', q.like_count, 'is_edited', q.is_edited,
          'created_at', q.created_at, 'user_id', q.user_id, 'display_name', q.display_name,
          'avatar_url', q.avatar_url, 'liked_by_me', q.liked_by_me,
          'replies', COALESCE(ra.replies, '[]'::jsonb)
        )
        ORDER BY q.created_at DESC
      )
      FROM classified q
      LEFT JOIN replies_agg ra ON ra.parent_comment_id = q.id
      CROSS JOIN viewer v
      WHERE q.parent_comment_id IS NULL
        AND NOT q.is_public
        AND (q.effective_owner_id = v_uid OR v.is_seller OR v.is_admin)
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
