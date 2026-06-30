
PromptGrid = class PromptGrid
{
	constructor(container, callbacks)
	{
		// callbacks: { onCardClick }
		this.el        = container
		this.callbacks = callbacks || {}
		this._injectStyle()
	}

	// ─────────────────────────────────────────
	// 렌더
	// ─────────────────────────────────────────

	renderLoading()
	{
		this.el.innerHTML = '<div class="pg-loading"><div class="ac-spinner"></div></div>'
	}

	renderError()
	{
		this.el.innerHTML =
			'<div class="pg-empty">' +
				'<div class="pg-empty-icon">⚠️</div>' +
				'<div class="pg-empty-text">데이터를 불러오지 못했습니다</div>' +
			'</div>'
	}

	renderCards(prompts, keyword)
	{
		if (!prompts.length)
		{
			var msg = keyword
				? '"' + keyword + '" 검색 결과가 없습니다'
				: '등록된 프롬프트가 없습니다'
			this.el.innerHTML =
				'<div class="pg-empty">' +
					'<div class="pg-empty-icon">🔍</div>' +
					'<div class="pg-empty-text">' + msg + '</div>' +
				'</div>'
			return
		}

		var self   = this
		var header = ''
		if (keyword)
			header = '<div class="pg-result-header"><strong>"' + keyword + '"</strong> 검색 결과 ' + prompts.length + '개</div>'

		this.el.innerHTML = header + '<div class="pg-grid">' +
			prompts.map(function(p) { return self._cardHTML(p) }).join('') +
		'</div>'

		this.el.querySelectorAll('.ac-prompt-card').forEach(function(card)
		{
			card.addEventListener('click', function()
			{
				if (self.callbacks.onCardClick) self.callbacks.onCardClick(card.getAttribute('data-id'))
			})
		})
	}

	_cardHTML(p)
	{
		var isImage    = p.prompt_type === 'image'
		var thumbClass = isImage ? 'pg-thumb-image' : 'pg-thumb-text'
		var thumbIcon  = isImage ? '🎨' : '✍️'
		var toolName   = p.ai_tools ? p.ai_tools.name : ''
		var toolBadge  = toolName ? '<span class="ac-badge ac-badge-accent">' + toolName + '</span>' : ''
		var typeBadge  = '<span class="ac-badge ac-badge-dim">' + (isImage ? '이미지' : '텍스트') + '</span>'
		var isFree     = Number(p.price) === 0
		var price      = isFree
			? '<span class="ac-prompt-card-price free">무료</span>'
			: '<span class="ac-prompt-card-price">' + Number(p.price).toLocaleString() + '원</span>'
		var author     = p.users ? '@' + p.users.username : ''

		return '<div class="ac-prompt-card" data-id="' + p.id + '">' +
			'<div class="' + thumbClass + '">' + thumbIcon + '</div>' +
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

	_injectStyle()
	{
		if (document.getElementById('promptgrid-style')) return
		var style = document.createElement('style')
		style.id  = 'promptgrid-style'
		style.textContent =
			'.pg-grid{columns:3;column-gap:16px;}' +
			'.pg-grid .ac-prompt-card{break-inside:avoid;margin-bottom:16px;display:inline-block;width:100%;}' +
			'.pg-thumb-text{width:100%;height:140px;display:flex;align-items:center;justify-content:center;font-size:2rem;background:linear-gradient(135deg,#2E2E48,#3A3A5A);}' +
			'.pg-thumb-image{width:100%;height:140px;display:flex;align-items:center;justify-content:center;font-size:2rem;background:linear-gradient(135deg,#2A2048,#3D1F5A);}' +
			'.pg-loading{display:flex;justify-content:center;padding:60px;}' +
			'.pg-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;color:var(--color-text-muted);gap:12px;}' +
			'.pg-empty-icon{font-size:3rem;}' +
			'.pg-empty-text{font-size:1rem;font-weight:500;}' +
			'.pg-result-header{font-size:0.875rem;color:var(--color-text-muted);margin-bottom:1