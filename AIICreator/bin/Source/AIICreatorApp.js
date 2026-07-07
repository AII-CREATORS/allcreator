
AIICreatorApp = class AIICreatorApp extends AApplication
{
	constructor()
	{
		super()
		this._promptId          = null
		this.editPromptId       = null
		this.editReturnToDetail = null
		this._filterState       = null
	}

	openDetail(id)
	{
		this._promptId = id
		this.mainContainer.open('Source/Prompt/PromptDetailView.lay')
	}

	getDetailId() { return this._promptId }

	onReady()
	{
		super.onReady()

		var noPersist    = localStorage.getItem('ac_no_persist') === '1'
		var sessionAlive = sessionStorage.getItem('ac_session_alive') === '1'
		if (noPersist && !sessionAlive)
			localStorage.removeItem('sb-gnwpnesdjjjoevregdmo-auth-token')

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

		ErrorHandler.init()
		this.setMainContainer(new APage('main'))

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

		var payResult = pm.parsePaymentResult()
		if (payResult)
		{
			pm.clearPaymentParams()
			this._handlePaymentReturn(payResult)
			return
		}

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
