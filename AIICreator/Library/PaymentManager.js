
PaymentManager = class PaymentManager
{
	constructor()
	{
		this.CLIENT_KEY = 'test_ck_DpexMgkW36G76oNWEL2pVGbR5ozO'
		this.toss       = null
		this.sb         = null
	}

	static getInstance()
	{
		if (!PaymentManager._instance)
			PaymentManager._instance = new PaymentManager()
		return PaymentManager._instance
	}

	init(supabaseManager)
	{
		this.sb   = supabaseManager
		this.toss = TossPayments(this.CLIENT_KEY)
	}

	// ─────────────────────────────────────────
	// orderId 생성 (Toss 규격: 영문+숫자+특수문자, 최대 64자)
	// ─────────────────────────────────────────

	_generateOrderId()
	{
		return 'order-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
	}

	// ─────────────────────────────────────────
	// 결제 요청 (Toss 결제창 열기 → 리다이렉트)
	// ─────────────────────────────────────────

	async requestPayment(prompt, user)
	{
		if (!this.toss) throw new Error('PaymentManager가 초기화되지 않았습니다')

		var orderId   = this._generateOrderId()
		var amount    = Number(prompt.price)
		var orderName = prompt.title

		// 결제 완료 후 돌아올 URL (현재 페이지 기준)
		var base       = window.location.href.split('?')[0].split('#')[0]
		var successUrl = base + '?payment=success&promptId=' + prompt.id + '&orderId=' + orderId
		var failUrl    = base + '?payment=fail&promptId=' + prompt.id

		// Toss 결제창 호출 (이 시점에서 브라우저가 Toss 페이지로 이동)
		await this.toss.requestPayment('카드', {
			amount:       amount,
			orderId:      orderId,
			orderName:    orderName,
			customerName: user.email,
			successUrl:   successUrl,
			failUrl:      failUrl
		})
	}

	// ─────────────────────────────────────────
	// 결제 승인 (Edge Function 호출)
	// paymentKey, orderId, amount → Toss 서버 검증 → orders INSERT
	// ─────────────────────────────────────────

	async confirmPayment(paymentKey, orderId, amount, promptId, buyerId)
	{
		var result = await this.sb.getClient().functions.invoke('verify-payment', {
			body: {
				paymentKey: paymentKey,
				orderId:    orderId,
				amount:     Number(amount),
				promptId:   promptId,
				buyerId:    buyerId
			}
		})
		return result
	}

	// ─────────────────────────────────────────
	// URL 파라미터에서 결제 결과 파싱
	// successUrl 리다이렉트 후 앱 재진입 시 호출
	// ─────────────────────────────────────────

	parsePaymentResult()
	{
		var params   = new URLSearchParams(window.location.search)
		var payment  = params.get('payment')

		if (!payment) return null

		if (payment === 'success')
		{
			return {
				type:       'success',
				paymentKey: params.get('paymentKey'),
				orderId:    params.get('orderId'),
				amount:     params.get('amount'),
				promptId:   params.get('promptId')
			}
		}

		if (payment === 'fail')
		{
			return {
				type:     'fail',
				code:     params.get('code'),
				message:  params.get('message'),
				promptId: params.get('promptId')
			}
		}

		return null
	}

	// URL 파라미터 제거 (결제 처리 완료 후 URL 정리)
	clearPaymentParams()
	{
		var url = window.location.href.split('?')[0].split('#')[0]
		window.history.replaceState({}, '', url)
	}
}

PaymentManager._instance = null
