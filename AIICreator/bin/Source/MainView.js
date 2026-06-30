
MainView = class MainView extends AView
{
	constructor()
	{
		super()
		this.sb          = null
		this.ps          = null
		this.navBar      = null
		this.filterBar   = null
		this.grid        = null
	}

	init(context, evtListener)
	{
		super.init(context, evtListener)
	}

	onInitDone()
	{
		super.onInitDone()
		this.sb = SupabaseManager.getInstance()
		this.ps = new PromptService(this.sb)
		this._renderShell()
		this._initComponents()
		this._bootstrap()
	}

	onActiveDone(isFirst)
	{
		super.onActiveDone(isFirst)
	}

	// -----------------------------------------
	// 셸 렌더 & 컴포넌트 초기화
	// -----------------------------------------

	_renderShell()
	{
		this.getElement().innerHTML =
			'<header id="main-navbar"></header>' +
			'<div id="main-filterbar"></div>' +
			'<main class="main-content" id="main-grid-wrap"></main>'
	}

	_initComponents()
	{
		var el   = this.getElement()
		var self = this

		this.navBar = new NavBar(el.querySelector('#main-navbar'), {
			onSearch:   function(kw) { self._loadPrompts() },
			onLogin:    function()   { theApp.mainContainer.open('Source/Auth/AuthView.lay') },
			onRegister: function()   { theApp.mainContainer.open('Source/Prompt/PromptRegisterView.lay') },
			onMyPage:   function()   { theApp.mainContainer.open('Source/MyPage/MyPageView.lay') },
			onAdmin:    function()   { theApp.mainContainer.open('Source/Admin/AdminView.lay') },
			onLogout:   async function()
			{
				await self.sb.signOut()
				localStorage.removeItem('ac_persist_login')
				sessionStorage.removeItem('ac_session_active')
				theApp.mainContainer.open('Source/Auth/AuthView.lay')
			}
		})

		this.filterBar = new FilterBar(el.querySelector('#main-filterbar'), {
			onChange: function() { self._loadPrompts() }
		})

		this.grid = new PromptGrid(el.querySelector('#main-grid-wrap'), {
			onCardClick: function(id)
			{
				theApp.openDetail(id)
			}
		})
	}

	// -----------------------------------------
	// 부트스트랩
	// -----------------------------------------

	async _bootstrap()
	{
		await this.navBar.render()

		var aiToolsResult = await this.ps.getAITools()
		this.filterBar.render(aiToolsResult.data || [])

		await this._loadPrompts()
	}

	// -----------------------------------------
	// 데이터 로드
	// -----------------------------------------

	async _loadPrompts()
	{
		this.grid.renderLoading()

		var fs = this.filterBar.getState()
		var kw = this.navBar.getKeyword()

		var result = await this.ps.list({
			toolId:  fs.toolId,
			price:   fs.price,
			type:    fs.type,
			sort:    fs.sort,
			keyword: kw,
			limit:   30
		})

		if (result.error)
		{
			ToastManager.error('데이터 로드 실패: ' + result.error.message)
			this.grid.renderError()
			return
		}

		this.grid.renderCards(result.data || [], kw)
	}
}
