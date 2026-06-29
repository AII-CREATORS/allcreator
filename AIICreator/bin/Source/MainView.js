
MainView = class MainView extends AView
{
	constructor()
	{
		super()
		this.sb          = null
		this.currentToolId = null   // null = 전체
		this.currentSort   = 'latest'
		this.aiTools       = []
		this.currentUser   = null
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
		this._renderHTML()
		this._bindEvents()
		this._bootstrap()
	}

	onActiveDone(isFirst)
	{
		super.onActiveDone(isFirst)
	}

	// ─────────────────────────────────────────
	// 초기화
	// ─────────────────────────────────────────

	async _bootstrap()
	{
		this.currentUser = await this.sb.getUser()
		this._renderUserArea()
		await this._loadAITools()
	}

	// ─────────────────────────────────────────
	// HTML 렌더링
	// ─────────────────────────────────────────

	_renderHTML()
	{
		this.getElement().innerHTML =

			// ── 네비게이션 바 ──
			'<header class="main-nav">' +
				'<div class="main-nav-logo">' +
					'<span class="main-nav-logo-text">ALL</span>' +
					'<span class="main-nav-logo-accent">Creator</span>' +
				'</div>' +
				'<div class="main-nav-search">' +
					'<input class="ac-input main-search-input" id="search-input" type="text" placeholder="프롬프트 검색...">' +
				'</div>' +
				'<div class="main-nav-actions" id="nav-user-area">' +
					'<div class="ac-spinner"></div>' +
				'</div>' +
			'</header>' +

			// ── 필터 바 ──
			'<div class="main-filter-bar">' +
				'<div class="main-filter-tabs" id="filter-tabs">' +
					'<button class="main-filter-tab active" data-tool="">전체</button>' +
				'</div>' +
				'<div class="main-sort">' +
					'<select class="main-sort-select" id="sort-select">' +
						'<option value="latest">최신순</option>' +
						'<option value="popular">인기순</option>' +
						'<option value="price_asc">낮은 가격순</option>' +
						'<option value="price_desc">높은 가격순</option>' +
					'</select>' +
				'</div>' +
			'</div>' +

			// ── 프롬프트 그리드 ──
			'<main class="main-content">' +
				'<div class="prompt-grid" id="prompt-grid">' +
					'<div class="grid-loading"><div class="ac-spinner"></div></div>' +
				'</div>' +
			'</main>'
	}

	_renderUserArea()
	{
		var area = this.getElement().querySelector('#nav-user-area')
		var self = this

		if (!this.currentUser)
		{
			area.innerHTML =
				'<button class="ac-btn ac-btn-outline ac-btn-sm" id="btn-to-login">로그인</button>'

			area.querySelector('#btn-to-login').addEventListener('click', function()
			{
				theApp.mainContainer.open('Source/Auth/AuthView.lay')
			})
			return
		}

		var initial = (this.currentUser.email || 'U')[0].toUpperCase()

		area.innerHTML =
			'<button class="ac-btn ac-btn-secondary ac-btn-sm" id="btn-register">+ 프롬프트 등록</button>' +
			'<div class="ac-avatar nav-avatar" id="nav-avatar">' + initial + '</div>' +
			'<div class="nav-dropdown" id="nav-dropdown" style="display:none">' +
				'<div class="nav-dropdown-email">' + this.currentUser.email + '</div>' +
				'<button class="nav-dropdown-item" id="btn-logout">로그아웃</button>' +
			'</div>'

		area.querySelector('#nav-avatar').addEventListener('click', function()
		{
			var dd = area.querySelector('#nav-dropdown')
			dd.style.display = dd.style.display === 'none' ? '' : 'none'
		})

		area.querySelector('#btn-logout').addEventListener('click', async function()
		{
			await self.sb.signOut()
			theApp.mainContainer.open('Source/Auth/AuthView.lay')
		})

		// 등록 버튼 — STEP 8에서 연결
		area.querySelector('#btn-register').addEventListener('click', function()
		{
			ToastManager.info('프롬프트 등록 기능은 준비 중입니다')
		})
	}

	_injectStyle()
	{
		if (document.getElementById('main-view-style')) return

		var style = document.createElement('style')
		style.id  = 'main-view-style'
		style.textContent =
			// 레이아웃
			'.AView-Style{display:flex;flex-direction:column;overflow:hidden;}' +

			// 네비게이션 바
			'.main-nav{display:flex;align-items:center;gap:16px;padding:0 24px;height:60px;background:var(--color-primary-dark);border-bottom:1px solid var(--color-border);flex-shrink:0;position:relative;z-index:100;}' +
			'.main-nav-logo{font-family:var(--font-title);font-size:1.375rem;font-weight:700;white-space:nowrap;flex-shrink:0;}' +
			'.main-nav-logo-text{color:var(--color-text);}' +
			'.main-nav-logo-accent{color:var(--color-accent);margin-left:3px;}' +
			'.main-nav-search{flex:1;max-width:480px;}' +
			'.main-search-input{padding:8px 14px;font-size:0.875rem;}' +
			'.main-nav-actions{display:flex;align-items:center;gap:10px;margin-left:auto;position:relative;}' +
			'.nav-avatar{cursor:pointer;width:34px;height:34px;font-size:0.8125rem;}' +
			'.nav-dropdown{position:absolute;top:calc(100% + 8px);right:0;background:var(--color-surface);border:1px solid var(--color-border-light);border-radius:var(--radius-md);padding:8px;min-width:200px;box-shadow:var(--shadow-md);z-index:200;}' +
			'.nav-dropdown-email{font-size:0.75rem;color:var(--color-text-muted);padding:6px 10px 10px;border-bottom:1px solid var(--color-border);margin-bottom:6px;}' +
			'.nav-dropdown-item{width:100%;padding:8px 10px;background:none;border:none;color:var(--color-text);font-size:0.875rem;font-family:var(--font-body);text-align:left;border-radius:var(--radius-sm);cursor:pointer;}' +
			'.nav-dropdown-item:hover{background:var(--color-surface-2);}' +

			// 필터 바
			'.main-filter-bar{display:flex;align-items:center;gap:12px;padding:0 24px;height:52px;background:var(--color-primary);border-bottom:1px solid var(--color-border);flex-shrink:0;overflow-x:auto;}' +
			'.main-filter-bar::-webkit-scrollbar{height:0;}' +
			'.main-filter-tabs{display:flex;gap:6px;flex-shrink:0;}' +
			'.main-filter-tab{padding:5px 14px;border:1px solid var(--color-border);border-radius:var(--radius-full);background:transparent;color:var(--color-text-muted);font-size:0.8125rem;font-weight:500;font-family:var(--font-body);cursor:pointer;white-space:nowrap;transition:background var(--transition),color var(--transition),border-color var(--transition);}' +
			'.main-filter-tab:hover{border-color:var(--color-accent);color:var(--color-accent);}' +
			'.main-filter-tab.active{background:var(--color-accent);border-color:var(--color-accent);color:#fff;}' +
			'.main-sort{margin-left:auto;flex-shrink:0;}' +
			'.main-sort-select{padding:5px 10px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);color:var(--color-text);font-size:0.8125rem;font-family:var(--font-body);cursor:pointer;outline:none;}' +

			// 콘텐츠 영역
			'.main-content{flex:1;overflow-y:auto;padding:24px;}' +

			// 마소니리 그리드
			'.prompt-grid{columns:3;column-gap:16px;}' +
			'.prompt-grid .ac-prompt-card{break-inside:avoid;margin-bottom:16px;display:inline-block;width:100%;}' +
			'.ac-prompt-card-thumb-placeholder{width:100%;height:160px;background:linear-gradient(135deg,var(--color-surface-2),var(--color-border));}' +

			// 로딩 / 빈 상태
			'.grid-loading{display:flex;justify-content:center;padding:60px;}' +
			'.grid-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;color:var(--color-text-muted);gap:12px;}' +
			'.grid-empty-icon{font-size:3rem;}' +
			'.grid-empty-text{font-size:1rem;font-weight:500;}'

		document.head.appendChild(style)
	}

	// ─────────────────────────────────────────
	// 이벤트 바인딩
	// ─────────────────────────────────────────

	_bindEvents()
	{
		var el   = this.getElement()
		var self = this

		// 정렬 변경
		el.querySelector('#sort-select').addEventListener('change', function()
		{
			self.currentSort = this.value
			self._loadPrompts()
		})

		// 검색 — STEP 6에서 확장 (Enter 시 필터링)
		el.querySelector('#search-input').addEventListener('keydown', function(e)
		{
			if (e.key === 'Enter') self._loadPrompts(this.value.trim())
		})

		// 외부 클릭 시 드롭다운 닫기
		document.addEventListener('click', function(e)
		{
			var dropdown = el.querySelector('#nav-dropdown')
			var avatar   = el.querySelector('#nav-avatar')
			if (dropdown && avatar && !avatar.contains(e.target) && !dropdown.contains(e.target))
			{
				dropdown.style.display = 'none'
			}
		})
	}

	// ─────────────────────────────────────────
	// 데이터 로드
	// ─────────────────────────────────────────

	async _loadAITools()
	{
		var result = await this.sb.getClient()
			.from('ai_tools')
			.select('id, name')
			.order('name')

		this.aiTools = result.data || []
		this._renderFilterTabs()
		await this._loadPrompts()
	}

	_renderFilterTabs()
	{
		var container = this.getElement().querySelector('#filter-tabs')
		var self      = this
		var html      = '<button class="main-filter-tab active" data-tool="">전체</button>'

		this.aiTools.forEach(function(tool)
		{
			html += '<button class="main-filter-tab" data-tool="' + tool.id + '">' + tool.name + '</button>'
		})

		container.innerHTML = html

		container.querySelectorAll('.main-filter-tab').forEach(function(tab)
		{
			tab.addEventListener('click', function()
			{
				container.querySelectorAll('.main-filter-tab').forEach(function(t) { t.classList.remove('active') })
				tab.classList.add('active')
				self.currentToolId = tab.getAttribute('data-tool') || null
				self._loadPrompts()
			})
		})
	}

	async _loadPrompts(searchKeyword)
	{
		var grid = this.getElement().querySelector('#prompt-grid')
		grid.innerHTML = '<div class="grid-loading"><div class="ac-spinner"></div></div>'

		var query = this.sb.getClient()
			.from('prompts')
			.select('id, title, description, price, thumbnail_url, like_count, view_count, is_free, users(username), ai_tools(name)')
			.is('deleted_at', null)
			.eq('status', 'published')

		if (this.currentToolId)
		{
			query = query.eq('ai_tool_id', this.currentToolId)
		}

		if (searchKeyword)
		{
			query = query.ilike('title', '%' + searchKeyword + '%')
		}

		if (this.currentSort === 'popular')
		{
			query = query.order('like_count', { ascending: false })
		}
		else if (this.currentSort === 'price_asc')
		{
			query = query.order('price', { ascending: true })
		}
		else if (this.currentSort === 'price_desc')
		{
			query = query.order('price', { ascending: false })
		}
		else
		{
			query = query.order('created_at', { ascending: false })
		}

		var result = await query.limit(30)

		if (result.error)
		{
			ToastManager.error('데이터 로드 실패: ' + result.error.message)
			grid.innerHTML = '<div class="grid-empty"><div class="grid-empty-icon">⚠️</div><div class="grid-empty-text">불러오기 실패</div></div>'
			return
		}

		this._renderCards(result.data || [])
	}

	_renderCards(prompts)
	{
		var grid = this.getElement().querySelector('#prompt-grid')
		var self = this

		if (!prompts.length)
		{
			grid.innerHTML =
				'<div class="grid-empty">' +
					'<div class="grid-empty-icon">🔍</div>' +
					'<div class="grid-empty-text">등록된 프롬프트가 없습니다</div>' +
				'</div>'
			return
		}

		grid.innerHTML = prompts.map(function(p) { return self._cardHTML(p) }).join('')

		grid.querySelectorAll('.ac-prompt-card').forEach(function(card)
		{
			card.addEventListener('click', function()
			{
				self._onCardClick(card.getAttribute('data-id'))
			})
		})
	}

	_cardHTML(p)
	{
		var thumb = p.thumbnail_url
			? '<img class="ac-prompt-card-thumb" src="' + p.thumbnail_url + '" alt="">'
			: '<div class="ac-prompt-card-thumb-placeholder"></div>'

		var toolBadge = p.ai_tools
			? '<span class="ac-badge ac-badge-accent">' + p.ai_tools.name + '</span>'
			: ''

		var price = p.is_free === 'Y'
			? '<span class="ac-prompt-card-price free">무료</span>'
			: '<span class="ac-prompt-card-price">' + Number(p.price).toLocaleString() + '원</span>'

		var author = p.users ? '@' + p.users.username : ''

		return '<div class="ac-prompt-card" data-id="' + p.id + '">' +
			thumb +
			'<div class="ac-prompt-card-body">' +
				toolBadge +
				'<div class="ac-prompt-card-title" style="margin-top:' + (toolBadge ? '8px' : '0') + '">' + p.title + '</div>' +
				'<div class="ac-prompt-card-desc">' + (p.description || '') + '</div>' +
				'<div class="ac-prompt-card-footer">' +
					price +
					'<span class="ac-caption" style="display:flex;align-items:center;gap:6px">' +
						'<span>♥ ' + (p.like_count || 0) + '</span>' +
						'<span>' + author + '</span>' +
					'</span>' +
				'</div>' +
			'</div>' +
		'</div>'
	}

	// ─────────────────────────────────────────
	// 화면 전환
	// ─────────────────────────────────────────

	_onCardClick(id)
	{
		console.log('[MainView] prompt clicked:', id)
		// TODO: STEP 7 - 프롬프트 상세 화면으로 이동
	}
}