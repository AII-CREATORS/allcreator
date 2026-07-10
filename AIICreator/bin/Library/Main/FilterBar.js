
FilterBar = class FilterBar
{
	constructor(container, callbacks)
	{
		// callbacks: { onChange }
		this.el       = container
		this.callbacks = callbacks || {}
		this.aiTools  = []
		this.state    = {
			toolIds: [],   // 빈 배열 = 전체
			sort:    'latest',
			prices:  [],   // 'free' | 'paid' 조합, 빈 배열 = 전체
			types:   []    // 'text' | 'image' 조합, 빈 배열 = 전체
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
			tabsHTML += '<button class="fb-tool-tab" data-tool="' + t.id + '">' + fmt.esc(t.name) + '</button>'
		})

		return '<div class="fb-tool-bar">' +
				'<div class="fb-tool-tabs" id="fb-tool-tabs">' + tabsHTML + '</div>' +
				'<div class="fb-sort">' +
					'<select class="fb-sort-select" id="fb-sort">' +
						'<option value="latest">최신순</option>' +
						'<option value="popular">인기순</option>' +
						'<option value="views">조회순</option>' +
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

		// AI 도구 탭 (다중 선택)
		el.querySelector('#fb-tool-tabs').addEventListener('click', function(e)
		{
			var tab = e.target.closest('.fb-tool-tab')
			if (!tab) return

			var toolId = tab.getAttribute('data-tool')
			if (!toolId)
				self.state.toolIds = []
			else
				self.state.toolIds = self._toggle(self.state.toolIds, toolId)

			self._syncToolTabsUI()
			self._onChange()
		})

		// 정렬 (단일 선택 유지)
		el.querySelector('#fb-sort').addEventListener('change', function()
		{
			self.state.sort = this.value
			self._onChange()
		})

		// 가격 칩 (다중 선택)
		el.querySelector('#fb-price-chips').addEventListener('click', function(e)
		{
			var chip = e.target.closest('.fb-chip')
			if (!chip) return

			var price = chip.getAttribute('data-price')
			if (price === 'all')
				self.state.prices = []
			else
				self.state.prices = self._toggle(self.state.prices, price)

			self._syncPriceChipsUI()
			self._onChange()
		})

		// 타입 칩 (다중 선택)
		el.querySelector('#fb-type-chips').addEventListener('click', function(e)
		{
			var chip = e.target.closest('.fb-chip')
			if (!chip) return

			var type = chip.getAttribute('data-type')
			if (type === 'all')
				self.state.types = []
			else
				self.state.types = self._toggle(self.state.types, type)

			self._syncTypeChipsUI()
			self._onChange()
		})

		// 초기화
		el.querySelector('#fb-reset').addEventListener('click', function()
		{
			self.reset()
		})
	}

	// 배열에 값이 있으면 제거, 없으면 추가한 새 배열을 반환
	_toggle(arr, value)
	{
		var idx = arr.indexOf(value)
		if (idx === -1) return arr.concat([value])
		var next = arr.slice()
		next.splice(idx, 1)
		return next
	}

	_onChange()
	{
		if (this.callbacks.onChange) this.callbacks.onChange()
	}

	// ─────────────────────────────────────────
	// UI 동기화 — state.toolIds/prices/types 기준으로 active 클래스 반영
	// '전체'는 선택된 항목이 없을 때만 active
	// ─────────────────────────────────────────

	_syncToolTabsUI()
	{
		var el      = this.el
		var toolIds = this.state.toolIds
		el.querySelectorAll('.fb-tool-tab').forEach(function(t)
		{
			var id = t.getAttribute('data-tool')
			var isActive = id ? toolIds.indexOf(id) !== -1 : toolIds.length === 0
			t.classList.toggle('active', isActive)
		})
	}

	_syncPriceChipsUI()
	{
		var el     = this.el
		var prices = this.state.prices
		el.querySelectorAll('#fb-price-chips .fb-chip').forEach(function(c)
		{
			var val = c.getAttribute('data-price')
			var isActive = (val === 'all') ? prices.length === 0 : prices.indexOf(val) !== -1
			c.classList.toggle('active', isActive)
		})
	}

	_syncTypeChipsUI()
	{
		var el    = this.el
		var types = this.state.types
		el.querySelectorAll('#fb-type-chips .fb-chip').forEach(function(c)
		{
			var val = c.getAttribute('data-type')
			var isActive = (val === 'all') ? types.length === 0 : types.indexOf(val) !== -1
			c.classList.toggle('active', isActive)
		})
	}

	// ─────────────────────────────────────────
	// 상태
	// ─────────────────────────────────────────

	getState()
	{
		return {
			toolIds: this.state.toolIds.slice(),
			sort:    this.state.sort,
			prices:  this.state.prices.slice(),
			types:   this.state.types.slice()
		}
	}

	// render() 후 이전 상태를 DOM에 반영 — onChange는 발생시키지 않음
	restoreState(saved)
	{
		if (!saved) return

		this.state = {
			toolIds: saved.toolIds || [],
			sort:    saved.sort    || 'latest',
			prices:  saved.prices  || [],
			types:   saved.types   || []
		}

		this._syncToolTabsUI()
		this._syncPriceChipsUI()
		this._syncTypeChipsUI()
		this.el.querySelector('#fb-sort').value = this.state.sort
	}

	reset()
	{
		this.state = { toolIds: [], sort: 'latest', prices: [], types: [] }

		this._syncToolTabsUI()
		this._syncPriceChipsUI()
		this._syncTypeChipsUI()
		this.el.querySelector('#fb-sort').value = 'latest'

		this._onChange()
	}
}
