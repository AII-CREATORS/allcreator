import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const COMMISSION_RATE = 0.2  // 플랫폼 수수료 20%

Deno.serve(async (req) =>
{
  // CORS preflight
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })

  try
  {
    const { paymentKey, orderId, amount, promptId, buyerId } = await req.json()

    // ─────────────────────────────────────────
    // 1. Supabase Service Role 클라이언트 (RLS 우회)
    // ─────────────────────────────────────────

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ─────────────────────────────────────────
    // 2. 프롬프트 조회 + 금액 위변조 검증
    // ─────────────────────────────────────────

    const { data: prompt, error: promptErr } = await supabase
      .from('prompts')
      .select('user_id, title, price, purchase_count')
      .eq('id', promptId)
      .single()

    if (promptErr || !prompt)
    {
      return new Response(
        JSON.stringify({ error: '프롬프트를 찾을 수 없습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 클라이언트가 보낸 amount와 DB price 일치 검증
    if (Number(prompt.price) !== amount)
    {
      return new Response(
        JSON.stringify({ error: '결제 금액이 일치하지 않습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─────────────────────────────────────────
    // 3. 중복 구매 체크 (Toss confirm 이전에 실행)
    //    라이브 환경에서 confirm 이후 중복 감지 → 실제 결제는 완료됐는데 DB만 막힘
    // ─────────────────────────────────────────

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', buyerId)
      .eq('prompt_id', promptId)
      .eq('status', 'completed')
      .maybeSingle()

    if (existingOrder)
    {
      return new Response(
        JSON.stringify({ error: '이미 구매한 프롬프트입니다', alreadyPurchased: true }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─────────────────────────────────────────
    // 4. Toss /confirm API 호출 (서버 측 결제 승인)
    // ─────────────────────────────────────────

    const tossSecretKey = Deno.env.get('TOSS_SECRET_KEY')!
    const encoded       = btoa(tossSecretKey + ':')

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method:  'POST',
      headers: {
        Authorization:  `Basic ${encoded}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentKey, orderId, amount })
    })

    const tossData = await tossRes.json()

    if (!tossRes.ok)
    {
      return new Response(
        JSON.stringify({ error: tossData.message || '결제 승인 실패', code: tossData.code }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ─────────────────────────────────────────
    // 5. orders INSERT
    // ─────────────────────────────────────────

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        buyer_id:       buyerId,
        prompt_id:      promptId,
        order_no:       orderId,
        amount:         String(amount),
        status:         'completed',
        payment_method: tossData.method  || null,
        payment_key:    paymentKey,
        receipt_url:    tossData.receipt?.url || null,
        paid_at:        tossData.approvedAt   || new Date().toISOString()
      })
      .select('id')
      .single()

    if (orderErr) throw new Error('주문 생성 실패: ' + orderErr.message)

    // ─────────────────────────────────────────
    // 6. settlements INSERT (수수료 20%)
    // ─────────────────────────────────────────

    const netAmount = Math.floor(amount * (1 - COMMISSION_RATE))

    await supabase.from('settlements').insert({
      creator_id:      prompt.user_id,
      order_id:        order.id,
      gross_amount:    String(amount),
      commission_rate: String(COMMISSION_RATE),
      net_amount:      String(netAmount),
      status:          'pending'
    })

    // ─────────────────────────────────────────
    // 7. purchase_count 증가
    // ─────────────────────────────────────────

    await supabase
      .from('prompts')
      .update({ purchase_count: (prompt.purchase_count || 0) + 1 })
      .eq('id', promptId)

    // ─────────────────────────────────────────
    // 8. 알림 발송
    //    - 구매자: 항상 발송 (구매 완료 확인)
    //    - 판매자: notification_settings.purchase === true 인 경우만 발송
    // ─────────────────────────────────────────

    // 구매자 알림 (항상)
    await supabase.from('notifications').insert({
      user_id:   buyerId,
      type:      'purchase_completed',
      title:     '구매가 완료되었습니다',
      body:      '"' + prompt.title + '" 프롬프트를 구매했습니다.',
      prompt_id: promptId
    })

    // 판매자 알림 (notification_settings.purchase 체크)
    const sellerId = prompt.user_id
    if (sellerId !== buyerId)  // 자기 자신 구매 예외 처리
    {
      const { data: seller } = await supabase
        .from('users')
        .select('notification_settings')
        .eq('id', sellerId)
        .single()

      const sellerNotiEnabled = seller?.notification_settings?.purchase !== false  // null/undefined → true (기본값)

      if (sellerNotiEnabled)
      {
        await supabase.from('notifications').insert({
          user_id:   sellerId,
          type:      'sale_completed',
          title:     '프롬프트가 판매되었습니다',
          body:      '"' + prompt.title + '" 프롬프트가 판매되었습니다. 순수익: ' + netAmount.toLocaleString() + '원',
          prompt_id: promptId
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true, orderId: order.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  catch (e)
  {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
