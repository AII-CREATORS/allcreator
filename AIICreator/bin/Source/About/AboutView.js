
AboutView = class AboutView extends AView
{
	onInitDone()
	{
		super.onInitDone()
		this._renderShell()
		this._bindEvents()
	}

	_renderShell()
	{
		// MainView와 동일하게 뷰 전체를 스크롤
		this.getElement().style.overflowY = 'auto'
		this.getElement().style.overflowX = 'hidden'

		this.getElement().innerHTML =
			'<header id="about-navbar"></header>' +
			'<div class="main-content">' +

				'<section class="hero" style="margin-top:20px;margin-bottom:110px;">' +
					'<div class="hero-bg"></div>' +
					'<video class="hero-video" src="Template/Logo/hero-bg.mp4" autoplay muted loop playsinline></video>' +
					'<div class="hero-scrim"></div>' +
					'<div class="hero-content" style="max-width:640px;">' +
						'<div class="hero-eyebrow">About Us</div>' +
						'<h1 class="about-title">AI를 사용하는 사람들의 커뮤니티가 아니라,<br>' +
							'<span>AI 시대를 만드는 크리에이터들의 커뮤니티.</span></h1>' +
						'<p class="about-sub">ChatGPT, Claude, Gemini, Midjourney 등 흩어진 AI 도구의 좋은 프롬프트를 한곳에 모아 누구나 쉽게 찾고, 쓰고, 나눌 수 있게 합니다.</p>' +
					'</div>' +
				'</section>' +

				'<section class="about-section about-story">' +
					'<div class="about-sec-title">AI 시대의 크리에이터를 위한 커뮤니티</div>' +
					'<p>AI는 이제 누구나 사용하는 도구가 되었지만, 좋은 프롬프트와 실전 노하우는 여전히 여러 곳에 흩어져 있습니다.<br>' +
						'올크리에이터는 이러한 지식과 경험을 한곳에 모아 누구나 배우고, 공유하며, 함께 성장할 수 있는 AI 커뮤니티를 만들고 있습니다.<br>' +
						'단순히 프롬프트를 저장하는 공간이 아니라, 사람들의 경험이 모여 더 큰 가치를 만드는 플랫폼입니다.</p>' +
					'<p>우리는 AI 활용 능력이 새로운 경쟁력이 되는 시대를 믿습니다.<br>' +
						'사용자는 검증된 프롬프트를 발견하고, 자신만의 노하우를 공유하며, 다른 크리에이터와 소통하면서 AI 활용 역량을 지속적으로 발전시킬 수 있습니다.<br>' +
						'개인의 경험은 커뮤니티를 통해 더 나은 지식으로 발전하고, 모두의 자산이 됩니다.</p>' +
					'<p>올크리에이터의 목표는 AI를 사용하는 사람들을 연결하는 것을 넘어, AI 시대를 함께 만들어가는 크리에이터들의 생태계를 구축하는 것입니다.<br>' +
						'더 많이 배우고, 더 많이 나누며, 함께 성장하는 공간.<br>' +
						'올크리에이터는 AI 시대의 크리에이터가 가장 먼저 찾는 커뮤니티가 되고자 합니다.</p>' +
				'</section>' +

				'<section class="about-section">' +
					'<div class="about-sec-eyebrow">Mission</div>' +
					'<div class="about-sec-title">우리가 믿는 것</div>' +
					'<p class="about-sec-desc">좋은 프롬프트 하나가 몇 시간의 시행착오를 줄여줍니다. AllCreator는 그 지식을 모두가 나눠 쓸 수 있는 마켓플레이스를 만듭니다.</p>' +
					'<div class="mission-grid">' +
						'<div class="mission-card">' +
							'<div class="mission-icon">🎯</div>' +
							'<h3>누구나 접근 가능하게</h3>' +
							'<p>전문 지식 없이도 검증된 프롬프트로 원하는 결과를 바로 얻을 수 있도록 합니다.</p>' +
						'</div>' +
						'<div class="mission-card">' +
							'<div class="mission-icon">🤝</div>' +
							'<h3>크리에이터와 함께</h3>' +
							'<p>좋은 프롬프트를 만드는 사람이 정당한 보상을 받는 생태계를 만듭니다.</p>' +
						'</div>' +
						'<div class="mission-card">' +
							'<div class="mission-icon">⚡</div>' +
							'<h3>모든 AI 도구를 한곳에</h3>' +
							'<p>ChatGPT부터 Sora까지, 도구별로 흩어진 노하우를 하나의 플랫폼에 모읍니다.</p>' +
						'</div>' +
					'</div>' +
				'</section>' +

				'<section class="about-section">' +
					'<div class="about-sec-eyebrow">How It Works</div>' +
					'<div class="about-sec-title">서비스는 이렇게 동작합니다</div>' +
					'<div class="flow-row">' +
						'<div class="flow-step"><div class="flow-bubble">🔍</div><h4>탐색</h4><p>도구·목적별로 프롬프트를 검색합니다</p></div>' +
						'<div class="flow-arrow">→</div>' +
						'<div class="flow-step"><div class="flow-bubble">📋</div><h4>복사</h4><p>마음에 드는 프롬프트를 바로 복사합니다</p></div>' +
						'<div class="flow-arrow">→</div>' +
						'<div class="flow-step"><div class="flow-bubble">✨</div><h4>생성</h4><p>원하는 AI 도구에 붙여넣고 결과를 받습니다</p></div>' +
						'<div class="flow-arrow">→</div>' +
						'<div class="flow-step"><div class="flow-bubble">💬</div><h4>공유</h4><p>직접 만든 프롬프트도 등록해 나눕니다</p></div>' +
					'</div>' +
				'</section>' +

				'<section style="margin-bottom:20px;">' +
					'<div class="about-cta-box">' +
						'<h2>AllCreator와 함께해요</h2>' +
						'<p>지금 프롬프트를 둘러보거나, 직접 만든 프롬프트를 등록해보세요.</p>' +
						'<div class="about-cta-btns">' +
							'<button class="about-cta-primary" id="about-btn-browse">프롬프트 둘러보기</button>' +
						'</div>' +
					'</div>' +
				'</section>' +

			'</div>'

		NavBar.mountStandard(this.getElement().querySelector('#about-navbar'))
	}

	_bindEvents()
	{
		var browseBtn = this.getElement().querySelector('#about-btn-browse')
		if (browseBtn) browseBtn.addEventListener('click', function()
		{
			theApp.mainContainer.open('Source/MainView.lay')
		})
	}
}
