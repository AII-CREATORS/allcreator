
MyPageView = class MyPageView extends AView
{
	constructor()
	{
		super()
		this.sb          = null
		this.currentUser = null
		this.profile     = null
		this.currentTab  = 'mine'
		this.isEditing   = false
	}

	init(context, evtListener)
	{
		super.init(context, evtListener)
	}

	onInitDone()
	{
		super.onInitDone()
		this.sb = SupabaseManager.getInstance()
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
		this.currentUser = await this.sb.getUser()

		if (!this.currentUser)
		{
			ToastManager.error('로그인이 필요합니다')
			theApp.mainContainer.open('Source/Auth/AuthView.lay')
			return
		}

		try
		{
			await this._loadProfile()

			// public.users row가 없는 경우(소셜 로그인 트리거 미발동) → 자동 생성
			if (!this.profile)
			{
				var result = await this.sb.ensureUserProfile(this.currentUser)
				if (result.data) this.profile = result.data
			}
		}
		catch (e)
		{
			// row 없음 → ensureUserProfile로 생성 시도
			var result = await this.sb.ensureUserProfile(this.currentUser)
			if (result.error)
			{
				ToastManager.error('프로필을 불러올 수 없습니다')
				return
			}
			this.profile = result.data
		}

		this._renderLayout()
		this._bindEvents()
		this._loadTabData()
	}

	async _loadProfile()
	{
		var result = await this.sb.getClient()
			.from('users')
			.select('id, email, username, display_name, bio, gender, birth_date, avatar_url, created_at')
			.eq('id', this.currentUser.id)
			.single()

		if (result.error) throw new Error(result.error.message)
		this.profile = result.data
	}

	// ─────────────────────────────────────────
	// 렌더링
	// ─────────────────────────────────────────

	_renderSkeleton()
	{
		this.getElement().innerHTML =
			'<div class="mp-wrap">' +
				'<header class="mp-nav">' +
					'<button class="mp-back" id="btn-back">← 돌아가기</button>' +
					'<h1 class="mp-nav-title">마이페이지</h1>' +
				'</header>' +
				'<div class="mp-body">' +
					'<div class="mp-profile-skeleton"></div>' +
				'</div>' +
			'</div>'
	}

	_avatarHTML()
	{
		var p = this.profile
		if (p.avatar_url)
			return '<img class="mp-avatar mp-avatar-img" id="mp-avatar-img" src="' + p.avatar_url + '" alt="avatar">' +
				   '<div class="mp-avatar-overlay" id="btn-avatar">📷</div>'

		var initial = (p.display_name || p.email || 'U')[0].toUpperCase()
		return '<div class="mp-avatar mp-avatar-initial" id="mp-avatar-initial">' + initial + '</div>' +
			   '<div class="mp-avatar-overlay" id="btn-avatar">📷</div>'
	}

	_renderLayout()
	{
		var p           = this.profile
		var genderMap   = { male: '남성', female: '여성', other: '기타' }
		var genderLabel = p.gender ? (genderMap[p.gender] || p.gender) : '—'
		var birthLabel  = p.birth_date || '—'
		var joinDate    = p.created_at ? p.created_at.slice(0, 10) : '—'

		this.getElement().innerHTML =
			'<div class="mp-wrap">' +

				'<header class="mp-nav">' +
					'<button class="mp-back" id="btn-back">← 돌아가기</button>' +
					'<h1 class="mp-nav-title">마이페이지</h1>' +
					'<button class="ac-btn ac-btn-outline ac-btn-sm" id="btn-logout">로그아웃</button>' +
				'</header>' +

				'<div class="mp-body">' +

					// 프로필 카드
					'<div class="mp-profile-card">' +
						'<div class="mp-avatar-wrap">' +
							this._avatarHTML() +
							// 숨김 file input
							'<input type="file" id="avatar-file-input" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none">' +
						'</div>' +
						'<div class="mp-profile-info">' +
							'<div class="mp-display-name" id="mp-display-name">' + (p.display_name || '이름 없음') + '</div>' +
							'<div class="mp-username">@' + (p.username || '') + '</div>' +
							'<div class="mp-bio" id="mp-bio">' + (p.bio || '<span style="color:var(--color-text-dim)">자기소개가 없습니다</span>') + '</div>' +
							'<div class="mp-meta">' +
								'<span>' + p.email + '</span>' +
								'<span class="mp-meta-sep">·</span>' +
								'<span>성별 ' + genderLabel + '</span>' +
								'<span class="mp-meta-sep">·</span>' +
								'<span>생년월일 ' + birthLabel + '</span>' +
								'<span class="mp-meta-sep">·</span>' +
								'<span>가입 ' + joinDate + '</span>' +
							'</div>' +
						'</div>' +
						'<button class="ac-btn ac-btn-outline ac-btn-sm" id="btn-edit-profile">프로필 편집</button>' +
					'</div>' +

					// 편집 폼 (기본 숨김)
					'<div class="mp-edit-form" id="mp-edit-form" style="display:none">' +
						'<div class="mp-edit-row">' +
							'<div class="ac-input-group" style="flex:2">' +
								'<label class="ac-label">닉네임</label>' +
								'<input class="ac-input" type="text" id="edit-displayname" value="' + (p.display_name || '') + '">' +
							'</div>' +
							'<div class="ac-input-group" style="flex:1">' +
								'<label class="ac-label">성별</label>' +
								'<select class="ac-input" id="edit-gender">' +
									'<option value="">선택 안함</option>' +
									'<option value="male"' + (p.gender === 'male' ? ' selected' : '') + '>남성</option>' +
									'<option value="female"' + (p.gender === 'female' ? ' selected' : '') + '>여성</option>' +
									'<option value="other"' + (p.gender === 'other' ? ' selected' : '') + '>기타</option>' +
								'</select>' +
							'</div>' +
							'<div class="ac-input-group" style="flex:1.5">' +
								'<label class="ac-label">생년월일</label>' +
								'<input class="ac-input" type="date" id="edit-birthdate" value="' + (p.birth_date || '') + '">' +
							'</div>' +
						'</div>' +
						'<div class="ac-input-group">' +
							'<label class="ac-label">자기소개</label>' +
							'<textarea class="ac-input mp-bio-textarea" id="edit-bio" placeholder="나를 소개해보세요 (최대 200자)" maxlength="200">' + (p.bio || '') + '</textarea>' +
							'<div class="mp-char-count" id="bio-count">' + (p.bio ? p.bio.length : 0) + ' / 200</div>' +
						'</div>' +
						'<div class="mp-edit-actions">' +
							'<button class="ac-btn ac-btn-primary ac-btn-sm" id="btn-save-profile">저장</button>' +
							'<button class="ac-btn ac-btn-outline ac-btn-sm" id="btn-cancel-edit">취소</button>' +
						'</div>' +
					'</div>' +

					// 탭
					'<div class="mp-tabs">' +
						'<button class="mp-tab active" data-tab="mine">내 프롬프트</button>' +
						'<button class="mp-tab" data-tab="saved">저장됨</button>' +
						'<button class="mp-tab" data-tab="purchased">구매함</button>' +
					'</div>' +

					// 탭 콘텐츠
					'<div class="mp-tab-content" id="mp-tab-content">' +
						'<div class="mp-loading"><div class="ac-spinner"></div></div>' +
					'</div>' +

				'</div>' +
			'</div>'
	}


	// ─────────────────────────────────────────
	// 이벤트 바인딩
	// ─────────────────────────────────────────

	_bindEvents()
	{
		var el   = this.getElement()
		var self = this

		el.querySelector('#btn-back').addEventListener('click', function() { self._goBack() })

		el.querySelector('#btn-logout').addEventListener('click', async function()
		{
			await self.sb.signOut()
			theApp.mainContainer.open('Source/Auth/AuthView.lay')
		})

		// 아바타 클릭 → file input 열기
		el.querySelector('#btn-avatar').addEventListener('click', function()
		{
			el.querySelector('#avatar-file-input').click()
		})

		// 파일 선택 → 업로드
		el.querySelector('#avatar-file-input').addEventListener('change', function()
		{
			if (this.files && this.files[0])
				self._uploadAvatar(this.files[0])
		})

		// 프로필 편집 토글
		el.querySelector('#btn-edit-profile').addEventListener('click', function()
		{
			self._toggleEditForm(true)
		})
		el.querySelector('#btn-cancel-edit').addEventListener('click', function()
		{
			self._toggleEditForm(false)
		})
		el.querySelector('#btn-save-profile').addEventListener('click', function()
		{
			self._saveProfile()
		})

		// bio 글자 수
		el.querySelector('#edit-bio').addEventListener('input', function()
		{
			el.querySelector('#bio-count').textContent = this.value.length + ' / 200'
		})

		// 탭 전환
		el.querySelectorAll('.mp-tab').forEach(function(tab)
		{
			tab.addEventListener('click', function()
			{
				el.querySelectorAll('.mp-tab').forEach(function(t) { t.classList.remove('active') })
				tab.classList.add('active')
				self.currentTab = tab.getAttribute('data-tab')
				self._loadTabData()
			})
		})
	}

	_toggleEditForm(show)
	{
		var form = this.getElement().querySelector('#mp-edit-form')
		var btn  = this.getElement().querySelector('#btn-edit-profile')
		if (form)
		{
			form.style.display = show ? '' : 'none'
			btn.style.display  = show ? 'none' : ''
			this.isEditing     = show
		}
	}

	// ─────────────────────────────────────────
	// 아바타 업로드
	// ─────────────────────────────────────────

	async _uploadAvatar(file)
	{
		// 2MB 제한 검사
		if (file.size > 2 * 1024 * 1024)
		{
			ToastManager.error('이미지는 2MB 이하여야 합니다')
			return
		}

		var overlay = this.getElement().querySelector('#btn-avatar')
		overlay.textContent = '⏳'

		try
		{
			var result = await this.sb.uploadAvatar(this.currentUser.id, file)
			if (result.error) throw new Error(result.error.message)

			// users 테이블 avatar_url 업데이트
			var err = await this.sb.updateUserProfile(this.currentUser.id, { avatar_url: result.url })
			if (err) throw new Error(err.message)

			// 화면 반영
			this.profile.avatar_url = result.url
			var wrap = this.getElement().querySelector('.mp-avatar-wrap')
			if (wrap)
			{
				var existing = wrap.querySelector('.mp-avatar')
				if (existing) existing.remove()

				var img = document.createElement('img')
				img.className = 'mp-avatar mp-avatar-img'
				img.id        = 'mp-avatar-img'
				img.src       = result.url
				img.alt       = 'avatar'
				wrap.insertBefore(img, wrap.firstChild)
			}

			overlay.textContent = '📷'
			ToastManager.success('프로필 이미지가 변경되었습니다')
		}
		catch (e)
		{
			overlay.textContent = '📷'
			ToastManager.error('업로드 실패: ' + e.message)
		}
	}

	// ─────────────────────────────────────────
	// 프로필 저장
	// ─────────────────────────────────────────

	async _saveProfile()
	{
		var el          = this.getElement()
		var displayName = el.querySelector('#edit-displayname').value.trim()
		var gender      = el.querySelector('#edit-gender').value
		var birthDate   = el.querySelector('#edit-birthdate').value
		var bio         = el.querySelector('#edit-bio').value.trim()

		if (!displayName) { ToastManager.error('닉네임을 입력해주세요'); return }

		var btn = el.querySelector('#btn-save-profile')
		btn.disabled    = true
		btn.textContent = '저장 중...'

		try
		{
			var profile = { display_name: displayName, bio: bio }
			if (gender)    profile.gender     = gender
			if (birthDate) profile.birth_date = birthDate

			var err = await this.sb.updateUserProfile(this.currentUser.id, profile)
			if (err) throw new Error(err.message)

			// 로컬 반영
			this.profile.display_name = displayName
			this.profile.bio          = bio
			this.profile.gender       = gender
			this.profile.birth_date   = birthDate

			// 화면 텍스트 업데이트
			var nameEl = el.querySelector('#mp-display-name')
			if (nameEl) nameEl.textContent = displayName

			var bioEl = el.querySelector('#mp-bio')
			if (bioEl) bioEl.innerHTML = bio || '<span style="color:var(--color-text-dim)">자기소개가 없습니다</span>'

			this._toggleEditForm(false)
			ToastManager.success('프로필이 업데이트되었습니다')
		}
		catch (e)
		{
			ToastManager.error('저장 실패: ' + e.message)
		}
		finally
		{
			btn.disabled    = false
			btn.textContent = '저장'
		}
	}

	// ─────────────────────────────────────────
	// 탭 데이터 로드
	// ─────────────────────────────────────────

	async _loadTabData()
	{
		var content = this.getElement().querySelector('#mp-tab-content')
		content.innerHTML = '<div class="mp-loading"><div class="ac-spinner"></div></div>'

		try
		{
			if      (this.currentTab === 'mine')      await this._loadMyPrompts(content)
			else if (this.currentTab === 'saved')     await this._loadSaved(content)
			else if (this.currentTab === 'purchased') await this._loadPurchased(content)
		}
		catch (e)
		{
			content.innerHTML = '<div class="mp-empty"><div class="mp-empty-icon">⚠️</div><div class="mp-empty-text">불러오기 실패</div></div>'
		}
	}

	async _loadMyPrompts(content)
	{
		var result = await this.sb.getClient()
			.from('prompts')
			.select('id, title, description, price, prompt_type, like_count, view_count, status, rejection_reason, prompt_content, created_at, ai_tool_id, ai_tools(id, name)')
			.eq('user_id', this.currentUser.id)
			.is('deleted_at', null)
			.order('created_at', { ascending: false })

		this._allMyPrompts = result.data || []
		this._myFilter     = { sort: 'newest', toolId: 'all', price: 'all' }

		var toolsMap = {}
		this._allMyPrompts.forEach(function(p)
		{
			if (p.ai_tool_id && p.ai_tools) toolsMap[p.ai_tool_id] = p.ai_tools.name
		})
		this._myToolsMap = toolsMap

		this._renderMyFilters(content)
		this._applyMyFilters(content)
	}

	_renderMyFilters(content)
	{
		var toolsMap    = this._myToolsMap
		var toolOptions = '<option value="all">전체 도구</option>'
		Object.keys(toolsMap).forEach(function(id)
		{
			toolOptions += '<option value="' + id + '">' + toolsMap[id] + '</option>'
		})

		var sel = 'padding:6px 12px;background:#2E2E48;border:1px solid #3A3A58;border-radius:9999px;color:#fff;font-size:0.8125rem;font-family:inherit;cursor:pointer;outline:none;'

		content.innerHTML =
			'<div style="display:flex;gap:8px;padding:16px 0 12px;flex-wrap:wrap;">' +
				'<select id="mp-filter-sort" style="' + sel + '">' +
					'<option value="newest">최신순</option>' +
					'<option value="oldest">오래된 순</option>' +
					'<option value="likes">좋아요 많은 순</option>' +
				'</select>' +
				'<select id="mp-filter-tool" style="' + sel + '">' + toolOptions + '</select>' +
				'<select id="mp-filter-price" style="' + sel + '">' +
					'<option value="all">가격 전체</option>' +
					'<option value="free">무료</option>' +
					'<option value="high">가격 높은 순</option>' +
					'<option value="low">가격 낮은 순</option>' +
				'</select>' +
			'</div>' +
			'<div id="mp-my-list"></div>'

		var self = this
		content.querySelector('#mp-filter-sort').addEventListener('change', function()
		{
			self._myFilter.sort = this.value
			self._applyMyFilters(content)
		})
		content.querySelector('#mp-filter-tool').addEventListener('change', function()
		{
			self._myFilter.toolId = this.value
			self._applyMyFilters(content)
		})
		content.querySelector('#mp-filter-price').addEventListener('change', function()
		{
			self._myFilter.price = this.value
			self._applyMyFilters(content)
		})
	}

	_applyMyFilters(content)
	{
		var filter  = this._myFilter
		var prompts = this._allMyPrompts.slice()

		if (filter.toolId !== 'all')
			prompts = prompts.filter(function(p) { return p.ai_tool_id === filter.toolId })

		if (filter.price === 'free')
		{
			prompts = prompts.filter(function(p) { return Number(p.price) === 0 })
			prompts = this._sortMyPrompts(prompts, filter.sort)
		}
		else if (filter.price === 'high')
			prompts.sort(function(a, b) { return Number(b.price) - Number(a.price) })
		else if (filter.price === 'low')
			prompts.sort(function(a, b) { return Number(a.price) - Number(b.price) })
		else
			prompts = this._sortMyPrompts(prompts, filter.sort)

		var listEl = content.querySelector('#mp-my-list')
		if (listEl) this._renderMyPromptList(listEl, prompts)
	}

	_sortMyPrompts(prompts, sort)
	{
		if (sort === 'oldest')
			return prompts.sort(function(a, b) { return new Date(a.created_at) - new Date(b.created_at) })
		if (sort === 'likes')
			return prompts.sort(function(a, b) { return (b.like_count || 0) - (a.like_count || 0) })
		return prompts.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at) })
	}

	_renderMyPromptList(container, prompts)
	{
		if (!prompts.length)
		{
			container.innerHTML =
				'<div class="mp-empty">' +
					'<div class="mp-empty-icon">✍️</div>' +
					'<div class="mp-empty-text">등록한 프롬프트가 없습니다</div>' +
				'</div>'
			return
		}

		var html = '<div class="mp-list">'

		prompts.forEach(function(p)
		{
			var isImage    = p.prompt_type === 'image'
			var isRejected = p.status === 'rejected'
			var isPending  = p.status === 'pending'
			var icon       = isImage ? '🎨' : '✍️'
			var isFree     = Number(p.price) === 0
			var price      = isFree
				? '<span class="mp-list-price free">무료</span>'
				: '<span class="mp-list-price">' + Number(p.price).toLocaleString() + '원</span>'

			var statusLabel = ''
			if (isRejected)
				statusLabel = '<span style="font-size:0.8125rem;font-weight:600;color:rgba(255,107,107,0.75);flex-shrink:0;margin-right:10px;">반려</span>'
			else if (isPending)
				statusLabel = '<span style="font-size:0.8125rem;font-weight:600;color:rgba(255,179,71,0.75);flex-shrink:0;margin-right:10px;">심사중</span>'

			var cardStyle = isRejected ? ' style="border-left:3px solid rgba(255,107,107,0.5)"' : ''

			html +=
				'<div class="mp-list-card" data-id="' + p.id + '"' + cardStyle + '>' +
					'<div class="mp-list-icon">' + icon + '</div>' +
					'<div class="mp-list-info">' +
						'<div class="mp-list-title">' + p.title + '</div>' +
						'<div class="mp-list-desc">' + (p.description || '') + '</div>' +
					'</div>' +
					statusLabel +
					price +
				'</div>'
		})

		html += '</div>'
		container.innerHTML = html

		var self = this

		container.querySelectorAll('.mp-list-card').forEach(function(card)
		{
			var id     = card.dataset.id
			var prompt = prompts.find(function(p) { return p.id === id })
			if (!prompt) return

			card.addEventListener('click', function()
			{
				if (prompt.status === 'published')
					theApp.openDetail(prompt.id)
				else
					self._showPromptPopup(prompt)
			})
		})
	}

	_showPromptPopup(prompt)
	{
		var el       = this.getElement()
		var existing = el.querySelector('#mp-prompt-popup-overlay')
		if (existing) existing.remove()

		var statusMap   = { published: '승인됨', pending: '심사 중', rejected: '반려', draft: '임시저장' }
		var statusColor = { published: '#4CAF82', pending: '#FFB347', rejected: '#FF6B6B' }
		var typeLabel   = prompt.prompt_type === 'image' ? '🎨 이미지 프롬프트' : '✍️ 텍스트 프롬프트'
		var priceLabel  = Number(prompt.price) === 0 ? '무료' : Number(prompt.price).toLocaleString() + '원'
		var sLabel      = statusMap[prompt.status] || prompt.status
		var sColor      = statusColor[prompt.status] || '#A0A0C0'

		var rejectionHTML = ''
		if (prompt.status === 'rejected' && prompt.rejection_reason)
			rejectionHTML =
				'<div style="background:rgba(255,107,107,0.1);border:1px solid #FF6B6B;border-radius:12px;padding:14px 16px;margin-bottom:20px;">' +
					'<div style="font-size:0.875rem;font-weight:700;color:#FF6B6B;margin-bottom:6px;">⚠️ 반려 사유</div>' +
					'<div style="font-size:0.9rem;color:#fff;line-height:1.6;">' + prompt.rejection_reason + '</div>' +
				'</div>'

		var contentHTML = ''
		if (prompt.prompt_content)
			contentHTML =
				'<div>' +
					'<div style="font-size:0.75rem;font-weight:700;color:#6B6B8A;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:10px;">프롬프트 내용</div>' +
					'<pre style="font-family:\'JetBrains Mono\',monospace;font-size:0.875rem;color:#fff;background:#2E2E48;border:1px solid #3A3A58;border-radius:12px;padding:14px;white-space:pre-wrap;word-break:break-word;margin:0;line-height:1.7;max-height:260px;overflow-y:auto;">' + prompt.prompt_content + '</pre>' +
				'</div>'

		var overlay = document.createElement('div')
		overlay.id = 'mp-prompt-popup-overlay'
		overlay.style.cssText =
			'position:fixed;top:0;left:0;right:0;bottom:0;' +
			'background:rgba(10,10,20,0.82);' +
			'display:flex;align-items:center;justify-content:center;' +
			'z-index:9999;padding:20px;box-sizing:border-box;'

		var box = document.createElement('div')
		box.style.cssText =
			'background:#242438;border:1px solid #4A4A68;border-radius:24px;' +
			'padding:28px;width:100%;max-width:580px;max-height:82vh;overflow-y:auto;' +
			'box-shadow:0 8px 40px rgba(0,0,0,0.5);box-sizing:border-box;'
		box.innerHTML =
			'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
				'<div>' +
					'<span style="font-size:0.8125rem;color:#A0A0C0;">' + typeLabel + '</span>' +
					'<span style="font-size:0.75rem;font-weight:700;padding:3px 10px;border-radius:9999px;margin-left:10px;background:' + sColor + ';color:' + (prompt.status === 'pending' ? '#1a1a2e' : '#fff') + ';">' + sLabel + '</span>' +
				'</div>' +
				'<button id="mp-popup-close-btn" style="width:32px;height:32px;border:none;background:#2E2E48;border-radius:6px;color:#A0A0C0;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">✕</button>' +
			'</div>' +
			'<h2 style="font-size:1.375rem;font-weight:700;color:#fff;margin-bottom:8px;">' + prompt.title + '</h2>' +
			'<div style="font-size:1rem;font-weight:700;color:#6C63FF;margin-bottom:12px;">' + priceLabel + '</div>' +
			'<div style="font-size:0.9375rem;color:#A0A0C0;line-height:1.6;margin-bottom:20px;">' + (prompt.description || '') + '</div>' +
			rejectionHTML +
			contentHTML

		overlay.appendChild(box)
		el.appendChild(overlay)

		box.querySelector('#mp-popup-close-btn').addEventListener('click', function()
		{
			overlay.remove()
		})
		overlay.addEventListener('click', function(e)
		{
			if (e.target === overlay) overlay.remove()
		})
	}

	async _loadSaved(content)
	{
		var result = await this.sb.getClient()
			.from('prompt_saves')
			.select('prompts(id, title, description, price, prompt_type, like_count, view_count)')
			.eq('user_id', this.currentUser.id)
			.order('created_at', { ascending: false })

		var prompts = (result.data || []).map(function(row) { return row.prompts }).filter(Boolean)
		this._renderList(content, prompts, '저장된 프롬프트가 없습니다', '🔖')
	}

	async _loadPurchased(content)
	{
		var result = await this.sb.getClient()
			.from('orders')
			.select('prompts(id, title, description, price, prompt_type, like_count, view_count)')
			.eq('buyer_id', this.currentUser.id)
			.eq('status', 'completed')
			.order('created_at', { ascending: false })

		var prompts = (result.data || []).map(function(row) { return row.prompts }).filter(Boolean)
		this._renderList(content, prompts, '구매한 프롬프트가 없습니다', '🛒')
	}

	_renderList(content, prompts, emptyMsg, emptyIcon)
	{
		if (!prompts.length)
		{
			content.innerHTML =
				'<div class="mp-empty">' +
					'<div class="mp-empty-icon">' + emptyIcon + '</div>' +
					'<div class="mp-empty-text">' + emptyMsg + '</div>' +
				'</div>'
			return
		}

		var html = '<div class="mp-list">'

		prompts.forEach(function(p)
		{
			var isImage = p.prompt_type === 'image'
			var icon    = isImage ? '🎨' : '✍️'
			var isFree  = Number(p.price) === 0
			var price   = isFree
				? '<span class="mp-list-price free">무료</span>'
				: '<span class="mp-list-price">' + Number(p.price).toLocaleString() + '원</span>'

			html +=
				'<div class="mp-list-card" data-id="' + p.id + '">' +
					'<div class="mp-list-icon">' + icon + '</div>' +
					'<div class="mp-list-info">' +
						'<div class="mp-list-title">' + p.title + '</div>' +
						'<div class="mp-list-desc">' + (p.description || '') + '</div>' +
					'</div>' +
					price +
				'</div>'
		})

		html += '</div>'
		content.innerHTML = html

		content.querySelectorAll('.mp-list-card').forEach(function(card)
		{
			card.addEventListener('click', function()
			{
				theApp.openDetail(card.dataset.id)
			})
		})
	}

	_goBack()
	{
		theApp.mainContainer.open('Source/MainView.lay')
	}
}
