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
        // ※ onAuthStateChange는 ErrorHandler에서 등록 — 여기서 중복 등록 금지
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

    _getRedirectUrl()
    {
        var href = window.location.href
        return href.split('#')[0].split('?')[0]
    }

    async _signInWithOAuth(provider)
    {
        if (window.location.protocol === 'file:')
            return { message: 'OAuth는 HTTP 서버 환경에서만 동작합니다.' }

        var { error } = await this.client.auth.signInWithOAuth({
            provider: provider,
            options:  { redirectTo: this._getRedirectUrl() }
        })
        return error
    }

    async signInWithGoogle() { return this._signInWithOAuth('google') }
    async signInWithKakao()  { return this._signInWithOAuth('kakao')  }

    // OAuth 로그인 후 public.users row 보장
    // 트리거가 미발동한 경우(identity link 등)를 코드에서 보완
    async ensureUserProfile(authUser)
    {
        if (!authUser) return { error: { message: '유저 정보 없음' } }

        // 이미 존재하는지 확인
        var { data: existing } = await this.client
            .from('users')
            .select('id, gender, birth_date, display_name')
            .eq('id', authUser.id)
            .single()

        if (existing) return { data: existing, created: false }

        // 없으면 메타데이터에서 추출하여 INSERT
        var meta        = authUser.user_metadata || {}
        var displayName = meta.full_name || meta.name || meta.preferred_username || authUser.email?.split('@')[0] || 'user'
        var avatarUrl   = meta.avatar_url || meta.picture || null
        var provider    = authUser.app_metadata?.provider || 'email'
        var email       = authUser.email || ''
        var username    = 'user_' + authUser.id.substr(0, 8)

        var { data, error } = await this.client
            .from('users')
            .insert({
                id:            authUser.id,
                email:         email,
                username:      username,
                display_name:  displayName,
                avatar_url:    avatarUrl,
                auth_provider: provider
            })
            .select('id, gender, birth_date, display_name')
            .single()

        return { data, error, created: true }
    }

    async signOut()
    {
        const { error } = await this.client.auth.signOut();
        return error;
    }
}

SupabaseManager._instance = null;