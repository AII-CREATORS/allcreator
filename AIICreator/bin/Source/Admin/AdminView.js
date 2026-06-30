
AdminView = class AdminView extends AView
{
	constructor()
	{
		super()
		this.sb          = null
		this.currentUser = null
		this.profile     = null
		this.prompts     = []
		this.page        = 0
		this.pageSize    = 20
		this.tab         = 'pending'
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

	// -----------------------------------------
	// 초기화
	// -----------------------------------------

	async _bootstrap()
	{
		this.currentUser = await this.sb.getUser()

		if (!this.currentUser)
		{
			ToastManager.error('로그인이 필요합니다')
			theApp.mainContainer.open('Source/Auth/AuthView.lay')
			return
		}

		var res = await this.sb.getClient()
			.from('users')
			.select('role, display_name')
			.eq('id', this.currentUser.id)
			.single()

		this.profile = res.data

		if (!this.profile || (this.profile.role !== 'main_admin' && this.profile.role !== 'sub_admin'))
		{
			ToastManager.error('접근 권한이 없습니다')
			theApp.mainContainer.open('Source/MainView.lay')
			return
		}

		this._renderHeader()
		await this._loadPrompts()
	}

	// -----------------------------------------
	// 렌더링
	// -----------------------------------------

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
		var badge = this.getElement().querySelector('#adm-role-badge')
		var role  = this.profile && this.profile.role
		if (badge) badge.textContent = role === 'main_admin' ? '주 관리자' : '서브 관리자'

		var tabs = this.getElement().querySelector('#adm-tabs')
		if (tabs && role === 'main_admin' && !tabs.querySelector('[data-tab="manage"]'))
		{
			var btn      = document.createElement('button')
			btn.className   = 'adm-tab adm-tab-manage'
			btn.dataset.tab = 'manage'
			btn.textContent = '관리자 설정'
			tabs.appendChild(btn)
			btn.addEventListener('click', function() { this._switchTab('manage') }.bind(this))
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

		el.querySelectorAll('.adm-tab').forEach(function(btn)
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

		this.getElement().querySelectorAll('.adm-tab').forEach(function(btn)
		{
			btn.classList.toggle('adm-tab-active', btn.dataset.tab === tab)
		})

		if (tab === 'manage')
			this._renderManagePanel()
		else
			await this._loadPrompts()
	}

	// -----------------------------------------
	// 프롬프트 목록
	// -----------------------------------------

	async _loadPrompts()
	{
		var content = this.getElement().querySelector('#adm-content')
		content.innerHTML = '<div class="adm-loading">불러오는 중...</div>'

		var from = this.page * this.pageSize
		var to   = from + this.pageSize - 1

		var result = await this.sb.getClient()
			.from('prompts')
			.select(
				'id, title, description, prompt_content, price, prompt_type, status, ' +
				'rejection_reason, created_at, result_image, ' +
				'users!user_id(id, display_name, email, username), ai_tools(name)',
				{ count: 'exact' }
			)
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
		this._renderPromptList(result.count || 0)
	}

	_renderPromptList(total)
	{
		var self    = this
		var content = this.getElement().querySelector('#adm-content')
		var tab     = this.tab

		if (this.prompts.length === 0)
		{
			content.innerHTML = '<div class="adm-empty">' +
				(tab === 'pending'   ? '검수 대기 중인 프롬프트가 없습니다' :
				 tab === 'published' ? '승인된 프롬프트가 없습니다' :
				                      '반려된 프롬프트가 없습니다') +
			'</div>'
			return
		}

		var html = '<div class="adm-list">'

		this.prompts.forEach(function(p)
		{
			var seller    = p.users ? (p.users.display_name || p.users.username || p.users.email) : '알 수 없음'
			var priceText = Number(p.price) === 0 ? '무료' : Number(p.price).toLocaleString() + '원'
			var isFree    = Number(p.price) === 0
			var dateText  = p.created_at ? new Date(p.created_at).toLocaleDateString('ko-KR') : ''
			var toolName  = p.ai_tools ? p.ai_tools.name : ''
			var isImage   = p.prompt_type === 'image'

			var rejectHint = (tab === 'rejected' && p.rejection_reason)
				? '<div class="adm-reject-reason">사유: ' + p.rejection_reason + '</div>'
				: ''

			var thumbStyle = 'width:88px;height:88px;border-radius:10px;flex-shrink:0;overflow:hidden;'
			var thumbHTML  = p.result_image
				? '<div style="' + thumbStyle + 'background:#2E2E48;">' +
					'<img src="' + p.result_image + '" style="width:100%;height:100%;object-fit:cover;" alt="thumb" loading="lazy">' +
				  '</div>'
				: '<div style="' + thumbStyle + 'background:' +
					(isImage ? 'linear-gradient(135deg,#2A2048,#3D1F5A)' : 'linear-gradient(135deg,#2E2E48,#3A3A5A)') +
					';display:flex;align-items:center;justify-content:center;font-size:2rem;">' +
					(isImage ? '🎨' : '✍️') +
				  '</div>'

			html +=
				'<div class="adm-card" data-id="' + p.id + '" style="cursor:pointer;display:flex;gap:16px;align-items:flex-start;">' +
					thumbHTML +
					'<div style="flex:1;min-width:0;">' +
						'<div class="adm-card-meta">' +
							(toolName ? '<span class="ac-badge ac-badge-accent" style="font-size:0.7rem;">' + toolName + '</span>' : '') +
							'<span class="adm-card-seller">판매자: ' + seller + '</span>' +
							'<span class="adm-card-date">' + dateText + '</span>' +
							'<span class="adm-card-price' + (isFree ? ' free' : '') + '">' + priceText + '</span>' +
						'</div>' +
						'<div class="adm-card-title">' + p.title + '</div>' +
						'<div class="adm-card-desc">' + (p.description || '') + '</div>' +
						rejectHint +
					'</div>' +
				'</div>'
		})

		html += '</div>'

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

		content.querySelectorAll('.adm-card').forEach(function(card)
		{
			card.addEventListener('click', function()
			{
				var pid    = card.getAttribute('data-id')
				var prompt = self.prompts.find(function(p) { return p.id === pid })
				if (prompt) self._showDetailPopup(prompt)
			})
		})

		var prevBtn = content.querySelector('#adm-prev')
		var nextBtn = content.querySelector('#adm-next')
		if (prevBtn) prevBtn.addEventListener('click', function() { self.page--; self._loadPrompts() })
		if (nextBtn) nextBtn.addEventListener('click', function() { self.page++; self._loadPrompts() })
	}

	// -----------------------------------------
	// 상세 팝업
	// -----------------------------------------

	_showDetailPopup(prompt)
	{
		var self     = this
		var tab      = this.tab
		var p        = prompt
		var isFree   = Number(p.price) === 0
		var seller   = p.users ? (p.users.display_name || p.users.username || p.users.email) : '알 수 없음'
		var toolName = p.ai_tools ? p.ai_tools.name : ''
		var dateText = p.created_at ? new Date(p.created_at).toLocaleDateString('ko-KR') : ''

		var actionHTML = ''
		if (tab === 'pending')
		{
			actionHTML =
				'<button id="adm-popup-approve" style="padding:10px 28px;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:600;background:linear-gradient(135deg,#6C63FF,#8B5CF6);color:#fff;">승인</button>' +
				'<button id="adm-popup-reject"  style="padding:10px 28px;border:2px solid #FF6584;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:600;background:transparent;color:#FF6584;">반려</button>'
		}
		else if (tab === 'published')
		{
			actionHTML =
				'<button id="adm-popup-reject" style="padding:10px 28px;border:2px solid #FF6584;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:600;background:transparent;color:#FF6584;">반려 처리</button>'
		}
		else if (tab === 'rejected')
		{
			actionHTML =
				'<button id="adm-popup-approve" style="padding:10px 28px;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:600;background:linear-gradient(135deg,#6C63FF,#8B5CF6);color:#fff;">재승인</button>'
		}

		var imgHTML = p.result_image
			? '<div style="border-radius:20px 20px 0 0;overflow:hidden;flex-shrink:0;">' +
				'<img src="' + p.result_image + '" style="width:100%;max-height:300px;object-fit:cover;display:block;" alt="result">' +
			  '</div>'
			: ''

		var rejectReasonHTML = (tab === 'rejected' && p.rejection_reason)
			? '<div style="background:#2A1520;border:1px solid rgba(255,101,132,0.4);border-radius:10px;padding:14px 16px;margin-bottom:20px;">' +
				'<div style="font-size:0.75rem;color:#FF6584;font-weight:600;margin-bottom:6px;">반려 사유</div>' +
				'<div style="font-size:0.875rem;color:#F0C0C8;line-height:1.6;">' + p.rejection_reason + '</div>' +
			  '</div>'
			: ''

		var overlay = document.createElement('div')
		overlay.id  = 'adm-detail-overlay'
		overlay.style.cssText =
			'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9000;' +
			'display:flex;align-items:center;justify-content:center;padding:20px;'

		overlay.innerHTML =
			'<div style="background:#1E1E32;border:1px solid #2E2E48;border-radius:20px;width:100%;max-width:680px;max-height:88vh;overflow-y:auto;display:flex;flex-direction:column;">' +
				imgHTML +
				'<div style="padding:28px 32px;">' +
					'<div style="display:flex;justify-content:flex-end;margin-bottom:16px;">' +
						'<button id="adm-popup-close" style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;color:#A0A0C0;font-size:1rem;">X</button>' +
					'</div>' +
					'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">' +
						(toolName ? '<span class="ac-badge ac-badge-accent">' + toolName + '</span>' : '') +
						'<span class="ac-badge ' + (p.prompt_type === 'image' ? 'ac-badge-point' : 'ac-badge-dim') + '">' +
							(p.prompt_type === 'image' ? '이미지' : '텍스트') +
						'</span>' +
						'<span class="ac-badge ' + (isFree ? 'ac-badge-accent' : 'ac-badge-dim') + '">' +
							(isFree ? '무료' : Number(p.price).toLocaleString() + '원') +
						'</span>' +
					'</div>' +
					'<h2 style="font-size:1.375rem;font-weight:700;color:#F0F0FF;margin:0 0 10px;">' + p.title + '</h2>' +
					'<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #2E2E48;">' +
						'<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6C63FF,#FF6584);display:flex;align-items:center;justify-content:center;font-size:0.875rem;font-weight:600;color:#fff;flex-shrink:0;">' +
							seller[0].toUpperCase() +
						'</div>' +
						'<div>' +
							'<div style="font-size:0.875rem;color:#E0E0FF;font-weight:500;">' + seller + '</div>' +
							'<div style="font-size:0.75rem;color:#6B6B8A;">' + dateText + '</div>' +
						'</div>' +
					'</div>' +
					rejectReasonHTML +
					'<div style="font-size:0.875rem;color:#B0B0D0;line-height:1.7;margin-bottom:20px;">' + (p.description || '') + '</div>' +
					'<div style="margin-bottom:28px;">' +
						'<div style="font-size:0.75rem;color:#6C63FF;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">프롬프트 내용</div>' +
						'<pre style="background:#13132A;border:1px solid #2E2E48;border-radius:10px;padding:16px;font-family:monospace;font-size:0.8rem;color:#C8C8E8;line-height:1.6;white-space:pre-wrap;word-break:break-word;max-height:220px;overflow-y:auto;margin:0;">' + (p.prompt_content || '(내용 없음)') + '</pre>' +
					'</div>' +
					(actionHTML ? '<div style="display:flex;gap:12px;justify-content:flex-end;">' + actionHTML + '</div>' : '') +
				'</div>' +
			'</div>'

		document.body.appendChild(overlay)

		document.getElementById('adm-popup-close').addEventListener('click', function()
		{
			overlay.remove()
		})

		overlay.addEventListener('click', function(e)
		{
			if (e.target === overlay) overlay.remove()
		})

		var approveBtn = document.getElementById('adm-popup-approve')
		if (approveBtn)
		{
			approveBtn.addEventListener('click', function()
			{
				overlay.remove()
				self._approvePrompt(p.id)
			})
		}

		var rejectBtn = document.getElementById('adm-popup-reject')
		if (rejectBtn)
		{
			rejectBtn.addEventListener('click', function()
			{
				overlay.remove()
				self._showRejectModal(p.id)
			})
		}
	}

	// -----------------------------------------
	// 승인 / 반려
	// -----------------------------------------

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

		await this._sendNotification(promptId, 'prompt_approved')
		ToastManager.success('프롬프트가 승인되었습니다')
		await this._loadPrompts()
	}

	_showRejectModal(promptId)
	{
		var self = this

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
			if (!reason) { ToastManager.error('반려 사유를 입력해주세요'); return }
			modal.remove()
			await self._rejectPrompt(promptId, reason)
		})

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

	// -----------------------------------------
	// 알림 전송
	// -----------------------------------------

	async _sendNotification(promptId, type, reason)
	{
		var ref = await this.sb.getClient()
			.from('prompts')
			.select('user_id, title')
			.eq('id', promptId)
			.single()

		var prompt = ref.data
		if (!prompt) return

		var isApproved = type === 'prompt_approved'
		var title = isApproved ? '프롬프트가 승인되었습니다' : '프롬프트가 반려되었습니다'
		var body  = isApproved
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

	// -----------------------------------------
	// 관리자 설정 패널
	// -----------------------------------------

	async _renderManagePanel()
	{
		var content = this.getElement().querySelector('#adm-content')
		content.innerHTML = '<div class="adm-loading">불러오는 중...</div>'

		var ref = await this.sb.getClient()
			.from('users')
			.select('id, display_name, email, role, created_at')
			.in('role', ['main_admin', 'sub_admin'])
			.order('role')

		var self  = this
		var admins = ref.data || []

		var html =
			'<div class="adm-manage">' +
				'<h2 class="adm-manage-title">관리자 목록</h2>' +
				'<div class="adm-manage-list" id="adm-manage-list">'

		admins.forEach(function(u)
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

		content.querySelectorAll('.adm-btn-remove-admin').forEach(function(btn)
		{
			btn.addEventListener('click', function() { self._removeSubAdmin(this.dataset.id) })
		})

		document.getElementById('adm-btn-add-sub').addEventListener('click', function()
		{
			self._addSubAdmin()
		})
	}

	async _addSubAdmin()
	{
		var email      = document.getElementById('adm-sub-email').value.trim()
		var resultEl   = document.getElementById('adm-search-result')
		if (!email) { ToastManager.error('이메일을 입력해주세요'); return }

		var ref = await this.sb.getClient()
			.from('users')
			.select('id, display_name, email, role')
			.eq('email', email)
			.single()

		var user = ref.data

		if (!user)
		{
			resultEl.innerHTML = '<div class="adm-search-none">해당 이메일의 회원을 찾을 수 없습니다</div>'
			return
		}

		if (user.role === 'main_admin' || user.role === 'sub_admin')
		{
			resultEl.innerHTML = '<div class="adm-search-none">이미 관리자 권한을 가진 계정입니다</div>'
			return
		}

		var upd = await this.sb.getClient()
			.from('users')
			.update({ role: 'sub_admin' })
			.eq('id', user.id)

		if (upd.error) { ToastManager.error('지정 실패: ' + upd.error.message); return }

		ToastManager.success((user.display_name || user.email) + ' 님을 서브 관리자로 지정했습니다')
		document.getElementById('adm-sub-email').value = ''
		resultEl.innerHTML = ''
		this._renderManagePanel()
	}

	async _removeSubAdmin(userId)
	{
		var upd = await this.sb.getClient()
			.from('users')
			.update({ role: 'user' })
			.eq('id', userId)

		if (upd.error) { ToastManager.error('해제 실패: ' + upd.error.message); return }

		ToastManager.success('관리자 권한이 해제되었습니다')
		this._renderManagePanel()
	}
}
