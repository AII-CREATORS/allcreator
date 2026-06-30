
PromptRegisterView = class PromptRegisterView extends AView
{
	constructor()
	{
		super()
		this.sb          = null
		this.currentUser = null
		this.aiTools     = []
		this.categories  = []
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

		await this._loadMeta()
		this._renderHTML()
		this._bindEvents()
	}

	async _loadMeta()
	{
		var toolResult = await this.sb.getClient()
			.from('ai_tools')
			.select('id, name')
			.order('name')
		this.aiTools = toolResult.data || []

		var catResult = await this.sb.getClient()
			.from('categories')
			.select('id, name')
			.order('name')
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

	_injectStyle()
	{
		if (document.getElementById('reg-view-style')) return

		var style = document.createElement('style')
		style.id  = 'reg-view-style'
		style.textContent =
			'.reg-wrap{display:flex;flex-direction:column;height:100%;background:var(--color-primary);}' +

			// 네비
			'.reg-nav{display:flex;align-items:center;gap:16px;padding:0 24px;height:56px;background:var(--color-primary-dark);border-bottom:1px solid var(--color-border);flex-shrink:0;}' +
			'.reg-back{background:none;border:none;color:var(--color-text-muted);font-size:0.9375rem;font-family:var(--font-body);cursor:pointer;padding:6px 10px;border-radius:var(--radius-sm);transition:color var(--transition),background var(--transition);flex-shrink:0;}' +
			'.reg-back:hover{color:var(--color-text);background:var(--color-surface);}' +
			'.reg-nav-title{font-family:var(--font-title);font-size:1.0625rem;font-weight:700;color:var(--color-text);flex:1;}' +

			// 콘텐츠
			'.reg-content{flex:1;overflow-y:auto;padding:32px;}' +
			'.reg-form{max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:20px;}' +

			// 가로 배치
			'.reg-row{display:flex;gap:16px;}' +

			// textarea
			'.reg-textarea{resize:vertical;min-height:80px;line-height:1.6;}' +
			'.reg-textarea-lg{min-height:180px;font-family:var(--font-mono);font-size:0.875rem;}' +

			// 글자 수
			'.reg-char-count{text-align:right;font-size:0.75rem;color:var(--color-text-dim);margin-top:4px;}' +

			// 가격
			'.reg-price-wrap{display:flex;align-items:center;gap:12px;}' +
			'.reg-price-input{width:180px;flex-shrink:0;}' +
			'.reg-price-hint{font-size:0.9375rem;font-weight:700;color:var(--color-success);}' +
			'.reg-price-hint.paid{color:var(--color-accent);}' +

			// 레이블
			'.reg-required{color:var(--color-point);font-size:0.75rem;}' +
			'.reg-label-sub{font-size:0.75rem;color:var(--color-text-dim);font-weight:400;margin-left:6px;}' +

			// 스켈레톤
			'.skeleton-title{background:var(--color-surface-2);border-radius:var(--radius-md);animation:skeleton-pulse 1.5s ease infinite;}' +
			'.skeleton-line{height:16px;background:var(--color-surface-2);border-radius:var(--radius-sm);margin-bottom:10px;animation:skeleton-pulse 1.5s ease infinite;}' +
			'.skeleton-line.short{width:60%;}' +
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

		// 뒤로가기
		el.querySelector('#btn-back').addEventListener('click', function() { self._goBack() })

		// 등록
		el.querySelector('#btn-submit').addEventListener('click', function() { self._onSubmit() })

		// 글자 수 카운터
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

		// 가격 힌트
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

		// 유효성 검사
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

			var result = await this.sb.getClient()
				.from('prompts')
				.insert(row)
				.select('id')
				.single()

			if (result.error) throw new Error(result.error.message)

			ToastManager.success('프롬프트가 등록되었습니다! 관리자 검수 후 게시됩니다.')

			// 메인으로 이동 (pending 상태라 상세 진입 불필요)
			theApp.mainContainer.open('Source/MainView.lay')
		}
		catch (e)
		{
			ToastManager.error('등록 실패: ' + e.message)
			btn.disabled    = false
			btn.textContent = '등록하기'
		}
	}

	// ─────────────────────────────────────────
	// 화면 전환
	// ─────────────────────────────────────────

	_goBack()
	{
		theApp.mainContainer.open('Source/MainView.lay')
	}
}
