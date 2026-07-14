-- ─────────────────────────────────────────────────────────
-- 카테고리 다중 선택(태그화): 단일 category_id FK → 다대다 연결 테이블
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prompt_categories (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id   uuid        NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
    category_id uuid        NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (prompt_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_categories_prompt_id ON public.prompt_categories(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_categories_category_id ON public.prompt_categories(category_id);

-- 기존 단일 category_id 값을 연결 테이블로 이관
INSERT INTO public.prompt_categories (prompt_id, category_id)
SELECT id, category_id FROM public.prompts WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.prompt_categories ENABLE ROW LEVEL SECURITY;

-- 태그 데이터 자체는 민감하지 않고, 조회는 프롬프트 자체의 가시성 규칙을 따로 또 걸 필요가 없어 공개로 둠
CREATE POLICY prompt_categories_select_all ON public.prompt_categories
FOR SELECT USING (true);

-- 등록/수정은 해당 프롬프트의 소유자만
CREATE POLICY prompt_categories_manage_own ON public.prompt_categories
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = prompt_id AND p.user_id = auth.uid())
);

CREATE POLICY prompt_categories_delete_own ON public.prompt_categories
FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.prompts p WHERE p.id = prompt_id AND p.user_id = auth.uid())
);

-- 더 이상 쓰지 않는 단일 category_id 컬럼 제거 (연결 테이블로 완전히 대체)
ALTER TABLE public.prompts DROP COLUMN IF EXISTS category_id;

-- ─────────────────────────────────────────────────────────
-- 가격순 정렬 버그 수정: price가 text 컬럼이라 문자열(사전순) 정렬이 되고 있었음
-- (예: '500'이 '1500'보다 문자열상 뒤로 감) → 숫자 캐스팅 생성 컬럼 추가
-- ─────────────────────────────────────────────────────────
ALTER TABLE public.prompts
  ADD COLUMN IF NOT EXISTS price_numeric numeric GENERATED ALWAYS AS (price::numeric) STORED;

-- ─────────────────────────────────────────────────────────
-- get_prompt_detail 재정의: categories를 배열로 반환
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_prompt_detail(p_prompt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid              uuid := auth.uid();
  v_row              prompts%ROWTYPE;
  v_is_owner         boolean;
  v_is_admin         boolean;
  v_purchased        boolean;
  v_can_view_content boolean;
BEGIN
  SELECT * INTO v_row FROM prompts WHERE id = p_prompt_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_is_owner := (v_uid IS NOT NULL AND v_row.user_id = v_uid);
  v_is_admin := (v_uid IS NOT NULL AND EXISTS(
    SELECT 1 FROM users WHERE users.id = v_uid AND users.role IN ('main_admin', 'sub_admin')
  ));

  IF NOT (v_row.status = 'published' OR v_is_owner OR v_is_admin) THEN
    RETURN NULL;
  END IF;

  v_purchased := (v_uid IS NOT NULL AND EXISTS(
    SELECT 1 FROM orders o
    WHERE o.prompt_id = p_prompt_id AND o.buyer_id = v_uid AND o.status = 'completed'
  ));

  v_can_view_content := v_is_owner OR v_is_admin OR v_purchased;

  RETURN jsonb_build_object(
    'id',               v_row.id,
    'title',            v_row.title,
    'description',      v_row.description,
    'prompt_content',   CASE WHEN v_can_view_content THEN v_row.prompt_content ELSE NULL END,
    'prompt_type',      v_row.prompt_type,
    'price',            v_row.price,
    'difficulty',       v_row.difficulty,
    'status',           v_row.status,
    'rejection_reason', v_row.rejection_reason,
    'like_count',       v_row.like_count,
    'save_count',       v_row.save_count,
    'view_count',       v_row.view_count,
    'created_at',       v_row.created_at,
    'result_image',     v_row.result_image,
    'users',      (SELECT jsonb_build_object('id', u.id, 'display_name', u.display_name) FROM users u WHERE u.id = v_row.user_id),
    'ai_tools',   (SELECT jsonb_build_object('name', t.name) FROM ai_tools t WHERE t.id = v_row.ai_tool_id),
    'categories', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) ORDER BY c.name)
      FROM prompt_categories pc
      JOIN categories c ON c.id = pc.category_id
      WHERE pc.prompt_id = v_row.id
    ), '[]'::jsonb)
  );
END;
$$;
