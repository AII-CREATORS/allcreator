UserService = class UserService
{
	constructor(sb)
	{
		this.sb = sb
	}

	// -----------------------------------------
	// 프로필 조회
	// -----------------------------------------

	async getProfile(userId)
	{
		return this.sb.getClient()
			.from('users')
			.select('id, display_name, username, email, role, gender, birth_date, created_at, bio, avatar_url, notification_settings')
			.eq('id', userId)
			.single()
	}

	// -----------------------------------------
	// 프로필 수정
	// -----------------------------------------

	async updateProfile(userId, data)
	{
		return this.sb.getClient()
			.from('users')
			.update(data)
			.eq('id', userId)
	}

	// -----------------------------------------
	// 관리자 권한 확인
	// -----------------------------------------

	async getAdminRole(userId)
	{
		return this.sb.getClient()
			.from('users')
			.select('role, display_name')
			.eq('id', userId)
			.single()
	}

	// -----------------------------------------
	// 관리자 목록
	// -----------------------------------------

	async getAdmins()
	{
		return this.sb.getClient()
			.from('users')
			.select('id, display_name, email, role, created_at')
			.in('role', ['main_admin', 'sub_admin'])
			.order('role')
	}

	// -----------------------------------------
	// 이메일로 유저 검색
	// -----------------------------------------

	async findByEmail(email)
	{
		return this.sb.getClient()
			.from('users')
			.select('id, display_name, email, role')
			.eq('email', email)
			.single()
	}

	// -----------------------------------------
	// 서브 관리자 지정 / 해제
	// -----------------------------------------

	async addSubAdmin(userId)
	{
		return this.sb.getClient()
			.from('users')
			.update({ role: 'sub_admin' })
			.eq('id', userId)
	}

	async removeSubAdmin(userId)
	{
		return this.sb.getClient()
			.from('users')
			.update({ role: 'user' })
			.eq('id', userId)
	}

	// -----------------------------------------
	// 내 프롬프트 (마이페이지)
	// -----------------------------------------

	async getUserPrompts(userId)
	{
		return this.sb.getClient()
			.from('prompts')
			.select('id, title, description, price, prompt_type, status, rejection_reason, like_count, view_count, created_at, result_image, ai_tools(name)')
			.eq('user_id', userId)
			.neq('status', 'hidden')
			.order('created_at', { ascending: false })
	}

	// -----------------------------------------
	// 내 구매 내역 (마이페이지)
	// -----------------------------------------

	async getUserOrders(userId)
	{
		return this.sb.getClient()
			.from('orders')
			.select('id, amount, status, created_at, prompts(id, title, description, price, prompt_type, like_count, result_image, ai_tools(name))')
			.eq('buyer_id', userId)
			.eq('status', 'completed')
			.order('created_at', { ascending: false })
	}

	// -----------------------------------------
	// 저장된 프롬프트 (북마크)
	// -----------------------------------------

	async getSavedPrompts(userId)
	{
		return this.sb.getClient()
			.from('prompt_saves')
			.select('id, created_at, prompts(id, title, description, price, prompt_type, like_count, result_image, ai_tools(name))')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
	}

	// -----------------------------------------
	// 알림 설정 업데이트
	// -----------------------------------------

	async updateNotificationSettings(userId, settings)
	{
		return this.sb.getClient()
			.from('users')
			.update({ notification_settings: settings })
			.eq('id', userId)
	}

	// -----------------------------------------
	// 판매자 수익 내역 (settlements)
	// -----------------------------------------

	async getMyRevenue(userId)
	{
		return this.sb.getClient()
			.from('settlements')
			.select('id, gross_amount, net_amount, commission_rate, status, created_at, orders(paid_at, prompts(id, title))')
			.eq('creator_id', userId)
			.order('created_at', { ascending: false })
	}
}
