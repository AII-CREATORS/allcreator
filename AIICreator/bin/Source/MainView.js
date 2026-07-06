
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
		// _bootstrap()은 onActiveDone에서 호출 (auth 상태 확인 후 NavBar 렌더링)
	}

	async onActiveDone(isFirst)
	{
		super.onActiveDone(isFirst)
		await this._bootstrap()
	}

	// ─────────────────────────────────────────
	// 셸 렌더 & 컴포넌트 초기화
	// ─────────────────────────────────────────

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
				sessionStorage.removeItem('ac_session_alive')
				await self.sb.signOut()
				// AuthView로 이동하지 않고 MainView에서 게스트 상태로 재렌더링
				await self._bootstrap()
			}
		})

		this.filterBar = new FilterBar(el.querySelector('#main-filterbar'), {
			onChange: function() { self._loadPrompts() }
		})

		this.grid = new PromptGrid(el.querySelector('#main-grid-wrap'), {
			onCardClick: function(id) { theApp.openDetail(id) }
		})
	}

	// ─────────────────────────────────────────
	// 부트스트랩
	// ─────────────────────────────────────────

	async _bootstrap()
	{
		await this.navBar.render()

		var toolResult = await this.ps.getAITools()
		this.filterBar.render(toolResult.data || [])

		await this._loadPrompts()
	}

	// ─────────────────────────────────────────
	// 데이터 로드
	// ─────────────────────────────────────────

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
