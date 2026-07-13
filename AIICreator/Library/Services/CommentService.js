CommentService = class CommentService
{
	constructor(sb)
	{
		this.sb = sb
	}

	// -----------------------------------------
	// 댓글 목록
	// 공개(후기)/비공개(구매 전 문의) 분류와 인기 후기 상위 3개 고정 정렬을
	// get_prompt_comments RPC가 서버에서 한 번에 처리해 { reviews, questions }로 반환
	// -----------------------------------------

	async list(promptId, sort)
	{
		var result = await this.sb.getClient().rpc('get_prompt_comments', {
			p_prompt_id: promptId,
			p_sort:      sort || 'oldest'
		})

		if (result.error) return result
		return { data: result.data || { reviews: [], questions: [] }, error: null }
	}

	// -----------------------------------------
	// 등록 / 수정 / 삭제
	// -----------------------------------------

	async create(promptId, userId, content)
	{
		return this.sb.getClient()
			.from('comments')
			.insert({ prompt_id: promptId, user_id: userId, content: content })
			.select('id')
			.single()
	}

	async update(commentId, content)
	{
		return this.sb.getClient()
			.from('comments')
			.update({ content: content, is_edited: true })
			.eq('id', commentId)
	}

	async remove(commentId)
	{
		return this.sb.getClient()
			.from('comments')
			.delete()
			.eq('id', commentId)
	}

	// -----------------------------------------
	// 좋아요 토글
	// -----------------------------------------

	async toggleLike(commentId)
	{
		return this.sb.getClient().rpc('toggle_comment_like', { p_comment_id: commentId })
	}
}
