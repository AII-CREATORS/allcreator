
class PromptRegisterView extends AView
{
	constructor()
	{
		super()
		this.sb          = null
		this.ps          = null
		this.currentUser = null
		this.aiTools     = []
		this.categories  = []
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

		await this._loadMeta()
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
		var toolOptions = '<option value="">AI 도구 선택 *</option>'
		this.aiTools.forEach(function(t)
		{
			toolOptions += '<option value="' + t.id + '">' + t.name + '</option>'
		})

		var catOptions = '<option value="">카테고리 선택</option>'
		this.categories.forEach(function(c)
		{
			catOptions += '<option value="' + c.id + '">' + c.name + '</option>'
		})

		this.getElement().innerHTML =
			'<div class="reg-wrap">' +

				'<header class="reg-nav">' +
					'<button class="reg-back" id="btn-back">← 돌아가기</button>' +
					'<h1 class="reg-nav-title">프롬프트 등록</h1>' +
					'<button class="ac-btn ac-btn-primary ac-btn-sm" id="btn-submit">등록하기</button>' +
				'</header>' +

				'<div class="reg-content">' +
					'<div class="reg-form">' +

						// 제목
						'<div class="ac-input-group">' +
							'<label class="ac-label">제목 <span class="reg-required">*</span></label>' +
							'<input class="ac-input" type="text" id="reg-title" placeholder="프롬프트 제목을 입력하세요" maxlength="100">' +
							'<div class="reg-char-count" id="count-title">0 / 100</div>' +
						'</div>' +

						// 설명
						'<div class="ac-input-group">' +
							'<label class="ac-label">설명 <span class="reg-required">*</span></label>' +
							'<textarea class="ac-input reg-textarea" id="reg-desc" placeholder="프롬프트에 대한 간단한 설명을 입력하세요" maxlength="300"></textarea>' +
							'<div class="reg-char-count" id="count-desc">0 / 300</div>' +
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
									'<option value="text">✍️ 텍스트</option>' +
									'<option value="image">🎨 이미지</option>' +
								'</select>' +
							'</div>' +
							'<div class="ac-input-group" style="flex:1">' +
								'<label class="ac-label">난이도</label>' +
								'<select class="ac-input" id="reg-difficulty">' +
									'<option value="beginner">입문</option>' +
									'<option value="intermediate">중급</option>' +
									'<option value="advanced">고급</option>' +
								'</select>' +
							'</div>' +
						'</div>' +

						// 가격
						'<div class="ac-input-group">' +
							'<label class="ac-label">가격 (원)</label>' +
							'<div class="reg-price-wrap">' +
								'<input class="ac-input reg-price-input" type="number" id="reg-price" placeholder="0" min="0" value="0">' +
								'<span class="reg-price-hint" id="price-hint">무료</span>' +
							'</div>' +
						'</div>' +

						// 프롬프트 내용
						'<div class="ac-input-group">' +
							'<label class="ac-label">프롬프트 내용 <span class="reg-required">*</span>' +
								'<span class="reg-label-sub">— 구매자에게 공개되는 실제 프롬프트</span>' +
							'</label>' +
							'<textarea class="ac-input reg-textarea reg-textarea-lg" id="reg-content" placeholder="실제 프롬프트 내용을 입력하세요&#10;&#10;예시) Act as a senior software engineer..."></textarea>' +
							'<div class="reg-char-count" id="count-content">0 자</div>' +
						'</div>' +

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

		var btn = el.querySelector('#btn-submit')
		btn.disabled    = true
		btn.textContent = '등록 중...'

		try
		{
			var row = {
				user_id:        this.currentUser.id,
				title:          title,
				description:    desc,
				prompt_content: content,
				ai_tool_id:     toolId,
				prompt_type:    type,
				difficulty:     difficulty,
				price:          String(price),
				status:         'pending'
			}

			if (categoryId) row.category_id = categoryId

			var result = await this.ps.create(row)
			if (result.error) throw new Error(result.error.message)

			ToastManager.success('프롬프트가 등록되었습니다! 관리자 검수 후 게시됩니다.')
			theApp.mainContainer.open('Source/MainView.lay')
		}
		catch (e)
		{
			ToastManager.error('등록 실패: ' + e.message)
			btn.disabled    = false
			btn.textContent = '등록하기'
		}
	}

	_goBack()
	{
		theApp.mainContainer.open('Source/MainView.lay')
	}
}
