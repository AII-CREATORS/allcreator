-- 유료 프롬프트 원문(prompt_content)이 RLS만으로는 비구매자에게도 노출되는 문제 수정.
-- 소유자/관리자/구매자가 아니면 prompt_content를 null로 반환하는 SECURITY DEFINER RPC 추가.
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

  -- 기존 RLS(관리자 전체 프롬프트 조회)와 동일한 가시성 규칙 유지
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
    'categories', (SELECT jsonb_build_object('name', c.name) FROM categories c WHERE c.id = v_row.category_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_prompt_detail(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_prompt_detail(uuid) TO anon, authenticated;
