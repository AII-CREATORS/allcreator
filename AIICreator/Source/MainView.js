
class MainView extends AView
{
	constructor()
	{
		super()
		this.sb            = null
		this.currentToolId = null
		this.currentSort   = 'latest'
		this.currentPrice  = 'all'    // all / free / paid
		this.currentType   = 'all'    // all / text / image
		this.searchKeyword = ''
		this.searchTimer   = null
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
					'<input class="ac-input main-search-input" id="search-input" type="text" placeholder="🔍  프롬프트 검색...">' +
				'</div>' +
				'<div class="main-nav-actions" id="nav-user-area">' +
					'<div class="ac-spinner"></div>' +
				'</div>' +
			'</header>' +

			// ── AI 도구 필터 탭 ──
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

			// ── 세부 필터 바 (STEP 6) ──
			'<div class="sub-filter-bar">' +
				'<div class="sub-filter-group">' +
					'<span class="sub-filter-label">가격</span>' +
					'<div class="sub-filter-chips" id="price-chips">' +
						'<button class="sub-chip active" data-price="all">전체</button>' +
						'<button class="sub-chip" data-price="free">무료</button>' +
						'<button class="sub-chip" data-price="paid">유료</button>' +
					'</div>' +
				'</div>' +
				'<div class="sub-filter-group">' +
					'<span class="sub-filter-label">타입</span>' +
					'<div class="sub-filter-chips" id="type-chips">' +
						'<button class="sub-chip active" data-type="all">전체</button>' +
						'<button class="sub-chip" data-type="text">텍스트</button>' +
						'<button class="sub-chip" data-type="image">이미지</button>' +
					'</div>' +
				'</div>' +
				'<button class="sub-filter-reset" id="btn-filter-reset">필터 초기화</button>' +
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

		area.querySelector('#btn-register').addEventListener('click', function()
		{
			theApp.mainContainer.open('Source/Prompt/PromptRegisterView.lay')
		})
	}

	_injectStyle()
	{
		if (document.getElementById('main-view-style')) return

		var style = document.createElement('style')
		style.id  = 'main-view-style'
		style.textContent =
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

			// AI 도구 필터 탭
			'.main-filter-bar{display:flex;align-items:center;gap:12px;padding:0 24px;height:52px;background:var(--color-primary);border-bottom:1px solid var(--color-border);flex-shrink:0;overflow-x:auto;}' +
			'.main-filter-bar::-webkit-scrollbar{height:0;}' +
			'.main-filter-tabs{display:flex;gap:6px;flex-shrink:0;}' +
			'.main-filter-tab{padding:5px 14px;border:1px solid var(--color-border);border-radius:var(--radius-full);background:transparent;color:var(--color-text-muted);font-size:0.8125rem;font-weight:500;font-family:var(--font-body);cursor:pointer;white-space:nowrap;transition:background var(--transition),color var(--transition),border-color var(--transition);}' +
			'.main-filter-tab:hover{border-color:var(--color-accent);color:var(--color-accent);}' +
			'.main-filter-tab.active{background:var(--color-accent);border-color:var(--color-accent);color:#fff;}' +
			'.main-sort{margin-left:auto;flex-shrink:0;}' +
			'.main-sort-select{padding:5px 10px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);color:var(--color-text);font-size:0.8125rem;font-family:var(--font-body);cursor:pointer;outline:none;}' +

			// 세부 필터 바
			'.sub-filter-bar{display:flex;align-items:center;gap:20px;padding:0 24px;height:44px;background:var(--color-primary-dark);border-bottom:1px solid var(--color-border);flex-shrink:0;overflow-x:auto;}' +
			'.sub-filter-bar::-webkit-scrollbar{height:0;}' +
			'.sub-filter-group{display:flex;align-items:center;gap:8px;flex-shrink:0;}' +
			'.sub-filter-label{font-size:0.75rem;font-weight:700;color:var(--color-text-dim);text-transform:uppercase;letter-spacing:0.04em;white-space:nowrap;}' +
			'.sub-filter-chips{display:flex;gap:4px;}' +
			'.sub-chip{padding:3px 10px;border:1px solid var(--color-border);border-radius:var(--radius-full);background:transparent;color:var(--color-text-muted);font-size:0.75rem;font-weight:500;font-family:var(--font-body);cursor:pointer;white-space:nowrap;transition:background var(--transition),color var(--transition),border-color var(--transition);}' +
			'.sub-chip:hover{border-color:var(--color-accent);color:var(--color-accent);}' +
			'.sub-chip.active{background:rgba(108,99,255,0.18);border-color:var(--color-accent);color:var(--color-accent);}' +
			'.sub-filter-reset{margin-left:auto;padding:3px 12px;border:1px solid var(--color-border);border-radius:var(--radius-full);background:transparent;color:var(--color-text-dim);font-size:0.75rem;font-family:var(--font-body);cursor:pointer;flex-shrink:0;transition:color var(--transition),border-color var(--transition);}' +
			'.sub-filter-reset:hover{color:var(--color-point);border-color:var(--color-point);}' +

			// 콘텐츠
			'.main-content{flex:1;overflow-y:auto;padding:24px;}' +

			// 마소니리 그리드
			'.prompt-grid{columns:3;column-gap:16px;}' +
			'.prompt-grid .ac-prompt-card{break-inside:avoid;margin-bottom:16px;display:inline-block;width:100%;}' +

			// 카드 썸네일 플레이스홀더 (타입별 색상)
			'.card-thumb-text{width:100%;height:140px;display:flex;align-items:center;justify-content:center;font-size:2rem;background:linear-gradient(135deg,#2E2E48,#3A3A5A);}' +
			'.card-thumb-image{width:100%;height:140px;display:flex;align-items:center;justify-content:center;font-size:2rem;background:linear-gradient(135deg,#2A2048,#3D1F5A);}' +

			// 로딩 / 빈 상태
			'.grid-loading{display:flex;justify-content:center;padding:60px;}' +
			'.grid-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;color:var(--color-text-muted);gap:12px;}' +
			'.grid-empty-icon{font-size:3rem;}' +
			'.grid-empty-text{font-size:1rem;font-weight:500;}' +

			// 검색 결과 헤더
			'.search-result-header{font-size:0.875rem;color:var(--color-text-muted);margin-bottom:16px;}' +
			'.search-result-header strong{color:var(--color-accent);}'

		document.head.appendChild(style)
	}

	// ─────────────────────────────────────────
	// 이벤트 바인딩
	// ─────────────────────────────────────────

	_bindEvents()
	{
		var el   = this.getElement()
		var self = this

		// 검색 — 300ms 디바운스
		el.querySelector('#search-input').addEventListener('input', function()
		{
			clearTimeout(self.searchTimer)
			self.searchKeyword = this.value.trim()
			self.searchTimer = setTimeout(function() { self._loadPrompts() }, 300)
		})

		// 정렬
		el.querySelector('#sort-select').addEventListener('change', function()
		{
			self.currentSort = this.value
			self._loadPrompts()
		})

		// 가격 필터
		el.querySelector('#price-chips').addEventListener('click', function(e)
		{
			var chip = e.target.closest('.sub-chip')
			if (!chip) return
			el.querySelectorAll('#price-chips .sub-chip').forEach(function(c) { c.classList.remove('active') })
			chip.classList.add('active')
			self.currentPrice = chip.getAttribute('data-price')
			self._loadPrompts()
		})

		// 타입 필터
		el.querySelector('#type-chips').addEventListener('click', function(e)
		{
			var chip = e.target.closest('.sub-chip')
			if (!chip) return
			el.querySelectorAll('#type-chips .sub-chip').forEach(function(c) { c.classList.remove('active') })
			chip.classList.add('active')
			self.currentType = chip.getAttribute('data-type')
			self._loadPrompts()
		})

		// 필터 초기화
		el.querySelector('#btn-filter-reset').addEventListener('click', function()
		{
			self._resetFilters()
		})

		// 외부 클릭 시 드롭다운 닫기
		document.addEventListener('click', function(e)
		{
			var dropdown = el.querySelector('#nav-dropdown')
			var avatar   = el.querySelector('#nav-avatar')
			if (dropdown && avatar && !avatar.contains(e.target) && !dropdown.contains(e.target))
				dropdown.style.display = 'none'
		})
	}

	_resetFilters()
	{
		var el = this.getElement()

		// AI 도구 필터
		el.querySelectorAll('.main-filter-tab').forEach(function(t) { t.classList.remove('active') })
		el.querySelector('.main-filter-tab[data-tool=""]').classList.add('active')
		this.currentToolId = null

		// 가격 / 타입
		el.querySelectorAll('#price-chips .sub-chip').forEach(function(c) { c.classList.remove('active') })
		el.querySelector('[data-price="all"]').classList.add('active')
		this.currentPrice = 'all'

		el.querySelectorAll('#type-chips .sub-chip').forEach(function(c) { c.classList.remove('active') })
		el.querySelector('[data-type="all"]').classList.add('active')
		this.currentType = 'all'

		// 검색어
		el.querySelector('#search-input').value = ''
		this.searchKeyword = ''

		// 정렬
		el.querySelector('#sort-select').value = 'latest'
		this.currentSort = 'latest'

		this._loadPrompts()
		ToastManager.info('필터가 초기화되었습니다')
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

	async _loadPrompts()
	{
		var grid = this.getElement().querySelector('#prompt-grid')
		grid.innerHTML = '<div class="grid-loading"><div class="ac-spinner"></div></div>'

		var query = this.sb.getClient()
			.from('prompts')
			.select('id, title, description, price, prompt_type, like_count, view_count, users(username), ai_tools(name)')
			.is('deleted_at', null)
			.eq('status', 'published')

		if (this.currentToolId)
			query = query.eq('ai_tool_id', this.currentToolId)

		if (this.currentPrice === 'free')
			query = query.eq('price', '0')
		else if (this.currentPrice === 'paid')
			query = query.neq('price', '0')

		if (this.currentType !== 'all')
			query = query.eq('prompt_type', this.currentType)

		if (this.searchKeyword)
			query = query.or('title.ilike.%' + this.searchKeyword + '%,description.ilike.%' + this.searchKeyword + '%')

		if (this.currentSort === 'popular')
			query = query.order('like_count', { ascending: false })
		else if (this.currentSort === 'price_asc')
			query = query.order('price', { ascending: true })
		else if (this.currentSort === 'price_desc')
			query = query.order('price', { ascending: false })
		else
			query = query.order('created_at', { ascending: false })

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
			var msg = this.searchKeyword
				? '"' + this.searchKeyword + '" 검색 결과가 없습니다'
				: '등록된 프롬프트가 없습니다'
			grid.innerHTML =
				'<div class="grid-empty">' +
					'<div class="grid-empty-icon">🔍</div>' +
					'<div class="grid-empty-text">' + msg + '</div>' +
				'</div>'
			return
		}

		var header = ''
		if (this.searchKeyword)
			header = '<div class="search-result-header"><strong>"' + this.searchKeyword + '"</strong> 검색 결과 ' + prompts.length + '개</div>'

		grid.innerHTML = header + prompts.map(function(p) { return self._cardHTML(p) }).join('')

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
		var isImage   = p.prompt_type === 'image'
		var thumbClass = isImage ? 'card-thumb-image' : 'card-thumb-text'
		var thumbIcon  = isImage ? '🎨' : '✍️'
		var thumb      = '<div class="' + thumbClass + '">' + thumbIcon + '</div>'

		var toolName   = p.ai_tools ? p.ai_tools.name : ''
		var toolBadge  = toolName ? '<span class="ac-badge ac-badge-accent">' + toolName + '</span>' : ''
		var typeBadge  = '<span class="ac-badge ac-badge-dim">' + (isImage ? '이미지' : '텍스트') + '</span>'

		var isFree = Number(p.price) === 0
		var price  = isFree
			? '<span class="ac-prompt-card-price free">무료</span>'
			: '<span class="ac-prompt-card-price">' + Number(p.price).toLocaleString() + '원</span>'

		var author = p.users ? '@' + p.users.username : ''

		return '<div class="ac-prompt-card" data-id="' + p.id + '">' +
			thumb +
			'<div class="ac-prompt-card-body">' +
				'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' + toolBadge + typeBadge + '</div>' +
				'<div class="ac-prompt-card-title">' + p.title + '</div>' +
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
		window._currentPromptId = id
		theApp.mainContainer.open('Source/Prompt/PromptDetailView.lay')
	}
}
