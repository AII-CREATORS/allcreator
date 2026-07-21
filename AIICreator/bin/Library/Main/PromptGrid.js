
PromptGrid = class PromptGrid
{
	constructor(container, callbacks)
	{
		this.el        = container
		this.callbacks = callbacks || {}
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
				? '"' + fmt.esc(keyword) + '" 검색 결과가 없습니다'
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
			header = '<div class="pg-result-header"><strong>"' + fmt.esc(keyword) + '"</strong> 검색 결과 ' + prompts.length + '개</div>'

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
		var isImage   = p.prompt_type === 'image'
		var toolName  = p.ai_tools ? p.ai_tools.name : ''
		var toolBadge = toolName ? '<span class="ac-badge ac-badge-accent">' + toolName + '</span>' : ''
		var typeBadge = '<span class="ac-badge ac-badge-dim">' + (isImage ? '이미지' : '텍스트') + '</span>'
		var isFree    = Number(p.price) === 0
		var price     = isFree
			? '<span class="ac-prompt-card-price free">무료</span>'
			: '<span class="ac-prompt-card-price">' + Number(p.price).toLocaleString() + '원</span>'
		var author    = p.users ? fmt.esc(p.users.display_name || '') : ''

		var thumb = p.result_image
			? '<div class="' + (isImage ? 'pg-thumb-image' : 'pg-thumb-text') + '" style="padding:0;overflow:hidden;">' +
				'<img src="' + p.result_image + '" style="width:100%;height:100%;object-fit:cover;" alt="result" loading="lazy">' +
			  '</div>'
			: '<div class="' + (isImage ? 'pg-thumb-image' : 'pg-thumb-text') + '">' +
				'<span class="pg-thumb-fallback">' + fmt.esc(p.title) + '</span>' +
			  '</div>'

		return '<div class="ac-prompt-card" data-id="' + p.id + '">' +
			thumb +
			'<div class="ac-prompt-card-body">' +
				'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' + toolBadge + typeBadge + '</div>' +
				'<div class="ac-prompt-card-title">' + fmt.esc(p.title) + '</div>' +
				'<div class="ac-prompt-card-desc">' + fmt.esc(p.description || '') + '</div>' +
				'<div class="ac-prompt-card-footer">' +
					price +
					'<span class="ac-caption" style="display:flex;align-items:center;gap:6px">' +
						'<span>👁 ' + (p.view_count || 0) + '</span>' +
						'<span>♥ ' + (p.like_count || 0) + '</span>' +
						'<span>' + author + '</span>' +
					'</span>' +
				'</div>' +
			'</div>' +
		'</div>'
	}
}
