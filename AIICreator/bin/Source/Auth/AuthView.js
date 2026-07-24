
AuthView = class AuthView extends AView
{
	constructor()
	{
		super()
		this.sb = null
	}

	onInitDone()
	{
		super.onInitDone()
		this.sb = SupabaseManager.getInstance()
		this._renderHTML()
		this._bindEvents()
		this._loadSavedEmail()
	}

	async onActiveDone(isFirst)
	{
		super.onActiveDone(isFirst)

		if (!isFirst) return

		// ── Auth 콜백 처리 (OAuth 소셜 로그인 또는 비밀번호 재설정) ──────────
		// onReady()에서 URL 확인 후 저장한 타입: 'oauth' | 'recovery'
		var callbackType = sessionStorage.getItem('ac_auth_callback')
		if (callbackType)
		{
			sessionStorage.removeItem('ac_auth_callback')
			await this._handleCallback(callbackType === 'recovery')
			return
		}

		// ── 자동 로그인: 기존 세션이 있으면 메인으로 ─────────────────────────
		var user = await this.sb.getUser()
		if (user) this._goToMain()
	}

	// ─────────────────────────────────────────
	// OAuth / 비밀번호 재설정 콜백 처리
	// ─────────────────────────────────────────

	async _handleCallback(isRecovery)
	{
		var self    = this
		var handled = false

		// Supabase가 ?code= 교환 완료 후 발화하는 이벤트를 수신
		// SIGNED_IN        → OAuth/소셜 로그인 성공
		// PASSWORD_RECOVERY → 비밀번호 재설정 링크 인증 성공
		var sub = this.sb.getClient().auth.onAuthStateChange(function(event, session)
		{
			if (handled) return

			if (event === 'SIGNED_IN')
			{
				handled = true
				sub.data.subscription.unsubscribe()
				self._handleOAuthSuccess()
			}
			else if (event === 'PASSWORD_RECOVERY')
			{
				handled = true
				sub.data.subscription.unsubscribe()
				self._showPasswordResetForm()
			}
			// INITIAL_SESSION 무시: initialize() 완료 전의 이전 세션일 수 있음
		})

		// getSession()은 내부적으로 initializePromise를 await함
		// → Supabase의 ?code= 교환 완료 시점을 보장한 후 결과 확인
		// → initialize()가 이미 완료되어 이벤트 없이 세션이 확립된 경우를 대비
		var result = await this.sb.getClient().auth.getSession()

		if (!handled)
		{
			sub.data.subscription.unsubscribe()

			if (result.data && result.data.session)
			{
				if (isRecovery)
					this._showPasswordResetForm()
				else
					this._handleOAuthSuccess()
			}
			else
			{
				// 코드 만료 또는 이미 사용된 코드
				ToastManager.error('인증 처리에 실패했습니다. 다시 시도해주세요.')
			}
		}
	}

	async _handleOAuthSuccess()
	{
		var user = await this.sb.getUser()
		if (!user) return

		// 이번 브라우저 탭에서 로그인됨을 표시 (no-persist 재시작 감지용)
		sessionStorage.setItem('ac_session_alive', '1')

		var result = await this.sb.ensureUserProfile(user)

		if (result.error)
		{
			ToastManager.error('프로필 초기화 실패: ' + result.error.message)
			return
		}

		var profile = result.data

		if (!profile.gender || !profile.birth_date)
		{
			this._showSocialCompletePanel(user, profile)
			return
		}

		this._goToMain()
	}

	// ─────────────────────────────────────────
	// 비밀번호 재설정 폼 (이메일 링크 클릭 후)
	// ─────────────────────────────────────────

	_showPasswordResetForm()
	{
		var el   = this.getElement()
		if (!el) return            // 뷰가 이미 교체된 경우 조용히 종료
		var self = this

		el.innerHTML =
			'<div class="auth-wrap">' +
				'<div class="auth-logo">' +
					'<span class="auth-logo-text">ALL</span>' +
					'<span class="auth-logo-accent">Creator</span>' +
				'</div>' +
				'<p class="auth-subtitle">새 비밀번호 설정</p>' +
				'<div class="auth-box ac-card">' +
					'<div class="ac-input-group">' +
						'<label class="ac-label">새 비밀번호</label>' +
						'<input class="ac-input" type="password" id="reset-pw" placeholder="6자 이상">' +
					'</div>' +
					'<div class="ac-input-group" style="margin-top:12px">' +
						'<label class="ac-label">새 비밀번호 확인</label>' +
						'<input class="ac-input" type="password" id="reset-pw2" placeholder="비밀번호 재입력">' +
					'</div>' +
					'<button class="ac-btn ac-btn-primary ac-w-full" id="btn-reset-pw" style="margin-top:20px">비밀번호 변경</button>' +
				'</div>' +
			'</div>'

		el.querySelector('#btn-reset-pw').addEventListener('click', async function()
		{
			var pw  = el.querySelector('#reset-pw').value
			var pw2 = el.querySelector('#reset-pw2').value

			if (!pw)           { ToastManager.error('비밀번호를 입력해주세요'); return }
			if (pw !== pw2)    { ToastManager.error('비밀번호가 일치하지 않습니다'); return }
			if (pw.length < 6) { ToastManager.error('비밀번호는 6자 이상이어야 합니다'); return }

			var btn = el.querySelector('#btn-reset-pw')
			btn.disabled    = true
			btn.textContent = '변경 중...'

			var { error } = await self.sb.getClient().auth.updateUser({ password: pw })

			if (error)
			{
				ToastManager.error(ErrorHandler.parseSupabaseError(error))
				btn.disabled    = false
				btn.textContent = '비밀번호 변경'
				return
			}

			ToastManager.success('비밀번호가 변경되었습니다. 다시 로그인해주세요.')
			ErrorHandler._intentionalLogout = true
			sessionStorage.removeItem('ac_session_alive')
			await self.sb.signOut()
			self._renderHTML()
			self._bindEvents()
			self._loadSavedEmail()
		})
	}

	_showSocialCompletePanel(user, profile)
	{
		var el   = this.getElement()
		var self = this

		el.innerHTML =
			'<div class="auth-wrap">' +
				'<div class="auth-logo">' +
					'<span class="auth-logo-text">ALL</span>' +
					'<span class="auth-logo-accent">Creator</span>' +
				'</div>' +
				'<p class="auth-subtitle">조금 더 알려주세요 👋</p>' +
				'<div class="auth-box ac-card">' +
					'<p style="color:var(--color-text-muted);font-size:0.875rem;margin-bottom:20px;line-height:1.5">' +
						'<strong style="color:var(--color-text)">' + fmt.esc(profile.display_name || '') + '</strong>님, 환영합니다!<br>' +
						'서비스 이용을 위해 추가 정보를 입력해주세요.' +
					'</p>' +
					'<div class="ac-input-group">' +
						'<label class="ac-label">닉네임</label>' +
						'<input class="ac-input" type="text" id="sc-displayname" value="' + fmt.esc(profile.display_name || '') + '" placeholder="다른 사람들에게 보일 이름">' +
					'</div>' +
					'<div style="display:flex;gap:12px;margin-top:14px">' +
						'<div class="ac-input-group" style="flex:1">' +
							'<label class="ac-label">성별</label>' +
							'<select class="ac-input" id="sc-gender">' +
								'<option value="">선택 안함</option>' +
								'<option value="male">남성</option>' +
								'<option value="female">여성</option>' +
								'<option value="other">기타</option>' +
							'</select>' +
						'</div>' +
						'<div class="ac-input-group" style="flex:1.5">' +
							'<label class="ac-label">생년월일</label>' +
							'<input class="ac-input" type="date" id="sc-birthdate">' +
						'</div>' +
					'</div>' +
					'<button class="ac-btn ac-btn-primary ac-w-full" id="sc-btn-complete" style="margin-top:20px">시작하기</button>' +
					'<button class="ac-btn ac-w-full" id="sc-btn-skip" style="margin-top:8px;opacity:0.6;font-size:0.8125rem">나중에 입력하기</button>' +
				'</div>' +
			'</div>'

		el.querySelector('#sc-btn-complete').addEventListener('click', async function()
		{
			var displayName = el.querySelector('#sc-displayname').value.trim()
			var gender      = el.querySelector('#sc-gender').value
			var birthDate   = el.querySelector('#sc-birthdate').value

			if (!displayName) { ToastManager.error('닉네임을 입력해주세요'); return }

			var btn = el.querySelector('#sc-btn-complete')
			btn.disabled    = true
			btn.textContent = '저장 중...'

			var { error } = await self.sb.getClient()
				.from('users')
				.update({ display_name: displayName, gender: gender || null, birth_date: birthDate || null })
				.eq('id', user.id)

			if (error)
			{
				ToastManager.error(ErrorHandler.parseSupabaseError(error))
				btn.disabled    = false
				btn.textContent = '시작하기'
				return
			}

			self._goToMain()
		})

		el.querySelector('#sc-btn-skip').addEventListener('click', function()
		{
			self._goToMain()
		})
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

					// ── 로그인 패널 ──────────────────────────
					'<div class="auth-panel" id="panel-login">' +
						'<div class="ac-input-group">' +
							'<label class="ac-label">이메일</label>' +
							'<input class="ac-input" type="email" id="login-email" placeholder="email@example.com">' +
						'</div>' +
						'<div class="ac-input-group" style="margin-top:12px">' +
							'<label class="ac-label">비밀번호</label>' +
							'<input class="ac-input" type="password" id="login-pw" placeholder="비밀번호 입력">' +
						'</div>' +
						'<div class="auth-options-row">' +
							'<label class="auth-check-label">' +
								'<input type="checkbox" id="chk-remember"> 이메일 저장' +
							'</label>' +
							'<label class="auth-check-label">' +
								'<input type="checkbox" id="chk-autologin"> 자동 로그인' +
							'</label>' +
						'</div>' +
						'<button class="ac-btn ac-btn-primary ac-w-full" id="btn-login" style="margin-top:16px">로그인</button>' +
						'<div class="auth-find-row">' +
							'<button class="auth-find-btn" id="btn-find-pw">비밀번호 찾기</button>' +
						'</div>' +
					'</div>' +

					// ── 회원가입 패널 ────────────────────────
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
							'<input class="ac-input" type="password" id="signup-pw" placeholder="6자 이상 입력">' +
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
				'<footer id="auth-footer" style="width:100%;"></footer>' +
			'</div>'

		Footer.mountStandard(this.getElement().querySelector('#auth-footer'))
	}

	// ─────────────────────────────────────────
	// 이메일 저장 / 자동 로그인 복원
	// ─────────────────────────────────────────

	_loadSavedEmail()
	{
		var el    = this.getElement()
		var saved = localStorage.getItem('ac_saved_email')
		if (saved)
		{
			var emailInput = el.querySelector('#login-email')
			if (emailInput) emailInput.value = saved
			var chk = el.querySelector('#chk-remember')
			if (chk) chk.checked = true
		}

		var autoChk = el.querySelector('#chk-autologin')
		if (autoChk) autoChk.checked = localStorage.getItem('ac_no_persist') !== '1'
	}

	// ─────────────────────────────────────────
	// 이벤트 바인딩
	// ─────────────────────────────────────────

	_bindEvents()
	{
		var el   = this.getElement()
		var self = this

		el.querySelectorAll('.auth-tab').forEach(function(tab)
		{
			tab.addEventListener('click', function()
			{
				self._switchTab(tab.getAttribute('data-tab'))
			})
		})

		el.querySelector('#btn-login').addEventListener('click',  function() { self._onLogin() })
		el.querySelector('#btn-signup').addEventListener('click', function() { self._onSignup() })
		el.querySelector('#btn-google').addEventListener('click', function() { self._onSocialLogin('google') })
		el.querySelector('#btn-kakao').addEventListener('click',  function() { self._onSocialLogin('kakao') })
		el.querySelector('#btn-find-pw').addEventListener('click', function() { self._showFindPwModal() })

		this._bindTabKey()
	}

	_bindTabKey()
	{
		var el = this.getElement()

		var loginEmail = el.querySelector('#login-email')
		var loginPw    = el.querySelector('#login-pw')
		var btnLogin   = el.querySelector('#btn-login')

		loginEmail.addEventListener('keydown', function(e)
		{
			if (e.key === 'Tab')   { e.preventDefault(); loginPw.focus() }
			if (e.key === 'Enter') { loginPw.focus() }
		})
		loginPw.addEventListener('keydown', function(e)
		{
			if (e.key === 'Tab') { e.preventDefault(); btnLogin.focus() }
		})
		loginPw.addEventListener('keyup', function(e)
		{
			if (e.key === 'Enter') { btnLogin.click() }
		})

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
		var el = this.getElement()

		el.querySelectorAll('.auth-tab').forEach(function(t)
		{
			t.classList.toggle('active', t.getAttribute('data-tab') === tab)
		})

		el.querySelector('#panel-login').style.display  = (tab === 'login')  ? '' : 'none'
		el.querySelector('#panel-signup').style.display = (tab === 'signup') ? '' : 'none'
	}

	// ─────────────────────────────────────────
	// 로그인
	// ─────────────────────────────────────────

	async _onLogin()
	{
		var el      = this.getElement()
		var email   = el.querySelector('#login-email').value.trim()
		var pw      = el.querySelector('#login-pw').value
		var chkSave = el.querySelector('#chk-remember').checked
		var chkAuto = el.querySelector('#chk-autologin').checked

		if (!email || !pw) { ToastManager.error('이메일과 비밀번호를 입력해주세요'); return }

		var btn = el.querySelector('#btn-login')
		btn.disabled    = true
		btn.textContent = '로그인 중...'

		var { error } = await this.sb.signInWithEmail(email, pw)

		if (error)
		{
			ToastManager.error(ErrorHandler.parseSupabaseError(error))
			btn.disabled    = false
			btn.textContent = '로그인'
			return
		}

		if (chkSave) localStorage.setItem('ac_saved_email', email)
		else         localStorage.removeItem('ac_saved_email')

		if (chkAuto)
			localStorage.removeItem('ac_no_persist')
		else
			localStorage.setItem('ac_no_persist', '1')

		// 이번 탭에서 로그인됨을 표시 (no-persist 재시작 감지용)
		sessionStorage.setItem('ac_session_alive', '1')

		this._goToMain()
	}

	// ─────────────────────────────────────────
	// 회원가입
	// ─────────────────────────────────────────

	async _onSignup()
	{
		var el          = this.getElement()
		var email       = el.querySelector('#signup-email').value.trim()
		var displayName = el.querySelector('#signup-displayname').value.trim()
		var pw          = el.querySelector('#signup-pw').value
		var pw2         = el.querySelector('#signup-pw2').value
		var gender      = el.querySelector('#signup-gender').value
		var birthDate   = el.querySelector('#signup-birthdate').value

		if (!email)        { ToastManager.error('이메일을 입력해주세요'); return }
		if (!displayName)  { ToastManager.error('닉네임을 입력해주세요'); return }
		if (!pw)           { ToastManager.error('비밀번호를 입력해주세요'); return }
		if (pw !== pw2)    { ToastManager.error('비밀번호가 일치하지 않습니다'); return }
		if (pw.length < 6) { ToastManager.error('비밀번호는 6자 이상이어야 합니다'); return }

		var btn = el.querySelector('#btn-signup')
		btn.disabled    = true
		btn.textContent = '가입 중...'

		var { error } = await this.sb.signUpWithEmail(email, pw, {
			display_name: displayName,
			gender:       gender || null,
			birth_date:   birthDate || null
		})

		if (error)
		{
			ToastManager.error(ErrorHandler.parseSupabaseError(error))
			btn.disabled    = false
			btn.textContent = '회원가입'
			return
		}

		ToastManager.success('가입이 완료되었습니다! 이메일을 확인해주세요.')
		btn.disabled    = false
		btn.textContent = '회원가입'
	}

	async _onSocialLogin(provider)
	{
		var error = provider === 'google'
			? await this.sb.signInWithGoogle()
			: await this.sb.signInWithKakao()

		if (error && error.message)
			ToastManager.error(error.message)
	}

	// ─────────────────────────────────────────
	// 비밀번호 찾기
	// ─────────────────────────────────────────

	_showFindPwModal()
	{
		var self    = this
		var overlay = this._createModalShell('비밀번호 찾기')
		var body    = overlay.querySelector('#find-body')

		body.innerHTML =
			'<p class="find-modal-desc">가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 발송합니다.</p>' +
			'<div class="ac-input-group">' +
				'<label class="ac-label">이메일</label>' +
				'<input class="ac-input" type="email" id="findpw-email" placeholder="email@example.com">' +
			'</div>' +
			'<button class="ac-btn ac-btn-primary ac-w-full" id="findpw-btn-send" style="margin-top:16px">재설정 링크 발송</button>'

		body.querySelector('#findpw-btn-send').addEventListener('click', async function()
		{
			var email = body.querySelector('#findpw-email').value.trim()
			if (!email) { ToastManager.error('이메일을 입력해주세요'); return }

			var btn = body.querySelector('#findpw-btn-send')
			btn.disabled    = true
			btn.textContent = '확인 중...'

			// provider 확인
			var { data } = await self.sb.getClient()
				.from('users')
				.select('auth_provider')
				.eq('email', email)
				.single()

			if (!data)
			{
				btn.disabled    = false
				btn.textContent = '재설정 링크 발송'
				body.innerHTML =
					'<div class="find-result find-result-error">' +
						'<div class="find-result-icon">❌</div>' +
						'<div class="find-result-msg">가입되지 않은 이메일입니다.</div>' +
					'</div>' +
					'<button class="ac-btn ac-w-full" id="findpw-retry" style="margin-top:16px">다시 입력</button>'
				body.querySelector('#findpw-retry').addEventListener('click', function()
				{
					document.body.removeChild(overlay)
					self._showFindPwModal()
				})
				return
			}

			if (data.auth_provider !== 'email')
			{
				var pName = data.auth_provider === 'kakao' ? '카카오' : 'Google'
				btn.disabled    = false
				btn.textContent = '재설정 링크 발송'
				body.innerHTML =
					'<div class="find-result find-result-info">' +
						'<div class="find-result-icon">' + (data.auth_provider === 'kakao' ? '💛' : '🔵') + '</div>' +
						'<div class="find-result-msg">' + pName + '로 가입된 계정입니다.<br>' + pName + ' 로그인으로 진행해주세요.</div>' +
					'</div>' +
					'<button class="ac-btn ac-btn-primary ac-w-full" id="findpw-done" style="margin-top:16px">확인</button>'
				body.querySelector('#findpw-done').addEventListener('click', function()
				{
					document.body.removeChild(overlay)
				})
				return
			}

			// 이메일 회원 → 재설정 링크 발송
			var redirectTo = window.location.href.split('#')[0].split('?')[0]
			var { error } = await self.sb.getClient().auth.resetPasswordForEmail(email, { redirectTo })

			btn.disabled    = false
			btn.textContent = '재설정 링크 발송'

			if (error)
			{
				ToastManager.error(ErrorHandler.parseSupabaseError(error))
				return
			}

			body.innerHTML =
				'<div class="find-result find-result-success">' +
					'<div class="find-result-icon">📧</div>' +
					'<div class="find-result-msg">' +
						'<strong>' + fmt.esc(email) + '</strong>으로<br>' +
						'비밀번호 재설정 링크를 발송했습니다.<br>' +
						'<span style="font-size:0.8125rem;color:var(--color-text-dim)">이메일의 링크를 클릭하면 새 비밀번호를 설정할 수 있습니다.</span>' +
					'</div>' +
				'</div>' +
				'<button class="ac-btn ac-w-full" id="findpw-close" style="margin-top:16px">닫기</button>'

			body.querySelector('#findpw-close').addEventListener('click', function()
			{
				document.body.removeChild(overlay)
			})
		})
	}

	// ─────────────────────────────────────────
	// 모달 공통 쉘 생성
	// ─────────────────────────────────────────

	_createModalShell(title)
	{
		var overlay = document.createElement('div')
		overlay.className = 'find-modal-overlay'
		overlay.innerHTML =
			'<div class="find-modal">' +
				'<div class="find-modal-header">' +
					'<span class="find-modal-title">' + title + '</span>' +
					'<button class="find-modal-close" id="find-close">✕</button>' +
				'</div>' +
				'<div class="find-modal-body" id="find-body"></div>' +
			'</div>'

		document.body.appendChild(overlay)

		overlay.querySelector('#find-close').addEventListener('click', function()
		{
			if (overlay.parentNode) document.body.removeChild(overlay)
		})
		overlay.addEventListener('click', function(e)
		{
			if (e.target === overlay && overlay.parentNode) document.body.removeChild(overlay)
		})

		return overlay
	}

	_goToMain()
	{
		theApp.mainContainer.open('Source/MainView.lay')
	}
}
