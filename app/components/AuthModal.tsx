'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

type Tab = 'login' | 'signup' | 'forgot' | 'success';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(''); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setTab('success');
  }

  async function handleSignup() {
    setError('');
    if (password !== password2) { setError('비밀번호가 일치하지 않아요'); return; }
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 해요'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, nickname });
    }
    setLoading(false);
    if (error) { setError(error.message); return; }
    setTab('success');
  }

  async function handleForgot() {
    setError(''); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) { setError(error.message); return; }
    setTab('success');
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: 10, padding: '11px 14px', fontSize: 14,
    color: 'var(--text)', fontFamily: 'var(--sans)', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 13, color: 'var(--muted)', marginBottom: 6, display: 'block',
  };
  const submitStyle: React.CSSProperties = {
    width: '100%', background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: 10, padding: '13px',
    fontSize: 15, fontWeight: 600, fontFamily: 'var(--display)',
    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
    marginTop: 8,
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 420,
        position: 'relative', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer' }}
        >✕</button>

        <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 4, textAlign: 'center' }}>
          All<span style={{ color: 'var(--accent)' }}>.</span>Creator
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginBottom: '1.5rem' }}>
          {tab === 'login' && 'AI 크리에이터의 세계에 오신 걸 환영해요'}
          {tab === 'signup' && '무료로 시작해보세요'}
          {tab === 'forgot' && '비밀번호를 재설정할게요'}
          {tab === 'success' && ''}
        </div>

        {/* 탭 */}
        {(tab === 'login' || tab === 'signup') && (
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 10, padding: 4, marginBottom: '1.5rem' }}>
            {(['login', 'signup'] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(''); }} style={{
                flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: tab === t ? 'var(--accent)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--muted)',
                fontFamily: 'var(--display)', fontWeight: 600, fontSize: 14,
              }}>
                {t === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>
        )}

        {/* 로그인 */}
        {tab === 'login' && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>이메일</label>
              <input style={inputStyle} type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: 4 }}>
              <label style={labelStyle}>비밀번호</label>
              <input style={inputStyle} type="password" placeholder="비밀번호를 입력하세요" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            </div>
            <div style={{ textAlign: 'right', marginBottom: 12 }}>
              <span onClick={() => setTab('forgot')} style={{ fontSize: 13, color: 'var(--accent)', cursor: 'pointer' }}>비밀번호를 잊으셨나요?</span>
            </div>
            {error && <div style={{ fontSize: 13, color: '#FF6B6B', marginBottom: 8 }}>{error}</div>}
            <button style={submitStyle} onClick={handleLogin} disabled={loading}>
              {loading ? '로그인 중...' : '이메일로 로그인'}
            </button>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 16 }}>
              아직 계정이 없으신가요? <span onClick={() => setTab('signup')} style={{ color: 'var(--accent)', cursor: 'pointer' }}>회원가입</span>
            </div>
          </>
        )}

        {/* 회원가입 */}
        {tab === 'signup' && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>닉네임</label>
              <input style={inputStyle} type="text" placeholder="크리에이터명" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>이메일</label>
              <input style={inputStyle} type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>비밀번호</label>
              <input style={inputStyle} type="password" placeholder="8자 이상 영문+숫자" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div style={{ marginBottom: 4 }}>
              <label style={labelStyle}>비밀번호 확인</label>
              <input style={inputStyle} type="password" placeholder="비밀번호를 다시 입력하세요" value={password2} onChange={(e) => setPassword2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSignup()} />
            </div>
            {error && <div style={{ fontSize: 13, color: '#FF6B6B', marginBottom: 8 }}>{error}</div>}
            <button style={submitStyle} onClick={handleSignup} disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </button>
            <div style={{ fontSize: 12, color: 'var(--subtle)', textAlign: 'center', marginTop: 12 }}>
              가입하면 <span style={{ color: 'var(--accent)' }}>이용약관</span>과 <span style={{ color: 'var(--accent)' }}>개인정보처리방침</span>에 동의하는 것으로 간주됩니다.
            </div>
          </>
        )}

        {/* 비밀번호 찾기 */}
        {tab === 'forgot' && (
          <>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드려요.
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>이메일</label>
              <input style={inputStyle} type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {error && <div style={{ fontSize: 13, color: '#FF6B6B', marginBottom: 8 }}>{error}</div>}
            <button style={submitStyle} onClick={handleForgot} disabled={loading}>
              {loading ? '전송 중...' : '재설정 링크 보내기'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <span onClick={() => setTab('login')} style={{ fontSize: 13, color: 'var(--accent)', cursor: 'pointer' }}>← 로그인으로 돌아가기</span>
            </div>
          </>
        )}

        {/* 완료 */}
        {tab === 'success' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-dim)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: 28, color: 'var(--accent)' }}>✓</div>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>환영해요!</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.7 }}>올크리에이터 회원이 됐어요.<br />이제 프롬프트를 저장하고 구매할 수 있어요.</p>
            <button style={submitStyle} onClick={onClose}>시작하기</button>
          </div>
        )}
      </div>
    </div>
  );
}
