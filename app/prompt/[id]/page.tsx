'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SAMPLE_PROMPTS } from '../../lib/data';

const PROMPT_TEXTS: Record<string, string> = {
  chatgpt: '아래 사진 속 인물을 지브리 스튜디오 애니메이션 스타일로 바꿔줘. 인물의 표정과 분위기는 그대로 살리되, 피부와 눈은 지브리 특유의 맑고 따뜻한 색감으로 표현해줘. 배경은 일본 시골 마을 풍경이나 꽃밭으로 자연스럽게 합성해주고, 전체적으로 여름 오후의 따뜻한 햇빛이 느껴지게 해줘.',
  claude: '첨부한 사진의 인물을 지브리 스튜디오 스타일 애니메이션으로 변환해 주세요. 다음 요소들을 반드시 포함해 주세요:\n1. 인물 특징(표정, 헤어스타일, 옷차림)을 최대한 유지\n2. 지브리 특유의 맑고 투명한 눈 표현\n3. 파스텔톤의 따뜻한 색감\n4. 배경: 여름 꽃밭 또는 일본 시골 마을\n5. 자연광이 부드럽게 퍼지는 분위기',
  midjourney: '/imagine a person in Studio Ghibli anime style, soft watercolor illustration, warm summer afternoon light, Japanese countryside background with wildflowers, clear expressive eyes, pastel color palette, gentle and nostalgic atmosphere --ar 3:4 --style raw --stylize 750',
};

const aiBadgeStyle: Record<string, React.CSSProperties> = {
  chatgpt: { background: 'rgba(16,185,129,0.15)', color: '#10B981' },
  claude: { background: 'var(--accent-dim)', color: 'var(--accent)' },
  midjourney: { background: 'rgba(251,191,36,0.12)', color: 'var(--point)' },
  runway: { background: 'rgba(251,191,36,0.12)', color: '#FBBF24' },
};

const REVIEWS = [
  { name: '김지은', initial: '김', date: '3일 전', stars: 5, text: 'ChatGPT에 그대로 붙여넣었는데 첫 시도에 바로 지브리 느낌이 나왔어요! 배경까지 예쁘게 나와서 인스타에 바로 올렸습니다 ㅎㅎ', bg: 'rgba(108,99,255,0.2)', color: 'var(--accent)' },
  { name: '박민준', initial: '박', date: '1주 전', stars: 4, text: 'Midjourney 버전이 특히 색감이 예쁘게 나왔어요. 처음엔 비슷하게 안 나와서 프롬프트 조금 수정했는데 그 다음엔 완벽했어요.', bg: 'rgba(255,101,132,0.15)', color: 'var(--point)' },
  { name: '이수진', initial: '이', date: '2주 전', stars: 5, text: 'Claude 버전으로 했는데 설명이 너무 자세하게 나와서 오히려 더 좋았어요. AI가 어떻게 처리하는지 과정도 알려줘서 다음에 혼자서도 할 수 있을 것 같아요.', bg: 'rgba(16,185,129,0.15)', color: 'var(--green)' },
];

export default function PromptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const prompt = SAMPLE_PROMPTS.find((p) => p.id === id) || SAMPLE_PROMPTS[0];

  const [activeTab, setActiveTab] = useState('chatgpt');
  const [activeThumb, setActiveThumb] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedAI, setSelectedAI] = useState('ChatGPT');

  const thumbs = [prompt.emoji, '🌿', '🌊', '🌙'];

  function copyPrompt() {
    const text = PROMPT_TEXTS[activeTab] || PROMPT_TEXTS.chatgpt;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem', alignItems: 'start' }}>
      {/* 왼쪽 */}
      <div>
        <button
          onClick={() => router.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--muted)', cursor: 'pointer', marginBottom: '1.75rem', fontFamily: 'var(--display)', background: 'none', border: 'none', padding: 0, transition: 'color .15s' }}
        >
          ← 탐색으로 돌아가기
        </button>

        {/* 미리보기 */}
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: '1.75rem' }}>
          <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid var(--border2)', borderRadius: 8, padding: '4px 12px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--display)' }}>
              결과물 미리보기
            </div>
            {thumbs[activeThumb]}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--border)' }}>
            {thumbs.map((t, i) => (
              <div
                key={i}
                onClick={() => setActiveThumb(i)}
                style={{ height: 64, flex: 1, background: 'var(--surface)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', cursor: 'pointer', border: `2px solid ${activeThumb === i ? 'var(--accent)' : 'transparent'}`, transition: 'border-color .15s' }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* 메타 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--display)', fontWeight: 600, padding: '3px 10px', borderRadius: 6, ...aiBadgeStyle[prompt.ai] }}>{prompt.aiLabel}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--display)', fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>쉬움</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--display)', fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: 'var(--point-dim)', color: 'var(--point)' }}>🔥 이번 주 인기</span>
          </div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem', lineHeight: 1.2 }}>
            {prompt.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
            <span style={{ color: '#FBBF24', fontSize: 15, letterSpacing: 1 }}>★★★★★</span>
            <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15 }}>{prompt.stars}</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>(리뷰 287개)</span>
            <span style={{ fontSize: 13, color: 'var(--subtle)' }}>· 사용 {prompt.downloads}회</span>
          </div>
          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, marginBottom: '1.5rem' }}>
            {prompt.desc} ChatGPT, Claude, Midjourney 3가지 버전을 모두 제공해서 어떤 AI를 쓰든 바로 사용할 수 있어요.
          </p>
        </div>

        {/* AI 탭 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
          {[['chatgpt', 'ChatGPT 버전'], ['claude', 'Claude 버전'], ['midjourney', 'Midjourney 버전']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13,
                fontFamily: 'var(--display)', fontWeight: 500, cursor: 'pointer',
                border: `1px solid ${activeTab === key ? 'var(--accent-border)' : 'var(--border2)'}`,
                background: activeTab === key ? 'var(--accent-dim)' : 'var(--surface2)',
                color: activeTab === key ? 'var(--accent)' : 'var(--muted)',
                transition: 'all .2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 프롬프트 박스 */}
        <div style={{ background: 'var(--brand2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{ fontSize: 11, color: 'var(--subtle)', fontFamily: 'var(--display)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            AI에게 이렇게 물어보세요
          </div>
          <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.75, whiteSpace: 'pre-wrap', filter: prompt.free ? 'none' : 'none' }}>
            {PROMPT_TEXTS[activeTab] || PROMPT_TEXTS.chatgpt}
          </div>
          <button
            onClick={copyPrompt}
            style={{ position: 'absolute', top: 12, right: 12, background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '5px 12px', fontSize: 12, color: copied ? 'var(--green)' : 'var(--muted)', fontFamily: 'var(--display)', cursor: 'pointer', transition: 'all .2s' }}
          >
            {copied ? '복사됨 ✓' : '복사'}
          </button>
        </div>

        {/* 리뷰 */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600, marginBottom: '1.25rem' }}>리뷰 287개</h3>
          {REVIEWS.map((r) => (
            <div key={r.name} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.5rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, fontFamily: 'var(--display)', flexShrink: 0, background: r.bg, color: r.color }}>
                  {r.initial}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</span>
                <span style={{ fontSize: 12, color: 'var(--subtle)', marginLeft: 'auto' }}>{r.date}</span>
              </div>
              <div style={{ color: '#FBBF24', fontSize: 12, marginBottom: 4 }}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽: 구매 패널 */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', position: 'sticky', top: 80 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: '1.5rem' }}>
          {prompt.free ? (
            <span style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 700, color: 'var(--green)' }}>무료</span>
          ) : (
            <>
              <span style={{ fontFamily: 'var(--display)', fontSize: 32, fontWeight: 700 }}>{prompt.price}</span>
              <span style={{ fontSize: 16, color: 'var(--subtle)', textDecoration: 'line-through' }}>₩7,000</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--point)', background: 'var(--point-dim)', padding: '3px 8px', borderRadius: 6 }}>44% 할인</span>
            </>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 12, color: 'var(--subtle)', fontFamily: 'var(--display)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>포함 내용</div>
          {['ChatGPT / Claude / Midjourney 3가지 버전', '사용 방법 단계별 가이드', '결과물이 안 나올 때 팁 포함', '업데이트 시 무료 재다운로드'].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--muted)', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span> {item}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: 12, color: 'var(--subtle)', fontFamily: 'var(--display)', display: 'block', marginBottom: '0.5rem' }}>어떤 AI로 사용하세요?</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['ChatGPT', 'Claude', 'Midjourney', '모두 필요해요'].map((ai) => (
              <div
                key={ai}
                onClick={() => setSelectedAI(ai)}
                style={{
                  border: `1px solid ${selectedAI === ai ? 'var(--accent-border)' : 'var(--border2)'}`,
                  borderRadius: 8, padding: '8px 10px',
                  fontSize: 13, fontFamily: 'var(--display)',
                  color: selectedAI === ai ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer', textAlign: 'center',
                  background: selectedAI === ai ? 'var(--accent-dim)' : 'var(--surface2)',
                  transition: 'all .15s',
                }}
              >
                {ai}
              </div>
            ))}
          </div>
        </div>

        {prompt.free ? (
          <button
            onClick={copyPrompt}
            style={{ width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, padding: 15, cursor: 'pointer', transition: 'opacity .15s', marginBottom: '0.75rem' }}
          >
            {copied ? '복사됨 ✓' : '복사하기'}
          </button>
        ) : (
          <button
            onClick={() => router.push(`/purchase/${prompt.id}`)}
            style={{ width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, padding: 15, cursor: 'pointer', transition: 'opacity .15s', marginBottom: '0.75rem' }}
          >
            {prompt.price}에 구매하기
          </button>
        )}
        <button style={{ width: '100%', background: 'none', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--muted)', fontFamily: 'var(--display)', fontSize: 14, fontWeight: 500, padding: 12, cursor: 'pointer', transition: 'all .2s' }}>
          미리보기 (일부 공개)
        </button>

        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            🎨
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>AIPromptKR</span>
              <span style={{ fontSize: 10, fontFamily: 'var(--display)', fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', borderRadius: 5, padding: '2px 7px' }}>✓ 인증</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtle)' }}>프롬프트 38개 · 판매 12,000회+</div>
          </div>
        </div>
      </div>
    </div>
  );
}
