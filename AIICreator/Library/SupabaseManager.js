/**
 * SupabaseManager.js
 * Supabase 클라이언트 싱글톤 관리
 * 사용: SupabaseManager.getInstance().getClient()
 */

'use strict'

SupabaseManager = class SupabaseManager
{
    constructor()
    {
        this.client = null;
        this.SUPABASE_URL = 'https://gnwpnesdjjjoevregdmo.supabase.co';
        this.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdud3BuZXNkampqb2V2cmVnZG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4Mzc0NTYsImV4cCI6MjA5NzQxMzQ1Nn0.dDgFtamVvsY63ubxByE3s8JGC0dFwrPTbfVJZSRxIKs';
    }

    static getInstance()
    {
        if (!SupabaseManager._instance) {
            SupabaseManager._instance = new SupabaseManager();
            SupabaseManager._instance._init();
        }
        return SupabaseManager._instance;
    }

    _init()
    {
        this.client = supabase.createClient(this.SUPABASE_URL, this.SUPABASE_KEY);

        this.client.auth.onAuthStateChange(async (event, session) =>
        {
            console.log('[Auth Event]', event);

            if (event === 'SIGNED_IN') {
                const user = session.user;
                const { data: profile } = await this.client
                    .from('users')
                    .select('username, gender, birth_date')
                    .eq('id', user.id)
                    .single();

                if (!profile || profile.username.startsWith('user_')) {
                    console.log('[Auth] 추가 정보 입력 필요');
                    // TODO: 추가 정보 입력 View로 전환
                } else {
                    console.log('[Auth] 로그인 완료:', user.email);
                    // TODO: 메인 View로 전환
                }
            }

            if (event === 'SIGNED_OUT') {
                console.log('[Auth] 로그아웃 완료');
                // TODO: 로그인 View로 전환
            }
        });

        console.log('[SupabaseManager] 초기화 완료');
    }

    getClient()
    {
        return this.client;
    }

    async getUser()
    {
        const { data: { user } } = await this.client.auth.getUser();
        return user;
    }

    async signUpWithEmail(email, password)
    {
        const { data, error } = await this.client.auth.signUp({ email, password });
        return { data, error };
    }

    async signInWithEmail(email, password)
    {
        const { data, error } = await this.client.auth.signInWithPassword({ email, password });
        return { data, error };
    }

    async signInWithGoogle()
    {
        const { error } = await this.client.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        return error;
    }

    async signInWithKakao()
    {
        const { error } = await this.client.auth.signInWithOAuth({
            provider: 'kakao',
            options: { redirectTo: window.location.origin }
        });
        return error;
    }

    async signOut()
    {
        const { error } = await this.client.auth.signOut();
        return error;
    }
}

SupabaseManager._instance = null;