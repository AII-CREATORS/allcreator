
ErrorHandler = class ErrorHandler
{
	static init()
	{
		ErrorHandler._setupGlobalErrors()
		ErrorHandler._setupNetworkDetection()
		ErrorHandler._setupAuthExpiry()
	}

	// ─────────────────────────────────────────
	// 전역 JS 에러
	// ─────────────────────────────────────────

	static _setupGlobalErrors()
	{
		// 동기 런타임 에러
		window.onerror = function(message, source, lineno, colno, error)
		{
			// SpiderGen 프레임워크 내부 에러만 무시
			if (source && source.indexOf('/afc/') !== -1) return false

			console.error('[GlobalError]', message, 'at', source, lineno + ':' + colno)
			return false
		}

		// 비동기 Promise 에러
		window.onunhandledrejection = function(e)
		{
			var reason = e.reason
			var msg    = reason instanceof Error ? reason.message : String(reason)

			// Supabase 인증 만료는 _setupAuthExpiry에서 처리
			if (msg && msg.indexOf('JWT') !== -1) return
			if (msg && msg.indexOf('token') !== -1) return

			console.error('[UnhandledPromise]', reason)
		}
	}

	// ─────────────────────────────────────────
	// 네트워크 감지
	// ─────────────────────────────────────────

	static _setupNetworkDetection()
	{
		window.addEventListener('offline', function()
		{
			ToastManager.warning('네트워크 연결이 끊겼습니다')
			ErrorHandler._showNetworkBanner()
		})

		window.addEventListener('online', function()
		{
			ToastManager.success('네트워크가 복구되었습니다')
			ErrorHandler._hideNetworkBanner()
		})
	}

	static _showNetworkBanner()
	{
		ErrorHandler._hideNetworkBanner()

		var banner = document.createElement('div')
		banner.id  = 'ac-network-banner'
		banner.style.cssText =
			'position:fixed;top:0;left:0;right:0;z-index:9999;' +
			'background:#FF6584;color:#fff;text-align:center;' +
			'padding:8px 16px;font-size:0.875rem;font-family:var(--font-body, sans-serif);' +
			'font-weight:600;letter-spacing:0.02em;'
		banner.textContent = '⚠️ 오프라인 상태입니다 — 인터넷 연결을 확인해주세요'
		document.body.appendChild(banner)
	}

	static _hideNetworkBanner()
	{
		var existing = document.getElementById('ac-network-banner')
		if (existing) existing.remove()
	}

	// ─────────────────────────────────────────
	// 세션 만료
	// ─────────────────────────────────────────

	static _setupAuthExpiry()
	{
		var sb = SupabaseManager.getInstance()

		sb.getClient().auth.onAuthStateChange(function(event, session)
		{
			if (event === 'TOKEN_REFRESHED') return

			// 세션이 만료되어 로그아웃 처리된 경우
			if (event === 'SIGNED_OUT' && ErrorHandler._wasSignedIn)
			{
				ErrorHandler._wasSignedIn = false
				ToastManager.warning('세션이 만료되었습니다. 다시 로그인해주세요')

				try
				{
					theApp.mainContainer.open('Source/Auth/AuthView.lay')
				}
				catch (e)
				{
					console.warn('[ErrorHandler] 화면 전환 실패:', e)
				}
				return
			}

			if (event === 'SIGNED_IN') ErrorHandler._wasSignedIn = true
		})
	}

	// ─────────────────────────────────────────
	// Supabase 에러 메시지 한국어 변환
	// ─────────────────────────────────────────

	static parseSupabaseError(error)
	{
		if (!error) return '알 수 없는 오류가 발생했습니다'

		var msg = (error.message || '').toLowerCase()
		var code = error.code || ''

		if (msg.indexOf('invalid login credentials') !== -1)
			return '이메일 또는 비밀번호가 올바르지 않습니다'

		if (msg.indexOf('email not confirmed') !== -1)
			return '이메일 인증이 필요합니다. 받은 편지함을 확인해주세요'

		if (msg.indexOf('user already registered') !== -1 || code === '23505')
			return '이미 가입된 이메일입니다'

		if (msg.indexOf('password') !== -1 && msg.indexOf('6') !== -1)
			return '비밀번호는 6자 이상이어야 합니다'

		if (msg.indexOf('rate limit') !== -1 || msg.indexOf('too many requests') !== -1)
			return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요'

		if (msg.indexOf('network') !== -1 || msg.indexOf('fetch') !== -1)
			return '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요'

		if (msg.indexOf('jwt expired') !== -1 || msg.indexOf('token is expired') !== -1)
			return '로그인이 만료되었습니다. 다시 로그인해주세요'

		if (msg.indexOf('permission denied') !== -1 || msg.indexOf('rls') !== -1)
			return '접근 권한이 없습니다'

		if (msg.indexOf('not found') !== -1)
			return '데이터를 찾을 수 없습니다'

		if (msg.indexOf('duplicate') !== -1)
			return '이미 존재하는 데이터입니다'

		// 원본 메시지 반환 (번역 없을 때)
		return error.message || '오류가 발생했습니다'
	}
}

ErrorHandler._wasSignedIn = false
