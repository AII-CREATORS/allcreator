/**
 * SupabaseManager.js
 * Supabase 클라이언트 싱글톤 관리
 * 사용: SupabaseManager.getInstance().getClient()
 */

var SupabaseManager = class SupabaseManager {

    constructor() {
        this.client = null;
        this.SUPABASE_URL  = 'https://gnwpnesdjjjoevregdmo.supabase.co';
        this.SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdud3BuZXNkampqb2V2cmVnZG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4Mzc0NTYsImV4cCI6MjA5NzQxMzQ1Nn0.dDgFtamVvsY63ubxByE3s8JGC0dFwrPTbfVJZSRxIKs';
    }

    //-- 싱글톤 인스턴스 반환
    static getInstance() {
        if (!SupabaseManager._instance) {
            SupabaseManager._instance = new SupabaseManager();
            SupabaseManager._instance._init();
        }
        return SupabaseManager._instance;
    }

    //-- 초기화
    _init() {
        this.client = supabase.createClient(this.SUPABASE_URL, this.SUPABASE_KEY);
        console.log('[SupabaseManager] 초기화 완료');
    }

    //-- 클라이언트 반환
    getClient() {
        return this.client;
    }

    //-- 현재 로그인 유저 반환
    async getUser() {
        const { data: { user } } = await this.client.auth.getUser();
        return user;
    }

    //-- 로그아웃
    async signOut() {
        const { error } = await this.client.auth.signOut();
        if (error) console.error('[SupabaseManager] 로그아웃 실패:', error.message);
        return error;
    }
};

SupabaseManager._instance = null;

// 아무 View의 onInitDone 또는 테스트 버튼 이벤트에 작성
async function testSupabaseConnection() {
    const db = SupabaseManager.getInstance().getClient();

    // ai_tools 테이블에서 데이터 1개 조회 (연결 확인용)
    const { data, error } = await db
        .from('ai_tools')
        .select('name')
        .limit(1);

    if (error) {
        console.error('❌ Supabase 연결 실패:', error.message);
    } else {
        console.log('✅ Supabase 연결 성공:', data);
    }
}

testSupabaseConnection();