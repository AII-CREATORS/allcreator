
AIICreatorApp = class AIICreatorApp extends AApplication
{
	constructor()
	{
		super()
		this._promptId = null
	}

	// 프롬프트 상세 진입 — ID를 안전하게 보관 후 뷰 오픈
	openDetail(id)
	{
		this._promptId = id
		this.mainContainer.open('Source/Prompt/PromptDetailView.lay')
	}

	getDetailId() { return this._promptId }

	onReady()
	{
		super.onReady()

		// ── Supabase 초기화 이전에 URL 읽기 (implicit flow) ──────────────────
		// Supabase createClient()가 hash를 비동기로 지우기 전에 먼저 확인
		// PKCE flow는 hash에 type=recovery가 없으므로 ErrorHandler에서 이벤트로 보완
		var rawHash   = window.location.hash
		var rawSearch = window.location.search

		// implicit flow: hash에 type=recovery 포함
		if (rawHash.indexOf('type=recovery') !== -1 || rawSearch.indexOf('type=recovery') !== -1)
			sessionStorage.setItem('ac_pw_recovery', '1')

		// PKCE flow: ?code= 파라미터 존재 → OAuth 콜백 또는 recovery 콜백
		if (rawSearch.indexOf('code=') !== -1)
		{
			sessionStorage.setItem('ac_pkce_callback', '1')

			// history.replaceState가 ?code=를 동기적으로 제거하기 전에 값 저장
			// → AuthView에서 exchangeCodeForSession()으로 수동 교환
			var codeMatch = rawSearch.match(/[?&]code=([^&]+)/)
			if (codeMatch) sessionStorage.setItem('ac_pkce_code', codeMatch[1])

			// stale localStorage 세션 제거 (Supabase 클라이언트 생성 전)
			// → initialize()가 GET /auth/v1/user 검증 시도하지 않음
			// → 내부 signOut() 미발생 → POST /auth/v1/logout 403 방지
			Object.keys(localStorage).forEach(function(key)
			{
				if (key.indexOf('-auth-token') !== -1) localStorage.removeItem(key)
			})
		}

		ErrorHandler.init()
		this.setMainContainer(new APage('main'))

		// PaymentManager 앱 전역 초기화
		var pm = PaymentManager.getInstance()
		pm.init(SupabaseManager.getInstance())

		var origOpen = this.mainContainer.open.bind(this.mainContainer)

		var LAY_TO_HASH = {
			'Source/MainView.lay':                  '#/',
			'Source/Auth/AuthView.lay':             '#/auth',
			'Source/Prompt/PromptRegisterView.lay': '#/register',
			'Source/MyPage/MyPageView.lay':         '#/mypage',
			'Source/Prompt/PromptDetailView.lay':   '#/detail',
			'Source/Admin/AdminView.lay':           '#/admin',
		}
		var HASH_TO_LAY = {}
		Object.keys(LAY_TO_HASH).forEach(function(k) { HASH_TO_LAY[LAY_TO_HASH[k]] = k })

		window.addEventListener('popstate', function(e)
		{
			var lay = (e.state && e.state.lay)
				|| HASH_TO_LAY[window.location.hash]
				|| 'Source/MainView.lay'
			origOpen(lay)
		})

		this.mainContainer.open = function(lay)
		{
			var hash = LAY_TO_HASH[lay] || '#/'
			try { history.pushState({ lay: lay }, '', hash) }
			catch(e) {}
			origOpen(lay)
		}

		// Toss 결제 리다이렉트 결과 감지
		var payResult = pm.parsePaymentResult()
		if (payResult)
		{
			pm.clearPaymentParams()
			this._handlePaymentReturn(payResult)
			return
		}

		// PKCE 콜백 또는 비밀번호 재설정일 때만 AuthView, 그 외 일반 진입은 MainView
		var isAuthCallback = sessionStorage.getItem('ac_pkce_callback') === '1'
		                  || sessionStorage.getItem('ac_pw_recovery')   === '1'

		if (isAuthCallback)
		{
			try { history.replaceState({ lay: 'Source/Auth/AuthView.lay' }, '', '#/auth') }
			catch(e) {}
			origOpen('Source/Auth/AuthView.lay')
		}
		else
		{
			try { history.replaceState({ lay: 'Source/MainView.lay' }, '', '#/') }
			catch(e) {}
			origOpen('Source/MainView.lay')
		}
	}

	async _handlePaymentReturn(result)
	{
		if (result.type === 'fail')
		{
			if (result.promptId)
			{
				this._promptId = result.promptId
				this.mainContainer.open('Source/Prompt/PromptDetailView.lay')
			}
			else
			{
				this.mainContainer.open('Source/MainView.lay')
			}
			setTimeout(function()
			{
				ToastManager.error('결제가 취소되었습니다' + (result.message ? ': ' + result.message : ''))
			}, 300)
			return
		}

		// 결제 성공 → Edge Function으로 승인 처리
		try
		{
			var sb   = SupabaseManager.getInstance()
			var user = await sb.getUser()

			if (!user) throw new Error('로그인이 필요합니다')

			var pm          = PaymentManager.getInstance()
			var { data, error } = await pm.confirmPayment(
				result.paymentKey,
				result.orderId,
				Number(result.amount),
				result.promptId,
				user.id
			)

			if (error) throw new Error(error.message || '결제 처리 실패')

			this._promptId = result.promptId
			this.mainContainer.open('Source/Prompt/PromptDetailView.lay')
			setTimeout(function() { ToastManager.success('구매가 완료되었습니다!') }, 300)
		}
		catch (e)
		{
			if (result.promptId)
			{
				this._promptId = result.promptId
				this.mainContainer.open('Source/Prompt/PromptDetailView.lay')
			}
			else
			{
				this.mainContainer.open('Source/MainView.lay')
			}
			setTimeout(function() { ToastManager.error('결제 처리 실패: ' + e.message) }, 300)
		}
	}

	unitTest(unitUrl)
	{
		this.onReady()
		super.unitTest(unitUrl)
	}
}
