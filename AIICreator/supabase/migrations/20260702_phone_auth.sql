-- ─────────────────────────────────────────────────────────
-- users 테이블에 phone_num 컬럼 추가
-- ─────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_num VARCHAR(20);

-- ─────────────────────────────────────────────────────────
-- SMS 인증번호 임시 저장 테이블
-- purpose: 'signup' | 'find_id' | 'find_pw'
-- expires_at: 발송 후 5분 TTL
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_verifications (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    phone      VARCHAR(20)  NOT NULL,
    code       VARCHAR(6)   NOT NULL,
    purpose    VARCHAR(20)  NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 복합 인덱스 (phone + purpose 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_sms_verif_phone_purpose
    ON sms_verifications (phone, purpose);

-- RLS 활성화 (Edge Function service role만 접근)
ALTER TABLE sms_verifications ENABLE ROW LEVEL SECURITY;

-- anon / authenticated 는 직접 접근 불가 (Edge Function이 service role로 처리)
-- 별도 policy 없음 → service role은 RLS bypass
