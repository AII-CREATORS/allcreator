
AdminView = class AdminView extends AView
{
	constructor()
	{
		super()
		this.sb          = null
		this.ps          = null
		this.us          = null
		this.currentUser = null
		this.profile     = null
		this.prompts       = []
		this.page          = 0
		this.pageSize      = 20
		this.tab           = 'pending'
		this.searchKeyword = ''
		this.searchTimer   = null

		this.aiTools     = []   // 대량등록 시 AI 도구 이름 매칭용
		this.bulkRows    = []   // 파싱된 대량등록 행 (검증 결과 포함)
	}

	onInitDone()
	{
		super.onInitDone()
		this.sb = SupabaseManager.getInstance()
		this.ps = new PromptService(this.sb)
		this.us = new UserService(this.sb)

		var el = this.getElement()
		el.innerHTML =
			'<header id="adm-navbar"></header>' +
			'<div id="adm-body-wrap" class="adm-body-wrap"></div>'

		this._initNavBar(el.querySelector('#adm-navbar'))
		this._renderShell()
		this._bootstrap()
	}

	_initNavBar(container)
	{
		NavBar.mountStandard(container)
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

		var { data: profile } = await this.us.getAdminRole(this.currentUser.id)
		this.profile = profile

		if (!profile || (profile.role !== 'main_admin' && profile.role !== 'sub_admin'))
		{
			ToastManager.error('접근 권한이 없습니다')
			theApp.mainContainer.open('Source/MainView.lay')
			return
		}

		var toolResult = await this.ps.getAITools()
		this.aiTools   = toolResult.data || []

		this._renderHeader()
		await this._loadPrompts()
	}

	// ─────────────────────────────────────────
	// 렌더링
	// ─────────────────────────────────────────

	_renderShell()
	{
		var body = this.getElement().querySelector('#adm-body-wrap') || this.getElement()
		body.innerHTML =
			'<div class="adm-wrap">' +
				'<header class="adm-header" id="adm-header">' +
					'<h1 class="adm-title">관리자 패널</h1>' +
					'<span class="adm-role-badge" id="adm-role-badge"></span>' +
				'</header>' +

				'<nav class="adm-tabs" id="adm-tabs">' +
					'<button class="adm-tab adm-tab-active" data-tab="pending">대기 중</button>' +
					'<button class="adm-tab" data-tab="published">승인됨</button>' +
					'<button class="adm-tab" data-tab="rejected">반려됨</button>' +
					'<button class="adm-tab" data-tab="bulk">대량등록</button>' +
					'<div class="adm-tabs-search">' +
						'<input class="ac-input adm-search-input" type="text" id="adm-search" placeholder="제목 검색...">' +
					'</div>' +
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
	}

	_bindShellEvents()
	{
		var self = this
		var el   = this.getElement()

		el.querySelectorAll('.adm-tab').forEach(function(btn)
		{
			btn.addEventListener('click', function()
			{
				self._switchTab(this.dataset.tab)
			})
		})

		var searchInput = el.querySelector('#adm-search')
		if (searchInput)
		{
			searchInput.addEventListener('input', function()
			{
				var keyword = this.value.trim()
				clearTimeout(self.searchTimer)
				self.searchTimer = setTimeout(function()
				{
					self.searchKeyword = keyword
					self.page = 0
					self._loadPrompts()
				}, 300)
			})
		}
	}

	async _switchTab(tab)
	{
		this.tab  = tab
		this.page = 0

		this.getElement().querySelectorAll('.adm-tab').forEach(function(btn)
		{
			btn.classList.toggle('adm-tab-active', btn.dataset.tab === tab)
		})

		var searchWrap = this.getElement().querySelector('.adm-tabs-search')
		if (searchWrap) searchWrap.style.display = (tab === 'bulk') ? 'none' : ''

		if (tab === 'bulk') this._renderBulkTab()
		else                await this._loadPrompts()
	}

	// ─────────────────────────────────────────
	// 프롬프트 목록
	// ─────────────────────────────────────────

	async _loadPrompts()
	{
		var content = this.getElement().querySelector('#adm-content')
		content.innerHTML = '<div class="adm-loading">불러오는 중...</div>'

		var result = await this.ps.adminList(this.tab, this.page, this.pageSize, this.searchKeyword)

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
				(tab === 'pending'   ? '검수 대기 중인 프롬프트가 없습니다' :
				 tab === 'published' ? '승인된 프롬프트가 없습니다' :
				 '반려된 프롬프트가 없습니다') +
			'</div>'
			return
		}

		var html = '<div class="adm-list">'

		this.prompts.forEach(function(p)
		{
			var seller    = p.users ? fmt.esc(p.users.display_name || p.users.email) : '알 수 없음'
			var priceText = Number(p.price) === 0 ? '무료' : Number(p.price).toLocaleString() + '원'
			var dateText  = fmt.date(p.created_at)

			var actionBtns = ''
			var pendingBadge = ''
			if (tab === 'pending')
			{
				actionBtns =
					'<button class="adm-btn-approve" data-id="' + p.id + '">✓ 승인</button>' +
					'<button class="adm-btn-reject"  data-id="' + p.id + '">✗ 반려</button>'

				pendingBadge = p.reviewed_at
					? '<span class="adm-badge adm-badge-edit">수정요청</span>'
					: '<span class="adm-badge adm-badge-new">신규 등록</span>'
			}
			else if (tab === 'published')
			{
				actionBtns = '<button class="adm-btn-reject" data-id="' + p.id + '">반려 처리</button>'
			}
			else if (tab === 'rejected')
			{
				actionBtns =
					'<button class="adm-btn-approve" data-id="' + p.id + '">재승인</button>' +
					'<div class="adm-reject-reason">' + fmt.esc(p.rejection_reason || '') + '</div>'
			}

			html +=
				'<div class="adm-card" data-id="' + p.id + '">' +
					'<div class="adm-card-meta">' +
						'<span class="adm-card-type">' + (p.prompt_type === 'image' ? '🎨' : '✍️') + '</span>' +
						'<span class="adm-card-seller">판매자: ' + seller + '</span>' +
						pendingBadge +
						'<span class="adm-card-date">' + dateText + '</span>' +
						'<span class="adm-card-price">' + priceText + '</span>' +
					'</div>' +
					'<div class="adm-card-title">' + fmt.esc(p.title) + '</div>' +
					'<div class="adm-card-desc">' + fmt.esc(p.description || '') + '</div>' +
					'<div class="adm-card-actions">' + actionBtns + '</div>' +
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
			card.addEventListener('click', function(e)
			{
				// 승인/반려 버튼 클릭은 상세 페이지 이동 제외
				if (e.target.closest('.adm-card-actions')) return
				theApp.openDetail(card.dataset.id)
			})
		})

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
		if (prevBtn) prevBtn.addEventListener('click', function() { self.page--; self._loadPrompts() })
		if (nextBtn) nextBtn.addEventListener('click', function() { self.page++; self._loadPrompts() })
	}

	// ─────────────────────────────────────────
	// 승인 / 반려
	// ─────────────────────────────────────────

	_approvePrompt(promptId)
	{
		var self = this

		var existing = document.getElementById('adm-approve-modal')
		if (existing) existing.remove()

		var modal = document.createElement('div')
		modal.id        = 'adm-approve-modal'
		modal.className = 'adm-modal-overlay'
		modal.innerHTML =
			'<div class="adm-modal">' +
				'<h3 class="adm-modal-title">승인 확인</h3>' +
				'<p class="adm-modal-desc">해당 프롬프트를 승인하시겠습니까?<br>승인 후 마켓에 즉시 게시됩니다.</p>' +
				'<div class="adm-modal-actions">' +
					'<button class="ac-btn ac-btn-outline ac-btn-sm" id="adm-approve-cancel">취소</button>' +
					'<button class="ac-btn ac-btn-primary ac-btn-sm" id="adm-approve-confirm">승인</button>' +
				'</div>' +
			'</div>'

		document.body.appendChild(modal)

		document.getElementById('adm-approve-cancel').addEventListener('click', function()
		{
			modal.remove()
		})

		document.getElementById('adm-approve-confirm').addEventListener('click', async function()
		{
			modal.remove()

			var result = await self.ps.approve(promptId, self.currentUser.id)
			if (result.error) { ToastManager.error('승인 실패: ' + result.error.message); return }

			await self.ps.sendNotification(promptId, 'prompt_approved')
			ToastManager.success('프롬프트가 승인되었습니다')
			await self._loadPrompts()
		})

		modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove() })
	}

	_showRejectModal(promptId)
	{
		var self = this

		var existing = document.getElementById('adm-reject-modal')
		if (existing) existing.remove()

		var modal = document.createElement('div')
		modal.id        = 'adm-reject-modal'
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
		var result = await this.ps.reject(promptId, this.currentUser.id, reason)
		if (result.error)
		{
			ToastManager.error('반려 처리 실패: ' + result.error.message)
			return
		}

		await this.ps.sendNotification(promptId, 'prompt_rejected', reason)

		ToastManager.success('프롬프트가 반려 처리되었습니다')
		await this._loadPrompts()
	}

	// ─────────────────────────────────────────
	// 대량등록 (엑셀/CSV 업로드)
	// ─────────────────────────────────────────

	_renderBulkTab()
	{
		var content = this.getElement().querySelector('#adm-content')

		content.innerHTML =
			'<div class="adm-bulk">' +
				'<div class="adm-bulk-guide">' +
					'<h3>엑셀/CSV로 프롬프트 한 번에 등록</h3>' +
					'<p>다음 열(컬럼)을 포함한 .xlsx 또는 .csv 파일을 업로드하세요. 첫 번째 행은 열 이름(헤더)이어야 합니다.</p>' +
					'<table class="adm-bulk-guide-table">' +
						'<tr><th>제목</th><th>설명</th><th>프롬프트내용</th><th>AI도구</th><th>타입</th><th>난이도</th><th>가격</th></tr>' +
						'<tr><td>필수</td><td>필수</td><td>필수</td><td>필수 (ChatGPT/Claude/Gemini/Midjourney/Sora 등 등록된 이름과 일치)</td>' +
							'<td>선택 (텍스트/이미지, 기본 텍스트)</td><td>선택 (입문/중급/고급, 기본 입문)</td><td>선택 (숫자, 기본 0)</td></tr>' +
					'</table>' +
					'<p class="adm-bulk-note">업로드한 프롬프트는 일반 등록과 동일하게 <b>검수 대기(pending)</b> 상태로 들어가며, 승인 후 게시됩니다. 결과 이미지는 대량등록으로 첨부할 수 없습니다.</p>' +
				'</div>' +

				'<div class="adm-bulk-upload">' +
					'<input type="file" id="adm-bulk-file" accept=".xlsx,.xls,.csv" style="display:none">' +
					'<div class="adm-bulk-dropzone" id="adm-bulk-dropzone">' +
						'<div style="font-size:2rem;margin-bottom:8px;">📄</div>' +
						'<div>클릭하거나 파일을 끌어다 놓으세요</div>' +
						'<div class="adm-bulk-note">.xlsx, .xls, .csv</div>' +
					'</div>' +
				'</div>' +

				'<div id="adm-bulk-preview"></div>' +
			'</div>'

		this.bulkRows = []
		this._bindBulkEvents()
	}

	_bindBulkEvents()
	{
		var self      = this
		var el        = this.getElement()
		var zone      = el.querySelector('#adm-bulk-dropzone')
		var fileInput = el.querySelector('#adm-bulk-file')

		zone.addEventListener('click', function() { fileInput.click() })

		zone.addEventListener('dragover', function(e)
		{
			e.preventDefault()
			zone.classList.add('adm-bulk-dropzone-hover')
		})
		zone.addEventListener('dragleave', function() { zone.classList.remove('adm-bulk-dropzone-hover') })
		zone.addEventListener('drop', function(e)
		{
			e.preventDefault()
			zone.classList.remove('adm-bulk-dropzone-hover')
			var file = e.dataTransfer.files[0]
			if (file) self._handleBulkFile(file)
		})

		fileInput.addEventListener('change', function()
		{
			var file = fileInput.files[0]
			if (file) self._handleBulkFile(file)
			fileInput.value = ''
		})
	}

	_handleBulkFile(file)
	{
		var self   = this
		var reader = new FileReader()

		reader.onload = function(e)
		{
			var wb    = XLSX.read(e.target.result, { type: 'array' })
			var sheet = wb.Sheets[wb.SheetNames[0]]
			var rows  = XLSX.utils.sheet_to_json(sheet, { defval: '' })

			self.bulkRows = rows.map(function(r) { return self._validateBulkRow(r) })
			self._renderBulkPreview()
		}

		reader.onerror = function()
		{
			ToastManager.error('파일을 읽을 수 없습니다')
		}

		reader.readAsArrayBuffer(file)
	}

	_validateBulkRow(r)
	{
		var title   = String(r['제목'] || '').trim()
		var desc    = String(r['설명'] || '').trim()
		var content = String(r['프롬프트내용'] || '').trim()
		var toolRaw = String(r['AI도구'] || '').trim()

		var errors = []
		if (!title)   errors.push('제목 없음')
		if (!desc)    errors.push('설명 없음')
		if (!content) errors.push('프롬프트내용 없음')

		var tool = this.aiTools.filter(function(t) { return t.name.toLowerCase() === toolRaw.toLowerCase() })[0]
		if (!toolRaw)   errors.push('AI도구 없음')
		else if (!tool) errors.push('AI도구 불일치: "' + toolRaw + '"')

		var priceRaw = Number(r['가격'])
		var price    = isNaN(priceRaw) || priceRaw < 0 ? 0 : Math.floor(priceRaw)

		return {
			title:       title,
			description: desc,
			content:     content,
			toolId:      tool ? tool.id : '',
			type:        this._mapPromptType(r['타입']),
			difficulty:  this._mapDifficulty(r['난이도']),
			price:       price,
			errors:      errors
		}
	}

	_mapPromptType(v)
	{
		v = String(v || '').trim()
		if (v === '이미지' || v.toLowerCase() === 'image') return 'image'
		return 'text'
	}

	_mapDifficulty(v)
	{
		v = String(v || '').trim()
		if (v === '중급' || v.toLowerCase() === 'intermediate') return 'intermediate'
		if (v === '고급' || v.toLowerCase() === 'advanced')     return 'advanced'
		return 'beginner'
	}

	_renderBulkPreview()
	{
		var self    = this
		var wrap    = this.getElement().querySelector('#adm-bulk-preview')
		var rows    = this.bulkRows
		var okCount = rows.filter(function(r) { return r.errors.length === 0 }).length

		if (rows.length === 0)
		{
			wrap.innerHTML = '<div class="adm-empty">파일에서 읽은 행이 없습니다</div>'
			return
		}

		var rowsHTML = rows.map(function(r, i)
		{
			var statusHTML = r.errors.length === 0
				? '<span class="adm-bulk-status-ok">OK</span>'
				: '<span class="adm-bulk-status-err">' + fmt.esc(r.errors.join(', ')) + '</span>'

			return '<tr class="' + (r.errors.length ? 'adm-bulk-row-err' : '') + '">' +
				'<td>' + (i + 1) + '</td>' +
				'<td>' + fmt.esc(r.title || '(없음)') + '</td>' +
				'<td>' + fmt.esc((r.description || '').slice(0, 40)) + '</td>' +
				'<td>' + (r.type === 'image' ? '🎨 이미지' : '✍️ 텍스트') + '</td>' +
				'<td>' + r.price.toLocaleString() + '원</td>' +
				'<td>' + statusHTML + '</td>' +
			'</tr>'
		}).join('')

		wrap.innerHTML =
			'<div class="adm-bulk-summary">전체 ' + rows.length + '건 중 <b>' + okCount + '건</b> 등록 가능 (오류 ' + (rows.length - okCount) + '건)</div>' +
			'<div class="adm-bulk-table-wrap">' +
				'<table class="adm-bulk-table">' +
					'<tr><th>#</th><th>제목</th><th>설명</th><th>타입</th><th>가격</th><th>상태</th></tr>' +
					rowsHTML +
				'</table>' +
			'</div>' +
			'<div class="adm-bulk-actions">' +
				'<button class="ac-btn ac-btn-primary" id="adm-bulk-submit"' + (okCount === 0 ? ' disabled' : '') + '>' +
					okCount + '건 일괄 등록' +
				'</button>' +
			'</div>' +
			'<div id="adm-bulk-progress" class="adm-bulk-note"></div>'

		var submitBtn = wrap.querySelector('#adm-bulk-submit')
		if (submitBtn) submitBtn.addEventListener('click', function() { self._submitBulk() })
	}

	async _submitBulk()
	{
		var self      = this
		var el        = this.getElement()
		var submitBtn = el.querySelector('#adm-bulk-submit')
		var progress  = el.querySelector('#adm-bulk-progress')

		var validRows = this.bulkRows.filter(function(r) { return r.errors.length === 0 })

		submitBtn.disabled = true

		var successCount = 0
		var failed        = []

		for (var i = 0; i < validRows.length; i++)
		{
			var r = validRows[i]
			progress.textContent = '등록 중... (' + (i + 1) + ' / ' + validRows.length + ')'

			var row = {
				title:          r.title,
				description:    r.description,
				prompt_content: r.content,
				ai_tool_id:     r.toolId,
				prompt_type:    r.type,
				difficulty:     r.difficulty,
				price:          String(r.price),
				user_id:        this.currentUser.id,
				status:         'pending'
			}

			var result = await this.ps.create(row)
			if (result.error) failed.push(r.title + ' (' + result.error.message + ')')
			else               successCount++
		}

		progress.textContent = ''

		if (failed.length === 0)
		{
			ToastManager.success(successCount + '건 등록 완료. 검수 대기 목록에서 확인하세요.')
		}
		else
		{
			ToastManager.error(successCount + '건 성공, ' + failed.length + '건 실패: ' + failed.join(' / '))
		}

		this._switchTab('pending')
	}
}
