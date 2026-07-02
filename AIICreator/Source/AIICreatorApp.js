
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

		// ── Supabase 초기화 이전에 URL 읽기 (implicit flow) ──────────────────
		// Supabase createClient()가 hash를 비동기로 지우기 전에 먼저 확인
		// PKCE flow는 hash에 type=recovery가 없으므로 ErrorHandler에서 이벤트로 보완
		var rawHash   = window.location.hash
		var rawSearch = window.location.search
		if (rawHash.indexOf('type=recovery') !== -1 || rawSearch.indexOf('type=recovery') !== -1)
			sessionStorage.setItem('ac_pw_recovery', '1')

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

		try { history.replaceState({ lay: 'Source/Auth/AuthView.lay' }, '', '#/auth') }
		catch(e) {}
		origOpen('Source/Auth/AuthView.lay')
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
