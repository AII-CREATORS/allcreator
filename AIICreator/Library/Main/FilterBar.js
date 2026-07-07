
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

	// render() 후 이전 상태를 DOM에 반영 — onChange는 발생시키지 않음
	restoreState(saved)
	{
		if (!saved) return

		var el = this.el
		this.state = { toolId: saved.toolId || null, sort: saved.sort || 'latest', price: saved.price || 'all', type: saved.type || 'all' }

		// 도구 탭
		el.querySelectorAll('.fb-tool-tab').forEach(function(t) { t.classList.remove('active') })
		var toolSel = saved.toolId
			? el.querySelector('.fb-tool-tab[data-tool="' + saved.toolId + '"]')
			: el.querySelector('.fb-tool-tab[data-tool=""]')
		if (toolSel) toolSel.classList.add('active')

		// 정렬
		el.querySelector('#fb-sort').value = saved.sort || 'latest'

		// 가격 칩
		el.querySelectorAll('#fb-price-chips .fb-chip').forEach(function(c) { c.classList.remove('active') })
		var priceChip = el.querySelector('[data-price="' + (saved.price || 'all') + '"]')
		if (priceChip) priceChip.classList.add('active')

		// 타입 칩
		el.querySelectorAll('#fb-type-chips .fb-chip').forEach(function(c) { c.classList.remove('active') })
		var typeChip = el.querySelector('[data-type="' + (saved.type || 'all') + '"]')
		if (typeChip) typeChip.classList.add('active')
	}

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

		el.querySelector('#fb-sort').value = 'latest'

		this._onChange()
	}
}
