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

        // ※ onAuthStateChange 안에서 DB 쿼리 금지 — Supabase v2 데드락 발생
        this.client.auth.onAuthStateChange((event, session) =>
        {
            console.log('[Auth Event]', event);
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

    async signUpWithEmail(email, password, metadata)
    {
        var options = metadata ? { data: metadata } : undefined;
        const { data, error } = await this.client.auth.signUp({ email, password, options });
        return { data, error };
    }

    async updateUserProfile(userId, profile)
    {
        const { error } = await this.client
            .from('users')
            .update(profile)
            .eq('id', userId);
        return error;
    }

    async uploadAvatar(userId, file)
    {
        var ext  = file.name.split('.').pop().toLowerCase();
        var path = userId + '/avatar.' + ext;

        // upsert: true → 같은 경로 파일 덮어쓰기
        const { error: uploadError } = await this.client.storage
            .from('avatars')
            .upload(path, file, { upsert: true, contentType: file.type });

        if (uploadError) return { url: null, error: uploadError };

        const { data } = this.client.storage
            .from('avatars')
            .getPublicUrl(path);

        return { url: data.publicUrl, error: null };
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