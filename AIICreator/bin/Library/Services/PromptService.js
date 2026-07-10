
PromptService = class PromptService
{
	constructor(sb)
	{
		this.sb = sb
	}

	// -----------------------------------------
	// 프롬프트 목록 조회 (MainView용)
	// -----------------------------------------

	async list(filters)
	{
		var { toolId, price, type, sort, keyword, limit } = filters || {}

		var query = this.sb.getClient()
			.from('prompts')
			.select('id, title, description, price, prompt_type, like_count, view_count, result_image, users!user_id(display_name), ai_tools(name)')
			.eq('status', 'published')

		if (toolId)           query = query.eq('ai_tool_id', toolId)
		if (price === 'free') query = query.eq('price', '0')
		else if (price === 'paid') query = query.neq('price', '0')
		if (type && type !== 'all') query = query.eq('prompt_type', type)
		if (keyword) query = query.or('title.ilike.%' + keyword + '%,description.ilike.%' + keyword + '%')

		if (sort === 'popular')         query = query.order('like_count',  { ascending: false })
		else if (sort === 'views')      query = query.order('view_count',  { ascending: false })
		else if (sort === 'price_asc')  query = query.order('price',      { ascending: true  })
		else if (sort === 'price_desc') query = query.order('price',      { ascending: false })
		else                            query = query.order('created_at', { ascending: false })

		return query.limit(limit || 30)
	}

	// -----------------------------------------
	// AI 도구 목록
	// -----------------------------------------

	async getAITools()
	{
		return this.sb.getClient().from('ai_tools').select('id, name').order('name')
	}

	// -----------------------------------------
	// 프롬프트 상세
	// 구매/소유/관리자 여부를 서버(RPC)에서 검증한 뒤에만 prompt_content를 포함해 반환
	// (RLS만으로는 비구매자도 prompt_content를 직접 조회할 수 있어 결제 우회가 가능했음)
	// -----------------------------------------

	async getDetail(promptId)
	{
		var result = await this.sb.getClient().rpc('get_prompt_detail', { p_prompt_id: promptId })
		if (result.error) return result
		if (!result.data) return { data: null, error: { message: '프롬프트를 찾을 수 없습니다' } }
		return { data: result.data, error: null }
	}

	// -----------------------------------------
	// 사용자 상태 (좋아요, 저장, 구매 여부)
	// -----------------------------------------

	async getUserStatus(promptId, userId)
	{
		var sb = this.sb.getClient()

		var results = await Promise.all([
			sb.from('prompt_likes').select('id').eq('prompt_id', promptId).eq('user_id', userId).maybeSingle(),
			sb.from('prompt_saves').select('id').eq('prompt_id', promptId).eq('user_id', userId).maybeSingle(),
			sb.from('orders').select('id').eq('prompt_id', promptId).eq('buyer_id', userId).eq('status', 'completed').maybeSingle()
		])

		return {
			isLiked:     !!(results[0].data),
			isSaved:     !!(results[1].data),
			isPurchased: !!(results[2].data)
		}
	}

	// -----------------------------------------
	// 좋아요 / 저장 토글
	// -----------------------------------------

	async toggleLike(promptId)
	{
		return this.sb.getClient().rpc('toggle_like', { p_prompt_id: promptId })
	}

	async toggleSave(promptId)
	{
		return this.sb.getClient().rpc('toggle_save', { p_prompt_id: promptId })
	}

	// -----------------------------------------
	// 조회수 증가
	// -----------------------------------------

	incrementView(promptId)
	{
		this.sb.getClient().rpc('increment_view', { p_prompt_id: promptId }).then(function() {})
	}

	// -----------------------------------------
	// 프롬프트 등록
	// -----------------------------------------

	async create(data)
	{
		return this.sb.getClient().from('prompts').insert(data).select('id').single()
	}

	// -----------------------------------------
	// 프롬프트 수정 (status → pending, rejection_reason 초기화)
	// -----------------------------------------

	async update(promptId, data)
	{
		data.status           = 'pending'
		data.rejection_reason = null
		return this.sb.getClient()
			.from('prompts')
			.update(data)
			.eq('id', promptId)
			.select('id')
			.single()
	}

	async updateResultImage(promptId, imageUrl)
	{
		return this.sb.getClient()
			.from('prompts')
			.update({ result_image: imageUrl })
			.eq('id', promptId)
	}

	async uploadResultImage(promptId, file)
	{
		var ext  = file.name.split('.').pop().toLowerCase() || 'jpg'
		var path = promptId + '/' + Date.now() + '.' + ext
		var upload = await this.sb.getClient().storage.from('prompt-results').upload(path, file, { upsert: true })
		if (upload.error) return { error: upload.error, url: null }
		var url = this.sb.getClient().storage.from('prompt-results').getPublicUrl(path).data.publicUrl
		return { error: null, url }
	}

	// -----------------------------------------
	// 관리자: 프롬프트 목록
	// -----------------------------------------

	async adminList(status, page, pageSize, keyword)
	{
		var from = page * pageSize
		var to   = from + pageSize - 1

		var query = this.sb.getClient()
			.from('prompts')
			.select(
				'id, title, description, price, prompt_type, status, ' +
				'rejection_reason, created_at, result_image, ' +
				'users!user_id(id, display_name, email), ai_tools(name)',
				{ count: 'exact' }
			)
			.eq('status', status)

		if (keyword) query = query.ilike('title', '%' + keyword + '%')

		return query
			.order('created_at', { ascending: false })
			.range(from, to)
	}

	// -----------------------------------------
	// 관리자: 승인 / 반려
	// -----------------------------------------

	async approve(promptId, reviewerId)
	{
		return this.sb.getClient()
			.from('prompts')
			.update({
				status:           'published',
				rejection_reason: null,
				reviewed_at:      new Date().toISOString(),
				reviewed_by:      reviewerId
			})
			.eq('id', promptId)
	}

	async reject(promptId, reviewerId, reason)
	{
		return this.sb.getClient()
			.from('prompts')
			.update({
				status:           'rejected',
				rejection_reason: reason,
				reviewed_at:      new Date().toISOString(),
				reviewed_by:      reviewerId
			})
			.eq('id', promptId)
	}

	// -----------------------------------------
	// 알림 전송
	// -----------------------------------------

	async sendNotification(promptId, type, reason)
	{
		var ref = await this.sb.getClient()
			.from('prompts')
			.select('user_id, title')
			.eq('id', promptId)
			.single()

		var prompt = ref.data
		if (!prompt) return

		// 알림 설정 확인 (like/purchase 타입만 적용; 승인/반려는 항상 전송)
		if (type === 'prompt_liked' || type === 'prompt_purchased')
		{
			var { data: userProfile } = await this.sb.getClient()
				.from('users')
				.select('notification_settings')
				.eq('id', prompt.user_id)
				.single()

			var ns = (userProfile && userProfile.notification_settings) || {}
			if (type === 'prompt_liked'     && ns.like     === false) return
			if (type === 'prompt_purchased' && ns.purchase === false) return
		}

		var msgMap = {
			prompt_approved:  { title: '프롬프트가 승인되었습니다',  body: '등록하신 "' + prompt.title + '" 프롬프트가 검수를 통과하여 게시되었습니다.' },
			prompt_rejected:  { title: '프롬프트가 반려되었습니다',  body: '등록하신 "' + prompt.title + '" 프롬프트가 반려되었습니다.\n사유: ' + (reason || '') },
			prompt_liked:     { title: '좋아요를 받았습니다',        body: '"' + prompt.title + '" 프롬프트에 좋아요가 달렸습니다.' },
			prompt_purchased: { title: '프롬프트가 판매되었습니다',  body: '"' + prompt.title + '" 프롬프트가 구매되었습니다.' }
		}
		var msg = msgMap[type] || { title: type, body: '' }

		return this.sb.getClient()
			.from('notifications')
			.insert({
				user_id:   prompt.user_id,
				type:      type,
				title:     msg.title,
				body:      msg.body,
				prompt_id: promptId
			})
	}

	// -----------------------------------------
	// 카테고리 목록
	// -----------------------------------------

	async getCategories()
	{
		return this.sb.getClient().from('categories').select('id, name').order('name')
	}
}
