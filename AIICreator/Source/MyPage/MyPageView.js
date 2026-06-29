
class MyPageView extends AView
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
		this._injectStyle()
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

		await this._loadProfile()
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

	_injectStyle()
	{
		if (document.getElementById('mp-view-style')) return

		var style = document.createElement('style')
		style.id  = 'mp-view-style'
		style.textContent =
			'.mp-wrap{display:flex;flex-direction:column;height:100%;background:var(--color-primary);}' +

			// 네비
			'.mp-nav{display:flex;align-items:center;gap:16px;padding:0 24px;height:56px;background:var(--color-primary-dark);border-bottom:1px solid var(--color-border);flex-shrink:0;}' +
			'.mp-back{background:none;border:none;color:var(--color-text-muted);font-size:0.9375rem;font-family:var(--font-body);cursor:pointer;padding:6px 10px;border-radius:var(--radius-sm);transition:color var(--transition),background var(--transition);flex-shrink:0;}' +
			'.mp-back:hover{color:var(--color-text);background:var(--color-surface);}' +
			'.mp-nav-title{font-family:var(--font-title);font-size:1.0625rem;font-weight:700;color:var(--color-text);flex:1;}' +

			// 바디
			'.mp-body{flex:1;overflow-y:auto;padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:820px;width:100%;margin:0 auto;box-sizing:border-box;}' +

			// 프로필 카드
			'.mp-profile-card{display:flex;align-items:flex-start;gap:20px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:24px;}' +

			// 아바타
			'.mp-avatar-wrap{position:relative;flex-shrink:0;width:72px;height:72px;}' +
			'.mp-avatar{width:72px;height:72px;border-radius:50%;flex-shrink:0;}' +
			'.mp-avatar-initial{background:var(--color-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-title);font-size:1.625rem;font-weight:700;}' +
			'.mp-avatar-img{object-fit:cover;border:2px solid var(--color-border);}' +
			'.mp-avatar-overlay{position:absolute;bottom:0;right:0;width:24px;height:24px;border-radius:50%;background:var(--color-surface-2);border:1px solid var(--color-border);display:flex;align-items:center;justify-content:center;font-size:0.75rem;cursor:pointer;transition:background var(--transition);}' +
			'.mp-avatar-overlay:hover{background:var(--color-accent);}' +

			// 프로필 정보
			'.mp-profile-info{flex:1;min-width:0;}' +
			'.mp-display-name{font-family:var(--font-title);font-size:1.25rem;font-weight:700;color:var(--color-text);margin-bottom:2px;}' +
			'.mp-username{font-size:0.875rem;color:var(--color-accent);margin-bottom:6px;}' +
			'.mp-bio{font-size:0.9rem;color:var(--color-text-muted);line-height:1.5;margin-bottom:8px;}' +
			'.mp-meta{font-size:0.8125rem;color:var(--color-text-dim);display:flex;flex-wrap:wrap;gap:4px;}' +
			'.mp-meta-sep{color:var(--color-border);}' +
			'.mp-profile-skeleton{height:120px;background:var(--color-surface-2);border-radius:var(--radius-lg);animation:skeleton-pulse 1.5s ease infinite;}' +

			// 편집 폼
			'.mp-edit-form{background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:20px;display:flex;flex-direction:column;gap:16px;}' +
			'.mp-edit-row{display:flex;gap:12px;}' +
			'.mp-edit-actions{display:flex;gap:8px;justify-content:flex-end;}' +
			'.mp-bio-textarea{resize:vertical;min-height:72px;line-height:1.6;}' +
			'.mp-char-count{text-align:right;font-size:0.75rem;color:var(--color-text-dim);margin-top:4px;}' +

			// 탭
			'.mp-tabs{display:flex;gap:0;border-bottom:1px solid var(--color-border);}' +
			'.mp-tab{padding:10px 20px;border:none;border-bottom:2px solid transparent;background:transparent;color:var(--color-text-muted);font-size:0.9375rem;font-weight:500;font-family:var(--font-body);cursor:pointer;transition:color var(--transition),border-color var(--transition);margin-bottom:-1px;}' +
			'.mp-tab:hover{color:var(--color-text);}' +
			'.mp-tab.active{color:var(--color-accent);border-bottom-color:var(--color-accent);}' +

			// 탭 콘텐츠
			'.mp-tab-content{flex:1;}' +
			'.mp-loading{display:flex;justify-content:center;padding:48px;}' +
			'.mp-empty{display:flex;flex-direction:column;align-items:center;padding:60px 20px;gap:10px;}' +
			'.mp-empty-icon{font-size:2.5rem;}' +
			'.mp-empty-text{font-size:0.9375rem;color:var(--color-text-muted);}' +

			// 미니 카드 목록
			'.mp-list{display:flex;flex-direction:column;gap:10px;padding-top:16px;}' +
			'.mp-list-card{display:flex;align-items:center;gap:14px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:14px 16px;cursor:pointer;transition:border-color var(--transition),background var(--transition);}' +
			'.mp-list-card:hover{border-color:var(--color-accent);background:var(--color-surface-2);}' +
			'.mp-list-icon{font-size:1.5rem;flex-shrink:0;}' +
			'.mp-list-info{flex:1;min-width:0;}' +
			'.mp-list-title{font-size:0.9375rem;font-weight:700;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;}' +
			'.mp-list-desc{font-size:0.8125rem;color:var(--color-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
			'.mp-list-price{font-size:0.9375rem;font-weight:700;color:var(--color-accent);flex-shrink:0;}' +
			'.mp-list-price.free{color:var(--color-success);}' +

			'@keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:0.4}}'

		document.head.appendChild(style)
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
			console.error('[MyPageView] _uploadAvatar error:', e)
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
			console.error('[MyPageView] _loadTabData error:', e)
		}
	}

	async _loadMyPrompts(content)
	{
		var result = await this.sb.getClient()
			.from('prompts')
			.select('id, title, description, price, prompt_type, like_count, view_count, status')
			.eq('user_id', this.currentUser.id)
			.is('deleted_at', null)
			.order('created_at', { ascending: false })

		this._renderList(content, result.data || [], '등록한 프롬프트가 없습니다', '✍️')
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
				window._currentPromptId = card.getAttribute('data-id')
				theApp.mainContainer.open('Source/Prompt/PromptDetailView.lay')
			})
		})
	}

	// ─────────────────────────────────────────
	// 화면 전환
	// ─────────────────────────────────────────

	_goBack()
	{
		theApp.mainContainer.open('Source/MainView.lay')
	}
}
