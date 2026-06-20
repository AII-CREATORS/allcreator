'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AuthModal from './AuthModal';
import type { User } from '@supabase/supabase-js';

export default function Nav() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showAuth, setShowAuth] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState('');
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) loadProfile(data.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setNickname('');
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(id: string) {
    const { data } = await supabase.from('profiles').select('nickname').eq('id', id).single();
    if (data) setNickname(data.nickname ?? '');
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.body.classList.toggle('light', next === 'light');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
  }

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'var(--nav-bg)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        height: 60, display: 'flex', alignItems: 'center',
        padding: '0 2.5rem', gap: '2rem',
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--display)', fontWeight: 700, fontSize: 20,
          color: 'var(--text)', letterSpacing: '-0.01em', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          All<span style={{ color: 'var(--accent)' }}>.</span>Creator
        </Link>

        <div style={{
          flex: 1, maxWidth: 480,
          background: 'var(--surface2)', border: '1px solid var(--border2)',
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 14px', height: 38,
        }}>
          <span style={{ color: 'var(--subtle)', fontSize: 16 }}>🔍</span>
          <input
            type="text"
            placeholder="어떤 결과물을 원하세요?"
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text)', flex: 1,
            }}
            onKeyDown={(e) => e.key === 'Enter' && router.push(`/search?q=${(e.target as HTMLInputElement).value}`)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: 'auto' }}>
          <Link href="/" style={{ fontSize: 14, color: 'var(--muted)', textDecoration: 'none', fontFamily: 'var(--display)', fontWeight: 500 }}>탐색</Link>
          <Link href="/trend" style={{ fontSize: 14, color: 'var(--muted)', textDecoration: 'none', fontFamily: 'var(--display)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ background: 'var(--point)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--display)' }}>HOT</span>
            트렌드
          </Link>
          <a style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'var(--display)', fontWeight: 500, cursor: 'pointer' }}>마켓</a>
          <a style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'var(--display)', fontWeight: 500, cursor: 'pointer' }}>크리에이터</a>

          <button onClick={toggleTheme} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--surface2)', border: '1px solid var(--border2)',
                  borderRadius: 100, padding: '6px 14px 6px 8px', cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'var(--accent)',
                }}>
                  {nickname ? nickname[0].toUpperCase() : '?'}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--display)', color: 'var(--text)' }}>{nickname || '사용자'}</span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>▼</span>
              </div>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--surface)', border: '1px solid var(--border2)',
                  borderRadius: 12, minWidth: 180, overflow: 'hidden', zIndex: 300,
                }}>
                  {[
                    { label: '👤 마이페이지', href: '/mypage' },
                    { label: '🛍️ 구매한 프롬프트', href: '/mypage?tab=bought' },
                    { label: '♡ 저장한 프롬프트', href: '/mypage?tab=saved' },
                  ].map((item) => (
                    <button key={item.label} onClick={() => { setUserMenuOpen(false); router.push(item.href); }} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 16px', fontSize: 14, color: 'var(--muted)',
                      cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left',
                    }}>
                      {item.label}
                    </button>
                  ))}
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px', fontSize: 14, color: '#FF6B6B',
                    cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left',
                  }}>
                    🚪 로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 18px', fontSize: 14, fontWeight: 600,
                fontFamily: 'var(--display)', cursor: 'pointer',
              }}
            >
              로그인
            </button>
          )}
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
