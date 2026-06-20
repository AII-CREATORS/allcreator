'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PromptCard, { Prompt } from './components/PromptCard';

const SAMPLE_PROMPTS: Prompt[] = [
  { id: 1, emoji: '🌸', height: 'tall', ai: 'midjourney', aiLabel: 'Midjourney', diff: 'easy', diffLabel: '입문', title: '지브리 스타일 인물 사진', desc: '내 사진을 지브리 애니메이션 스타일로 변환해요', stars: '4.9', downloads: '2.3k', free: false, price: '₩2,900' },
  { id: 2, emoji: '📝', height: 'med', ai: 'chatgpt', aiLabel: 'ChatGPT', diff: 'easy', diffLabel: '입문', title: '쇼핑몰 상세페이지 문구', desc: '제품 특징을 입력하면 구매 욕구를 자극하는 문구 완성', stars: '4.7', downloads: '1.8k', free: true },
  { id: 3, emoji: '🎬', height: 'short', ai: 'runway', aiLabel: 'Runway', diff: 'mid', diffLabel: '중급', title: '유튜브 썸네일 생성', desc: '클릭률 높은 썸네일을 AI로 자동 생성', stars: '4.8', downloads: '956', free: false, price: '₩1,900' },
  { id: 4, emoji: '🌿', height: 'tall', ai: 'midjourney', aiLabel: 'Midjourney', diff: 'easy', diffLabel: '입문', title: '자연 풍경 고퀄 이미지', desc: '감성적인 자연 풍경 사진을 AI로 생성', stars: '4.6', downloads: '1.2k', free: true },
  { id: 5, emoji: '📣', height: 'med', ai: 'chatgpt', aiLabel: 'ChatGPT', diff: 'easy', diffLabel: '입문', title: 'SNS 광고 문구 5종', desc: '인스타그램/페이스북 광고용 카피 5개 자동 생성', stars: '4.9', downloads: '3.1k', free: false, price: '₩990' },
  { id: 6, emoji: '🤖', height: 'short', ai: 'claude', aiLabel: 'Claude', diff: 'mid', diffLabel: '중급', title: '업무 보고서 자동화', desc: '데이터를 붙여넣으면 깔끔한 보고서로 변환', stars: '4.8', downloads: '879', free: false, price: '₩3,900' },
  { id: 7, emoji: '🎨', height: 'med', ai: 'midjourney', aiLabel: 'Midjourney', diff: 'easy', diffLabel: '입문', title: '로고 디자인 아이디어', desc: '브랜드명 입력만으로 로고 컨셉 10개 생성', stars: '4.5', downloads: '2.7k', free: true },
  { id: 8, emoji: '✍️', height: 'tall', ai: 'claude', aiLabel: 'Claude', diff: 'easy', diffLabel: '입문', title: '블로그 글 자동 작성', desc: '키워드만 입력하면 SEO 최적화 블로그 글 완성', stars: '4.7', downloads: '1.5k', free: false, price: '₩1,490' },
];

const FILTERS = ['전체', '🎨 이미지 생성', '✍️ 글쓰기', '🎬 영상', '⚡ 업무 자동화', '📣 마케팅'];
const AI_FILTERS = ['무료만', 'ChatGPT', 'Claude', 'Midjourney'];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  function doSearch() {
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  }

  return (
    <>
      {/* HERO */}
      <div style={{ padding: '5rem 2.5rem 3rem', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
          borderRadius: 100, padding: '5px 14px',
          fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--display)',
          fontWeight: 600, letterSpacing: '0.04em', marginBottom: '1.75rem',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          ✦ 검증된 프롬프트 12,400개+
        </div>

        <h1 style={{
          fontFamily: 'var(--display)', fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
          fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em',
          color: 'var(--text)', marginBottom: '1.25rem',
        }}>
          원하는 결과를 먼저 보고<br />
          <em style={{ fontStyle: 'normal', color: 'var(--point)' }}>프롬프트</em>를 선택하세요
        </h1>

        <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 520, margin: '0 auto 2.5rem' }}>
          AI에게 뭐라고 물어봐야 할지 몰라도 괜찮아요.<br />결과 이미지를 보고 바로 쓸 수 있어요.
        </p>

        <div style={{
          display: 'flex', gap: 0,
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 14, overflow: 'hidden',
          maxWidth: 640, margin: '0 auto 1.25rem',
          boxShadow: '0 0 0 4px var(--accent-dim)',
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            placeholder="예) 지브리 스타일 내 사진, 쇼핑몰 상세페이지 문구..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontFamily: 'var(--sans)', fontSize: 16, color: 'var(--text)',
              padding: '0 1.25rem', height: 56,
            }}
          />
          <button
            onClick={doSearch}
            style={{
              background: 'var(--accent)', border: 'none', color: '#fff',
              fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15,
              padding: '0 1.75rem', cursor: 'pointer',
            }}
          >
            검색
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['🎨 지브리 스타일', '📸 야구장 사진', '🛒 상세페이지', '📣 광고 문구', '🎬 유튜브 썸네일', '✍️ SNS 게시글'].map((tag) => (
            <span
              key={tag}
              onClick={() => { setSearchQuery(tag.slice(3)); doSearch(); }}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: 100, padding: '5px 14px',
                fontSize: 13, color: 'var(--muted)', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{
        padding: '1.25rem 2.5rem', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '1rem', overflowX: 'auto',
      }}>
        <span style={{ fontSize: 12, color: 'var(--subtle)', fontFamily: 'var(--display)', whiteSpace: 'nowrap' }}>카테고리</span>
        {FILTERS.map((f) => (
          <div
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              background: activeFilter === f ? 'var(--accent-dim)' : 'var(--surface2)',
              border: `1px solid ${activeFilter === f ? 'var(--accent-border)' : 'var(--border2)'}`,
              color: activeFilter === f ? 'var(--accent)' : 'var(--muted)',
              borderRadius: 8, padding: '6px 14px',
              fontSize: 13, cursor: 'pointer',
              whiteSpace: 'nowrap', fontFamily: 'var(--display)',
            }}
          >
            {f}
          </div>
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--border2)', flexShrink: 0 }} />
        {AI_FILTERS.map((f) => (
          <div
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              background: activeFilter === f ? 'var(--accent-dim)' : 'var(--surface2)',
              border: `1px solid ${activeFilter === f ? 'var(--accent-border)' : 'var(--border2)'}`,
              color: activeFilter === f ? 'var(--accent)' : 'var(--muted)',
              borderRadius: 8, padding: '6px 14px',
              fontSize: 13, cursor: 'pointer',
              whiteSpace: 'nowrap', fontFamily: 'var(--display)',
            }}
          >
            {f}
          </div>
        ))}
      </div>

      {/* MASONRY FEED */}
      <div style={{ padding: '2rem 2.5rem 4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: 17, fontWeight: 600 }}>지금 인기 프롬프트</h2>
          <span style={{ fontSize: 13, color: 'var(--subtle)' }}>12,413개의 프롬프트</span>
        </div>
        <div style={{ columns: 4, gap: 16 }}>
          {SAMPLE_PROMPTS.map((p) => (
            <PromptCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </>
  );
}
