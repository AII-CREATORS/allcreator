Footer = class Footer
{
	static mountStandard(container)
	{
		if (!container) return

		container.innerHTML = Footer._html()
		Footer._bindEvents(container)
	}

	static _html()
	{
		return '<div class="ft-inner">' +
				'<div class="ft-links">' +
					'<button class="ft-link" id="ft-btn-terms">이용약관</button>' +
					'<span class="ft-sep">|</span>' +
					'<button class="ft-link" id="ft-btn-privacy">개인정보처리방침</button>' +
				'</div>' +
				'<div class="ft-info">' +
					'상호명: [상호명] · 대표: [대표자명] · 사업자등록번호: [사업자등록번호] · 통신판매업 신고번호: [통신판매업 신고번호]<br>' +
					'주소: [주소] · 이메일: [이메일 또는 연락처]' +
				'</div>' +
				'<div class="ft-copyright">© 2026 ALL Creator. All rights reserved.</div>' +
			'</div>'
	}

	static _bindEvents(container)
	{
		var btnTerms = container.querySelector('#ft-btn-terms')
		if (btnTerms) btnTerms.addEventListener('click', function()
		{
			theApp.mainContainer.open('Source/Legal/LegalView.lay')
		})

		var btnPrivacy = container.querySelector('#ft-btn-privacy')
		if (btnPrivacy) btnPrivacy.addEventListener('click', function()
		{
			theApp.mainContainer.open('Source/Legal/LegalView.lay')
		})
	}
}
