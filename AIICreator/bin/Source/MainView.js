
MainView = class MainView extends AView
{
	constructor()
	{
		super()
		this.sb        = null
		this.ps        = null
		this.navBar    = null
		this.filterBar = null
		this.grid      = null
	}

	onInitDone()
	{
		super.onInitDone()
		this.sb = SupabaseManager.getInstance()
		this.ps = new PromptService(this.sb)
		this._renderShell()
		this._initComponents()
	}

	async onActiveDone(isFirst)
	{
		super.onActiveDone(isFirst)
		await this._bootstrap()
	}

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
			onSearch:   function()   { self._loadPrompts() },
			onLogin:    function()   { theApp.mainContainer.open('Source/Auth/AuthView.lay') },
			onRegister: function()   { theApp.mainContainer.open('Source/Prompt/PromptRegisterView.lay') },
			onMyPage:   function()   { theApp.mainContainer.open('Source/MyPage/MyPageView.lay') },
			onAdmin:    function()   { theApp.mainContainer.open('Source/Admin/AdminView.lay') },
			onLogout:   async function()
			{
				sessionStorage.removeItem('ac_session_alive')
				await self.sb.signOut()
				theApp._filterState = null
				await self._bootstrap()
			}
		})

		this.filterBar = new FilterBar(el.querySelector('#main-filterbar'), {
			onChange: function()
			{
				theApp._filterState = self.filterBar.getState()
				self._loadPrompts()
			}
		})

		this.grid = new PromptGrid(el.querySelector('#main-grid-wrap'), {
			onCardClick: function(id) { theApp.openDetail(id) }
		})
	}

	async _bootstrap()
	{
		await this.navBar.render()

		var toolResult = await this.ps.getAITools()
		this.filterBar.render(toolResult.data || [])
		this.filterBar.restoreState(theApp._filterState)

		await this._loadPrompts()
	}

	async _loadPrompts()
	{
		this.grid.renderLoading()

		var fs = this.filterBar.getState()
		var kw = this.navBar.getKeyword()

		var result = await this.ps.list({
			toolIds: fs.toolIds,
			prices:  fs.prices,
			types:   fs.types,
			sort:    fs.sort,
			keyword: kw
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
