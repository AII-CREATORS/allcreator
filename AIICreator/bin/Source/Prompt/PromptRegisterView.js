
PromptRegisterView = class PromptRegisterView extends AView
{
	constructor()
	{
		super()
		this.sb            = null
		this.ps            = null
		this.currentUser   = null
		this.aiTools       = []
		this.categories    = []
		this.editPromptId  = null   // 수정 모드일 때 설정됨
		this.editPrompt    = null   // 수정 대상 데이터
		this._pendingImageFile   = null   // 업로드 대기 중인 이미지 파일
		this._pendingImageRemove = false  // 수정 모드에서 이미지 제거 요청 여부
		this._displayInitial     = ''
	}

	onInitDone()
	{
		super.onInitDone()
		this.sb = SupabaseManager.getInstance()
		this.ps = new PromptService(this.sb)
		this.us = new UserService(this.sb)

		var el = this.getElement()
		el.innerHTML =
			'<header id="reg-navbar"></header>' +
			'<div id="reg-body-wrap" class="reg-body-wrap"></div>'

		this._initNavBar(el.querySelector('#reg-navbar'))
		this._renderSkeleton()
		this._bootstrap()
	}

	_initNavBar(container)
	{
		var sb = this.sb
		var nav = new NavBar(container, {
			onSearch:   function() { theApp.mainContainer.open('Source/MainView.lay') },
			onLogin:    function() { theApp.mainContainer.open('Source/Auth/AuthView.lay') },
			onRegister: function() { theApp.mainContainer.open('Source/Prompt/PromptRegisterView.lay') },
			onMyPage:   function() { theApp.mainContainer.open('Source/MyPage/MyPageView.lay') },
			onAdmin:    function() { theApp.mainContainer.open('Source/Admin/AdminView.lay') },
			onLogout:   async function()
			{
				ErrorHandler._intentionalLogout = true
				sessionStorage.removeItem('ac_session_alive')
				await sb.signOut()
				theApp._filterState = null
				theApp.mainContainer.open('Source/MainView.lay')
			}
		})
		nav.render()
	}

	// ─────────────────────────────────────────
	// 초기화
	// ─────────────────────────────────────────

	async _bootstrap()
	{
		this.currentUser = await this.sb.getUser()

		if (!this.currentUser)
		{
			theApp.editPromptId = null  // 오염 방지: 소비하지 않고 나가면 초기화
			ToastManager.error('로그인이 필요합니다')
			theApp.mainContainer.open('Source/Auth/AuthView.lay')
			return
		}

		// 헤더 아바타 이니셜용 display_name 로드
		var { data: uProfile } = await this.us.getAdminRole(this.currentUser.id)
		this._displayInitial = uProfile && uProfile.display_name
			? uProfile.display_name[0].toUpperCase()
			: this.currentUser.email[0].toUpperCase()

		// 수정 모드 감지: theApp.editPromptId가 설정돼 있으면 수정 모드
		if (theApp.editPromptId)
		{
			this.editPromptId    = theApp.editPromptId
			theApp.editPromptId  = null  // 소비 후 초기화
		}

		await this._loadMeta()

		// 수정 모드면 기존 데이터 로드
		if (this.editPromptId)
		{
			var result = await this.ps.getDetail(this.editPromptId)
			if (result.error || !result.data)
			{
				ToastManager.error('프롬프트를 불러올 수 없습니다')
				this._goBack()
				return
			}
			this.editPrompt = result.data
		}

		this._renderHTML()
		this._bindEvents()
	}

	async _loadMeta()
	{
		var toolResult  = await this.ps.getAITools()
		this.aiTools    = toolResult.data || []

		var catResult   = await this.ps.getCategories()
		this.categories = catResult.data || []
	}

	// ─────────────────────────────────────────
	// 렌더링
	// ─────────────────────────────────────────

	_renderSkeleton()
	{
		var body = this.getElement().querySelector('#reg-body-wrap') || this.getElement()
		body.innerHTML =
			'<div class="reg-wrap">' +
				'<div class="reg-content">' +
					'<div class="skeleton-title" style="height:32px;margin-bottom:16px"></div>' +
					'<div class="skeleton-line"></div>' +
					'<div class="skeleton-line short"></div>' +
				'</div>' +
			'</div>'
	}

	_renderHTML()
	{
		var isEdit = !!this.editPromptId
		var p      = this.editPrompt || {}
		var price  = isEdit ? Number(p.price || 0) : 0

		// AI 도구 옵션 (수정 모드면 기존 값 selected)
		var editToolId = isEdit && p.ai_tools ? (this._findToolId(p.ai_tools.name)) : ''
		var toolOptions = '<option value="">AI 도구 선택 *</option>'
		this.aiTools.forEach(function(t)
		{
			toolOptions += '<option value="' + t.id + '"' + (t.id === editToolId ? ' selected' : '') + '>' + t.name + '</option>'
		})

		// 카테고리 옵션
		var editCatId = isEdit && p.categories ? (this._findCatId(p.categories.name)) : ''
		var catOptions = '<option value="">카테고리 선택</option>'
		this.categories.forEach(function(c)
		{
			catOptions += '<option value="' + c.id + '"' + (c.id === editCatId ? ' selected' : '') + '>' + c.name + '</option>'
		})

		var body = this.getElement().querySelector('#reg-body-wrap') || this.getElement()
		body.innerHTML =
			'<div class="reg-wrap">' +
				'<div class="reg-content">' +
					'<div class="reg-form">' +

						// 제목
						'<div class="ac-input-group">' +
							'<label class="ac-label">제목 <span class="reg-required">*</span></label>' +
							'<input class="ac-input" type="text" id="reg-title" placeholder="프롬프트 제목을 입력하세요" maxlength="100" value="' + (isEdit ? (p.title || '').replace(/"/g, '&quot;') : '') + '">' +
							'<div class="reg-char-count" id="count-title">' + (isEdit ? (p.title || '').length : 0) + ' / 100</div>' +
						'</div>' +

						// 설명
						'<div class="ac-input-group">' +
							'<label class="ac-label">설명 <span class="reg-required">*</span></label>' +
							'<textarea class="ac-input reg-textarea" id="reg-desc" placeholder="프롬프트에 대한 간단한 설명을 입력하세요" maxlength="300">' + (isEdit ? (p.description || '') : '') + '</textarea>' +
							'<div class="reg-char-count" id="count-desc">' + (isEdit ? (p.description || '').length : 0) + ' / 300</div>' +
						'</div>' +

						// AI 도구 + 카테고리
						'<div class="reg-row">' +
							'<div class="ac-input-group" style="flex:1">' +
								'<label class="ac-label">AI 도구 <span class="reg-required">*</span></label>' +
								'<select class="ac-input" id="reg-tool">' + toolOptions + '</select>' +
							'</div>' +
							'<div class="ac-input-group" style="flex:1">' +
								'<label class="ac-label">카테고리</label>' +
								'<select class="ac-input" id="reg-category">' + catOptions + '</select>' +
							'</div>' +
						'</div>' +

						// 타입 + 난이도
						'<div class="reg-row">' +
							'<div class="ac-input-group" style="flex:1">' +
								'<label class="ac-label">프롬프트 타입 <span class="reg-required">*</span></label>' +
								'<select class="ac-input" id="reg-type">' +
									'<option value="text"' + (isEdit && p.prompt_type === 'text' ? ' selected' : '') + '>✍️ 텍스트</option>' +
									'<option value="image"' + (isEdit && p.prompt_type === 'image' ? ' selected' : '') + '>🎨 이미지</option>' +
								'</select>' +
							'</div>' +
							'<div class="ac-input-group" style="flex:1">' +
								'<label class="ac-label">난이도</label>' +
								'<select class="ac-input" id="reg-difficulty">' +
									'<option value="beginner"' + (isEdit && p.difficulty === 'beginner' ? ' selected' : '') + '>입문</option>' +
									'<option value="intermediate"' + (isEdit && p.difficulty === 'intermediate' ? ' selected' : '') + '>중급</option>' +
									'<option value="advanced"' + (isEdit && p.difficulty === 'advanced' ? ' selected' : '') + '>고급</option>' +
								'</select>' +
							'</div>' +
						'</div>' +

						// 가격
						'<div class="ac-input-group">' +
							'<label class="ac-label">가격 (원)</label>' +
							'<div class="reg-price-wrap">' +
								'<input class="ac-input reg-price-input" type="number" id="reg-price" placeholder="0" min="0" value="' + price + '">' +
								'<span class="reg-price-hint' + (price > 0 ? ' paid' : '') + '" id="price-hint">' + (price > 0 ? price.toLocaleString() + '원' : '무료') + '</span>' +
							'</div>' +
						'</div>' +

						// 프롬프트 내용
						'<div class="ac-input-group">' +
							'<label class="ac-label">프롬프트 내용 <span class="reg-required">*</span>' +
								'<span class="reg-label-sub">— 구매자에게 공개되는 실제 프롬프트</span>' +
							'</label>' +
							'<textarea class="ac-input reg-textarea reg-textarea-lg" id="reg-content" placeholder="실제 프롬프트 내용을 입력하세요&#10;&#10;예시) Act as a senior software engineer...">' + (isEdit ? (p.prompt_content || '') : '') + '</textarea>' +
							'<div class="reg-char-count" id="count-content">' + (isEdit ? (p.prompt_content || '').length : 0) + ' 자</div>' +
						'</div>' +

						// 결과 이미지
						'<div class="ac-input-group">' +
							'<label class="ac-label">결과 이미지' +
								'<span class="reg-label-sub">— 프롬프트 사용 결과 예시 (선택)</span>' +
							'</label>' +
							'<input type="file" id="reg-img-file" accept="image/*" style="display:none">' +
							(isEdit && p.result_image
								? '<div class="reg-img-zone reg-img-preview" id="reg-img-zone">' +
									'<img src="' + p.result_image + '" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:0 auto;">' +
									'<div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">' +
										'<button type="button" class="ac-btn ac-btn-outline ac-btn-sm" id="reg-img-change">변경</button>' +
										'<button type="button" class="ac-btn ac-btn-sm" id="reg-img-remove" style="color:#FF6584;border-color:#FF6584;">제거</button>' +
									'</div>' +
								'</div>'
								: '<div class="reg-img-zone" id="reg-img-zone" style="cursor:pointer;">' +
									'<div style="font-size:2rem;margin-bottom:8px;">🖼️</div>' +
									'<div style="font-size:0.875rem;color:#8080A0;">클릭하거나 이미지를 끌어다 놓으세요</div>' +
									'<div style="font-size:0.75rem;color:#4A4A6A;margin-top:4px;">JPG, PNG, GIF, WebP · 최대 5MB</div>' +
								'</div>'
							) +
						'</div>' +

						'<div class="reg-submit-row">' +
							'<button class="ac-btn ac-btn-primary" id="btn-submit">' + (isEdit ? '수정 완료' : '등록하기') + '</button>' +
						'</div>' +

					'</div>' +

				'</div>' +

			'</div>'
	}

	// AI 도구 이름으로 id 찾기
	_findToolId(name)
	{
		var found = this.aiTools.filter(function(t) { return t.name === name })[0]
		return found ? found.id : ''
	}

	// 카테고리 이름으로 id 찾기
	_findCatId(name)
	{
		var found = this.categories.filter(function(c) { return c.name === name })[0]
		return found ? found.id : ''
	}

	// ─────────────────────────────────────────
	// 이벤트 바인딩
	// ─────────────────────────────────────────

	_bindEvents()
	{
		var el   = this.getElement()
		var self = this

		el.querySelector('#btn-submit').addEventListener('click', function() { self._onSubmit() })

		el.querySelector('#reg-title').addEventListener('input', function()
		{
			el.querySelector('#count-title').textContent = this.value.length + ' / 100'
		})
		el.querySelector('#reg-desc').addEventListener('input', function()
		{
			el.querySelector('#count-desc').textContent = this.value.length + ' / 300'
		})
		el.querySelector('#reg-content').addEventListener('input', function()
		{
			el.querySelector('#count-content').textContent = this.value.length + ' 자'
		})

		el.querySelector('#reg-price').addEventListener('input', function()
		{
			var hint = el.querySelector('#price-hint')
			var val  = parseInt(this.value, 10) || 0
			if (val <= 0)
			{
				hint.textContent = '무료'
				hint.className   = 'reg-price-hint'
			}
			else
			{
				hint.textContent = val.toLocaleString() + '원'
				hint.className   = 'reg-price-hint paid'
			}
		})

		this._bindImageEvents(el)
	}

	_bindImageEvents(el)
	{
		var self    = this
		var zone    = el.querySelector('#reg-img-zone')
		var fileInput = el.querySelector('#reg-img-file')
		if (!zone || !fileInput) return

		// 클릭으로 파일 선택 (변경 버튼 또는 빈 존)
		zone.addEventListener('click', function(e)
		{
			if (e.target.id === 'reg-img-remove') return
			fileInput.click()
		})

		// 드래그 앤 드롭
		zone.addEventListener('dragover', function(e)
		{
			e.preventDefault()
			zone.style.borderColor = '#6C63FF'
			zone.style.background  = 'rgba(108,99,255,0.1)'
		})
		zone.addEventListener('dragleave', function()
		{
			zone.style.borderColor = ''
			zone.style.background  = ''
		})
		zone.addEventListener('drop', function(e)
		{
			e.preventDefault()
			zone.style.borderColor = ''
			zone.style.background  = ''
			var file = e.dataTransfer.files[0]
			if (file) self._applyImageFile(el, file)
		})

		// 파일 선택
		fileInput.addEventListener('change', function()
		{
			var file = fileInput.files[0]
			if (file) self._applyImageFile(el, file)
			fileInput.value = ''  // 같은 파일 재선택 허용
		})

		// 제거 버튼 (수정 모드 기존 이미지)
		var removeBtn = el.querySelector('#reg-img-remove')
		if (removeBtn)
		{
			removeBtn.addEventListener('click', function(e)
			{
				e.stopPropagation()
				self._pendingImageFile   = null
				self._pendingImageRemove = true
				self._resetImageZone(el)
			})
		}
	}

	_applyImageFile(el, file)
	{
		if (!file.type.startsWith('image/'))
		{
			ToastManager.error('이미지 파일만 첨부할 수 있습니다')
			return
		}
		if (file.size > 5 * 1024 * 1024)
		{
			ToastManager.error('이미지 크기는 5MB 이하여야 합니다')
			return
		}

		this._pendingImageFile   = file
		this._pendingImageRemove = false

		var reader = new FileReader()
		var self   = this
		reader.onload = function(e)
		{
			var zone = el.querySelector('#reg-img-zone')
			if (!zone) return
			zone.innerHTML =
				'<img src="' + e.target.result + '" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:0 auto;">' +
				'<div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">' +
					'<button type="button" class="ac-btn ac-btn-outline ac-btn-sm" id="reg-img-change">변경</button>' +
					'<button type="button" class="ac-btn ac-btn-sm" id="reg-img-remove" style="color:#FF6584;border-color:#FF6584;">제거</button>' +
				'</div>'
			zone.style.cursor = 'default'

			// 동적으로 추가된 버튼에 이벤트 재바인딩
			zone.querySelector('#reg-img-change').addEventListener('click', function()
			{
				el.querySelector('#reg-img-file').click()
			})
			zone.querySelector('#reg-img-remove').addEventListener('click', function(ev)
			{
				ev.stopPropagation()
				self._pendingImageFile   = null
				self._pendingImageRemove = true
				self._resetImageZone(el)
			})
		}
		reader.readAsDataURL(file)
	}

	_resetImageZone(el)
	{
		var zone = el.querySelector('#reg-img-zone')
		if (!zone) return
		zone.innerHTML =
			'<div style="font-size:2rem;margin-bottom:8px;">🖼️</div>' +
			'<div style="font-size:0.875rem;color:#8080A0;">클릭하거나 이미지를 끌어다 놓으세요</div>' +
			'<div style="font-size:0.75rem;color:#4A4A6A;margin-top:4px;">JPG, PNG, GIF, WebP · 최대 5MB</div>'
		zone.style.cursor = 'pointer'
	}

	// ─────────────────────────────────────────
	// 등록 로직
	// ─────────────────────────────────────────

	async _onSubmit()
	{
		var el         = this.getElement()
		var title      = el.querySelector('#reg-title').value.trim()
		var desc       = el.querySelector('#reg-desc').value.trim()
		var content    = el.querySelector('#reg-content').value.trim()
		var toolId     = el.querySelector('#reg-tool').value
		var categoryId = el.querySelector('#reg-category').value
		var type       = el.querySelector('#reg-type').value
		var difficulty = el.querySelector('#reg-difficulty').value
		var price      = parseInt(el.querySelector('#reg-price').value, 10) || 0

		if (!title)   { ToastManager.error('제목을 입력해주세요'); return }
		if (!desc)    { ToastManager.error('설명을 입력해주세요'); return }
		if (!content) { ToastManager.error('프롬프트 내용을 입력해주세요'); return }
		if (!toolId)  { ToastManager.error('AI 도구를 선택해주세요'); return }
		if (price < 0){ ToastManager.error('가격은 0원 이상이어야 합니다'); return }

		var isEdit = !!this.editPromptId
		var btn    = el.querySelector('#btn-submit')
		btn.disabled    = true
		btn.textContent = isEdit ? '수정 중...' : '등록 중...'

		try
		{
			var row = {
				title:          title,
				description:    desc,
				prompt_content: content,
				ai_tool_id:     toolId,
				prompt_type:    type,
				difficulty:     difficulty,
				price:          String(price),
				category_id:    categoryId || null
			}

			var result
			var savedPromptId
			if (isEdit)
			{
				// 이미지 제거 요청
				if (this._pendingImageRemove) row.result_image = null

				// update()가 내부적으로 status:'pending', rejection_reason:null 처리
				result = await this.ps.update(this.editPromptId, row)
				if (result.error) throw new Error(result.error.message)
				savedPromptId = this.editPromptId
			}
			else
			{
				row.user_id = this.currentUser.id
				row.status  = 'pending'
				result = await this.ps.create(row)
				if (result.error) throw new Error(result.error.message)
				savedPromptId = result.data.id
			}

			// 이미지 업로드 (파일이 선택된 경우)
			if (this._pendingImageFile && savedPromptId)
			{
				btn.textContent = '이미지 업로드 중...'
				var imgResult = await this.ps.uploadResultImage(savedPromptId, this._pendingImageFile)
				if (!imgResult.error && imgResult.url)
					await this.ps.updateResultImage(savedPromptId, imgResult.url)
				// 이미지 실패는 등록 자체를 막지 않음 (토스트만)
				if (imgResult.error)
					ToastManager.error('이미지 업로드 실패: ' + imgResult.error.message)
			}

			if (isEdit)
			{
				ToastManager.success('수정되었습니다. 관리자 재검수 후 게시됩니다.')
				// 상세 페이지에서 진입한 경우 상세 페이지로 복귀, 아니면 마이페이지
				var returnId = theApp.editReturnToDetail
				theApp.editReturnToDetail = null
				if (returnId)
					theApp.openDetail(returnId)
				else
					theApp.mainContainer.open('Source/MyPage/MyPageView.lay')
			}
			else
			{
				ToastManager.success('프롬프트가 등록되었습니다! 관리자 검수 후 게시됩니다.')
				theApp.mainContainer.open('Source/MainView.lay')
			}
		}
		catch (e)
		{
			ToastManager.error((isEdit ? '수정' : '등록') + ' 실패: ' + e.message)
			btn.disabled    = false
			btn.textContent = isEdit ? '수정 완료' : '등록하기'
		}
	}

	_goBack()
	{
		if (this.editPromptId)
		{
			// 상세 페이지에서 진입한 경우 → 상세 페이지로 복귀
			var returnId = theApp.editReturnToDetail
			theApp.editReturnToDetail = null
			if (returnId)
				theApp.openDetail(returnId)
			else
				theApp.mainContainer.open('Source/MyPage/MyPageView.lay')
		}
		else
		{
			theApp.mainContainer.open('Source/MainView.lay')
		}
	}
}
