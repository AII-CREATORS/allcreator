
PromptDetailView = class PromptDetailView extends AView
{
	constructor()
	{
		super()
		this.sb          = null
		this.ps          = null
		this.pm          = null
		this.us          = null
		this.promptId    = null
		this.prompt      = null
		this.isLiked     = false
		this.isSaved     = false
		this.isPurchased = false
		this.currentUser = null
		this.isAdmin     = false
	}

	onInitDone()
	{
		super.onInitDone()
		this.sb       = SupabaseManager.getInstance()
		this.ps       = new PromptService(this.sb)
		this.pm       = PaymentManager.getInstance()
		this.us       = new UserService(this.sb)
		this.promptId = theApp.getDetailId() || null

		// 외부 구조: navbar 슬롯 + body 슬롯 (navbar는 교체되지 않음)
		var el = this.getElement()
		el.innerHTML =
			'<header id="detail-navbar"></header>' +
			'<div id="detail-body" class="detail-body-wrap"></div>'

		// NavBar — 한 번만 렌더
		this._initNavBar(el.querySelector('#detail-navbar'))

		this._renderSkeleton()
		this._bootstrap()
	}

	_initNavBar(container)
	{
		NavBar.mountStandard(container)
	}

	// -----------------------------------------
	// 초기화
	// -----------------------------------------

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

			// 관리자 여부 확인 (콘텐츠 전체 노출 판단용)
			if (this.currentUser)
			{
				var { data: profile } = await this.us.getAdminRole(this.currentUser.id)
				this.isAdmin = !!(profile && (profile.role === 'main_admin' || profile.role === 'sub_admin'))
			}

			await this._loadPrompt()
			await this._loadUserStatus()
			this._renderDetail()
			this._bindEvents()

			// 조회수 증가 (비동기, 결과 무시)
			this.ps.incrementView(this.promptId)
		}
		catch (e)
		{
			ToastManager.error('불러오기 실패: ' + e.message)
		}
	}

	async _loadPrompt()
	{
		var result = await this.ps.getDetail(this.promptId)
		if (result.error) throw new Error(result.error.message)
		this.prompt = result.data
	}

	async _loadUserStatus()
	{
		if (!this.currentUser) return

		var status = await this.ps.getUserStatus(this.promptId, this.currentUser.id)
		this.isLiked     = status.isLiked
		this.isSaved     = status.isSaved
		this.isPurchased = status.isPurchased
	}

	// -----------------------------------------
	// 렌더링
	// -----------------------------------------

	_renderSkeleton()
	{
		var body = this.getElement().querySelector('#detail-body') || this.getElement()
		body.innerHTML =
			'<div class="detail-wrap">' +
				'<div class="detail-content">' +
					'<div class="skeleton-title"></div>' +
					'<div class="skeleton-line"></div>' +
					'<div class="skeleton-line short"></div>' +
				'</div>' +
			'</div>'
	}

	_renderDetail()
	{
		var p          = this.prompt
		var isFree     = Number(p.price) === 0
		var toolName   = p.ai_tools   ? p.ai_tools.name   : ''
		var catName    = p.categories ? p.categories.name : ''
		var authorRaw  = p.users ? (p.users.display_name || '알 수 없음') : '알 수 없음'
		var initial    = fmt.esc(authorRaw[0].toUpperCase())
		var author     = fmt.esc(authorRaw)

		var difficultyMap = { beginner: '입문', intermediate: '중급', advanced: '고급' }
		var difficulty    = difficultyMap[p.difficulty] || p.difficulty || ''

		var priceHTML = isFree
			? '<span class="detail-price free">무료</span>'
			: '<span class="detail-price">' + Number(p.price).toLocaleString() + '원</span>'

		var actionBtn = this._renderActionBtn(isFree)

		// 관리자 또는 판매자 본인은 구매 여부와 무관하게 전체 내용 노출
		var isSeller = !!(this.currentUser && p.users && this.currentUser.id === p.users.id)
		var canView  = this.isAdmin || isSeller || this.isPurchased
		var contentHTML = canView
			? '<div class="prompt-content-box">' +
				'<div class="prompt-content-label">프롬프트 내용</div>' +
				'<pre class="prompt-content-text">' + fmt.esc(p.prompt_content || '') + '</pre>' +
				'<button class="prompt-content-copy" id="btn-copy">📋 복사</button>' +
			  '</div>'
			: '<div class="prompt-locked">' +
				'<div class="prompt-locked-icon">🔒</div>' +
				'<div class="prompt-locked-text">구매 후 프롬프트 내용을 확인할 수 있습니다</div>' +
			  '</div>'

		var body = this.getElement().querySelector('#detail-body') || this.getElement()
		body.innerHTML =
			'<div class="detail-wrap">' +
				'<div class="detail-content">' +

					// 배지
					'<div class="detail-badges">' +
						(toolName ? '<span class="ac-badge ac-badge-accent">' + fmt.esc(toolName) + '</span>' : '') +
						(catName  ? '<span class="ac-badge ac-badge-dim">'   + fmt.esc(catName)  + '</span>' : '') +
						(difficulty ? '<span class="ac-badge ac-badge-dim">' + fmt.esc(difficulty) + '</span>' : '') +
						'<span class="ac-badge ' + (p.prompt_type === 'image' ? 'ac-badge-point' : 'ac-badge-dim') + '">' +
							(p.prompt_type === 'image' ? '🎨 이미지' : '✍️ 텍스트') +
						'</span>' +
					'</div>' +

					// 반려 사유 (rejected 상태일 때만, 이미지 위)
					(p.status === 'rejected' && p.rejection_reason
						? '<div class="detail-rejected-box">' +
							'<div class="detail-rejected-label">반려 사유</div>' +
							'<div class="detail-rejected-reason">' + fmt.esc(p.rejection_reason) + '</div>' +
						  '</div>'
						: '') +

					// 결과물 이미지
					(p.result_image
						? '<div class="detail-result-image">'
							+ '<img src="' + fmt.esc(p.result_image) + '" alt="결과물 이미지">'
							+ '</div>'
						: '') +

					// 제목
					'<h1 class="detail-title">' + fmt.esc(p.title) + '</h1>' +

					// 작성자 + 통계
					'<div class="detail-meta">' +
						'<div class="detail-author">' +
							'<div class="ac-avatar ac-avatar-sm">' + initial + '</div>' +
							'<span class="detail-author-name">' + author + '</span>' +
						'</div>' +
						'<div class="detail-stats">' +
							'<span class="detail-stat">👁 ' + (p.view_count || 0) + '</span>' +
							'<span class="detail-stat">❤️ ' + (p.like_count || 0) + '</span>' +
							'<span class="detail-stat">🔖 ' + (p.save_count || 0) + '</span>' +
						'</div>' +
					'</div>' +

					'<hr class="ac-divider">' +

					// 설명
					'<p class="detail-description">' + fmt.esc(p.description || '') + '</p>' +

					// 가격 + 구매 버튼
					'<div class="detail-purchase-box">' +
						priceHTML +
						actionBtn +
					'</div>' +

					// 저장 · 좋아요 · 수정 버튼 행 (가격란 바로 아래)
					'<div class="detail-action-row">' +
						'<button class="detail-action-btn ' + (this.isSaved ? 'active' : '') + '" id="btn-save" title="저장">' +
							(this.isSaved ? '🔖' : '📌') + ' 저장 ' + (p.save_count || 0) +
						'</button>' +
						'<button class="detail-action-btn ' + (this.isLiked ? 'active' : '') + '" id="btn-like" title="좋아요">' +
							(this.isLiked ? '❤️' : '🤍') + ' 좋아요 ' + (p.like_count || 0) +
						'</button>' +
					'</div>' +

					// 프롬프트 내용
					contentHTML +

				'</div>' +
			'</div>'
	}

	_renderActionBtn(isFree)
	{
		// 반려된 프롬프트, 관리자, 판매자 본인은 구매 버튼 미표시
		if (this.prompt && this.prompt.status === 'rejected') return ''
		if (this.isAdmin) return ''
		if (this.currentUser && this.prompt.users && this.currentUser.id === this.prompt.users.id)
			return '<button class="ac-btn ac-btn-outline ac-btn-sm" id="btn-edit-prompt">✏️ 수정하기</button>'

		if (this.isPurchased)
			return '<span class="detail-purchased-badge">✅ ' + (isFree ? '사용 중' : '구매 완료') + '</span>'

		if (!this.currentUser)
			return '<button class="ac-btn ac-btn-outline" id="btn-login-required">로그인 후 이용</button>'

		if (isFree)
			return '<button class="ac-btn ac-btn-primary" id="btn-purchase">무료로 사용하기</button>'

		return '<button class="ac-btn ac-btn-secondary" id="btn-purchase">구매하기 ' + Number(this.prompt.price).toLocaleString() + '원</button>'
	}

	// -----------------------------------------
	// 이벤트 바인딩
	// -----------------------------------------

	_bindEvents()
	{
		var el   = this.getElement()
		var self = this

		var btnLike = el.querySelector('#btn-like')
		if (btnLike) btnLike.addEventListener('click', function() { self._toggleLike() })

		var btnSave = el.querySelector('#btn-save')
		if (btnSave) btnSave.addEventListener('click', function() { self._toggleSave() })

		var btnPurchase = el.querySelector('#btn-purchase')
		if (btnPurchase) btnPurchase.addEventListener('click', function() { self._onPurchase() })

		var btnLoginRequired = el.querySelector('#btn-login-required')
		if (btnLoginRequired)
		{
			btnLoginRequired.addEventListener('click', function()
			{
				theApp.mainContainer.open('Source/Auth/AuthView.lay')
			})
		}

		var btnCopy = el.querySelector('#btn-copy')
		if (btnCopy) btnCopy.addEventListener('click', function() { self._copyPrompt() })

		var btnEdit = el.querySelector('#btn-edit-prompt')
		if (btnEdit)
		{
			btnEdit.addEventListener('click', function()
			{
				theApp.editPromptId       = self.prompt.id
				theApp.editReturnToDetail = self.prompt.id
				theApp.mainContainer.open('Source/Prompt/PromptRegisterView.lay')
			})
		}
	}

	// -----------------------------------------
	// 액션
	// -----------------------------------------

	async _toggleLike()
	{
		if (!this.currentUser) { ToastManager.error('로그인이 필요합니다'); return }

		var result = await this.ps.toggleLike(this.promptId)
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

		var result = await this.ps.toggleSave(this.promptId)
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

		// 무료 프롬프트: orders INSERT 후 버튼 → 배지 교체
		if (Number(this.prompt.price) === 0)
		{
			var btn = this.getElement().querySelector('#btn-purchase')
			if (btn) { btn.disabled = true; btn.textContent = '처리 중...' }

			var { error } = await this.sb.getClient()
				.from('orders')
				.insert({
					buyer_id:  this.currentUser.id,
					prompt_id: this.prompt.id,
					order_no:  'free-' + Date.now(),
					amount:    '0',
					status:    'completed',
					paid_at:   new Date().toISOString()
				})

			if (error)
			{
				ToastManager.error('처리 실패: ' + error.message)
				if (btn) { btn.disabled = false; btn.textContent = '무료로 사용하기' }
				return
			}

			this.isPurchased = true
			ToastManager.success('이용 목록에 추가되었습니다')
			this._renderDetail()
			this._bindEvents()
			return
		}

		// 유료: Toss 결제창 열기
		var btn = this.getElement().querySelector('#btn-purchase')
		if (btn) { btn.disabled = true; btn.textContent = '결제창 연결 중...' }

		try
		{
			await this.pm.requestPayment(this.prompt, this.currentUser)
		}
		catch (e)
		{
			ToastManager.error('결제창 열기 실패: ' + e.message)
			if (btn)
			{
				btn.disabled    = false
				btn.textContent = '구매하기 ' + Number(this.prompt.price).toLocaleString() + '원'
			}
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
			ToastManager.error('복사에 실패했습니다')
		})
	}

}
