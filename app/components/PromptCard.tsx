'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type Prompt = {
  id: number;
  emoji: string;
  height: 'short' | 'med' | 'tall';
  ai: 'chatgpt' | 'claude' | 'midjourney' | 'runway';
  aiLabel: string;
  diff: 'easy' | 'mid';
  diffLabel: string;
  title: string;
  desc: string;
  stars: string;
  downloads: string;
  free: boolean;
  price?: string;
};

const heightMap = { short: 140, med: 190, tall: 240 };
const aiBadgeStyle: Record<string, React.CSSProperties> = {
  chatgpt: { background: 'rgba(16,185,129,0.15)', color: '#10B981' },
  claude:  { background: 'var(--accent-dim)', color: 'var(--accent)' },
  midjourney: { background: 'rgba(251,191,36,0.12)', color: 'var(--point)' },
  runway:  { background: 'rgba(251,191,36,0.12)', color: '#FBBF24' },
};
const diffStyle: Record<string, React.CSSProperties> = {
  easy: { background: 'rgba(16,185,129,0.12)', color: '#10B981' },
  mid:  { background: 'rgba(251,191,36,0.12)', color: '#FBBF24' },
};

export default function PromptCard({ p }: { p: Prompt }) {
  const [liked, setLiked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/prompt/${p.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        breakInside: 'avoid',
        background: 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--accent-border)' : 'var(--border)'}`,
        borderRadius: 14, overflow: 'hidden',
        marginBottom: 16, cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'border-color .2s, transform .2s',
      }}
    >
      {/* 이미지 영역 */}
      <div style={{ position: 'relative', background: 'var(--surface2)' }}>
        <div style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem', height: heightMap[p.height],
        }}>
          {p.emoji}
        </div>
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(108,99,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); }}
              style={{
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8,
                color: '#fff', fontSize: 13, fontFamily: 'var(--display)',
                fontWeight: 600, padding: '8px 18px', cursor: 'pointer',
              }}
            >
              미리보기
            </button>
          </div>
        )}
      </div>

      {/* 본문 */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 600, padding: '2px 8px', borderRadius: 5, letterSpacing: '0.05em', ...aiBadgeStyle[p.ai] }}>
            {p.aiLabel}
          </span>
          <span style={{ fontSize: 10, fontFamily: 'var(--display)', padding: '2px 8px', borderRadius: 5, marginLeft: 'auto', ...diffStyle[p.diff] }}>
            {p.diffLabel}
          </span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 6, lineHeight: 1.4 }}>{p.title}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{p.desc}</div>
      </div>

      {/* 푸터 */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#FBBF24' }}>★ {p.stars}</span>
        <span style={{ fontSize: 12, color: 'var(--subtle)' }}>↓ {p.downloads}</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--display)', fontSize: 13, fontWeight: 600, color: p.free ? 'var(--green)' : 'var(--point)' }}>
          {p.free ? '무료' : p.price}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          style={{ background: 'none', border: 'none', color: liked ? 'var(--point)' : 'var(--subtle)', cursor: 'pointer', fontSize: 16, padding: 0 }}
        >
          {liked ? '♥' : '♡'}
        </button>
      </div>
    </div>
  );
}
