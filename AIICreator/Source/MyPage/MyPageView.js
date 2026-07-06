
class MyPageView extends AView
{
	constructor()
	{
		super()
		this.sb          = null
		this.us          = null
		this.currentUser = null
		this.profile     = null
		this.currentTab  = 'mine'
		this.isEditing   = false
	}

	onInitDone()
	{
		super.onInitDone()
		this.sb = SupabaseManager.getInstance()
		this.us = new UserService(this.sb)
		this._renderSkeleton()
		this._bootstrap()
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

			if (!this.profile)
			{
				var result = await this.sb.ensureUserProfile(this.currentUser)
				if (result.data) this.profile = result.data
			}
		}
		catch (e)
		{
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
		var result = await this.us.getProfile(this.currentUser.id)
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
					'<div class="mp-center">' +
						'<div class="mp-profile-skeleton"></div>' +
					'</div>' +
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
		var joinDate    = fmt.date(p.created_at)
		var ns          = p.notification_settings || { like: true, purchase: true }

		this.getElement().innerHTML =
			'<div class="mp-wrap">' +

				'<header class="mp-nav">' +
					'<button class="mp-back" id="btn-back">← 돌아가기</button>' +
					'<h1 class="mp-nav-title">마이페이지</h1>' +
					'<button class="ac-btn ac-btn-outline ac-btn-sm" id="btn-logout">로그아웃</button>' +
				'</header>' +

				'<div class="mp-body">' +
				'<div class="mp-center">' +

					'<div class="mp-profile-card">' +
						'<div class="mp-avatar-wrap">' +
							this._avatarHTML() +
							'<input type="file" id="avatar-file-input" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none">' +
						'</div>' +
						'<div class="mp-profile-info">' +
							'<div class="mp-display-name" id="mp-display-name">' + (p.display_name || '이름 없음') + '</div>' +
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
						// 알림 설정 섹션
						'<div class="mp-edit-section-label">알림 설정</div>' +
						'<div class="noti-row">' +
							'<div class="noti-row-info">' +
								'<div class="noti-row-label">좋아요 알림</div>' +
								'<div class="noti-row-sub">내 프롬프트에 좋아요가 눌렸을 때 알림을 받습니다</div>' +
							'</div>' +
							'<label class="noti-toggle">' +
								'<input type="checkbox" id="noti-like"' + (ns.like !== false ? ' checked' : '') + '>' +
								'<span class="noti-toggle-slider"></span>' +
							'</label>' +
						'</div>' +
						'<div class="noti-row">' +
							'<div class="noti-row-info">' +
								'<div class="noti-row-label">판매 알림</div>' +
								'<div class="noti-row-sub">내 프롬프트가 판매되었을 때 알림을 받습니다</div>' +
							'</div>' +
							'<label class="noti-toggle">' +
								'<input type="checkbox" id="noti-purchase"' + (ns.purchase !== false ? ' checked' : '') + '>' +
								'<span class="noti-toggle-slider"></span>' +
							'</label>' +
						'</div>' +
						'<div class="mp-edit-actions">' +
							'<button class="ac-btn ac-btn-primary ac-btn-sm" id="btn-save-profile">저장</button>' +
							'<button class="ac-btn ac-btn-outline ac-btn-sm" id="btn-cancel-edit">취소</button>' +
						'</div>' +
					'</div>' +

					'<div class="mp-tabs">' +
						'<button class="mp-tab active" data-tab="mine">내 프롬프트</button>' +
						'<button class="mp-tab" data-tab="saved">저장됨</button>' +
						'<button class="mp-tab" data-tab="purchased">구매함</button>' +
						'<button class="mp-tab" data-tab="revenue">수익</button>' +
					'</div>' +

					'<div class="mp-tab-content" id="mp-tab-content">' +
						'<div class="mp-loading"><div class="ac-spinner"></div></div>' +
					'</div>' +

				'</div>' +  // mp-center
			'</div>' +      // mp-body
		'</div>'            // mp-wrap
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
			ErrorHandler._intentionalLogout = true
			sessionStorage.removeItem('ac_session_alive')
			await self.sb.signOut()
			theApp.mainContainer.open('Source/Auth/AuthView.lay')
		})

		el.querySelector('#btn-avatar').addEventListener('click', function()
		{
			el.querySelector('#avatar-file-input').click()
		})

		el.querySelector('#avatar-file-input').addEventListener('change', function()
		{
			if (this.files && this.files[0])
				self._uploadAvatar(this.files[0])
		})

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

		el.querySelector('#edit-bio').addEventListener('input', function()
		{
			el.querySelector('#bio-count').textContent = this.value.length + ' / 200'
		})

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

			var upd = await this.us.updateProfile(this.currentUser.id, { avatar_url: result.url })
			if (upd.error) throw new Error(upd.error.message)

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
			var data = { display_name: displayName, bio: bio }
			if (gender)    data.gender     = gender
			if (birthDate) data.birth_date = birthDate

			var result = await this.us.updateProfile(this.currentUser.id, data)
			if (result.error) throw new Error(result.error.message)

			this.profile.display_name = displayName
			this.profile.bio          = bio
			this.profile.gender       = gender
			this.profile.birth_date   = birthDate

			// 알림 설정 함께 저장
			var notiLikeEl     = el.querySelector('#noti-like')
			var notiPurchaseEl = el.querySelector('#noti-purchase')
			if (notiLikeEl && notiPurchaseEl)
			{
				var newSettings = { like: notiLikeEl.checked, purchase: notiPurchaseEl.checked }
				var notiResult  = await this.us.updateNotificationSettings(this.currentUser.id, newSettings)
				if (!notiResult.error) this.profile.notification_settings = newSettings
			}

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
			else if (this.currentTab === 'revenue')   await this._loadRevenue(content)
		}
		catch (e)
		{
			content.innerHTML = '<div class="mp-empty"><div class="mp-empty-icon">⚠️</div><div class="mp-empty-text">불러오기 실패</div></div>'
		}
	}

	async _loadMyPrompts(content)
	{
		var result = await this.us.getUserPrompts(this.currentUser.id)
		var items  = result.data || []

		if (!items.length)
		{
			content.innerHTML =
				'<div class="mp-empty">' +
					'<div class="mp-empty-icon">✍️</div>' +
					'<div class="mp-empty-text">등록한 프롬프트가 없습니다</div>' +
				'</div>'
			return
		}

		var statusMap = {
			pending:   { label: '검토 중', cls: 'badge-pending'   },
			published: { label: '공개',    cls: 'badge-published' },
			rejected:  { label: '반려',    cls: 'badge-rejected'  },
			hidden:    { label: '숨김',    cls: 'badge-hidden'    }
		}

		var html = '<div class="mp-list">'

		items.forEach(function(p)
		{
			var isImage  = p.prompt_type === 'image'
			var icon     = isImage ? '🎨' : '✍️'
			var isFree   = Number(p.price) === 0
			var price    = isFree
				? '<span class="mp-list-price free">무료</span>'
				: '<span class="mp-list-price">' + Number(p.price).toLocaleString() + '원</span>'

			var st      = statusMap[p.status] || { label: p.status, cls: 'badge-hidden' }
			var badge   = '<span class="status-badge ' + st.cls + '">' + st.label + '</span>'

			var reason  = (p.status === 'rejected' && p.rejection_reason)
				? '<div class="my-prompt-reason">💬 반려 사유: ' + p.rejection_reason + '</div>'
				: ''

			html +=
				'<div class="mp-list-card" data-id="' + p.id + '">' +
					'<div class="mp-list-icon">' + icon + '</div>' +
					'<div class="mp-list-info">' +
						'<div class="mp-list-title">' + p.title + '</div>' +
						'<div class="mp-list-desc">' + (p.description || '') + '</div>' +
						reason +
					'</div>' +
					'<div class="mp-list-meta">' +
						badge +
						price +
						'<button class="mp-edit-btn" data-id="' + p.id + '">수정</button>' +
					'</div>' +
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

		// 수정 버튼: 카드 클릭 이벤트와 분리
		content.querySelectorAll('.mp-edit-btn').forEach(function(btn)
		{
			btn.addEventListener('click', function(e)
			{
				e.stopPropagation()
				theApp.editPromptId = btn.getAttribute('data-id')
				theApp.mainContainer.open('Source/Prompt/PromptRegisterView.lay')
			})
		})
	}

	async _loadSaved(content)
	{
		var result  = await this.us.getSavedPrompts(this.currentUser.id)
		var prompts = (result.data || []).map(function(row) { return row.prompts }).filter(Boolean)
		this._renderList(content, prompts, '저장된 프롬프트가 없습니다', '🔖')
	}

	async _loadPurchased(content)
	{
		var result  = await this.us.getUserOrders(this.currentUser.id)
		var prompts = (result.data || []).map(function(row) { return row.prompts }).filter(Boolean)
		this._renderList(content, prompts, '구매한 프롬프트가 없습니다', '🛒')
	}

	async _loadRevenue(content)
	{
		var result = await this.us.getMyRevenue(this.currentUser.id)

		if (result.error)
		{
			content.innerHTML = '<div class="mp-empty"><div class="mp-empty-icon">⚠️</div><div class="mp-empty-text">수익 정보를 불러올 수 없습니다</div></div>'
			return
		}

		var rows = result.data || []

		if (rows.length === 0)
		{
			content.innerHTML =
				'<div class="mp-empty">' +
					'<div class="mp-empty-icon">💰</div>' +
					'<div class="mp-empty-text">아직 판매 내역이 없습니다</div>' +
				'</div>'
			return
		}

		// 합계 계산
		var totalGross = rows.reduce(function(sum, r) { return sum + Number(r.gross_amount) }, 0)
		var totalNet   = rows.reduce(function(sum, r) { return sum + Number(r.net_amount)   }, 0)
		var totalCount = rows.length

		var html =
			// 요약 카드
			'<div class="rev-summary">' +
				'<div class="rev-card">' +
					'<div class="rev-card-label">총 판매</div>' +
					'<div class="rev-card-value">' + totalCount + '건</div>' +
				'</div>' +
				'<div class="rev-card">' +
					'<div class="rev-card-label">총 매출</div>' +
					'<div class="rev-card-value">' + totalGross.toLocaleString() + '원</div>' +
				'</div>' +
				'<div class="rev-card rev-card-accent">' +
					'<div class="rev-card-label">순수익 <span class="rev-commission">(수수료 20% 제외)</span></div>' +
					'<div class="rev-card-value">' + totalNet.toLocaleString() + '원</div>' +
				'</div>' +
			'</div>' +

			// 개별 내역
			'<div class="rev-list">'

		rows.forEach(function(r)
		{
			var prompt  = r.orders && r.orders.prompts ? r.orders.prompts : null
			var title   = prompt ? prompt.title : '알 수 없음'
			var paidAt  = r.orders && r.orders.paid_at ? fmt.date(r.orders.paid_at) : fmt.date(r.created_at)
			var gross   = Number(r.gross_amount).toLocaleString() + '원'
			var net     = Number(r.net_amount).toLocaleString() + '원'

			html +=
				'<div class="rev-row">' +
					'<div class="rev-row-info">' +
						'<div class="rev-row-title">' + title + '</div>' +
						'<div class="rev-row-date">' + paidAt + '</div>' +
					'</div>' +
					'<div class="rev-row-amounts">' +
						'<span class="rev-row-gross">매출 ' + gross + '</span>' +
						'<span class="rev-row-net">순수익 ' + net + '</span>' +
					'</div>' +
				'</div>'
		})

		html += '</div>'
		content.innerHTML = html
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
					'<div class="mp-list-info">'
					+ '<div class="mp-list-title">' + p.title + '</div>'
					+ '<div class="mp-list-desc">' + (p.description || '') + '</div>'
				+ '</div>'
				+ price
			+ '</div>'
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
