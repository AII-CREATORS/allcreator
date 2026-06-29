
class AuthView extends AView
{
	constructor()
	{
		super()
		this.sb = null
		this.currentTab = 'login'
	}

	init(context, evtListener)
	{
		super.init(context, evtListener)
	}

	onInitDone()
	{
		super.onInitDone()
		this._injectStyle()
		this._renderHTML()
		this._bindEvents()
		this.sb = SupabaseManager.getInstance()
	}

	onActiveDone(isFirst)
	{
		super.onActiveDone(isFirst)
	}

	// ─────────────────────────────────────────
	// HTML 렌더링
	// ─────────────────────────────────────────

	_renderHTML()
	{
		this.getElement().innerHTML =
			'<div class="auth-wrap">' +
				'<div class="auth-logo">' +
					'<span class="auth-logo-text">ALL</span>' +
					'<span class="auth-logo-accent">Creator</span>' +
				'</div>' +
				'<p class="auth-subtitle">AI 프롬프트 마켓플레이스</p>' +

				'<div class="auth-box ac-card">' +

					'<div class="auth-tabs">' +
						'<button class="auth-tab active" data-tab="login">로그인</button>' +
						'<button class="auth-tab" data-tab="signup">회원가입</button>' +
					'</div>' +

					'<!-- 로그인 패널 -->' +
					'<div class="auth-panel" id="panel-login">' +
						'<div class="ac-input-group">' +
							'<label class="ac-label">이메일</label>' +
							'<input class="ac-input" type="email" id="login-email" placeholder="email@example.com">' +
						'</div>' +
						'<div class="ac-input-group" style="margin-top:12px">' +
							'<label class="ac-label">비밀번호</label>' +
							'<input class="ac-input" type="password" id="login-pw" placeholder="비밀번호 입력">' +
						'</div>' +
						'<button class="ac-btn ac-btn-primary ac-w-full" id="btn-login" style="margin-top:20px">로그인</button>' +
					'</div>' +

					'<!-- 회원가입 패널 -->' +
					'<div class="auth-panel" id="panel-signup" style="display:none">' +
						'<div class="ac-input-group">' +
							'<label class="ac-label">이메일</label>' +
							'<input class="ac-input" type="email" id="signup-email" placeholder="email@example.com">' +
						'</div>' +
						'<div class="ac-input-group" style="margin-top:12px">' +
							'<label class="ac-label">비밀번호</label>' +
							'<input class="ac-input" type="password" id="signup-pw" placeholder="8자 이상 입력">' +
						'</div>' +
						'<div class="ac-input-group" style="margin-top:12px">' +
							'<label class="ac-label">비밀번호 확인</label>' +
							'<input class="ac-input" type="password" id="signup-pw2" placeholder="비밀번호 재입력">' +
						'</div>' +
						'<button class="ac-btn ac-btn-primary ac-w-full" id="btn-signup" style="margin-top:20px">회원가입</button>' +
					'</div>' +

					'<div class="ac-divider-text" style="margin-top:20px">또는</div>' +

					'<div style="margin-top:16px;display:flex;flex-direction:column;gap:10px">' +
						'<button class="auth-social-btn" id="btn-google">' +
							'<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="Google">' +
							'Google로 계속하기' +
						'</button>' +
						'<button class="auth-social-btn auth-social-kakao" id="btn-kakao">' +
							'<svg width="18" height="18" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.477 2 10.857c0 2.742 1.695 5.146 4.25 6.618L5.1 21l5.217-2.803c.554.076 1.12.117 1.683.117 5.523 0 10-3.477 10-7.857C22 6.477 17.523 3 12 3z"/></svg>' +
							'카카오로 계속하기' +
						'</button>' +
					'</div>' +

				'</div>' +
			'</div>'
	}

	_injectStyle()
	{
		if (document.getElementById('auth-view-style')) return

		var style = document.createElement('style')
		style.id = 'auth-view-style'
		style.textContent =
			'.auth-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100%;padding:40px 20px;}' +
			'.auth-logo{font-family:var(--font-title);font-size:2rem;font-weight:700;letter-spacing:-0.02em;}' +
			'.auth-logo-text{color:var(--color-text);}' +
			'.auth-logo-accent{color:var(--color-accent);margin-left:4px;}' +
			'.auth-subtitle{color:var(--color-text-muted);font-size:0.875rem;margin-top:6px;margin-bottom:28px;}' +
			'.auth-box{width:100%;max-width:420px;padding:28px;}' +
			'.auth-tabs{display:flex;margin-bottom:24px;background:var(--color-surface-2);border-radius:var(--radius-md);padding:4px;}' +
			'.auth-tab{flex:1;padding:9px;border:none;background:transparent;color:var(--color-text-muted);font-size:0.9375rem;font-weight:700;font-family:var(--font-body);border-radius:calc(var(--radius-md) - 2px);cursor:pointer;transition:background var(--transition),color var(--transition);}' +
			'.auth-tab.active{background:var(--color-accent);color:#fff;}' +
			'.auth-social-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:11px;border:2px solid var(--color-border);border-radius:var(--radius-md);background:transparent;color:var(--color-text);font-size:0.9375rem;font-weight:500;font-family:var(--font-body);cursor:pointer;transition:border-color var(--transition),background var(--transition);}' +
			'.auth-social-btn:hover{border-color:var(--color-border-light);background:var(--color-surface-2);}' +
			'.auth-social-kakao{background:#FEE500;border-color:#FEE500;color:#3C1E1E;}' +
			'.auth-social-kakao:hover{background:#F0D800;border-color:#F0D800;}'
		document.head.appendChild(style)
	}

	// ─────────────────────────────────────────
	// 이벤트 바인딩
	// ─────────────────────────────────────────

	_bindEvents()
	{
		var el   = this.getElement()
		var self = this

		// 탭 전환
		el.querySelectorAll('.auth-tab').forEach(function(tab)
		{
			tab.addEventListener('click', function()
			{
				self._switchTab(tab.getAttribute('data-tab'))
			})
		})

		// 로그인
		el.querySelector('#btn-login').addEventListener('click', function() { self._onLogin() })
		el.querySelector('#login-pw').addEventListener('keydown', function(e) { if (e.key === 'Enter') self._onLogin() })

		// 회원가입
		el.querySelector('#btn-signup').addEventListener('click', function() { self._onSignup() })
		el.querySelector('#signup-pw2').addEventListener('keydown', function(e) { if (e.key === 'Enter') self._onSignup() })

		// 소셜
		el.querySelector('#btn-google').addEventListener('click', function() { self._onGoogleLogin() })
		el.querySelector('#btn-kakao').addEventListener('click', function() { self._onKakaoLogin() })
	}

	_switchTab(tab)
	{
		var el   = this.getElement()
		this.currentTab = tab

		el.querySelectorAll('.auth-tab').forEach(function(t)
		{
			t.classList.toggle('active', t.getAttribute('data-tab') === tab)
		})

		el.querySelector('#panel-login').style.display  = (tab === 'login')  ? '' : 'none'
		el.querySelector('#panel-signup').style.display = (tab === 'signup') ? '' : 'none'
	}

	// ─────────────────────────────────────────
	// 인증 로직
	// ─────────────────────────────────────────

	async _onLogin()
	{
		var el    = this.getElement()
		var email = el.querySelector('#login-email').value.trim()
		var pw    = el.querySelector('#login-pw').value

		if (!email || !pw)
		{
			ToastManager.error('이메일과 비밀번호를 입력해주세요')
			return
		}

		var btn = el.querySelector('#btn-login')
		btn.disabled    = true
		btn.textContent = '로그인 중...'

		var result = await this.sb.signInWithEmail(email, pw)

		btn.disabled    = false
		btn.textContent = '로그인'

		if (result.error)
		{
			ToastManager.error('로그인 실패: ' + result.error.message)
		}
		else
		{
			ToastManager.success('로그인 성공!')
			this._goToMain()
		}
	}

	async _onSignup()
	{
		var el    = this.getElement()
		var email = el.querySelector('#signup-email').value.trim()
		var pw    = el.querySelector('#signup-pw').value
		var pw2   = el.querySelector('#signup-pw2').value

		if (!email || !pw || !pw2)
		{
			ToastManager.error('모든 항목을 입력해주세요')
			return
		}
		if (pw.length < 8)
		{
			ToastManager.error('비밀번호는 8자 이상이어야 합니다')
			return
		}
		if (pw !== pw2)
		{
			ToastManager.error('비밀번호가 일치하지 않습니다')
			return
		}

		var btn = el.querySelector('#btn-signup')
		btn.disabled    = true
		btn.textContent = '가입 중...'

		var result = await this.sb.signUpWithEmail(email, pw)

		btn.disabled    = false
		btn.textContent = '회원가입'

		if (result.error)
		{
			ToastManager.error('가입 실패: ' + result.error.message)
		}
		else
		{
			ToastManager.success('가입 완료! 이메일 인증 후 로그인해주세요')
			this._switchTab('login')
		}
	}

	async _onGoogleLogin()
	{
		var err = await this.sb.signInWithGoogle()
		if (err) ToastManager.error('구글 로그인 실패: ' + err.message)
	}

	async _onKakaoLogin()
	{
		var err = await this.sb.signInWithKakao()
		if (err) ToastManager.error('카카오 로그인 실패: ' + err.message)
	}

	// ─────────────────────────────────────────
	// 화면 전환
	// ─────────────────────────────────────────

	_goToMain()
	{
		theApp.mainContainer.open('Source/MainView.lay')
	}
}
