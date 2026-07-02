-- CoolSMS 방식 제거 — SMS 인증 임시 테이블 삭제
-- phone_num 컬럼은 향후 PASS 인증 도입을 위해 유지
DROP TABLE IF EXISTS sms_verifications;
