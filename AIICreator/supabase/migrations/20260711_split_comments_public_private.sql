-- 댓글 공개 범위 재정의:
--   공개(후기)  = 작성자가 판매자 본인 OR 구매자(completed order) OR 관리자
--   비공개(문의) = 그 외 (작성자 본인 + 판매자 본인 + 관리자에게만 보임)
-- 구매 여부는 매 조회 시점에 다시 판정하므로, 비구매자가 나중에 구매하면
-- 별도 마이그레이션 없이 다음 조회부터 자동으로 공개 전환됨.
DROP POLICY IF EXISTS comments_select_visible ON public.comments;
CREATE POLICY comments_select_visible ON public.comments
FOR SELECT
USING (
    -- 프롬프트 자체를 볼 수 있어야 함
    EXISTS (
        SELECT 1 FROM public.prompts p
        WHERE p.id = comments.prompt_id
        AND (
            p.status = 'published'
            OR p.user_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('main_admin','sub_admin'))
        )
    )
    AND (
        -- 공개 후기
        EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = comments.prompt_id AND p.user_id = comments.user_id)
        OR EXISTS (SELECT 1 FROM public.orders o WHERE o.prompt_id = comments.prompt_id AND o.buyer_id = comments.user_id AND o.status = 'completed')
        OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = comments.user_id AND u.role IN ('main_admin','sub_admin'))
        -- 비공개 문의: 작성자 본인 / 판매자 본인 / 관리자만
        OR comments.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = comments.prompt_id AND p.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('main_admin','sub_admin'))
    )
);

-- ─────────────────────────────────────────────────────────
-- 댓글 목록 조회 RPC
--   - 공개/비공개 판정 + 인기 후기 상위 3개 고정 정렬을 서버에서 일괄 처리
--   - reviews: 공개 후기 (좋아요 상위 3개는 좋아요순으로 우선 고정, 나머지는 p_sort 기준)
--   - questions: 비공개 문의 (본인 것이거나, 조회자가 판매자/관리자일 때 전체)
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
  WITH classified AS (
    SELECT
      c.id, c.content, c.like_count, c.is_edited, c.created_at, c.user_id,
      u.display_name, u.avatar_url,
      (
        EXISTS(SELECT 1 FROM prompts p WHERE p.id = c.prompt_id AND p.user_id = c.user_id)
        OR EXISTS(SELECT 1 FROM orders o WHERE o.prompt_id = c.prompt_id AND o.buyer_id = c.user_id AND o.status = 'completed')
        OR EXISTS(SELECT 1 FROM users ur WHERE ur.id = c.user_id AND ur.role IN ('main_admin','sub_admin'))
      ) AS is_public,
      EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = v_uid) AS liked_by_me
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.prompt_id = p_prompt_id
  ),
  viewer AS (
    SELECT
      EXISTS(SELECT 1 FROM prompts p WHERE p.id = p_prompt_id AND p.user_id = v_uid) AS is_seller,
      EXISTS(SELECT 1 FROM users ur WHERE ur.id = v_uid AND ur.role IN ('main_admin','sub_admin')) AS is_admin
  ),
  reviews_ranked AS (
    SELECT c.*, ROW_NUMBER() OVER (ORDER BY like_count DESC, created_at ASC) AS like_rank
    FROM classified c
    WHERE is_public
  )
  SELECT jsonb_build_object(
    'reviews', COALESCE((
      SELECT jsonb_agg(row_to_json(r) ORDER BY
        (r.like_rank <= 3) DESC,
        CASE WHEN r.like_rank <= 3 THEN r.like_rank END ASC,
        CASE WHEN r.like_rank > 3 AND p_sort = 'popular' THEN r.like_count END DESC,
        CASE WHEN r.like_rank > 3 AND p_sort = 'latest'  THEN r.created_at  END DESC,
        CASE WHEN r.like_rank > 3 AND (p_sort IS NULL OR p_sort = 'oldest') THEN r.created_at END ASC
      )
      FROM reviews_ranked r
    ), '[]'::jsonb),
    'questions', COALESCE((
      SELECT jsonb_agg(row_to_json(q) ORDER BY q.created_at DESC)
      FROM (
        SELECT c.id, c.content, c.like_count, c.is_edited, c.created_at, c.user_id, c.display_name, c.avatar_url, c.liked_by_me
        FROM classified c, viewer v
        WHERE NOT c.is_public
          AND (c.user_id = v_uid OR v.is_seller OR v.is_admin)
      ) q
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_prompt_comments(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_prompt_comments(uuid, text) TO anon, authenticated;
