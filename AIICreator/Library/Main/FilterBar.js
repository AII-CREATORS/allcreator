
FilterBar = class FilterBar
{
	constructor(container, callbacks)
	{
		// callbacks: { onChange }
		this.el       = container
		this.callbacks = callbacks || {}
		this.aiTools  = []
		this.state    = {
			toolId: null,
			sort:   'latest',
			price:  'all',
			type:   'all'
		}
	}

	// ─────────────────────────────────────────
	// 렌더
	// ─────────────────────────────────────────

	render(aiTools)
	{
		this.aiTools = aiTools || []
		this._injectStyle()
		this.el.innerHTML = this._html()
		this._bindEvents()
	}

	_html()
	{
		var tabsHTML = '<button class="fb-tool-tab active" data-tool="">전체</button>'
		this.aiTools.forEach(function(t)
		{
			tabsHTML += '<button class="fb-tool-tab" data-tool="' + t.id + '">' + t.name + '</button>'
		})

		return '<div class="fb-tool-bar">' +
				'<div class="fb-tool-tabs" id="fb-tool-tabs">' + tabsHTML + '</div>' +
				'<div class="fb-sort">' +
					'<select class="fb-sort-select" id="fb-sort">' +
						'<option value="latest">최신순</option>' +
						'<option value="popular">인기순</option>' +
						'<option value="price_asc">낮은 가격순</option>' +
						'<option value="price_desc">높은 가격순</option>' +
					'</select>' +
				'</div>' +
			'</div>' +
			'<div class="fb-chip-bar">' +
				'<div class="fb-chip-group">' +
					'<span class="fb-chip-label">가격</span>' +
					'<div class="fb-chips" id="fb-price-chips">' +
						'<button class="fb-chip active" data-price="all">전체</button>' +
						'<button class="fb-chip" data-price="free">무료</button>' +
						'<button class="fb-chip" data-price="paid">유료</button>' +
					'</div>' +
				'</div>' +
				'<div class="fb-chip-group">' +
					'<span class="fb-chip-label">타입</span>' +
					'<div class="fb-chips" id="fb-type-chips">' +
						'<button class="fb-chip active" data-type="all">전체</button>' +
						'<button class="fb-chip" data-type="text">텍스트</button>' +
						'<button class="fb-chip" data-type="image">이미지</button>' +
					'</div>' +
				'</div>' +
				'<button class="fb-reset" id="fb-reset">필터 초기화</button>' +
			'</div>'
	}

	_injectStyle()
	{
		if (document.getElementById('filterbar-style')) return
		var style = document.createElement('style')
		style.id  = 'filterbar-style'
		style.textContent =
			// AI 도구 탭 바
			'.fb-tool-bar{display:flex;align-items:center;gap:12px;padding:0 24px;height:52px;background:var(--color-primary);border-bottom:1px solid var(--color-border);overflow-x:auto;}' +
			'.fb-tool-bar::-webkit-scrollbar{height:0;}' +
			'.fb-tool-tabs{display:flex;gap:6px;flex-shrink:0;}' +
			'.fb-tool-tab{padding:5px 14px;border:1px solid var(--color-border);border-radius:var(--radius-full);background:transparent;color:var(--color-text-muted);font-size:0.8125rem;font-weight:500;font-family:var(--font-body);cursor:pointer;white-space:nowrap;transition:background var(--transition),color var(--transition),border-color var(--transition);}' +
			'.fb-tool-tab:hover{border-color:var(--color-accent);color:var(--color-accent);}' +
			'.fb-tool-tab.active{background:var(--color-accent);border-color:var(--color-accent);color:#fff;}' +
			'.fb-sort{margin-left:auto;flex-shrink:0;}' +
			'.fb-sort-select{padding:5px 10px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);color:var(--color-text);font-size:0.8125rem;font-family:var(--font-body);cursor:pointer;outline:none;}' +
			// 칩 바
			'.fb-chip-bar{display:flex;align-items:center;gap:20px;padding:0 24px;height:44px;background:var(--color-primary-dark);border-bottom:1px solid var(--color-border);overflow-x:auto;}' +
			'.fb-chip-bar::-webkit-scrollbar{height:0;}' +
			'.fb-chip-group{display:flex;align-items:center;gap:8px;flex-shrink:0;}' +
			'.fb-chip-label{font-size:0.75rem;font-weight:700;color:var(--color-text-dim);text-transform:uppercase;letter-spacing:0.04em;white-space:nowrap;}' +
			'.fb-chips{display:flex;gap:4px;}' +
			'.fb-chip{padding:3px 10px;border:1px solid var(--color-border);border-radius:var(--radius-full);background:transparent;color:var(--color-text-muted);font-size:0.75rem;font-weight:500;font-family:var(--font-body);cursor:pointer;white-space:nowrap;transition:background var(--transition),color var(--transition),border-color var(--transition);}' +
			'.fb-chip:hover{border-color:var(--color-accent);color:var(--color-accent);}' +
			'.fb-chip.active{background:rgba(108,99,255,0.18);border-color:var(--color-accent);color:var(--color-accent);}' +
			'.fb-reset{margin-left:auto;padding:3px 12px;border:1px solid var(--color-border);border-radius:var(--radius-full);background:transparent;color:var(--color-text-dim);font-size:0.75rem;font-family:var(--font-body);cursor:pointer;flex-shrink:0;transition:color var(--transition),border-color var(--transition);}' +
			'.fb-reset:hover{color:var(--color-point);border-color:var(--color-point);}'
		document.head.appendChild(style)
	}

	// ─────────────────────────────────────────
	// 이벤트
	// ─────────────────────────────────────────

	_bindEvents()
	{
		var self = this
		var el   = this.el

		// AI 도구 탭
		el.querySelector('#fb-tool-tabs').addEventListener('click', function(e)
		{
			var tab = e.target.closest('.fb-tool-tab')
			if (!tab) return
			el.querySelectorAll('.fb-tool-tab').forEach(function(t) { t.classList.remove('active') })
			tab.classList.add('active')
			self.state.toolId = tab.getAttribute('data-tool') || null
			self._onChange()
		})

		// 정렬
		el.querySelector('#fb-sort').addEventListener('change', function()
		{
			self.state.sort = this.value
			self._onChange()
		})

		// 가격 칩
		el.querySelector('#fb-price-chips').addEventListener('click', function(e)
		{
			var chip = e.target.closest('.fb-chip')
			if (!chip) return
			el.querySelectorAll('#fb-price-chips .fb-chip').forEach(function(c) { c.classList.remove('active') })
			chip.classList.add('active')
			self.state.price = chip.getAttribute('data-price')
			self._onChange()
		})

		// 타입 칩
		el.querySelector('#fb-type-chips').addEventListener('click', function(e)
		{
			var chip = e.target.closest('.fb-chip')
			if (!chip) return
			el.querySelectorAll('#fb-type-chips .fb-chip').forEach(function(c) { c.classList.remove('active') })
			chip.classList.add('active')
			self.state.type = chip.getAttribute('data-type')
			self._onChange()
		})

		// 초기화
		el.querySelector('#fb-reset').addEventListener('click', function()
		{
			self.reset()
		})
	}

	_onChange()
	{
		if (this.callbacks.onChange) this.callbacks.onChange()
	}

	// ─────────────────────────────────────────
	// 상태
	// ─────────────────────────────────────────

	getState() { return { toolId: this.state.toolId, sort: this.state.sort, price: this.state.price, type: this.state.type } }

	reset()
	{
		var el = this.el
		this.state = { toolId: null, sort: 'latest', price: 'all', type: 'all' }

		el.querySelectorAll('.fb-tool-tab').forEach(function(t) { t.classList.remove('active') })
		var allTab = el.querySelector('.fb-tool-tab[data-tool=""]')
		if (allTab) allTab.classList.add('active')

		el.querySelectorAll('#fb-price-chips .fb-chip').forEach(function(c) { c.classList.remove('active') })
		var priceAll = el.querySelector('[data-price="all"]')
		if (priceAll) priceAll.classList.add('active')

		el.querySelectorAll('#fb-type-chips .fb-chip').forEach(function(c) { c.classList.remove('active') })
		var typeAll = el.querySelector('[data-type="all"]')
		if (typeAll) typeAll.classList.add('active')

		var sortEl = el.querySelector('#fb-sort')
		if (sortEl) sortEl.value = 'latest'

		this._onChange()
		ToastManager.info('필터가 초기화되었습니다')
	}
}
