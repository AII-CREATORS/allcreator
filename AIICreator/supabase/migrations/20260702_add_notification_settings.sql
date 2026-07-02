-- users 테이블에 알림 설정 JSONB 컬럼 추가
-- like: 좋아요 알림, purchase: 구매 완료 알림 (판매자 수신)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_settings JSONB
  DEFAULT '{"like": true, "purchase": true}'::jsonb;
