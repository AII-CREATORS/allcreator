
class PromptDetailView extends AView
{
	constructor()
	{
		super()
		this.sb        = null
		this.promptId  = null
		this.prompt    = null
		this.isLiked   = false
		this.isSaved   = false
		this.isPurchased = false
		this.currentUser = null
	}

	init(context, evtListener)
	{
		super.init(context, evtListener)
	}

	onInitDone()
	{
		super.onInitDone()
		this.sb       = SupabaseManager.getInstance()
		this.promptId = theApp.getDetailId() || null
		this._renderSkeleton()
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
		if (!this.promptId)
		{
			ToastManager.error('잘못된 접근입니다')
			this._goBack()
			return
		}

		try
		{
			this.currentUser = await this.sb.getUser()
			await this._loadPrompt()
			await this._loadUserStatus()
			this._renderDetail()
			this._bindEvents()

			// 조회수 증가 (비동기, 결과 무시)
			this.sb.getClient().rpc('increment_view', { p_prompt_id: this.promptId })
		}
		catch (e)
		{
			ToastManager.error('불러오기 실패: ' + e.message)
		}
	}

	async _loadPrompt()
	{
		var result = await this.sb.getClient()
			.from('prompts')
			.select('id, title, description, prompt_content, prompt_type, price, difficulty, like_count, save_count, view_count, created_at, users!user_id(id, username), ai_tools(name), categories(name)')
			.eq('id', this.promptId)
			.single()

		if (result.error) throw new Error(result.error.message)
		this.prompt = result.data
	}

	async _loadUserStatus()
	{
		if (!this.currentUser) return

		var sb  = this.sb.getClient()
		var uid = this.currentUser.id
		var pid = this.promptId

		// 좋아요, 저장 병렬 조회
		var queries = [
			sb.from('prompt_likes').select('id').eq('prompt_id', pid).eq('user_id', uid).maybeSingle(),
			sb.from('prompt_saves').select('id').eq('prompt_id', pid).eq('user_id', uid).maybeSingle()
		]

		// 유료 프롬프트면 구매 여부도 병렬 추가
		var isFree = Number(this.prompt.price) === 0
		if (!isFree)
			queries.push(sb.from('orders').select('id').eq('prompt_id', pid).eq('buyer_id', uid).eq('status', 'completed').maybeSingle())

		var results = await Promise.all(queries)

		this.isLiked     = !!(results[0].data)
		this.isSaved     = !!(results[1].data)
		this.isPurchased = isFree ? true : !!(results[2] && results[2].data)
	}

	// ─────────────────────────────────────────
	// 렌더링
	// ─────────────────────────────────────────

	_renderSkeleton()
	{
		this.getElement().innerHTML =
			'<div class="detail-wrap">' +
				'<header class="detail-nav">' +
					'<button class="detail-back" id="btn-back">← 돌아가기</button>' +
				'</header>' +
				'<div class="detail-content">' +
					'<div class="skeleton-title"></div>' +
					'<div class="skeleton-line"></div>' +
					'<div class="skeleton-line short"></div>' +
				'</div>' +
			'</div>'
	}

	_renderDetail()
	{
		var p        = this.prompt
		var isFree   = Number(p.price) === 0
		var toolName = p.ai_tools   ? p.ai_tools.name   : ''
		var catName  = p.categories ? p.categories.name : ''
		var author   = p.users      ? p.users.username  : '알 수 없음'
		var initial  = author[0].toUpperCase()

		var difficultyMap = { beginner: '입문', intermediate: '중급', advanced: '고급' }
		var difficulty    = difficultyMap[p.difficulty] || p.difficulty || ''

		var priceHTML = isFree
			? '<span class="detail-price free">무료</span>'
			: '<span class="detail-price">' + Number(p.price).toLocaleString() + '원</span>'

		var actionBtn = this._renderActionBtn(isFree)

		var contentHTML = this.isPurchased
			? '<div class="prompt-content-box">' +
				'<div class="prompt-content-label">프롬프트 내용</div>' +
				'<pre class="prompt-content-text">' + (p.prompt_content || '') + '</pre>' +
				'<button class="prompt-content-copy" id="btn-copy">📋 복사</button>' +
			  '</div>'
			: '<div class="prompt-locked">' +
				'<div class="prompt-locked-icon">🔒</div>' +
				'<div class="prompt-locked-text">구매 후 프롬프트 내용을 확인할 수 있습니다</div>' +
			  '</div>'

		this.getElement().innerHTML =
			'<div class="detail-wrap">' +

				// 상단 네비
				'<header class="detail-nav">' +
					'<button class="detail-back" id="btn-back">← 돌아가기</button>' +
					'<div class="detail-nav-actions">' +
						'<button class="detail-action-btn ' + (this.isSaved ? 'active' : '') + '" id="btn-save" title="저장">' +
							(this.isSaved ? '🔖' : '📌') + ' ' + (p.save_count || 0) +
						'</button>' +
						'<button class="detail-action-btn ' + (this.isLiked ? 'active' : '') + '" id="btn-like" title="좋아요">' +
							(this.isLiked ? '❤️' : '🤍') + ' ' + (p.like_count || 0) +
						'</button>' +
					'</div>' +
				'</header>' +

				'<div class="detail-content">' +

					// 배지
					'<div class="detail-badges">' +
						(toolName ? '<span class="ac-badge ac-badge-accent">' + toolName + '</span>' : '') +
						(catName  ? '<span class="ac-badge ac-badge-dim">'   + catName  + '</span>' : '') +
						(difficulty ? '<span class="ac-badge ac-badge-dim">' + difficulty + '</span>' : '') +
						'<span class="ac-badge ' + (p.prompt_type === 'image' ? 'ac-badge-point' : 'ac-badge-dim') + '">' +
							(p.prompt_type === 'image' ? '🎨 이미지' : '✍️ 텍스트') +
						'</span>' +
					'</div>' +

					// 제목
					'<h1 class="detail-title">' + p.title + '</h1>' +

					// 작성자 + 통계
					'<div class="detail-meta">' +
						'<div class="detail-author">' +
							'<div class="ac-avatar ac-avatar-sm">' + initial + '</div>' +
							'<span class="detail-author-name">@' + author + '</span>' +
						'</div>' +
						'<div class="detail-stats">' +
							'<span class="detail-stat">👁 ' + (p.view_count || 0) + '</span>' +
							'<span class="detail-stat">❤️ ' + (p.like_count || 0) + '</span>' +
							'<span class="detail-stat">🔖 ' + (p.save_count || 0) + '</span>' +
						'</div>' +
					'</div>' +

					'<hr class="ac-divider">' +

					// 설명
					'<p class="detail-description">' + (p.description || '') + '</p>' +

					// 가격 + 구매 버튼
					'<div class="detail-purchase-box">' +
						priceHTML +
						actionBtn +
					'</div>' +

					// 프롬프트 내용 (구매 여부에 따라)
					contentHTML +

				'</div>' +
			'</div>'
	}

	_renderActionBtn(isFree)
	{
		if (this.isPurchased)
			return '<span class="detail-purchased-badge">✅ ' + (isFree ? '사용 중' : '구매 완료') + '</span>'

		if (!this.currentUser)
			return '<button class="ac-btn ac-btn-outline" id="btn-login-required">로그인 후 이용</button>'

		if (isFree)
			return '<button class="ac-btn ac-btn-primary" id="btn-purchase">무료로 사용하기</button>'

		return '<button class="ac-btn ac-btn-secondary" id="btn-purchase">구매하기 ' + Number(this.prompt.price).toLocaleString() + '원</button>'
	}


	// ─────────────────────────────────────────
	// 이벤트 바인딩
	// ─────────────────────────────────────────

	_bindEvents()
	{
		var el   = this.getElement()
		var self = this

		// 뒤로가기
		el.querySelector('#btn-back').addEventListener('click', function() { self._goBack() })

		// 좋아요
		var btnLike = el.querySelector('#btn-like')
		if (btnLike)
		{
			btnLike.addEventListener('click', function() { self._toggleLike() })
		}

		// 저장
		var btnSave = el.querySelector('#btn-save')
		if (btnSave)
		{
			btnSave.addEventListener('click', function() { self._toggleSave() })
		}

		// 구매 / 무료 사용
		var btnPurchase = el.querySelector('#btn-purchase')
		if (btnPurchase)
		{
			btnPurchase.addEventListener('click', function() { self._onPurchase() })
		}

		// 로그인 필요
		var btnLoginRequired = el.querySelector('#btn-login-required')
		if (btnLoginRequired)
		{
			btnLoginRequired.addEventListener('click', function()
			{
				theApp.mainContainer.open('Source/Auth/AuthView.lay')
			})
		}

		// 복사
		var btnCopy = el.querySelector('#btn-copy')
		if (btnCopy)
		{
			btnCopy.addEventListener('click', function() { self._copyPrompt() })
		}
	}

	// ─────────────────────────────────────────
	// 액션
	// ─────────────────────────────────────────

	async _toggleLike()
	{
		if (!this.currentUser) { ToastManager.error('로그인이 필요합니다'); return }

		var result = await this.sb.getClient().rpc('toggle_like', { p_prompt_id: this.promptId })
		if (result.error) { ToastManager.error('오류가 발생했습니다'); return }

		this.isLiked = !this.isLiked
		this.prompt.like_count = (this.prompt.like_count || 0) + (this.isLiked ? 1 : -1)

		var btn = this.getElement().querySelector('#btn-like')
		if (btn)
		{
			btn.textContent = (this.isLiked ? '❤️' : '🤍') + ' ' + this.prompt.like_count
			btn.classList.toggle('active', this.isLiked)
		}
	}

	async _toggleSave()
	{
		if (!this.currentUser) { ToastManager.error('로그인이 필요합니다'); return }

		var result = await this.sb.getClient().rpc('toggle_save', { p_prompt_id: this.promptId })
		if (result.error) { ToastManager.error('오류가 발생했습니다'); return }

		this.isSaved = !this.isSaved
		this.prompt.save_count = (this.prompt.save_count || 0) + (this.isSaved ? 1 : -1)

		var btn = this.getElement().querySelector('#btn-save')
		if (btn)
		{
			btn.textContent = (this.isSaved ? '🔖' : '📌') + ' ' + this.prompt.save_count
			btn.classList.toggle('active', this.isSaved)
		}
		ToastManager[this.isSaved ? 'success' : 'info'](this.isSaved ? '저장되었습니다' : '저장이 취소되었습니다')
	}

	async _onPurchase()
	{
		if (!this.currentUser) { ToastManager.error('로그인이 필요합니다'); return }

		var btn = this.getElement().querySelector('#btn-purchase')
		if (btn) { btn.disabled = true; btn.textContent = '처리 중...' }

		try
		{
			var isFree = Number(this.prompt.price) === 0
			var amount = isFree ? 0 : Number(this.prompt.price)

			var result = await this.sb.getClient()
				.from('orders')
				.insert({
					buyer_id:  this.currentUser.id,
					prompt_id: this.promptId,
					amount:    String(amount),
					status:    'completed'
				})

			if (result.error) throw new Error(result.error.message)

			this.isPurchased = true
			ToastManager.success(isFree ? '무료 프롬프트가 추가되었습니다!' : '구매 완료!')
			this._renderDetail()
			this._bindEvents()
		}
		catch (e)
		{
			ToastManager.error('처리 실패: ' + e.message)
			if (btn) { btn.disabled = false; btn.textContent = '다시 시도' }
		}
	}

	_copyPrompt()
	{
		var text = this.prompt.prompt_content || ''
		navigator.clipboard.writeText(text).then(function()
		{
			ToastManager.success('프롬프트가 클립보드에 복사되었습니다')
		}).catch(function()
		{
			ToastManager.
error('구매 처리 실패: ' + e.message)
			btn.disabled    = false
			btn.textContent = '구매하기'
		}
	}

	_goBack()
	{
		theApp.mainContainer.open('Source/MainView.lay')
	}
}
