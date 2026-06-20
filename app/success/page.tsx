'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROMPT_TEXT = '아래 사진 속 인물을 지브리 스튜디오 애니메이션 스타일로 바꿔줘. 인물의 표정과 분위기는 그대로 살리되, 피부와 눈은 지브리 특유의 맑고 따뜻한 색감으로 표현해줘. 배경은 일본 시골 마을 풍경이나 꽃밭으로 자연스럽게 합성해주고, 전체적으로 여름 오후의 따뜻한 햇빛이 느껴지게 해줘.';

export default function SuccessPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  function copyPrompt() {
    navigator.clipboard.writeText(PROMPT_TEXT).then(() => {
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2500);
    });
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '5rem 2.5rem', textAlign: 'center' }}>
      {/* 체크 아이콘 */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.5rem', margin: '0 auto 1.75rem',
      }}>
        ✓
      </div>

      <h2 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 700, marginBottom: '0.75rem' }}>
        구매가 완료됐어요!
      </h2>
      <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: '2rem' }}>
        결제가 완료됐어요. 프롬프트를 복사해서<br />바로 AI에 붙여넣으세요.
      </p>

      {/* 프롬프트 박스 */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
        <div style={{ fontSize: 11, color: 'var(--subtle)', fontFamily: 'var(--display)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
          지금 바로 사용하세요 — ChatGPT 버전
        </div>
        <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.75 }}>
          {PROMPT_TEXT}
        </div>
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={copyPrompt}
          style={{ background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'var(--display)', fontSize: 15, fontWeight: 600, padding: '12px 24px', cursor: 'pointer', transition: 'opacity .15s' }}
        >
          {copied ? '복사됨 ✓' : '프롬프트 복사하기'}
        </button>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--muted)', fontFamily: 'var(--display)', fontSize: 15, padding: '12px 24px', cursor: 'pointer', transition: 'all .2s' }}
        >
          더 탐색하기
        </button>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <button
          onClick={() => router.push('/mypage')}
          style={{ background: 'none', border: 'none', color: 'var(--subtle)', fontFamily: 'var(--display)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
        >
          마이페이지에서 확인하기 →
        </button>
      </div>

      {/* 토스트 */}
      <div style={{
        position: 'fixed', bottom: '2rem', left: '50%',
        transform: `translateX(-50%) translateY(${showToast ? 0 : 80}px)`,
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 10, padding: '12px 20px',
        fontSize: 14, color: 'var(--text)', fontFamily: 'var(--display)',
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
        zIndex: 999, whiteSpace: 'nowrap',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
        프롬프트 복사 완료!
      </div>
    </div>
  );
}
