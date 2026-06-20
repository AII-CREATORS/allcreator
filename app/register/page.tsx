'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['이미지', '글쓰기', '마케팅', '업무', '영상', '개발'];
const DIFFICULTIES = ['입문', '중급', '고급'];
const AI_TOOLS = ['ChatGPT', 'Claude', 'Midjourney', 'Gemini', 'Runway', 'Suno'];

export default function RegisterPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('이미지');
  const [difficulty, setDifficulty] = useState('입문');
  const [selectedAIs, setSelectedAIs] = useState<string[]>([]);
  const [promptText, setPromptText] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  function toggleAI(ai: string) {
    setSelectedAIs((prev) => prev.includes(ai) ? prev.filter((a) => a !== ai) : [...prev, ai]);
  }

  function handleSubmit() {
    if (!title.trim()) return alert('제목을 입력해주세요');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      router.push('/');
    }, 2500);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file.name);
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2.5rem' }}>
      <button
        onClick={() => router.back()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--muted)', cursor: 'pointer', marginBottom: '1.75rem', fontFamily: 'var(--display)', background: 'none', border: 'none', padding: 0 }}
      >
        ← 뒤로가기
      </button>

      <div style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700, marginBottom: '0.5rem' }}>프롬프트 등록하기</div>
      <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '2rem' }}>검증된 프롬프트를 공유하고 수익을 만들어보세요</div>

      {/* 기본 정보 */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: 12, color: 'var(--subtle)', fontFamily: 'var(--display)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>기본 정보</div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--display)', marginBottom: 6 }}>프롬프트 제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            placeholder="예) 지브리 감성 인물 사진 변환"
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: 'var(--text)', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--display)', marginBottom: 6 }}>한 줄 설명</label>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            type="text"
            placeholder="어떤 결과물이 나오는지 간단히 설명해줘요"
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: 'var(--text)', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--display)', marginBottom: 6 }}>카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 9, padding: '11px 14px', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--sans)', outline: 'none', appearance: 'none' as const }}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--display)', marginBottom: 6 }}>난이도</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 9, padding: '11px 14px', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--sans)', outline: 'none', appearance: 'none' as const }}
            >
              {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* AI 도구 선택 */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: 12, color: 'var(--subtle)', fontFamily: 'var(--display)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>AI 도구</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {AI_TOOLS.map((ai) => (
            <div
              key={ai}
              onClick={() => toggleAI(ai)}
              style={{
                border: `1px solid ${selectedAIs.includes(ai) ? 'var(--accent-border)' : 'var(--border2)'}`,
                borderRadius: 8, padding: '8px 16px',
                fontSize: 13, fontFamily: 'var(--display)',
                color: selectedAIs.includes(ai) ? 'var(--accent)' : 'var(--muted)',
                background: selectedAIs.includes(ai) ? 'var(--accent-dim)' : 'var(--surface2)',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {ai}
            </div>
          ))}
        </div>
      </div>

      {/* 프롬프트 내용 */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: 12, color: 'var(--subtle)', fontFamily: 'var(--display)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>프롬프트 내용</div>
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="실제 AI에 입력할 프롬프트를 작성해주세요..."
          rows={8}
          style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '14px', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--sans)', outline: 'none', resize: 'vertical', lineHeight: 1.7, boxSizing: 'border-box' }}
        />
      </div>

      {/* 이미지 업로드 */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: 12, color: 'var(--subtle)', fontFamily: 'var(--display)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>결과물 이미지 (선택)</div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border2)'}`,
            borderRadius: 12, padding: '2.5rem',
            textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'var(--accent-dim)' : 'var(--surface2)',
            transition: 'all .2s',
          }}
        >
          {uploadedFile ? (
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{uploadedFile}</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📁</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: '0.4rem' }}>이미지를 드래그하거나 클릭해서 업로드</div>
              <div style={{ fontSize: 12, color: 'var(--subtle)' }}>PNG, JPG, GIF · 최대 10MB</div>
            </div>
          )}
        </div>
        <input id="file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) setUploadedFile(e.target.files[0].name); }} />
      </div>

      {/* 가격 설정 */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: 12, color: 'var(--subtle)', fontFamily: 'var(--display)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>가격 설정</div>
        <div style={{ display: 'flex', gap: 0, background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 10, padding: 3, marginBottom: '1rem', width: 'fit-content' }}>
          {[true, false].map((free) => (
            <button
              key={String(free)}
              onClick={() => setIsFree(free)}
              style={{
                padding: '8px 24px', borderRadius: 7, fontSize: 14,
                fontFamily: 'var(--display)', fontWeight: 500, cursor: 'pointer',
                color: isFree === free ? 'var(--text)' : 'var(--muted)',
                background: isFree === free ? 'var(--surface)' : 'none',
                border: 'none',
                boxShadow: isFree === free ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                transition: 'all .2s',
              }}
            >
              {free ? '무료' : '유료'}
            </button>
          ))}
        </div>
        {!isFree && (
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--display)', marginBottom: 6 }}>판매 가격 (원)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              placeholder="예) 2900"
              min="100"
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 9, padding: '11px 14px', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        style={{ width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700, padding: 17, cursor: 'pointer', transition: 'opacity .15s' }}
      >
        프롬프트 등록하기
      </button>

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
        프롬프트가 등록됐어요! 🎉
      </div>
    </div>
  );
}
