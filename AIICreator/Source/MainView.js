
class MainView extends AView
{
	constructor()
	{
		super()
		this.sb          = null
		this.ps          = null
		this.navBar      = null
		this.filterBar   = null
		this.grid        = null
		this.heroKeyword = ''
		this.searchTimer = null
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
		// MainView는 예외적으로 뷰 전체(창)를 스크롤 — 그리드 영역에 별도 스크롤을 두지 않음
		this.getElement().style.overflowY = 'auto'
		this.getElement().style.overflowX = 'hidden'

		this.getElement().innerHTML =
			'<header id="main-navbar"></header>' +
			'<div style="padding:20px 24px 0;box-sizing:border-box;">' +
				'<section class="hero" id="main-hero">' +
					'<div class="hero-bg"></div>' +
					'<video class="hero-video" src="Template/Logo/hero-bg.mp4" autoplay muted loop playsinline></video>' +
					'<div class="hero-scrim"></div>' +
					'<div class="hero-content">' +
						'<div class="hero-eyebrow">AI Prompt Marketplace</div>' +
						'<h1 class="hero-title">오늘은 어떤 프롬프트를 찾고 있나요?</h1>' +
						'<div class="hero-search-bar">' +
							'<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke-width="2"/><path d="M21 21l-4.3-4.3" stroke-width="2" stroke-linecap="round"/></svg>' +
							'<input type="text" class="hero-search-input" id="hero-search-input" placeholder="프롬프트 검색...">' +
							'<button class="hero-search-go" id="hero-search-go">검색</button>' +
						'</div>' +
					'</div>' +
				'</section>' +
			'</div>' +
			'<div id="main-filterbar"></div>' +
			'<main class="main-content" id="main-grid-wrap"></main>' +
			'<footer id="main-footer"></footer>'

		Footer.mountStandard(this.getElement().querySelector('#main-footer'))
	}

	_initComponents()
	{
		var el   = this.getElement()
		var self = this

		this.navBar = new NavBar(el.querySelector('#main-navbar'), {
			onSearch:   function()   { self._resetSearch() },
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

		this._bindHeroSearch()
	}

	_bindHeroSearch()
	{
		var self  = this
		var el    = this.getElement()
		var input = el.querySelector('#hero-search-input')
		var go    = el.querySelector('#hero-search-go')

		if (input)
		{
			input.value = this.heroKeyword
			input.addEventListener('input', function()
			{
				self.heroKeyword = this.value.trim()
				clearTimeout(self.searchTimer)
				self.searchTimer = setTimeout(function() { self._loadPrompts() }, 300)
			})
		}

		if (go)
		{
			go.addEventListener('click', function()
			{
				clearTimeout(self.searchTimer)
				self._loadPrompts()
			})
		}
	}

	_resetSearch()
	{
		this.heroKeyword = ''
		var input = this.getElement().querySelector('#hero-search-input')
		if (input) input.value = ''
		this._loadPrompts()
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
		var kw = this.heroKeyword

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
