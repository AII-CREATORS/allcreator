
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
		ErrorHandler.init()
		this.setMainContainer(new APage('main'))

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

		try { history.replaceState({ lay: 'Source/Auth/AuthView.lay' }, '', '#/auth') }
		catch(e) {}
		origOpen('Source/Auth/AuthView.lay')
	}

	unitTest(unitUrl)
	{
		this.onReady()
		super.unitTest(unitUrl)
	}
}
