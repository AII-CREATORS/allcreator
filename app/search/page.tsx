'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PromptCard from '../components/PromptCard';
import { SAMPLE_PROMPTS } from '../lib/data';

const CATEGORY_FILTERS = ['전체', '🎨 이미지 생성', '✍️ 글쓰기', '⚡ 업무 자동화', '🎬 영상·음악'];
const AI_FILTERS = ['무료만', 'ChatGPT', 'Claude', 'Midjourney'];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [activeFilter, setActiveFilter] = useState('전체');

  const filtered = SAMPLE_PROMPTS.filter((p) => {
    const matchQuery = !query || p.title.includes(query) || p.desc.includes(query) || p.emoji.includes(query);
    if (activeFilter === '전체') return matchQuery;
    if (activeFilter === '무료만') return matchQuery && p.free;
    if (activeFilter === 'ChatGPT') return matchQuery && p.ai === 'chatgpt';
    if (activeFilter === 'Claude') return matchQuery && p.ai === 'claude';
    if (activeFilter === 'Midjourney') return matchQuery && p.ai === 'midjourney';
    if (activeFilter.includes('이미지')) return matchQuery && p.category === '이미지';
    if (activeFilter.includes('글쓰기')) return matchQuery && p.category === '글쓰기';
    if (activeFilter.includes('업무')) return matchQuery && p.category === '업무';
    if (activeFilter.includes('영상')) return matchQuery && p.category === '영상';
    return matchQuery;
  });

  return (
    <div>
      {/* 검색 결과 헤더 */}
      <div style={{ padding: '1.75rem 2.5rem 0', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, marginBottom: '0.4rem' }}>
          "<em style={{ color: 'var(--accent)', fontStyle: 'normal' }}>{query}</em>" 검색 결과
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '1.25rem' }}>
          {filtered.length}개의 프롬프트
        </div>

        {/* 필터 바 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: 12, color: 'var(--subtle)', fontFamily: 'var(--display)', whiteSpace: 'nowrap' }}>필터</span>
          {CATEGORY_FILTERS.map((f) => (
            <div
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: activeFilter === f ? 'var(--accent-dim)' : 'var(--surface2)',
                border: `1px solid ${activeFilter === f ? 'var(--accent-border)' : 'var(--border2)'}`,
                color: activeFilter === f ? 'var(--accent)' : 'var(--muted)',
                borderRadius: 100, padding: '6px 14px',
                fontSize: 13, cursor: 'pointer',
                fontFamily: 'var(--display)', whiteSpace: 'nowrap',
                transition: 'all .2s',
              }}
            >
              {f}
            </div>
          ))}
          <div style={{ width: 1, height: 18, background: 'var(--border2)', flexShrink: 0 }} />
          {AI_FILTERS.map((f) => (
            <div
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: activeFilter === f ? 'var(--accent-dim)' : 'var(--surface2)',
                border: `1px solid ${activeFilter === f ? 'var(--accent-border)' : 'var(--border2)'}`,
                color: activeFilter === f ? 'var(--accent)' : 'var(--muted)',
                borderRadius: 100, padding: '6px 14px',
                fontSize: 13, cursor: 'pointer',
                fontFamily: 'var(--display)', whiteSpace: 'nowrap',
                transition: 'all .2s',
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* 결과 그리드 */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.5rem 4rem' }}>
        {filtered.length > 0 ? (
          <div style={{ columns: 4, gap: 16 }}>
            {filtered.map((p) => (
              <PromptCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 600, marginBottom: '0.5rem' }}>
              검색 결과가 없어요
            </h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '1.5rem' }}>
              다른 키워드로 검색하거나 아래 인기 태그를 눌러보세요
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['지브리 스타일', '광고 문구', '사진 변환', 'SNS 게시글', '이메일 작성'].map((tag) => (
                <span
                  key={tag}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)}
                  style={{
                    background: 'var(--surface2)', border: '1px solid var(--border2)',
                    borderRadius: 100, padding: '5px 14px',
                    fontSize: 13, color: 'var(--muted)', cursor: 'pointer',
                    transition: 'all .2s',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>검색 중...</div>}>
      <SearchContent />
    </Suspense>
  );
}
