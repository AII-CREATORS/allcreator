-- search_path hijacking 방지 (Supabase 권장): 사용 중인 함수들의 search_path 고정
ALTER FUNCTION public.fn_set_updated_at()      SET search_path = public;
ALTER FUNCTION public.fn_handle_new_user()     SET search_path = public;
ALTER FUNCTION public.toggle_like(uuid)        SET search_path = public;
ALTER FUNCTION public.toggle_save(uuid)        SET search_path = public;
ALTER FUNCTION public.increment_view(uuid)     SET search_path = public;
ALTER FUNCTION public.get_prompt_detail(uuid)  SET search_path = public;

-- 판매자 본인 조회로 view_count가 계속 올라가지 않도록 자기 자신 조회는 제외
CREATE OR REPLACE FUNCTION public.increment_view(p_prompt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE prompts
  SET view_count = view_count + 1
  WHERE id = p_prompt_id
    AND (auth.uid() IS NULL OR user_id IS DISTINCT FROM auth.uid());
END;
$$;
