
MainView = class MainView extends AView
{
	constructor()
	{
		super()
		this.sb          = null
		this.currentUser = null
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
		this._injectStyle()
		this._renderShell()
		this._initComponents()
		this._bootstrap()
	}

	onActiveDone(isFirst)
	{
		super.onActiveDone(isFirst)
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
			onLogout:   async function()
			{
				await self.sb.signOut()
				theApp.mainContainer.open('Source/Auth/AuthView.lay')
			}
		})

		this.filterBar = new FilterBar(el.querySelector('#main-filterbar'), {
			onChange: function() { self._loadPrompts() }
		})

		this.grid = new PromptGrid(el.querySelector('#main-grid-wrap'), {
			onCardClick: function(id)
			{
				window._currentPromptId = id
				theApp.mainContainer.open('Source/Prompt/PromptDetailView.lay')
			}
		})
	}

	_injectStyle()
	{
		if (document.getElementById('main-view-style')) return
		var style = document.createElement('style')
		style.id  = 'main-view-style'
		style.textContent =
			'.AView-Style{display:flex;flex-direction:column;overflow:hidden;}' +
			'#main-navbar{flex-shrink:0;position:relative;z-index:100;}' +
			'#main-filterbar{flex-shrink:0;}' +
			'.main-content{flex:1;overflow-y:auto;padding:24px;}'
		document.head.appendChild(style)
	}

	// ─────────────────────────────────────────
	// 부트스트랩
	// ─────────────────────────────────────────

	async _bootstrap()
	{
		this.currentUser = await this.sb.getUser()
		this.navBar.render(this.currentUser)

		var aiTools = await this._fetchAITools()
		this.filterBar.render(aiTools)

		await this._loadPrompts()
	}

	async _fetchAITools()
	{
		var result = await this.sb.getClient().from('ai_tools').select('id, name').order('name')
		return result.data || []
	}

	// ─────────────────────────────────────────
	// 데이터 로드
	// ─────────────────────────────────────────

	async _loadPrompts()
	{
		this.grid.renderLoading()

		var fs  = this.filterBar.getState()
		var kw  = this.navBar.getKeyword()

		var query = this.sb.getClient()
			.from('prompts')
			.select('id, title, description, price, prompt_type, like_count, view_count, users(username), ai_tools(name)')
			.is('deleted_at', null)
			.eq('status', 'published')

		if (fs.toolId)          query = query.eq('ai_tool_id', fs.toolId)
		if (fs.price === 'free') query = query.eq('price', '0')
		else if (fs.price === 'paid') query = query.neq('price', '0')
		if (fs.type !== 'all')  query = query.eq('prompt_type', fs.type)
		if (kw)                 query = query.or('title.ilike.%' + kw + '%,description.ilike.%' + kw + '%')

		if (fs.sort === 'popular')    query = query.order('like_count', { ascending: false })
		else if (fs.sort === 'price_asc')  query = query.order('price',      { ascending: true  })
		else if (fs.sort === 'price_desc') query = query.order('price',      { ascending: false })
		else                               query = query.order('created_at', { ascending: false })

		var result = await query.limit(30)

		if (result.error)
		{
			ToastManager.error('데이터 로드 실패: ' + result.error.message)
			this.grid.renderError()
			return
		}

		this.grid.renderCards(result.data || [], kw)
	}
}
