
class PromptRegisterView extends AView
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
	}

	onInitDone()
	{
		super.onInitDone()
		this.sb = SupabaseManager.getInstance()
		this.ps = new PromptService(this.sb)
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
		this.getElement().innerHTML =
			'<div class="reg-wrap">' +
				'<header class="reg-nav">' +
					'<button class="reg-back" id="btn-back">← 돌아가기</button>' +
					'<h1 class="reg-nav-title">프롬프트 등록</h1>' +
				'</header>' +
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

		this.getElement().innerHTML =
			'<div class="reg-wrap">' +

				'<header class="reg-nav">' +
					'<button class="reg-back" id="btn-back">← 돌아가기</button>' +
					'<h1 class="reg-nav-title">' + (isEdit ? '프롬프트 수정' : '프롬프트 등록') + '</h1>' +
					'<button class="ac-btn ac-btn-primary ac-btn-sm" id="btn-submit">' + (isEdit ? '수정 완료' : '등록하기') + '</button>' +
				'</header>' +

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

		el.querySelector('#btn-back').addEventListener('click', function() { self._goBack() })
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
			if (isEdit)
			{
				// update()가 내부적으로 status:'pending', rejection_reason:null 처리
				result = await this.ps.update(this.editPromptId, row)
				if (result.error) throw new Error(result.error.message)
				ToastManager.success('수정되었습니다. 관리자 재검수 후 게시됩니다.')
				theApp.mainContainer.open('Source/MyPage/MyPageView.lay')
			}
			else
			{
				row.user_id = this.currentUser.id
				row.status  = 'pending'
				result = await this.ps.create(row)
				if (result.error) throw new Error(result.error.message)
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
		// 수정 모드면 마이페이지로, 등록 모드면 메인으로
		if (this.editPromptId)
			theApp.mainContainer.open('Source/MyPage/MyPageView.lay')
		else
			theApp.mainContainer.open('Source/MainView.lay')
	}
}
