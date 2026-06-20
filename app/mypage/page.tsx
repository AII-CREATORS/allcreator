'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'bought' | 'saved' | 'selling';

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('bought');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Supabase 없이 로컬 상태로 로그인 시뮬레이션
  useEffect(() => {
    // 실제 구현 시 Supabase Auth 사용
    // import { createClient } from '@/lib/supabase'
    // const supabase = createClient()
    // supabase.auth.getUser().then(({ data }) => setUser(data.user ? { name: data.user.email?.split('@')[0] || '사용자', email: data.user.email || '' } : null))
    const stored = localStorage.getItem('allcreator_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const emptyStates: Record<Tab, { icon: string; title: string; desc: string; action: string; onClick: () => void }> = {
    bought: { icon: '🛍️', title: '아직 구매한 프롬프트가 없어요', desc: '마음에 드는 프롬프트를 구매하면 여기에 보관돼요', action: '프롬프트 탐색하기', onClick: () => router.push('/') },
    saved: { icon: '♡', title: '저장한 프롬프트가 없어요', desc: '프롬프트 카드의 ♡를 누르면 여기에 저장돼요', action: '프롬프트 탐색하기', onClick: () => router.push('/') },
    selling: { icon: '🎨', title: '아직 등록한 프롬프트가 없어요', desc: '내가 만든 프롬프트를 올리고 수익을 만들어보세요', action: '첫 프롬프트 등록하기', onClick: () => router.push('/register') },
  };

  const tabConfig: { key: Tab; label: string }[] = [
    { key: 'bought', label: '구매한 프롬프트' },
    { key: 'saved', label: '저장한 프롬프트' },
    { key: 'selling', label: '판매 중' },
  ];

  if (!user) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ padding: '5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, marginBottom: '0.75rem' }}>
            로그인이 필요해요
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '2rem', lineHeight: 1.7 }}>
            로그인하면 구매 내역, 저장한 프롬프트,<br />내가 등록한 프롬프트를 관리할 수 있어요.
          </div>
          <button
            onClick={() => router.push('/')}
            style={{ background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'var(--display)', fontSize: 15, fontWeight: 600, padding: '12px 28px', cursor: 'pointer' }}
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  const empty = emptyStates[activeTab];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem' }}>
      {/* 프로필 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-dim)', border: '2px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, fontFamily: 'var(--display)', color: 'var(--accent)', flexShrink: 0 }}>
          {user.name[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{user.name}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>{user.email}</div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
            {[['0', '구매한 프롬프트'], ['0', '저장한 프롬프트']].map(([count, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700 }}>{count}</div>
                <div style={{ fontSize: 12, color: 'var(--subtle)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => router.push('/register')}
          style={{ marginLeft: 'auto', background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'var(--display)', fontSize: 14, fontWeight: 600, padding: '10px 20px', cursor: 'pointer' }}
        >
          + 프롬프트 등록
        </button>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 0, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, marginBottom: '1.75rem', width: 'fit-content' }}>
        {tabConfig.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '7px 22px', borderRadius: 7, fontSize: 14,
              fontFamily: 'var(--display)', fontWeight: 500, cursor: 'pointer',
              color: activeTab === key ? 'var(--text)' : 'var(--muted)',
              background: activeTab === key ? 'var(--surface)' : 'none',
              border: 'none',
              boxShadow: activeTab === key ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              transition: 'all .2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 빈 상태 */}
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{empty.icon}</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600, marginBottom: '0.5rem' }}>{empty.title}</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '1.5rem' }}>{empty.desc}</div>
        <button
          onClick={empty.onClick}
          style={{ background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'var(--display)', fontSize: 14, fontWeight: 600, padding: '11px 24px', cursor: 'pointer' }}
        >
          {empty.action}
        </button>
      </div>
    </div>
  );
}
