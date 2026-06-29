
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
		this._loadSavedEmail()
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

					// ── 로그인 패널 (이메일 → 체크박스 → 비밀번호 → 버튼)
					'<div class="auth-panel" id="panel-login">' +
						'<div class="ac-input-group">' +
							'<label class="ac-label">이메일</label>' +
							'<input class="ac-input" type="email" id="login-email" placeholder="email@example.com">' +
						'</div>' +
						'<div class="auth-remember">' +
							'<label class="auth-remember-label">' +
								'<input type="checkbox" id="chk-remember"> 이메일 저장' +
							'</label>' +
						'</div>' +
						'<div class="ac-input-group" style="margin-top:12px">' +
							'<label class="ac-label">비밀번호</label>' +
							'<input class="ac-input" type="password" id="login-pw" placeholder="비밀번호 입력">' +
						'</div>' +
						'<button class="ac-btn ac-btn-primary ac-w-full" id="btn-login" style="margin-top:20px">로그인</button>' +
					'</div>' +

					// ── 회원가입 패널
					'<div class="auth-panel" id="panel-signup" style="display:none">' +
						'<div class="ac-input-group">' +
							'<label class="ac-label">이메일</label>' +
							'<input class="ac-input" type="email" id="signup-email" placeholder="email@example.com">' +
						'</div>' +
						'<div class="ac-input-group" style="margin-top:12px">' +
							'<label class="ac-label">닉네임 <span class="auth-required">*</span></label>' +
							'<input class="ac-input" type="text" id="signup-displayname" placeholder="다른 사람들에게 보일 이름">' +
						'</div>' +
						'<div class="ac-input-group" style="margin-top:12px">' +
							'<label class="ac-label">비밀번호</label>' +
							'<input class="ac-input" type="password" id="signup-pw" placeholder="8자 이상 입력">' +
						'</div>' +
						'<div class="ac-input-group" style="margin-top:12px">' +
							'<label class="ac-label">비밀번호 확인</label>' +
							'<input class="ac-input" type="password" id="signup-pw2" placeholder="비밀번호 재입력">' +
						'</div>' +
						'<div style="display:flex;gap:12px;margin-top:12px">' +
							'<div class="ac-input-group" style="flex:1">' +
								'<label class="ac-label">성별</label>' +
								'<select class="ac-input" id="signup-gender">' +
									'<option value="">선택 안함</option>' +
									'<option value="male">남성</option>' +
									'<option value="female">여성</option>' +
									'<option value="other">기타</option>' +
								'</select>' +
							'</div>' +
							'<div class="ac-input-group" style="flex:1.5">' +
								'<label class="ac-label">생년월일</label>' +
								'<input class="ac-input" type="date" id="signup-birthdate">' +
							'</div>' +
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
			'.auth-remember{margin-top:8px;}' +
			'.auth-remember-label{display:flex;align-items:center;gap:8px;font-size:0.875rem;color:var(--color-text-muted);cursor:pointer;user-select:none;-webkit-user-select:none;}' +
			'.auth-remember-label input[type=checkbox]{width:15px;height:15px;accent-color:var(--color-accent);cursor:pointer;flex-shrink:0;}' +
			'.auth-social-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:11px;border:2px solid var(--color-border);border-radius:var(--radius-md);background:transparent;color:var(--color-text);font-size:0.9375rem;font-weight:500;font-family:var(--font-body);cursor:pointer;transition:border-color var(--transition),background var(--transition);}' +
			'.auth-social-btn:hover{border-color:var(--color-border-light);background:var(--color-surface-2);}' +
			'.auth-social-kakao{background:#FEE500;border-color:#FEE500;color:#3C1E1E;}' +
			'.auth-social-kakao:hover{background:#F0D800;border-color:#F0D800;}' +
			'.auth-required{color:var(--color-point);font-size:0.75rem;}' +
			'.ac-input option{background:var(--color-surface);color:var(--color-text);}'
		document.head.appendChild(style)
	}

	// ─────────────────────────────────────────
	// 이메일 저장 (localStorage)
	// ─────────────────────────────────────────

	_loadSavedEmail()
	{
		var saved = localStorage.getItem('ac_saved_email')
		if (!saved) return
		var emailInput  = this.getElement().querySelector('#login-email')
		var chkRemember = this.getElement().querySelector('#chk-remember')
		if (emailInput)  emailInput.value   = saved
		if (chkRemember) chkRemember.checked = true
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

		// 회원가입
		el.querySelector('#btn-signup').addEventListener('click', function() { self._onSignup() })

		// 소셜
		el.querySelector('#btn-google').addEventListener('click', function() { self._onGoogleLogin() })
		el.querySelector('#btn-kakao').addEventListener('click', function() { self._onKakaoLogin() })

		// Tab 키 명시적 처리 (SpiderGen 프레임워크가 Tab 이벤트를 가로채는 경우 대비)
		this._bindTabKey()
	}

	_bindTabKey()
	{
		var el = this.getElement()

		// 로그인 패널 Tab 순서: 이메일 → 비밀번호 → 로그인버튼
		var loginEmail = el.querySelector('#login-email')
		var loginPw    = el.querySelector('#login-pw')
		var btnLogin   = el.querySelector('#btn-login')

		loginEmail.addEventListener('keydown', function(e)
		{
			if (e.key === 'Tab') { e.preventDefault(); loginPw.focus() }
			if (e.key === 'Enter') { loginPw.focus() }
		})
		loginPw.addEventListener('keydown', function(e)
		{
			if (e.key === 'Tab') { e.preventDefault(); btnLogin.focus() }
			// Enter → 로그인은 btn-login click 이벤트로 처리
		})
		loginPw.addEventListener('keyup', function(e)
		{
			if (e.key === 'Enter') { btnLogin.click() }
		})

		// 회원가입 패널 Tab 순서: 이메일 → 비밀번호 → 비밀번호 확인 → 가입버튼
		var signupEmail = el.querySelector('#signup-email')
		var signupPw    = el.querySelector('#signup-pw')
		var signupPw2   = el.querySelector('#signup-pw2')
		var btnSignup   = el.querySelector('#btn-signup')

		signupEmail.addEventListener('keydown', function(e)
		{
			if (e.key === 'Tab') { e.preventDefault(); signupPw.focus() }
		})
		signupPw.addEventListener('keydown', function(e)
		{
			if (e.key === 'Tab') { e.preventDefault(); signupPw2.focus() }
		})
		signupPw2.addEventListener('keydown', function(e)
		{
			if (e.key === 'Tab') { e.preventDefault(); btnSignup.focus() }
		})
		signupPw2.addEventListener('keyup', function(e)
		{
			if (e.key === 'Enter') { btnSignup.click() }
		})
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
		var chk   = el.querySelector('#chk-remember')

		if (!email || !pw)
		{
			ToastManager.error('이메일과 비밀번호를 입력해주세요')
			return
		}

		var btn = el.querySelector('#btn-login')
		btn.disabled    = true
		btn.textContent = '로그인 중...'

		try
		{
			var result = await this.sb.signInWithEmail(email, pw)

			if (result.error)
			{
				btn.disabled    = false
				btn.textContent = '로그인'
				ToastManager.error('로그인 실패: ' + result.error.message)
			}
			else
			{
				if (chk && chk.checked) localStorage.setItem('ac_saved_email', email)
				else localStorage.removeItem('ac_saved_email')

				ToastManager.success('로그인 성공!')
				this._goToMain()
			}
		}
		catch (e)
		{
			btn.disabled    = false
			btn.textContent = '로그인'
			ToastManager.error('오류 발생: ' + e.message)
			console.error('[AuthView] _onLogin error:', e)
		}
	}

	async _onSignup()
	{
		var el          = this.getElement()
		var email       = el.querySelector('#signup-email').value.trim()
		var displayName = el.querySelector('#signup-displayname').value.trim()
		var pw          = el.querySelector('#signup-pw').value
		var pw2         = el.querySelector('#signup-pw2').value
		var gender      = el.querySelector('#signup-gender').value
		var birthDate   = el.querySelector('#signup-birthdate').value

		if (!email || !displayName || !pw || !pw2)
		{
			ToastManager.error('이메일, 닉네임, 비밀번호는 필수 항목입니다')
			return
		}
		if (pw.length < 8) { ToastManager.error('비밀번호는 8자 이상이어야 합니다'); return }
		if (pw !== pw2)    { ToastManager.error('비밀번호가 일치하지 않습니다'); return }

		var btn = el.querySelector('#btn-signup')
		btn.disabled    = true
		btn.textContent = '가입 중...'

		try
		{
			// 1) auth 가입 — full_name을 metadata로 전달 → 트리거가 display_name에 반영
			var result = await this.sb.signUpWithEmail(email, pw, { full_name: displayName })

			if (result.error)
			{
				ToastManager.error('가입 실패: ' + result.error.message)
				return
			}

			// 2) gender/birth_date 프로필 업데이트 (가입 즉시 세션이 생성되므로 바로 UPDATE 가능)
			var userId = result.data && result.data.user ? result.data.user.id : null
			if (userId)
			{
				var profile = {}
				if (gender)    profile.gender     = gender
				if (birthDate) profile.birth_date = birthDate
				if (displayName) profile.display_name = displayName

				if (Object.keys(profile).length > 0)
					await this.sb.updateUserProfile(userId, profile)
			}

			ToastManager.success('가입 완료!')
			this._switchTab('login')
		}
		catch (e)
		{
			ToastManager.error('오류 발생: ' + e.message)
			console.error('[AuthView] _onSignup error:', e)
		}
		finally
		{
			btn.disabled    = false
			btn.textContent = '회원가입'
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
		try
		{
			theApp.mainContainer.open('Source/MainView.lay')
		}
		catch (e)
		{
			console.error('[AuthView] _goToMain error:', e)
			ToastManager.error('화면 전환 오류: ' + e.message)
		}
	}
}
