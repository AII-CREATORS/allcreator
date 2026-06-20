'use client';
import { useRouter, useParams } from 'next/navigation';
import { SAMPLE_PROMPTS } from '../../lib/data';

export default function PurchasePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const prompt = SAMPLE_PROMPTS.find((p) => p.id === id) || SAMPLE_PROMPTS[0];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 2.5rem' }}>
      <button
        onClick={() => router.back()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--muted)', cursor: 'pointer', marginBottom: '1.75rem', fontFamily: 'var(--display)', background: 'none', border: 'none', padding: 0 }}
      >
        ← 뒤로가기
      </button>

      <h2 style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700, marginBottom: '0.5rem' }}>결제하기</h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '2rem' }}>안전하게 결제 후 바로 사용할 수 있어요</p>

      {/* 스텝 인디케이터 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2.5rem' }}>
        {[['선택', 'done'], ['결제', 'current'], ['완료', 'upcoming']].map(([label, state], i, arr) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontFamily: 'var(--display)', fontWeight: 700, flexShrink: 0,
              background: state === 'done' || state === 'current' ? 'var(--accent)' : 'var(--surface2)',
              color: state === 'done' || state === 'current' ? '#fff' : 'var(--subtle)',
              border: state === 'upcoming' ? '1px solid var(--border2)' : 'none',
              boxShadow: state === 'current' ? '0 0 0 4px var(--accent-dim)' : 'none',
            }}>
              {state === 'done' ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 12, fontFamily: 'var(--display)', marginLeft: 8, color: state === 'current' ? 'var(--text)' : 'var(--muted)', fontWeight: state === 'current' ? 600 : 400, whiteSpace: 'nowrap' }}>
              {label}
            </span>
            {i < arr.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--border2)', margin: '0 10px' }} />}
          </div>
        ))}
      </div>

      {/* 주문 요약 */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
          {prompt.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{prompt.title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>ChatGPT / Claude / Midjourney 버전 포함</div>
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700 }}>{prompt.price || '무료'}</div>
      </div>

      {/* 계정 정보 */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: 12, color: 'var(--subtle)', fontFamily: 'var(--display)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          계정 정보
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--display)' }}>이메일</label>
          <input
            type="email"
            placeholder="example@email.com"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 9, padding: '11px 14px', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--sans)', outline: 'none' }}
          />
        </div>
      </div>

      {/* 결제 수단 */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: 12, color: 'var(--subtle)', fontFamily: 'var(--display)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          결제 수단
        </div>
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 9, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>💳</span>
          <input type="text" placeholder="카드 번호 1234 5678 9012 3456" style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: 14, color: 'var(--text)', fontFamily: 'var(--sans)' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {['VISA', 'KB', '신한'].map((b) => (
              <div key={b} style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 5, padding: '2px 7px', fontSize: 11, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--muted)' }}>{b}</div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--display)' }}>유효기간</label>
            <input type="text" placeholder="MM / YY" style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 9, padding: '11px 14px', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--sans)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--display)' }}>CVC</label>
            <input type="text" placeholder="123" style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 9, padding: '11px 14px', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--sans)', outline: 'none' }} />
          </div>
        </div>
      </div>

      {/* 금액 내역 */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.75rem' }}>
        {[['상품 금액', '₩7,000'], ['할인 (44%)', '-₩3,100'], ['부가세 포함', '₩0']].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: val.startsWith('-') ? 'var(--green)' : 'var(--muted)', marginBottom: '0.6rem' }}>
            <span>{label}</span><span>{val}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
          <span>최종 결제 금액</span>
          <span style={{ color: 'var(--accent)' }}>{prompt.price || '₩0'}</span>
        </div>
      </div>

      <button
        onClick={() => router.push('/success')}
        style={{ width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700, padding: 17, cursor: 'pointer', transition: 'opacity .15s', marginBottom: '1rem' }}
      >
        {prompt.price || '무료'} 결제하기
      </button>
      <p style={{ fontSize: 12, color: 'var(--subtle)', textAlign: 'center', lineHeight: 1.6 }}>
        결제 후 즉시 프롬프트 전문을 확인할 수 있어요.<br />토스페이먼츠로 안전하게 처리됩니다. 환불은 구매 후 7일 이내 가능.
      </p>
    </div>
  );
}
