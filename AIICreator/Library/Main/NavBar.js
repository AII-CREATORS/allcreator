
NavBar = class NavBar
{
	constructor(container, callbacks)
	{
		// callbacks: { onSearch, onLogin, onMyPage, onLogout, onRegister }
		this.el           = container
		this.callbacks    = callbacks || {}
		this.searchTimer  = null
		this.keyword      = ''
	}

	// ─────────────────────────────────────────
	// 렌더
	// ─────────────────────────────────────────

	render(user)
	{
		this._injectStyle()
		this.el.innerHTML = this._html(user)
		this._bindEvents(user)
	}

	_html(user)
	{
		var userArea = user ? this._userHTML(user) : this._guestHTML()

		return '<div class="nb-inner">' +
			'<div class="nb-logo">' +
				'<span class="nb-logo-text">ALL</span>' +
				'<span class="nb-logo-accent">Creator</span>' +
			'</div>' +
			'<div class="nb-search">' +
				'<input class="ac-input nb-search-input" id="nb-search" type="text" placeholder="🔍  프롬프트 검색...">' +
			'</div>' +
			'<div class="nb-actions" id="nb-user-area">' + userArea + '</div>' +
		'</div>'
	}

	_guestHTML()
	{
		return '<button class="ac-btn ac-btn-outline ac-btn-sm" id="nb-btn-login">로그인</button>'
	}

	_userHTML(user)
	{
		var initial = (user.email || 'U')[0].toUpperCase()
		return '<button class="ac-btn ac-btn-secondary ac-btn-sm" id="nb-btn-register">+ 프롬프트 등록</button>' +
			'<div class="ac-avatar nb-avatar" id="nb-avatar">' + initial + '</div>' +
			'<div class="nb-dropdown" id="nb-dropdown" style="display:none">' +
				'<div class="nb-dropdown-email">' + user.email + '</div>' +
				'<button class="nb-dropdown-item" id="nb-btn-mypage">마이페이지</button>' +
				'<button class="nb-dropdown-item" id="nb-btn-logout">로그아웃</button>' +
			'</div>'
	}

	_injectStyle()
	{
		if (document.getElementById('navbar-style')) return
		var style = document.createElement('style')
		style.id  = 'navbar-style'
		style.textContent =
			'.nb-inner{display:flex;align-items:center;gap:16px;padding:0 24px;height:60px;background:var(--color-primary-dark);border-bottom:1px solid var(--color-border);}' +
			'.nb-logo{font-family:var(--font-title);font-size:1.375rem;font-weight:700;white-space:nowrap;flex-shrink:0;}' +
			'.nb-logo-text{color:var(--color-text);}' +
			'.nb-logo-accent{color:var(--color-accent);margin-left:3px;}' +
			'.nb-search{flex:1;max-width:480px;}' +
			'.nb-search-input{padding:8px 14px;font-size:0.875rem;}' +
			'.nb-actions{display:flex;align-items:center;gap:10px;margin-left:auto;position:relative;}' +
			'.nb-avatar{cursor:pointer;width:34px;height:34px;font-size:0.8125rem;}' +
			'.nb-dropdown{position:absolute;top:calc(100% + 8px);right:0;background:var(--color-surface);border:1px solid var(--color-border-light);border-radius:var(--radius-md);padding:8px;min-width:200px;box-shadow:var(--shadow-md);z-index:200;}' +
			'.nb-dropdown-email{font-size:0.75rem;color:var(--color-text-muted);padding:6px 10px 10px;border-bottom:1px solid var(--color-border);margin-bottom:6px;}' +
			'.nb-dropdown-item{width:100%;padding:8px 10px;background:none;border:none;color:var(--color-text);font-size:0.875rem;font-family:var(--font-body);text-align:left;border-radius:var(--radius-sm);cursor:pointer;}' +
			'.nb-dropdown-item:hover{background:var(--color-surface-2);}'
		document.head.appendChild(style)
	}

	// ─────────────────────────────────────────
	// 이벤트
	// ─────────────────────────────────────────

	_bindEvents(user)
	{
		var self = this
		var el   = this.el

		// 검색 — 300ms 디바운스
		var searchInput = el.querySelector('#nb-search')
		if (searchInput)
		{
			searchInput.addEventListener('input', function()
			{
				self.keyword = this.value.trim()
				clearTimeout(self.searchTimer)
				self.searchTimer = setTimeout(function()
				{
					if (self.callbacks.onSearch) self.callbacks.onSearch(self.keyword)
				}, 300)
			})
		}

		if (!user)
		{
			var btnLogin = el.querySelector('#nb-btn-login')
			if (btnLogin) btnLogin.addEventListener('click', function()
			{
				if (self.callbacks.onLogin) self.callbacks.onLogin()
			})
			return
		}

		// 아바타 드롭다운 토글
		var avatar = el.querySelector('#nb-avatar')
		if (avatar)
		{
			avatar.addEventListener('click', function()
			{
				var dd = el.querySelector('#nb-dropdown')
				if (dd) dd.style.display = dd.style.display === 'none' ? '' : 'none'
			})
		}

		// 외부 클릭 시 드롭다운 닫기
		document.addEventListener('click', function(e)
		{
			var dd  = el.querySelector('#nb-dropdown')
			var av  = el.querySelector('#nb-avatar')
			if (dd && av && !av.contains(e.target) && !dd.contains(e.target))
				dd.style.display = 'none'
		})

		var btnRegister = el.querySelector('#nb-btn-register')
		if (btnRegister) btnRegister.addEventListener('click', function()
		{
			if (self.callbacks.onRegister) self.callbacks.onRegister()
		})

		var btnMyPage = el.querySelector('#nb-btn-mypage')
		if (btnMyPage) btnMyPage.addEventListener('click', function()
		{
			if (self.callbacks.onMyPage) self.callbacks.onMyPage()
		})

		var btnLogout = el.querySelector('#nb-btn-logout')
		if (btnLogout) btnLogout.addEventListener('click', async function()
		{
			if (self.callbacks.onLogout) await self.callbacks.onLogout()
		})
	}

	// ─────────────────────────────────────────
	// 상태
	// ─────────────────────────────────────────

	getKeyword() { return this.keyword }
}
