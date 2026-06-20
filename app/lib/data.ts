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
  category?: string;
};

export const SAMPLE_PROMPTS: Prompt[] = [
  { id: 1, emoji: '🌸', height: 'tall', ai: 'midjourney', aiLabel: 'Midjourney', diff: 'easy', diffLabel: '입문', title: '지브리 스타일 인물 사진', desc: '내 사진을 지브리 애니메이션 스타일로 변환해요', stars: '4.9', downloads: '2.3k', free: false, price: '₩2,900', category: '이미지' },
  { id: 2, emoji: '🏟️', height: 'med', ai: 'chatgpt', aiLabel: 'ChatGPT', diff: 'easy', diffLabel: '입문', title: '야구장에서 찍은 것 같은 내 사진', desc: '야구장 배경으로 자연스럽게 합성된 사진 생성', stars: '4.7', downloads: '1.8k', free: true, category: '이미지' },
  { id: 3, emoji: '🛍️', height: 'short', ai: 'claude', aiLabel: 'Claude', diff: 'easy', diffLabel: '입문', title: '쇼핑몰 상세페이지 문구', desc: '제품 특징을 입력하면 구매 욕구를 자극하는 문구 완성', stars: '4.8', downloads: '956', free: false, price: '₩4,900', category: '글쓰기' },
  { id: 4, emoji: '📣', height: 'tall', ai: 'chatgpt', aiLabel: 'ChatGPT', diff: 'easy', diffLabel: '입문', title: 'SNS 광고 문구 5종', desc: '인스타그램/페이스북 광고용 카피 5개 자동 생성', stars: '4.9', downloads: '3.1k', free: false, price: '₩990', category: '마케팅' },
  { id: 5, emoji: '🎬', height: 'med', ai: 'runway', aiLabel: 'Runway', diff: 'mid', diffLabel: '중급', title: '유튜브 썸네일 생성', desc: '클릭률 높은 썸네일을 AI로 자동 생성', stars: '4.8', downloads: '1.2k', free: false, price: '₩1,900', category: '영상' },
  { id: 6, emoji: '✍️', height: 'short', ai: 'claude', aiLabel: 'Claude', diff: 'easy', diffLabel: '입문', title: 'SNS 게시글 자동 작성', desc: '키워드만 입력하면 감성 넘치는 SNS 게시글 완성', stars: '4.5', downloads: '2.1k', free: true, category: '글쓰기' },
  { id: 7, emoji: '🎨', height: 'med', ai: 'midjourney', aiLabel: 'Midjourney', diff: 'easy', diffLabel: '입문', title: '로고 디자인 아이디어', desc: '브랜드명 입력만으로 로고 컨셉 10개 생성', stars: '4.5', downloads: '2.7k', free: true, category: '이미지' },
  { id: 8, emoji: '💼', height: 'tall', ai: 'chatgpt', aiLabel: 'ChatGPT', diff: 'easy', diffLabel: '입문', title: '업무 이메일 상황별 작성', desc: '상황을 설명하면 깔끔한 업무 이메일 자동 완성', stars: '4.7', downloads: '1.5k', free: true, category: '업무' },
  { id: 9, emoji: '🌆', height: 'short', ai: 'midjourney', aiLabel: 'Midjourney', diff: 'mid', diffLabel: '중급', title: '영화 포스터 느낌 나는 내 사진', desc: '영화 포스터 스타일로 드라마틱하게 변환', stars: '4.8', downloads: '890', free: false, price: '₩3,900', category: '이미지' },
  { id: 10, emoji: '📊', height: 'med', ai: 'claude', aiLabel: 'Claude', diff: 'mid', diffLabel: '중급', title: '업무 보고서 자동화', desc: '데이터를 붙여넣으면 깔끔한 보고서로 변환', stars: '4.8', downloads: '879', free: false, price: '₩3,900', category: '업무' },
  { id: 11, emoji: '🌊', height: 'tall', ai: 'midjourney', aiLabel: 'Midjourney', diff: 'easy', diffLabel: '입문', title: '자연 여행 감성 사진', desc: '감성적인 자연 풍경 사진을 AI로 생성', stars: '4.6', downloads: '1.2k', free: true, category: '이미지' },
  { id: 12, emoji: '🤖', height: 'short', ai: 'chatgpt', aiLabel: 'ChatGPT', diff: 'mid', diffLabel: '중급', title: '고객 응대 챗봇 스크립트', desc: '업종별 고객 응대 자동화 챗봇 대화 스크립트', stars: '4.6', downloads: '744', free: false, price: '₩5,900', category: '업무' },
  { id: 13, emoji: '🧠', height: 'med', ai: 'chatgpt', aiLabel: 'ChatGPT', diff: 'easy', diffLabel: '입문', title: 'ChatGPT 역할 부여 전문가 답변', desc: '전문가 역할을 부여해 더 정확한 답변 받기', stars: '4.8', downloads: '2.9k', free: false, price: '₩2,900', category: '업무' },
  { id: 14, emoji: '📝', height: 'tall', ai: 'claude', aiLabel: 'Claude', diff: 'mid', diffLabel: '중급', title: '자기소개서 자동 완성', desc: '경험을 입력하면 설득력 있는 자소서 완성', stars: '4.9', downloads: '4.2k', free: false, price: '₩6,900', category: '글쓰기' },
  { id: 15, emoji: '🏠', height: 'short', ai: 'midjourney', aiLabel: 'Midjourney', diff: 'easy', diffLabel: '입문', title: '인테리어 리모델링 시뮬레이션', desc: '방 사진을 원하는 스타일로 리모델링 시각화', stars: '4.7', downloads: '1.6k', free: false, price: '₩3,900', category: '이미지' },
];
