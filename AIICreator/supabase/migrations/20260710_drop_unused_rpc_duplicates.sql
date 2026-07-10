-- 클라이언트 코드는 접두어 없는 toggle_like / toggle_save / increment_view만 호출함.
-- 아래 rpc_* 함수들은 어디서도 호출되지 않는 중복 구현이며, anon/authenticated에게
-- 실행 권한이 열린 SECURITY DEFINER 함수라 불필요한 공격 표면이므로 제거.
DROP FUNCTION IF EXISTS public.rpc_toggle_like(uuid);
DROP FUNCTION IF EXISTS public.rpc_toggle_save(uuid);
DROP FUNCTION IF EXISTS public.rpc_increment_view(uuid);
DROP FUNCTION IF EXISTS public.rpc_delete_prompt(uuid);
