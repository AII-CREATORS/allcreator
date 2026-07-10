-- "시스템 함수 알림 생성" 정책은 WITH CHECK(true)로 사실상 RLS를 무력화하여
-- 로그인한 아무 사용자나 임의의 user_id에게 알림(스크립트 포함 가능)을 꽂아 넣을 수 있었음.
-- 실제로 필요한 admin 승인/반려 알림은 이미 "관리자 알림 생성" 정책이 커버하고,
-- 구매/좋아요 알림은 SECURITY DEFINER 함수(toggle_like, verify-payment Edge Function)가
-- RLS를 우회해 INSERT하므로 이 무제한 정책은 불필요.
DROP POLICY IF EXISTS "시스템 함수 알림 생성" ON public.notifications;
