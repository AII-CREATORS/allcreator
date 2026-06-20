'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const aiBadgeStyle: Record<string, React.CSSProperties> = {
  chatgpt: { background: 'rgba(16,185,129,0.15)', color: '#10B981' },
  claude: { background: 'var(--accent-dim)', color: 'var(--accent)' },
  midjourney: { background: 'rgba(251,191,36,0.12)', color: 'var(--point)' },
  runway: { background: 'rgba(251,191,36,0.12)', color: '#FBBF24' },
};

const TOP3 = [
  { id: 1, rank: 1, emoji: '🌸', ai: 'midjourney', aiLabel: 'Midjourney', diff: '쉬움', title: '지브리 감성 인물 사진 변환', stars: '4.9', uses: '8,214', likes: '3,102', free: true, badge: '🔥 3주 연속', badgeType: 'hot' },
  { id: 4, rank: 2, emoji: '📣', ai: 'chatgpt', aiLabel: 'ChatGPT', diff: '쉬움', title: '광고 소재 100개 한 번에 뽑기', stars: '4.9', uses: '11,200', likes: '2,871', free: false, price: '9,900원', badge: '▲ 5위 상승', badgeType: 'up' },
  { id: 3, rank: 3, emoji: '🛍️', ai: 'claude', aiLabel: 'Claude', diff: '보통', title: '쇼핑몰 상세페이지 문구 자동 생성', stars: '4.8', uses: '5,721', likes: '1,940', free: false, price: '4,900원', badge: '✦ 신규 진입', badgeType: 'new' },
];

const LIST_4_10 = [
  { id: 5, rank: 4, emoji: '🎬', ai: 'Runway', title: '숏폼 영상 생성 — 릴스·쇼츠 최적화', stars: '4.7', uses: '4,330', change: '▲ 2', changeType: 'up', free: true },
  { id: 2, rank: 5, emoji: '🏟️', ai: 'ChatGPT', title: '야구장에서 찍은 것 같은 내 사진', stars: '4.7', uses: '3,100', change: '— 유지', changeType: 'same', free: true },
  { id: 13, rank: 6, emoji: '🧠', ai: 'ChatGPT', title: 'ChatGPT 역할 부여로 전문가처럼 답변받기', stars: '4.8', uses: '2,980', change: '✦ 신규', changeType: 'new', free: false, price: '2,900원' },
  { id: 6, rank: 7, emoji: '✍️', ai: 'Claude', title: '인스타 감성 SNS 캡션 자동 생성', stars: '4.5', uses: '4,800', change: '▲ 1', changeType: 'up', free: true },
  { id: 7, rank: 8, emoji: '🎨', ai: 'Midjourney', title: '브랜드 로고 컨셉 무드보드 이미지', stars: '4.7', uses: '1,920', change: '▲ 3', changeType: 'up', free: false, price: '6,900원' },
  { id: 9, rank: 9, emoji: '🌆', ai: 'Midjourney', title: '영화 포스터 느낌 나는 내 사진', stars: '4.8', uses: '6,100', change: '— 유지', changeType: 'same', free: false, price: '3,900원' },
  { id: 8, rank: 10, emoji: '💼', ai: 'ChatGPT', title: '업무 이메일 상황별 빠르게 작성', stars: '4.4', uses: '7,300', change: '▲ 2', changeType: 'up', free: true },
];

const CAT_BEST = [
  { icon: '🎨', label: '이미지 생성', title: '지브리 감성 인물 사진 변환', stat: '★ 4.9 · 사용 8,214회', id: 1 },
  { icon: '🧠', label: 'AI 더 똑똑하게', title: 'ChatGPT 역할 부여로 전문가 답변받기', stat: '★ 4.8 · 사용 2,980회', id: 13 },
  { icon: '✍️', label: '글쓰기·콘텐츠', title: '쇼핑몰 상세페이지 문구 자동 생성', stat: '★ 4.8 · 사용 5,721회', id: 3 },
  { icon: '⚡', label: '업무 자동화', title: '광고 소재 100개 한 번에 뽑기', stat: '★ 4.9 · 사용 11,200회', id: 4 },
  { icon: '🎬', label: '영상·음악', title: '숏폼 영상 생성 — 릴스·쇼츠 최적화', stat: '★ 4.7 · 사용 4,330회', id: 5 },
  { icon: '💻', label: '개발·디자인', title: 'UI · 랜딩페이지 와이어프레임 설계', stat: '★ 4.6 · 사용 1,440회', id: 1 },
];

export default function TrendPage() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const router = useRouter();

  const badgeStyle = (type: string): React.CSSProperties => {
    if (type === 'hot') return { background: 'rgba(255,101,132,0.15)', color: 'var(--point)' };
    if (type === 'up') return { background: 'rgba(16,185,129,0.15)', color: 'var(--green)' };
    return { background: 'rgba(108,99,255,0.2)', color: 'var(--accent)' };
  };

  const changeStyle = (type: string): React.CSSProperties => {
    if (type === 'up') return { background: 'rgba(16,185,129,0.12)', color: 'var(--green)' };
    if (type === 'new') return { background: 'var(--accent-dim)', color: 'var(--accent)' };
    return { background: 'var(--surface2)', color: 'var(--subtle)' };
  };

  const rankColor = (rank: number) => {
    if (rank === 1) return 'var(--point)';
    if (rank === 2) return '#9B99B8';
    return '#BA7517';
  };

  return (
    <div>
      {/* 히어로 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,101,132,0.12) 0%, rgba(108,99,255,0.1) 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '3rem 2.5rem 2rem',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,101,132,0.15)', border: '1px solid rgba(255,101,132,0.3)',
          borderRadius: 100, padding: '4px 14px',
          fontSize: 12, color: 'var(--point)', fontFamily: 'var(--display)',
          fontWeight: 600, letterSpacing: '0.04em', marginBottom: '1rem',
        }}>
          🔥 매주 월요일 업데이트
        </div>
        <h1 style={{
          fontFamily: 'var(--display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem',
        }}>
          이번 주 <em style={{ fontStyle: 'normal', color: 'var(--point)' }}>베스트</em> 프롬프트
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: '1.75rem' }}>
          가장 많이 쓰이고 가장 많이 공유된 프롬프트만 골랐어요
        </p>
        <div style={{
          display: 'inline-flex', gap: 0,
          background: 'var(--surface2)', border: '1px solid var(--border2)',
          borderRadius: 10, padding: 3,
        }}>
          {(['weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '7px 22px', borderRadius: 7, fontSize: 14,
                fontFamily: 'var(--display)', fontWeight: 500, cursor: 'pointer',
                color: period === p ? 'var(--text)' : 'var(--muted)',
                background: period === p ? 'var(--surface)' : 'none',
                border: 'none',
                boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                transition: 'all .2s',
              }}
            >
              {p === 'weekly' ? '주간 베스트' : '월간 베스트'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem' }}>
        {/* TOP 3 섹션 타이틀 */}
        <div style={{
          fontFamily: 'var(--display)', fontSize: 13, fontWeight: 600,
          color: 'var(--subtle)', letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {period === 'weekly' ? '이번 주 TOP 3' : '이번 달 TOP 3'}
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* 포디움 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: '2.5rem' }}>
          {TOP3.map((item) => (
            <div
              key={item.rank}
              onClick={() => router.push(`/prompt/${item.id}`)}
              style={{
                background: 'var(--surface)',
                border: `1px solid ${item.rank === 1 ? 'rgba(255,101,132,0.4)' : 'var(--border)'}`,
                borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                transition: 'border-color .2s, transform .2s',
                position: 'relative',
              }}
            >
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', background: 'var(--surface2)', position: 'relative' }}>
                <span style={{ position: 'absolute', top: 12, left: 12, fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: rankColor(item.rank) }}>
                  #{item.rank}
                </span>
                {item.emoji}
                <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontFamily: 'var(--display)', fontWeight: 700, padding: '3px 8px', borderRadius: 6, ...badgeStyle(item.badgeType) }}>
                  {item.badge}
                </span>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 600, padding: '2px 8px', borderRadius: 5, letterSpacing: '0.05em', ...aiBadgeStyle[item.ai] }}>
                    {item.aiLabel}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--display)', padding: '2px 8px', borderRadius: 5, background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                    {item.diff}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 8, lineHeight: 1.4 }}>{item.title}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--subtle)' }}>
                  <span>★ {item.stars}</span>
                  <span>사용 {item.uses}회</span>
                  <span>♡ {item.likes}</span>
                </div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 600, marginTop: 10, color: item.free ? 'var(--green)' : 'var(--point)' }}>
                  {item.free ? '무료' : item.price}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 4~10위 */}
        <div style={{
          fontFamily: 'var(--display)', fontSize: 13, fontWeight: 600,
          color: 'var(--subtle)', letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          4위 — 10위
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '3rem' }}>
          {LIST_4_10.map((item) => (
            <div
              key={item.rank}
              onClick={() => router.push(`/prompt/${item.id}`)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 16,
                cursor: 'pointer', transition: 'border-color .15s',
              }}
            >
              <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: 'var(--subtle)', minWidth: 28, textAlign: 'center' }}>
                {item.rank}
              </div>
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>{item.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--subtle)', display: 'flex', gap: 10 }}>
                  <span>{item.ai}</span><span>★ {item.stars}</span><span>사용 {item.uses}회</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--display)', fontWeight: 600, padding: '2px 8px', borderRadius: 5, ...changeStyle(item.changeType) }}>
                  {item.change}
                </span>
                <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 600, color: item.free ? 'var(--green)' : 'var(--point)' }}>
                  {item.free ? '무료' : item.price}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 카테고리별 1위 */}
        <div style={{
          fontFamily: 'var(--display)', fontSize: 13, fontWeight: 600,
          color: 'var(--subtle)', letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          카테고리별 이번 주 1위
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: '3rem' }}>
          {CAT_BEST.map((item) => (
            <div
              key={item.label}
              onClick={() => router.push(`/prompt/${item.id}`)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 16px',
                cursor: 'pointer', transition: 'border-color .15s, transform .15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--display)', fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {item.label}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 6, lineHeight: 1.4 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: 'var(--subtle)' }}>{item.stat}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
