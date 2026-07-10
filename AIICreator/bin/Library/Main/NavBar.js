NavBar = class NavBar
{
	constructor(container, callbacks)
	{
		this.el               = container
		this.callbacks        = callbacks || {}
		this.searchTimer      = null
		this.keyword          = ''
		this._docClickHandler = null
		this._notifPanel      = null
	}

	async render()
	{
		if (this._docClickHandler)
		{
			document.removeEventListener('click', this._docClickHandler)
			this._docClickHandler = null
		}

		// 기존 패널이 열려있으면 닫기
		if (this._notifPanel)
		{
			this._notifPanel._close()
			this._notifPanel = null
		}

		var sb      = SupabaseManager.getInstance()
		var user    = await sb.getUser()
		var profile = null
		var unread  = 0

		if (user)
		{
			var us     = new UserService(sb)
			var result = await us.getAdminRole(user.id)
			profile    = result.data

			this._notifPanel = new NotificationPanel(sb)
			unread = await this._notifPanel.getUnreadCount()
		}

		this.el.innerHTML = this._html(user, profile, unread)
		this._bindEvents(user, profile)
	}

	_html(user, profile, unread)
	{
		var userArea = user ? this._userHTML(user, profile, unread) : this._guestHTML()

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

	_userHTML(user, profile, unread)
	{
		var initial   = fmt.esc((user.email || 'U')[0].toUpperCase())
		var avatarUrl = profile && profile.avatar_url
		var avatarInner = avatarUrl
			? '<img src="' + fmt.esc(avatarUrl) + '" alt="avatar">'
			: initial
		var role    = profile && profile.role
		var isAdmin = role === 'main_admin' || role === 'sub_admin'

		var adminBtn = isAdmin
			? '<button class="ac-btn ac-btn-outline ac-btn-sm nb-btn-admin" id="nb-btn-admin"> 관리자</button>'
			: ''

		var badgeHTML = unread > 0
			? '<span class="nb-notif-badge" style="position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;' +
				'border-radius:8px;background:#FF6584;color:#fff;font-size:0.625rem;font-weight:700;' +
				'display:flex;align-items:center;justify-content:center;padding:0 3px;pointer-events:none;">' +
				(unread > 99 ? '99+' : String(unread)) +
			  '</span>'
			: ''

		return adminBtn
			+ '<button class="ac-btn ac-btn-secondary ac-btn-sm" id="nb-btn-register">+ 프롬프트 등록</button>'
			+ '<button id="nb-btn-notif" style="position:relative;background:rgba(255,255,255,0.06);border:1px solid #2E2E48;' +
				'border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:1.1rem;' +
				'display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 150ms ease;">' +
				'🔔' +
				badgeHTML +
			  '</button>'
			+ '<div class="ac-avatar nb-avatar" id="nb-avatar">' + avatarInner
				+ '<div class="nb-dropdown" id="nb-dropdown" style="display:none">'
					+ '<div class="nb-dropdown-email">' + fmt.esc(user.email) + '</div>'
					+ '<button class="nb-dropdown-item" id="nb-btn-mypage">마이페이지</button>'
					+ '<button class="nb-dropdown-item" id="nb-btn-logout">로그아웃</button>'
				+ '</div>'
			+ '</div>'
	}

	_bindEvents(user, profile)
	{
		var self = this
		var el   = this.el

		var logo = el.querySelector('.nb-logo')
		if (logo)
		{
			logo.style.cursor = 'pointer'
			logo.addEventListener('click', function()
			{
				if (self.callbacks.onSearch) self.callbacks.onSearch('')
			})
		}

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

		var btnNotif = el.querySelector('#nb-btn-notif')
		if (btnNotif)
		{
			btnNotif.addEventListener('click', async function(e)
			{
				e.stopPropagation()
				if (self._notifPanel) await self._notifPanel.toggle()
			})
			btnNotif.addEventListener('mouseenter', function()
			{
				btnNotif.style.background = 'rgba(108,99,255,0.2)'
			})
			btnNotif.addEventListener('mouseleave', function()
			{
				btnNotif.style.background = 'rgba(255,255,255,0.06)'
			})
		}

		var avatar = el.querySelector('#nb-avatar')
		if (avatar)
		{
			avatar.addEventListener('click', function(e)
			{
				var dd = el.querySelector('#nb-dropdown')
				// dropdown 내부 클릭은 toggle 무시 (자식이므로 이벤트 버블링됨)
				if (dd && dd.contains(e.target)) return
				if (dd) dd.style.display = dd.style.display === 'none' ? '' : 'none'
			})
		}

		this._docClickHandler = function(e)
		{
			var dd = el.querySelector('#nb-dropdown')
			var av = el.querySelector('#nb-avatar')
			// dd가 av 안에 있으므로 av.contains만 체크하면 충분
			if (dd && av && !av.contains(e.target))
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
			ErrorHandler._intentionalLogout = true
			if (self.callbacks.onLogout) await self.callbacks.onLogout()
		})
	}

	getKeyword() { return this.keyword }

	// ─────────────────────────────────────────
	// 서브 화면(Admin/MyPage/Detail/Register) 공용 NavBar 초기화
	// MainView는 onSearch/onLogout 동작이 달라 별도로 구성함
	// ─────────────────────────────────────────

	static mountStandard(container)
	{
		var sb  = SupabaseManager.getInstance()
		var nav = new NavBar(container, {
			onSearch:   function() { theApp.mainContainer.open('Source/MainView.lay') },
			onLogin:    function() { theApp.mainContainer.open('Source/Auth/AuthView.lay') },
			onRegister: function() { theApp.mainContainer.open('Source/Prompt/PromptRegisterView.lay') },
			onMyPage:   function() { theApp.mainContainer.open('Source/MyPage/MyPageView.lay') },
			onAdmin:    function() { theApp.mainContainer.open('Source/Admin/AdminView.lay') },
			onLogout:   async function()
			{
				ErrorHandler._intentionalLogout = true
				sessionStorage.removeItem('ac_session_alive')
				await sb.signOut()
				theApp._filterState = null
				theApp.mainContainer.open('Source/MainView.lay')
			}
		})
		nav.render()
		return nav
	}
}
