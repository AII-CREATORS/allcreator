
NavBar = class NavBar
{
	constructor(container, callbacks)
	{
		this.el          = container
		this.callbacks   = callbacks || {}
		this.searchTimer      = null
		this.keyword          = ''
		this._docClickHandler = null
	}

	// auth 검증을 내부에서 처리 — 호출자는 인자 불필요
	async render()
	{
		if (this._docClickHandler)
		{
			document.removeEventListener('click', this._docClickHandler)
			this._docClickHandler = null
		}

		var sb      = SupabaseManager.getInstance()
		var user    = await sb.getUser()
		var profile = null

		if (user)
		{
			var { data } = await sb.getClient()
				.from('users')
				.select('role')
				.eq('id', user.id)
				.single()
			profile = data
		}

		this.el.innerHTML = this._html(user, profile)
		this._bindEvents(user, profile)
	}

	_html(user, profile)
	{
		var userArea = user ? this._userHTML(user, profile) : this._guestHTML()

		return '<div class="nb-inner">'
			+ '<div class="nb-logo">'
				+ '<span class="nb-logo-text">ALL</span>'
				+ '<span class="nb-logo-accent">Creator</span>'
			+ '</div>'
			+ '<div class="nb-search">'
				+ '<input class="ac-input nb-search-input" id="nb-search" type="text" placeholder="  프롬프트 검색...">'
			+ '</div>'
			+ '<div class="nb-actions" id="nb-user-area">' + userArea + '</div>'
		+ '</div>'
	}

	_guestHTML()
	{
		return '<button class="ac-btn ac-btn-outline ac-btn-sm" id="nb-btn-login">로그인</button>'
	}

	_userHTML(user, profile)
	{
		var initial = (user.email || 'U')[0].toUpperCase()
		var role    = profile && profile.role
		var isAdmin = role === 'main_admin' || role === 'sub_admin'

		var adminBtn = isAdmin
			? '<button class="ac-btn ac-btn-outline ac-btn-sm nb-btn-admin" id="nb-btn-admin"> 관리자</button>'
			: ''

		return adminBtn
			+ '<button class="ac-btn ac-btn-secondary ac-btn-sm" id="nb-btn-register">+ 프롬프트 등록</button>'
			+ '<div class="ac-avatar nb-avatar" id="nb-avatar">' + initial + '</div>'
			+ '<div class="nb-dropdown" id="nb-dropdown" style="display:none">'
				+ '<div class="nb-dropdown-email">' + user.email + '</div>'
				+ '<button class="nb-dropdown-item" id="nb-btn-mypage">마이페이지</button>'
				+ '<button class="nb-dropdown-item" id="nb-btn-logout">로그아웃</button>'
			+ '</div>'
	}


	_bindEvents(user, profile)
	{
		var self = this
		var el   = this.el

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

		var btnAdmin = el.querySelector('#nb-btn-admin')
		if (btnAdmin) btnAdmin.addEventListener('click', function()
		{
			if (self.callbacks.onAdmin) self.callbacks.onAdmin()
		})

		var avatar = el.querySelector('#nb-avatar')
		if (avatar)
		{
			avatar.addEventListener('click', function()
			{
				var dd = el.querySelector('#nb-dropdown')
				if (dd) dd.style.display = dd.style.display === 'none' ? '' : 'none'
			})
		}

		this._docClickHandler = function(e)
		{
			var dd = el.querySelector('#nb-dropdown')
			var av = el.querySelector('#nb-avatar')
			if (dd && av && !av.contains(e.target) && !dd.contains(e.target))
				dd.style.display = 'none'
		}
		document.addEventListener('click', this._docClickHandler)

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

	getKeyword() { return this.keyword }
}
