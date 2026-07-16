
PromptDetailView = class PromptDetailView extends AView
{
	constructor()
	{
		super()
		this.sb          = null
		this.ps          = null
		this.pm          = null
		this.us          = null
		this.cs          = null
		this.promptId    = null
		this.prompt      = null
		this.isLiked     = false
		this.isSaved     = false
		this.isPurchased = false
		this.currentUser = null
		this.isAdmin     = false
		this.isSeller    = false
		this.reviews     = []
		this.questions   = []
		this.commentSort = 'oldest'
	}

	onInitDone()
	{
		super.onInitDone()
		this.sb       = SupabaseManager.getInstance()
		this.ps       = new PromptService(this.sb)
		this.pm       = PaymentManager.getInstance()
		this.us       = new UserService(this.sb)
		this.cs       = new CommentService(this.sb)
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
			this._loadComments()

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
		var catNames   = (p.categories || []).map(function(c) { return c.name })
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
		this.isSeller = !!(this.currentUser && p.users && this.currentUser.id === p.users.id)
		var canView  = this.isAdmin || this.isSeller || this.isPurchased
		var contentHTML = canView
			? '<div class="prompt-content-box">' +
				'<div class="prompt-content-header">' +
					'<div class="prompt-content-label">프롬프트 내용</div>' +
					'<button class="prompt-content-copy" id="btn-copy" title="복사">' +
						'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
					'</button>' +
				'</div>' +
				'<pre class="prompt-content-text">' + fmt.esc(p.prompt_content || '') + '</pre>' +
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
						catNames.map(function(n) { return '<span class="ac-badge ac-badge-dim">' + fmt.esc(n) + '</span>' }).join('') +
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
					'<div class="detail-description-box">' +
						'<div class="detail-description-label">설명</div>' +
						'<p class="detail-description">' + fmt.esc(p.description || '') + '</p>' +
					'</div>' +

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

					// 댓글
					this._commentsShellHTML() +

				'</div>' +
			'</div>'
	}

	_commentsShellHTML()
	{
		var canPostPublic = this.isSeller || this.isAdmin || this.isPurchased
		var writeHTML

		if (!this.currentUser)
		{
			writeHTML = '<div class="comment-login-hint">로그인 후 댓글을 작성할 수 있습니다</div>'
		}
		else
		{
			writeHTML =
				'<div class="comment-write-box">' +
					'<textarea class="ac-input comment-write-textarea" id="comment-input" placeholder="댓글을 입력하세요" maxlength="500"></textarea>' +
					'<button class="ac-btn ac-btn-primary ac-btn-sm comment-write-btn" id="btn-comment-submit">등록</button>' +
				'</div>' +
				(canPostPublic
					? ''
					: '<div class="comment-write-hint">구매하지 않은 프롬프트에 남긴 댓글은 판매자에게만 비공개로 전달됩니다</div>')
		}

		return '<div class="comments-section">' +
				'<div class="comments-header">' +
					'<h2 class="comments-title">후기 <span id="comment-count"></span></h2>' +
					'<select class="ac-input comment-sort-select" id="comment-sort">' +
						'<option value="oldest">기본순</option>' +
						'<option value="popular">인기순</option>' +
						'<option value="latest">최신순</option>' +
					'</select>' +
				'</div>' +
				writeHTML +
				'<div class="comment-list" id="comment-reviews-list"><div class="mp-loading"><div class="ac-spinner"></div></div></div>' +
				'<div class="comment-questions-section" id="comment-questions-section" style="display:none">' +
					'<h3 class="comments-subtitle">구매 전 문의 <span class="comment-private-tag">🔒 비공개</span></h3>' +
					'<div class="comment-list" id="comment-questions-list"></div>' +
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

		var commentSortSel = el.querySelector('#comment-sort')
		if (commentSortSel)
		{
			commentSortSel.value = this.commentSort
			commentSortSel.addEventListener('change', function()
			{
				self.commentSort = this.value
				self._loadComments()
			})
		}

		var btnCommentSubmit = el.querySelector('#btn-comment-submit')
		if (btnCommentSubmit) btnCommentSubmit.addEventListener('click', function() { self._submitComment() })
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

			// prompt_content는 구매 여부에 따라 서버(get_prompt_detail RPC)가 내려주는 값이
			// 달라지므로, 메모리에 있던 기존 this.prompt(구매 전 상태)로 다시 렌더링하면
			// 내용이 비어 보임 — 구매 반영 후 최신 상태로 다시 조회해야 함
			await this._loadPrompt()
			this._renderDetail()
			this._bindEvents()
			this._loadComments()
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

	// -----------------------------------------
	// 댓글
	// -----------------------------------------

	async _loadComments()
	{
		var result = await this.cs.list(this.promptId, this.commentSort)

		if (result.error)
		{
			var listEl = this.getElement().querySelector('#comment-reviews-list')
			if (listEl) listEl.innerHTML = '<div class="comment-empty">댓글을 불러오지 못했습니다</div>'
			return
		}

		this.reviews   = result.data.reviews   || []
		this.questions = result.data.questions || []
		this._renderReviews()
		this._renderQuestions()
		this._bindCommentItemEvents()
	}

	_findComment(commentId)
	{
		var all = this.reviews.concat(this.questions)
		for (var i = 0; i < all.length; i++)
		{
			if (all[i].id === commentId) return all[i]
			var reply = (all[i].replies || []).filter(function(r) { return r.id === commentId })[0]
			if (reply) return reply
		}
		return null
	}

	_renderReviews()
	{
		var el      = this.getElement()
		var listEl  = el.querySelector('#comment-reviews-list')
		var countEl = el.querySelector('#comment-count')
		if (countEl) countEl.textContent = this.reviews.length > 0 ? this.reviews.length : ''

		if (!listEl) return

		if (this.reviews.length === 0)
		{
			listEl.innerHTML = '<div class="comment-empty">아직 후기가 없습니다. 첫 후기를 남겨보세요!</div>'
			return
		}

		var self       = this
		var pinnedMax  = this.reviews.length > 3 ? 3 : 0
		var html = ''
		this.reviews.forEach(function(c, idx)
		{
			html += self._commentItemHTML(c, { pinned: idx < pinnedMax })
		})
		listEl.innerHTML = html
	}

	_renderQuestions()
	{
		var el      = this.getElement()
		var section = el.querySelector('#comment-questions-section')
		var listEl  = el.querySelector('#comment-questions-list')
		if (!section || !listEl) return

		if (this.questions.length === 0)
		{
			section.style.display = 'none'
			return
		}

		section.style.display = ''

		var self = this
		var html = ''
		this.questions.forEach(function(c) { html += self._commentItemHTML(c, { isPrivate: true }) })
		listEl.innerHTML = html
	}

	_commentItemHTML(c, opts)
	{
		opts = opts || {}

		var authorRaw = c.display_name || '알 수 없음'
		var avatarUrl = c.avatar_url
		var initial   = fmt.esc((authorRaw[0] || 'U').toUpperCase())
		var avatarHTML = avatarUrl
			? '<img class="ac-avatar comment-avatar" src="' + fmt.esc(avatarUrl) + '" alt="avatar">'
			: '<div class="ac-avatar comment-avatar">' + initial + '</div>'

		var isOwn     = !!(this.currentUser && c.user_id === this.currentUser.id)
		var canManage = isOwn || this.isAdmin || this.isSeller
		var isLiked   = !!c.liked_by_me
		var tags      = ''
		if (opts.pinned)    tags += '<span class="comment-pinned-tag">🔥 인기</span>'
		if (opts.isPrivate) tags += '<span class="comment-private-item-tag">🔒 비공개</span>'
		if (c.is_edited)    tags += '<span class="comment-edited-tag">(수정됨)</span>'

		var manageBtns = ''
		if (canManage)
		{
			manageBtns =
				(isOwn ? '<button class="comment-edit-btn" data-id="' + c.id + '">수정</button>' : '') +
				'<button class="comment-delete-btn" data-id="' + c.id + '">삭제</button>'
		}

		var replyBtn = (!opts.isReply && this.currentUser)
			? '<button class="comment-reply-btn" data-id="' + c.id + '">답글</button>'
			: ''

		var replyFormHTML = !opts.isReply
			? '<div class="comment-reply-form" id="comment-reply-form-' + c.id + '" style="display:none"></div>'
			: ''

		var childrenHTML = ''
		if (!opts.isReply && c.replies && c.replies.length)
		{
			var self = this
			childrenHTML = '<div class="comment-replies">' +
				c.replies.map(function(r) { return self._commentItemHTML(r, { isReply: true }) }).join('') +
			'</div>'
		}

		return '<div class="comment-item' + (opts.isReply ? ' comment-reply-item' : '') + '" data-id="' + c.id + '">' +
			avatarHTML +
			'<div class="comment-body">' +
				'<div class="comment-meta">' +
					'<span class="comment-author">' + fmt.esc(authorRaw) + '</span>' +
					'<span class="comment-time">' + fmt.timeAgo(c.created_at) + '</span>' +
					tags +
				'</div>' +
				'<div class="comment-text" id="comment-text-' + c.id + '">' + fmt.esc(c.content) + '</div>' +
				'<div class="comment-actions">' +
					'<button class="comment-like-btn' + (isLiked ? ' active' : '') + '" data-id="' + c.id + '">' +
						(isLiked ? '❤️' : '🤍') + ' ' + (c.like_count || 0) +
					'</button>' +
					manageBtns +
					replyBtn +
				'</div>' +
				replyFormHTML +
				childrenHTML +
			'</div>' +
		'</div>'
	}

	_bindCommentItemEvents()
	{
		var self = this
		var el   = this.getElement()

		el.querySelectorAll('.comment-like-btn').forEach(function(btn)
		{
			btn.addEventListener('click', function() { self._toggleCommentLike(btn.getAttribute('data-id')) })
		})

		el.querySelectorAll('.comment-edit-btn').forEach(function(btn)
		{
			btn.addEventListener('click', function() { self._startEditComment(btn.getAttribute('data-id')) })
		})

		el.querySelectorAll('.comment-delete-btn').forEach(function(btn)
		{
			btn.addEventListener('click', function() { self._confirmDeleteComment(btn.getAttribute('data-id')) })
		})

		el.querySelectorAll('.comment-reply-btn').forEach(function(btn)
		{
			btn.addEventListener('click', function() { self._startReply(btn.getAttribute('data-id')) })
		})
	}

	_startReply(commentId)
	{
		if (!this.currentUser) { ToastManager.error('로그인이 필요합니다'); return }

		var formEl = this.getElement().querySelector('#comment-reply-form-' + commentId)
		if (!formEl) return

		// 이미 열려있으면 토글로 닫기
		if (formEl.style.display !== 'none')
		{
			formEl.style.display = 'none'
			formEl.innerHTML = ''
			return
		}

		var self = this
		formEl.style.display = ''
		formEl.innerHTML =
			'<textarea class="ac-input comment-write-textarea" id="reply-input-' + commentId + '" placeholder="답글을 입력하세요" maxlength="500"></textarea>' +
			'<div class="comment-edit-actions">' +
				'<button class="ac-btn ac-btn-primary ac-btn-sm" id="reply-submit-' + commentId + '">등록</button>' +
				'<button class="ac-btn ac-btn-outline ac-btn-sm" id="reply-cancel-' + commentId + '">취소</button>' +
			'</div>'

		formEl.querySelector('#reply-submit-' + commentId).addEventListener('click', function()
		{
			self._submitReply(commentId)
		})
		formEl.querySelector('#reply-cancel-' + commentId).addEventListener('click', function()
		{
			formEl.style.display = 'none'
			formEl.innerHTML = ''
		})
	}

	async _submitReply(parentCommentId)
	{
		var input   = this.getElement().querySelector('#reply-input-' + parentCommentId)
		var content = input.value.trim()
		if (!content) { ToastManager.error('답글 내용을 입력해주세요'); return }

		var result = await this.cs.create(this.promptId, this.currentUser.id, content, parentCommentId)

		if (result.error)
		{
			ToastManager.error('답글 등록 실패: ' + result.error.message)
			return
		}

		window.location.reload()
	}

	async _submitComment()
	{
		if (!this.currentUser) { ToastManager.error('로그인이 필요합니다'); return }

		var input   = this.getElement().querySelector('#comment-input')
		var content = input.value.trim()
		if (!content) { ToastManager.error('댓글 내용을 입력해주세요'); return }

		var btn = this.getElement().querySelector('#btn-comment-submit')
		btn.disabled = true

		var result = await this.cs.create(this.promptId, this.currentUser.id, content)

		btn.disabled = false

		if (result.error)
		{
			ToastManager.error('댓글 등록 실패: ' + result.error.message)
			return
		}

		// 새로고침해도 같은 프롬프트 상세 화면으로 복귀하도록 라우팅이 처리되어 있어
		// 댓글 등록 후에는 페이지를 새로고침해서 최신 상태를 확실히 반영
		window.location.reload()
	}

	async _toggleCommentLike(commentId)
	{
		if (!this.currentUser) { ToastManager.error('로그인이 필요합니다'); return }

		var result = await this.cs.toggleLike(commentId)
		if (result.error) { ToastManager.error('오류가 발생했습니다'); return }

		await this._loadComments()
	}

	_startEditComment(commentId)
	{
		var comment = this._findComment(commentId)
		if (!comment) return

		var textEl = this.getElement().querySelector('#comment-text-' + commentId)
		if (!textEl) return

		var self = this
		textEl.innerHTML =
			'<textarea class="ac-input comment-edit-textarea" maxlength="500">' + fmt.esc(comment.content) + '</textarea>' +
			'<div class="comment-edit-actions">' +
				'<button class="ac-btn ac-btn-primary ac-btn-sm" id="comment-edit-save-' + commentId + '">저장</button>' +
				'<button class="ac-btn ac-btn-outline ac-btn-sm" id="comment-edit-cancel-' + commentId + '">취소</button>' +
			'</div>'

		textEl.querySelector('#comment-edit-save-' + commentId).addEventListener('click', function()
		{
			self._saveEditComment(commentId, textEl)
		})
		textEl.querySelector('#comment-edit-cancel-' + commentId).addEventListener('click', function()
		{
			textEl.textContent = comment.content
		})
	}

	async _saveEditComment(commentId, textEl)
	{
		var textarea = textEl.querySelector('textarea')
		var content  = textarea.value.trim()
		if (!content) { ToastManager.error('댓글 내용을 입력해주세요'); return }

		var result = await this.cs.update(commentId, content)
		if (result.error) { ToastManager.error('수정 실패: ' + result.error.message); return }

		ToastManager.success('댓글이 수정되었습니다')
		await this._loadComments()
	}

	_confirmDeleteComment(commentId)
	{
		var self = this

		var existing = document.getElementById('comment-delete-modal')
		if (existing) existing.remove()

		var modal = document.createElement('div')
		modal.id        = 'comment-delete-modal'
		modal.className = 'adm-modal-overlay'
		modal.innerHTML =
			'<div class="adm-modal">' +
				'<h3 class="adm-modal-title">댓글 삭제</h3>' +
				'<p class="adm-modal-desc">댓글을 삭제하시겠습니까? 삭제 후 되돌릴 수 없습니다.</p>' +
				'<div class="adm-modal-actions">' +
					'<button class="ac-btn ac-btn-outline ac-btn-sm" id="comment-delete-cancel">취소</button>' +
					'<button class="ac-btn ac-btn-secondary ac-btn-sm" id="comment-delete-confirm">삭제</button>' +
				'</div>' +
			'</div>'

		document.body.appendChild(modal)

		document.getElementById('comment-delete-cancel').addEventListener('click', function() { modal.remove() })
		modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove() })

		document.getElementById('comment-delete-confirm').addEventListener('click', async function()
		{
			modal.remove()

			var result = await self.cs.remove(commentId)
			if (result.error) { ToastManager.error('삭제 실패: ' + result.error.message); return }

			ToastManager.success('댓글이 삭제되었습니다')
			await self._loadComments()
		})
	}

}
