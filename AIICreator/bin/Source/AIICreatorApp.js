
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

		var self = this

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

		// base: 쿼리스트링 없는 순수 경로. detail/register는 id를 #/detail/<id> 형태로 추가 인코딩해서
		// 새로고침 시에도 어떤 프롬프트를 보고 있었는지 복원할 수 있게 함
		var ROUTES = [
			{ lay: 'Source/MainView.lay',                  base: '#/'         },
			{ lay: 'Source/Auth/AuthView.lay',              base: '#/auth'     },
			{ lay: 'Source/Prompt/PromptRegisterView.lay',  base: '#/register' },
			{ lay: 'Source/MyPage/MyPageView.lay',          base: '#/mypage'   },
			{ lay: 'Source/Prompt/PromptDetailView.lay',    base: '#/detail'   },
			{ lay: 'Source/Admin/AdminView.lay',            base: '#/admin'    },
		]

		function hashFor(lay)
		{
			if (lay === 'Source/Prompt/PromptDetailView.lay' && self._promptId)
				return '#/detail/' + self._promptId
			if (lay === 'Source/Prompt/PromptRegisterView.lay' && self.editPromptId)
				return '#/register/' + self.editPromptId
			var route = ROUTES.filter(function(r) { return r.lay === lay })[0]
			return route ? route.base : '#/'
		}

		function parseRoute(hash)
		{
			var parts = (hash || '#/').split('/')
			var base  = '#/' + (parts[1] || '')
			var id    = parts[2] || null
			var route = ROUTES.filter(function(r) { return r.base === base })[0]
			return { lay: route ? route.lay : null, id: id }
		}

		function openRoute(lay, id)
		{
			if (lay === 'Source/Prompt/PromptDetailView.lay' && id)   self._promptId    = id
			if (lay === 'Source/Prompt/PromptRegisterView.lay' && id) self.editPromptId = id
			origOpen(lay)
		}

		window.addEventListener('popstate', function(e)
		{
			var route = (e.state && e.state.lay)
				? { lay: e.state.lay, id: e.state.id }
				: parseRoute(window.location.hash)
			openRoute(route.lay || 'Source/MainView.lay', route.id)
		})

		this.mainContainer.open = function(lay)
		{
			var hash = hashFor(lay)
			var id   = hash.split('/')[2] || null
			try { history.pushState({ lay: lay, id: id }, '', hash) }
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
			return
		}

		// 새로고침(F5) 시 이전에 보고 있던 화면으로 복귀 (URL 해시 기준)
		var initial = parseRoute(window.location.hash)
		var lay     = initial.lay || 'Source/MainView.lay'

		if (lay === 'Source/Prompt/PromptDetailView.lay' && initial.id)   this._promptId    = initial.id
		if (lay === 'Source/Prompt/PromptRegisterView.lay' && initial.id) this.editPromptId = initial.id

		try { history.replaceState({ lay: lay, id: initial.id }, '', hashFor(lay)) }
		catch(e) {}
		origOpen(lay)
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
