
class AdminView extends AView
{
	constructor()
	{
		super()
		this.sb          = null
		this.currentUser = null
		this.profile     = null        // public.users row (role 포함)
		this.prompts     = []
		this.page        = 0
		this.pageSize    = 20
		this.tab         = 'pending'   // 'pending' | 'published' | 'rejected'
	}

	init(context, evtListener)
	{
		super.init(context, evtListener)
	}

	onInitDone()
	{
		super.onInitDone()
		this.sb = SupabaseManager.getInstance()
		this._renderShell()
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

		if (!this.currentUser)
		{
			ToastManager.error('로그인이 필요합니다')
			theApp.mainContainer.open('Source/Auth/AuthView.lay')
			return
		}

		var { data: profile } = await this.sb.getClient()
			.from('users')
			.select('role, display_name')
			.eq('id', this.currentUser.id)
			.single()

		this.profile = profile

		if (!profile || (profile.role !== 'main_admin' && profile.role !== 'sub_admin'))
		{
			ToastManager.error('접근 권한이 없습니다')
			theApp.mainContainer.open('Source/MainView.lay')
			return
		}

		this._renderHeader()
		await this._loadPrompts()
	}

	// ─────────────────────────────────────────
	// 렌더링
	// ─────────────────────────────────────────

	_renderShell()
	{
		this.getElement().innerHTML =
			'<div class="adm-wrap">' +
				'<header class="adm-header" id="adm-header">' +
					'<button class="adm-back" id="adm-btn-back">← 메인으로</button>' +
					'<h1 class="adm-title">관리자 패널</h1>' +
					'<span class="adm-role-badge" id="adm-role-badge"></span>' +
				'</header>' +

				'<nav class="adm-tabs" id="adm-tabs">' +
					'<button class="adm-tab adm-tab-active" data-tab="pending">대기 중</button>' +
					'<button class="adm-tab" data-tab="published">승인됨</button>' +
					'<button class="adm-tab" data-tab="rejected">반려됨</button>' +
				'</nav>' +

				'<div class="adm-content" id="adm-content">' +
					'<div class="adm-loading">불러오는 중...</div>' +
				'</div>' +
			'</div>'

		this._bindShellEvents()
	}

	_renderHeader()
	{
		var badge  = this.getElement().querySelector('#adm-role-badge')
		var role   = this.profile && this.profile.role
		if (badge) badge.textContent = role === 'main_admin' ? '주 관리자' : '서브 관리자'

		// main_admin이면 관리자 설정 탭 추가
		var tabs = this.getElement().querySelector('#adm-tabs')
		if (tabs && role === 'main_admin' && !tabs.querySelector('[data-tab="manage"]'))
		{
			var manageBtn = document.createElement('button')
			manageBtn.className    = 'adm-tab adm-tab-manage'
			manageBtn.dataset.tab  = 'manage'
			manageBtn.textContent  = '관리자 설정'
			tabs.appendChild(manageBtn)
			manageBtn.addEventListener('click', function() { this._switchTab('manage') }.bind(this))
		}
	}

	_bindShellEvents()
	{
		var self = this
		var el   = this.getElement()

		el.querySelector('#adm-btn-back').addEventListener('click', function()
		{
			theApp.mainContainer.open('Source/MainView.lay')
		})

		var tabBtns = el.querySelectorAll('.adm-tab')
		tabBtns.forEach(function(btn)
		{
			btn.addEventListener('click', function()
			{
				self._switchTab(this.dataset.tab)
			})
		})
	}

	async _switchTab(tab)
	{
		this.tab  = tab
		this.page = 0

		var tabBtns = this.getElement().querySelectorAll('.adm-tab')
		tabBtns.forEach(function(btn)
		{
			btn.classList.toggle('adm-tab-active', btn.dataset.tab === tab)
		})

		if (tab === 'manage')
			this._renderManagePanel()
		else
			await this._loadPrompts()
	}

	// ─────────────────────────────────────────
	// 프롬프트 목록
	// ─────────────────────────────────────────

	async _loadPrompts()
	{
		var content = this.getElement().querySelector('#adm-content')
		content.innerHTML = '<div class="adm-loading">불러오는 중...</div>'

		var from  = this.page * this.pageSize
		var to    = from + this.pageSize - 1

		var result = await this.sb.getClient()
			.from('prompts')
			.select('id, title, description, price, prompt_type, status, rejection_reason, created_at, reviewed_at, users!user_id(display_name, email)', { count: 'exact' })
			.eq('status', this.tab)
			.is('deleted_at', null)
			.order('created_at', { ascending: false })
			.range(from, to)

		if (result.error)
		{
			content.innerHTML = '<div class="adm-empty">데이터 로드 실패: ' + result.error.message + '</div>'
			return
		}

		this.prompts = result.data || []
		var total    = result.count || 0

		this._renderPromptList(total)
	}

	_renderPromptList(total)
	{
		var self    = this
		var content = this.getElement().querySelector('#adm-content')
		var tab     = this.tab

		if (this.prompts.length === 0)
		{
			content.innerHTML = '<div class="adm-empty">' +
				(tab === 'pending' ? '검수 대기 중인 프롬프트가 없습니다' :
				 tab === 'published' ? '승인된 프롬프트가 없습니다' :
				 '반려된 프롬프트가 없습니다') +
			'</div>'
			return
		}

		var html = '<div class="adm-list">'

		this.prompts.forEach(function(p)
		{
			var seller    = p.users ? (p.users.display_name || p.users.email) : '알 수 없음'
			var priceText = Number(p.price) === 0 ? '무료' : Number(p.price).toLocaleString() + '원'
			var dateText  = p.created_at ? new Date(p.created_at).toLocaleDateString('ko-KR') : ''

			var actionBtns = ''
			if (tab === 'pending')
			{
				actionBtns =
					'<button class="adm-btn-approve" data-id="' + p.id + '">✓ 승인</button>' +
					'<button class="adm-btn-reject"  data-id="' + p.id + '">✗ 반려</button>'
			}
			else if (tab === 'published')
			{
				actionBtns = '<button class="adm-btn-reject" data-id="' + p.id + '">반려 처리</button>'
			}
			else if (tab === 'rejected')
			{
				actionBtns =
					'<button class="adm-btn-approve" data-id="' + p.id + '">재승인</button>' +
					'<div class="adm-reject-reason">' + (p.rejection_reason || '') + '</div>'
			}

			html +=
				'<div class="adm-card" data-id="' + p.id + '">' +
					'<div class="adm-card-meta">' +
						'<span class="adm-card-type">' + (p.prompt_type === 'image' ? '🎨' : '✍️') + '</span>' +
						'<span class="adm-card-seller">판매자: ' + seller + '</span>' +
						'<span class="adm-card-date">' + dateText + '</span>' +
						'<span class="adm-card-price">' + priceText + '</span>' +
					'</div>' +
					'<div class="adm-card-title">' + p.title + '</div>' +
					'<div class="adm-card-desc">' + (p.description || '') + '</div>' +
					'<div class="adm-card-actions">' + actionBtns + '</div>' +
				'</div>'
		})

		html += '</div>'

		// 페이지네이션
		var totalPages = Math.ceil(total / this.pageSize)
		if (totalPages > 1)
		{
			html += '<div class="adm-pagination">' +
				'<button class="adm-page-btn" id="adm-prev" ' + (this.page === 0 ? 'disabled' : '') + '>이전</button>' +
				'<span class="adm-page-info">' + (this.page + 1) + ' / ' + totalPages + '</span>' +
				'<button class="adm-page-btn" id="adm-next" ' + (this.page >= totalPages - 1 ? 'disabled' : '') + '>다음</button>' +
			'</div>'
		}

		content.innerHTML = html

		// 이벤트 바인딩
		content.querySelectorAll('.adm-btn-approve').forEach(function(btn)
		{
			btn.addEventListener('click', function() { self._approvePrompt(this.dataset.id) })
		})

		content.querySelectorAll('.adm-btn-reject').forEach(function(btn)
		{
			btn.addEventListener('click', function() { self._showRejectModal(this.dataset.id) })
		})

		var prevBtn = content.querySelector('#adm-prev')
		var nextBtn = content.querySelector('#adm-next')
		if (prevBtn) prevBtn.addEventListener('click', function()
		{
			self.page--
			self._loadPrompts()
		})
		if (nextBtn) nextBtn.addEventListener('click', function()
		{
			self.page++
			self._loadPrompts()
		})
	}

	// ─────────────────────────────────────────
	// 승인 / 반려
	// ─────────────────────────────────────────

	async _approvePrompt(promptId)
	{
		var result = await this.sb.getClient()
			.from('prompts')
			.update({
				status:           'published',
				rejection_reason: null,
				reviewed_at:      new Date().toISOString(),
				reviewed_by:      this.currentUser.id
			})
			.eq('id', promptId)

		if (result.error)
		{
			ToastManager.error('승인 실패: ' + result.error.message)
			return
		}

		// 판매자에게 알림 전송
		await this._sendNotification(promptId, 'prompt_approved')

		ToastManager.success('프롬프트가 승인되었습니다')
		await this._loadPrompts()
	}

	_showRejectModal(promptId)
	{
		var self = this

		// 기존 모달 제거
		var existing = document.getElementById('adm-reject-modal')
		if (existing) existing.remove()

		var modal = document.createElement('div')
		modal.id  = 'adm-reject-modal'
		modal.className = 'adm-modal-overlay'
		modal.innerHTML =
			'<div class="adm-modal">' +
				'<h3 class="adm-modal-title">반려 사유 입력</h3>' +
				'<textarea class="ac-input adm-modal-textarea" id="adm-reject-reason" placeholder="판매자에게 전달될 반려 사유를 입력하세요" rows="4"></textarea>' +
				'<div class="adm-modal-actions">' +
					'<button class="ac-btn ac-btn-outline ac-btn-sm" id="adm-modal-cancel">취소</button>' +
					'<button class="ac-btn ac-btn-primary ac-btn-sm" id="adm-modal-confirm">반려 확정</button>' +
				'</div>' +
			'</div>'

		document.body.appendChild(modal)

		document.getElementById('adm-modal-cancel').addEventListener('click', function()
		{
			modal.remove()
		})

		document.getElementById('adm-modal-confirm').addEventListener('click', async function()
		{
			var reason = document.getElementById('adm-reject-reason').value.trim()
			if (!reason)
			{
				ToastManager.error('반려 사유를 입력해주세요')
				return
			}
			modal.remove()
			await self._rejectPrompt(promptId, reason)
		})

		// 오버레이 클릭 닫기
		modal.addEventListener('click', function(e)
		{
			if (e.target === modal) modal.remove()
		})
	}

	async _rejectPrompt(promptId, reason)
	{
		var result = await this.sb.getClient()
			.from('prompts')
			.update({
				status:           'rejected',
				rejection_reason: reason,
				reviewed_at:      new Date().toISOString(),
				reviewed_by:      this.currentUser.id
			})
			.eq('id', promptId)

		if (result.error)
		{
			ToastManager.error('반려 처리 실패: ' + result.error.message)
			return
		}

		await this._sendNotification(promptId, 'prompt_rejected', reason)

		ToastManager.success('프롬프트가 반려 처리되었습니다')
		await this._loadPrompts()
	}

	// ─────────────────────────────────────────
	// 알림 전송
	// ─────────────────────────────────────────

	async _sendNotification(promptId, type, reason)
	{
		// 프롬프트 소유자 조회
		var { data: prompt } = await this.sb.getClient()
			.from('prompts')
			.select('user_id, title')
			.eq('id', promptId)
			.single()

		if (!prompt) return

		var isApproved = type === 'prompt_approved'
		var title = isApproved
			? '프롬프트가 승인되었습니다'
			: '프롬프트가 반려되었습니다'
		var body = isApproved
			? '등록하신 "' + prompt.title + '" 프롬프트가 검수를 통과하여 게시되었습니다.'
			: '등록하신 "' + prompt.title + '" 프롬프트가 반려되었습니다.\n사유: ' + (reason || '')

		await this.sb.getClient()
			.from('notifications')
			.insert({
				user_id:   prompt.user_id,
				type:      type,
				title:     title,
				body:      body,
				prompt_id: promptId
			})
	}

	// ─────────────────────────────────────────
	// 관리자 설정 패널 (main_admin 전용)
	// ─────────────────────────────────────────

	async _renderManagePanel()
	{
		var content = this.getElement().querySelector('#adm-content')
		content.innerHTML = '<div class="adm-loading">불러오는 중...</div>'

		var { data: admins } = await this.sb.getClient()
			.from('users')
			.select('id, display_name, email, role, created_at')
			.in('role', ['main_admin', 'sub_admin'])
			.order('role')

		var self  = this
		var html  =
			'<div class="adm-manage">' +
				'<h2 class="adm-manage-title">관리자 목록</h2>' +
				'<div class="adm-manage-list" id="adm-manage-list">'

		;(admins || []).forEach(function(u)
		{
			var isSelf    = u.id === self.currentUser.id
			var roleLabel = u.role === 'main_admin' ? '주 관리자' : '서브 관리자'
			var canRemove = !isSelf && u.role !== 'main_admin'

			html +=
				'<div class="adm-manage-row">' +
					'<div class="adm-manage-info">' +
						'<span class="adm-manage-name">' + (u.display_name || u.email) + '</span>' +
						'<span class="adm-manage-email">' + u.email + '</span>' +
					'</div>' +
					'<span class="adm-role-tag adm-role-' + u.role + '">' + roleLabel + '</span>' +
					(canRemove
						? '<button class="adm-btn-remove-admin" data-id="' + u.id + '">해제</button>'
						: '<span class="adm-manage-self">' + (isSelf ? '(나)' : '') + '</span>') +
				'</div>'
		})

		html +=
				'</div>' +
				'<div class="adm-manage-add">' +
					'<h3 class="adm-manage-subtitle">서브 관리자 지정</h3>' +
					'<p class="adm-manage-desc">이메일로 회원을 검색하여 서브 관리자로 지정합니다</p>' +
					'<div class="adm-manage-search-wrap">' +
						'<input class="ac-input adm-manage-email-input" type="email" id="adm-sub-email" placeholder="이메일 주소 입력">' +
						'<button class="ac-btn ac-btn-secondary ac-btn-sm" id="adm-btn-add-sub">서브 관리자 지정</button>' +
					'</div>' +
					'<div id="adm-search-result"></div>' +
				'</div>' +
			'</div>'

		content.innerHTML = html

		// 해제 버튼
		content.querySelectorAll('.adm-btn-remove-admin').forEach(function(btn)
		{
			btn.addEventListener('click', function() { self._removeSubAdmin(this.dataset.id) })
		})

		// 서브 관리자 지정
		document.getElementById('adm-btn-add-sub').addEventListener('click', function()
		{
			self._addSubAdmin()
		})
	}

	async _addSubAdmin()
	{
		var email  = document.getElementById('adm-sub-email').value.trim()
		var result = document.getElementById('adm-search-result')
		if (!email) { ToastManager.error('이메일을 입력해주세요'); return }

		var { data: user } = await this.sb.getClient()
			.from('users')
			.select('id, display_name, email, role')
			.eq('email', email)
			.single()

		if (!user)
		{
			result.innerHTML = '<div class="adm-search-none">해당 이메일의 회원을 찾을 수 없습니다</div>'
			return
		}

		if (user.role === 'main_admin' || user.role === 'sub_admin')
		{
			result.innerHTML = '<div class="adm-search-none">이미 관리자 권한을 가진 계정입니다</div>'
			return
		}

		var { error } = await this.sb.getClient()
			.from('users')
			.update({ role: 'sub_admin' })
			.eq('id', user.id)

		if (error)
		{
			ToastManager.error('지정 실패: ' + error.message)
			return
		}

		ToastManager.success((user.display_name || user.email) + ' 님을 서브 관리자로 지정했습니다')
		document.getElementById('adm-sub-email').value = ''
		result.innerHTML = ''
		this._renderManagePanel()
	}

	async _removeSubAdmin(userId)
	{
		var { error } = await this.sb.getClient()
			.from('users')
			.update({ role: 'user' })
			.eq('id', userId)

		if (error)
		{
			ToastManager.error('해제 실패: ' + error.message)
			return
		}

		ToastManager.success('서브 관리자 권한이 해제되었습니다')
		this._renderManagePanel()
	}

	// ─────────────────────────────────────────
	// 스타일
	// ─────────────────────────────────────────

}
