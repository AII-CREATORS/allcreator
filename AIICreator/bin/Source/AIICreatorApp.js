
AIICreatorApp = class AIICreatorApp extends AApplication
{
	constructor()
	{
		super()
	}

	onReady()
	{
		super.onReady()

		ErrorHandler.init()

		this.setMainContainer(new APage('main'))

		var self     = this
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

		// 브라우저 뒤로/앞으로 버튼 처리
		window.addEventListener('popstate', function(e)
		{
			var lay = (e.state && e.state.lay)
				|| HASH_TO_LAY[window.location.hash]
				|| 'Source/MainView.lay'
			origOpen(lay)
		})

		// 모든 mainContainer.open() 호출을 히스토리에 기록
		this.mainContainer.open = function(lay)
		{
			var hash = LAY_TO_HASH[lay] || '#/'
			history.pushState({ lay: lay }, '', hash)
			origOpen(lay)
		}

		// 초기 진입: hash에 맞는 뷰 열기 (replaceState로 스택 오염 방지)
		var initLay = HASH_TO_LAY[window.location.hash] || 'Source/Auth/AuthView.lay'
		history.replaceState({ lay: initLay }, '', LAY_TO_HASH[initLay] || '#/auth')
		origOpen(initLay)
	}

	unitTest(unitUrl)
	{
		this.onReady()
		super.unitTest(unitUrl)
	}
}
