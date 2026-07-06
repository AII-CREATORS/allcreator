
class AIICreatorApp extends AApplication
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

		// ── No-persist: 새 브라우저 세션 시작 시 세션 토큰만 정확히 삭제 ────────
		// 패턴 매칭(indexOf) 대신 정확한 키 사용
		// → PKCE code_verifier(sb-...-auth-token-code-verifier) 삭제 방지
		var noPersist    = localStorage.getItem('ac_no_persist') === '1'
		var sessionAlive = sessionStorage.getItem('ac_session_alive') === '1'
		if (noPersist && !sessionAlive)
			localStorage.removeItem('sb-gnwpnesdjjjoevregdmo-auth-token')

		// ── Auth 콜백 유형 감지 (Supabase 클라이언트 생성 전에 URL 캡처) ──────
		// createClient()의 initialize()가 ?code= 처리 후 URL을 정리하므로
		// 그 전에 타입을 sessionStorage에 저장해 AuthView가 참조할 수 있게 함
		var rawSearch = window.location.search
		var rawHash   = window.location.hash
		var isAuthCallback = rawSearch.indexOf('code=') !== -1
		                  || rawHash.indexOf('access_token') !== -1

		if (isAuthCallback)
		{
			var isRecovery = rawSearch.indexOf('type=recovery') !== -1
			              || rawHash.indexOf('type=recovery') !== -1
			sessionStorage.setItem('ac_auth_callback', isRecovery ? 'recovery' : 'oauth')
		}

		// ── 앱 인프라 초기화 ─────────────────────────────────────────────────
		// createClient() 호출 시점: detectSessionInUrl:true(기본값) 로
		// ?code= / #access_token= 자동 감지 및 교환 시작 (initialize()는 async)
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

		// ── Toss 결제 리다이렉트 ─────────────────────────────────────────────
		var payResult = pm.parsePaymentResult()
		if (payResult)
		{
			pm.clearPaymentParams()
			this._handlePaymentReturn(payResult)
			return
		}

		// ── 초기 뷰 결정 ─────────────────────────────────────────────────────
		// auth 콜백이면 AuthView (Supabase가 자동으로 ?code= 교환 처리)
		// 일반 진입이면 MainView (게스트 또는 자동 로그인)
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
