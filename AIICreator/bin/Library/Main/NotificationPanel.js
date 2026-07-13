NotificationPanel = class NotificationPanel
{
	constructor(sb)
	{
		this.sb              = sb
		this.panelEl         = null
		this.isOpen          = false
		this.unreadCount     = 0
		this._outsideHandler = null
	}

	// -----------------------------------------
	// 패널 토글
	// -----------------------------------------

	async toggle()
	{
		if (this.isOpen)
			this._close()
		else
			await this._open()
	}

	async _open()
	{
		this._removePanel()
		this.isOpen = true

		var panel = document.createElement('div')
		panel.id  = 'notif-panel'
		panel.style.cssText =
			'position:fixed;top:0;right:0;width:400px;max-width:100vw;height:100vh;' +
			'background:#1A1A2E;border-left:1px solid #2E2E48;z-index:8000;' +
			'display:flex;flex-direction:column;' +
			'box-shadow:-8px 0 32px rgba(0,0,0,0.5);' +
			'animation:notifSlideIn 200ms ease;'

		panel.innerHTML =
			'<div style="display:flex;align-items:center;justify-content:space-between;' +
				'padding:20px 20px 16px;border-bottom:1px solid #2E2E48;flex-shrink:0;">' +
				'<h2 style="font-size:1rem;font-weight:700;color:#F0F0FF;margin:0;">알림</h2>' +
				'<div style="display:flex;align-items:center;gap:8px;">' +
					'<button id="notif-clear-all" style="background:none;border:1px solid #3E3E58;' +
						'border-radius:6px;padding:4px 10px;cursor:pointer;color:#8080A0;font-size:0.75rem;' +
						'transition:all 150ms ease;">모두 지우기</button>' +
					'<button id="notif-close" style="background:rgba(255,255,255,0.08);border:none;' +
						'border-radius:50%;width:30px;height:30px;cursor:pointer;color:#A0A0C0;font-size:0.9rem;">✕</button>' +
				'</div>' +
			'</div>' +
			'<div id="notif-list" style="flex:1;overflow-y:auto;padding:12px 0;">' +
				'<div style="text-align:center;padding:40px 20px;color:#6B6B8A;font-size:0.875rem;">불러오는 중...</div>' +
			'</div>'

		document.body.appendChild(panel)
		this.panelEl = panel

		panel.querySelector('#notif-close').addEventListener('click', function()
		{
			this._close()
		}.bind(this))

		panel.querySelector('#notif-clear-all').addEventListener('click', function()
		{
			this._clearAll()
		}.bind(this))

		this._outsideHandler = function(e)
		{
			if (this.panelEl && !this.panelEl.contains(e.target))
			{
				var bellBtn = document.getElementById('nb-btn-notif')
				if (bellBtn && bellBtn.contains(e.target)) return
				this._close()
			}
		}.bind(this)
		setTimeout(function() {
			document.addEventListener('click', this._outsideHandler)
		}.bind(this), 0)

		await this._loadNotifications()
	}

	_close()
	{
		this.isOpen = false
		this._removePanel()
		if (this._outsideHandler)
		{
			document.removeEventListener('click', this._outsideHandler)
			this._outsideHandler = null
		}
	}

	_removePanel()
	{
		var existing = document.getElementById('notif-panel')
		if (existing) existing.remove()
		this.panelEl = null
	}

	// -----------------------------------------
	// 미읽음 카운트 조회 (NavBar 배지용)
	// -----------------------------------------

	async getUnreadCount()
	{
		var user = await this.sb.getUser()
		if (!user) return 0

		var result = await this.sb.getClient()
			.from('notifications')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', user.id)
			.eq('is_read', false)
		return result.count || 0
	}

	// -----------------------------------------
	// 알림 로드
	// -----------------------------------------

	async _loadNotifications()
	{
		var user   = await this.sb.getUser()
		var listEl = document.getElementById('notif-list')
		if (!listEl) return

		if (!user)
		{
			listEl.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#6B6B8A;font-size:0.875rem;">로그인이 필요합니다</div>'
			return
		}

		var result = await this.sb.getClient()
			.from('notifications')
			.select('id, type, title, body, prompt_id, is_read, created_at')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(50)

		if (result.error)
		{
			listEl.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#FF6584;font-size:0.875rem;">로드 실패</div>'
			return
		}

		var items = result.data || []

		if (items.length === 0)
		{
			listEl.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#6B6B8A;font-size:0.875rem;">알림이 없습니다</div>'
			return
		}

		this.unreadCount = items.filter(function(n) { return !n.is_read }).length

		var self = this
		var html = ''
		items.forEach(function(n)
		{
			var isUnread = !n.is_read
			var timeText = fmt.timeAgo(n.created_at)
			var icon     = self._typeIcon(n.type)

			html +=
				'<div class="notif-item' + (isUnread ? ' notif-unread' : '') + '"' +
					' data-id="' + n.id + '"' +
					' data-type="' + n.type + '"' +
					' data-prompt="' + (n.prompt_id || '') + '"' +
					' data-body="' + encodeURIComponent(n.body || '') + '"' +
					' data-read="' + (n.is_read ? '1' : '0') + '"' +
					' style="position:relative;padding:14px 20px;cursor:pointer;border-bottom:1px solid #1E1E32;transition:background 150ms ease;' +
					(isUnread ? 'background:rgba(108,99,255,0.06);' : '') + '">' +
					'<div style="display:flex;gap:12px;align-items:flex-start;">' +
						'<div style="width:36px;height:36px;border-radius:50%;background:' + self._typeColor(n.type) + ';' +
							'display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">' +
							icon +
						'</div>' +
						'<div style="flex:1;min-width:0;padding-right:20px;">' +
							'<div class="notif-title-text" style="font-size:0.875rem;font-weight:' + (isUnread ? '600' : '400') + ';color:' + (isUnread ? '#F0F0FF' : '#B0B0D0') + ';line-height:1.4;margin-bottom:4px;">' +
								fmt.esc(n.title) +
							'</div>' +
							(n.body ? '<div style="font-size:0.775rem;color:#6B6B8A;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">' + fmt.esc(n.body) + '</div>' : '') +
							'<div style="font-size:0.725rem;color:#4A4A6A;margin-top:6px;">' + timeText + '</div>' +
						'</div>' +
						'<div class="notif-dot" style="' + (isUnread ? '' : 'display:none;') + 'width:7px;height:7px;border-radius:50%;background:#6C63FF;flex-shrink:0;margin-top:5px;"></div>' +
					'</div>' +
					'<button class="notif-item-del" data-del-id="' + n.id + '"' +
						' style="position:absolute;top:8px;right:8px;background:none;border:none;' +
						'color:#4A4A6A;font-size:0.75rem;cursor:pointer;padding:2px 5px;border-radius:4px;' +
						'line-height:1;transition:color 150ms ease;">✕</button>' +
				'</div>'
		})

		listEl.innerHTML = html

		listEl.querySelectorAll('.notif-item').forEach(function(item)
		{
			item.addEventListener('click', function() { self._onItemClick(item) })
			item.addEventListener('mouseenter', function()
			{
				item.style.background = 'rgba(108,99,255,0.1)'
				var delBtn = item.querySelector('.notif-item-del')
				if (delBtn) delBtn.style.color = '#8080A0'
			})
			item.addEventListener('mouseleave', function()
			{
				item.style.background = item.getAttribute('data-read') === '0'
					? 'rgba(108,99,255,0.06)'
					: ''
				var delBtn = item.querySelector('.notif-item-del')
				if (delBtn) delBtn.style.color = '#4A4A6A'
			})
		})

		listEl.querySelectorAll('.notif-item-del').forEach(function(btn)
		{
			btn.addEventListener('click', function(e)
			{
				e.stopPropagation()  // 아이템 클릭(_onItemClick) 버블링 차단
				var id     = btn.getAttribute('data-del-id')
				var item   = btn.closest('.notif-item')
				var isUnrd = item ? item.getAttribute('data-read') === '0' : false
				self._deleteOne(id, isUnrd, item)
			})
		})
	}

	// -----------------------------------------
	// 아이템 클릭 (개별 읽음 처리)
	// -----------------------------------------

	async _onItemClick(item)
	{
		var type     = item.getAttribute('data-type')
		var promptId = item.getAttribute('data-prompt')
		var body     = decodeURIComponent(item.getAttribute('data-body') || '')
		var isUnread = item.getAttribute('data-read') === '0'

		if (isUnread)
		{
			var notifId = item.getAttribute('data-id')
			var { error } = await this._markOneRead(notifId)

			if (error)
			{
				ToastManager.error('읽음 처리에 실패했습니다')
				return
			}

			item.setAttribute('data-read', '1')
			item.classList.remove('notif-unread')
			item.style.background = ''
			var dot = item.querySelector('.notif-dot')
			if (dot) dot.style.display = 'none'
			var titleEl = item.querySelector('.notif-title-text')
			if (titleEl) { titleEl.style.fontWeight = '400'; titleEl.style.color = '#B0B0D0' }

			this.unreadCount = Math.max(0, this.unreadCount - 1)
			this._updateBadge(this.unreadCount)
		}

		if (type === 'prompt_rejected')
		{
			this._showRejectionPopup(body)
			return
		}

		if (promptId)
		{
			this._close()
			theApp.openDetail(promptId)
		}
	}

	// -----------------------------------------
	// 배지 업데이트 (NavBar DOM 직접 조작)
	// -----------------------------------------

	_updateBadge(count)
	{
		var btn = document.getElementById('nb-btn-notif')
		if (!btn) return

		var badge = btn.querySelector('.nb-notif-badge')

		if (count <= 0)
		{
			if (badge) badge.remove()
			return
		}

		if (!badge)
		{
			badge = document.createElement('span')
			badge.className = 'nb-notif-badge'
			badge.style.cssText =
				'position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;' +
				'border-radius:8px;background:#FF6584;color:#fff;font-size:0.625rem;font-weight:700;' +
				'display:flex;align-items:center;justify-content:center;padding:0 3px;pointer-events:none;'
			btn.appendChild(badge)
		}
		badge.textContent = count > 99 ? '99+' : String(count)
	}

	// -----------------------------------------
	// 반려 사유 팝업
	// -----------------------------------------

	_showRejectionPopup(body)
	{
		var overlay = document.createElement('div')
		overlay.style.cssText =
			'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9100;' +
			'display:flex;align-items:center;justify-content:center;padding:20px;'

		overlay.innerHTML =
			'<div style="background:#1E1E32;border:1px solid #2E2E48;border-radius:16px;' +
				'width:100%;max-width:480px;padding:28px;">' +
				'<h3 style="font-size:1rem;font-weight:700;color:#FF6584;margin:0 0 16px;">반려 사유</h3>' +
				'<div style="background:#2A1520;border:1px solid rgba(255,101,132,0.3);border-radius:10px;' +
					'padding:16px;font-size:0.875rem;color:#F0C0C8;line-height:1.7;white-space:pre-wrap;">' +
					(body ? fmt.esc(body) : '사유가 기록되지 않았습니다.') +
				'</div>' +
				'<div style="text-align:right;margin-top:20px;">' +
					'<button id="rej-popup-close" style="padding:8px 24px;border:none;border-radius:8px;' +
						'background:rgba(255,255,255,0.1);color:#E0E0FF;cursor:pointer;font-size:0.875rem;">닫기</button>' +
				'</div>' +
			'</div>'

		document.body.appendChild(overlay)

		overlay.querySelector('#rej-popup-close').addEventListener('click', function()
		{
			overlay.remove()
		})
		overlay.addEventListener('click', function(e)
		{
			if (e.target === overlay) overlay.remove()
		})
	}

	// -----------------------------------------
	// 개별 읽음 처리
	// -----------------------------------------

	async _markOneRead(notifId)
	{
		return this.sb.getClient()
			.from('notifications')
			.update({ is_read: true })
			.eq('id', notifId)
	}

	// -----------------------------------------
	// 알림 전체 삭제
	// -----------------------------------------

	async _clearAll()
	{
		var user = await this.sb.getUser()
		if (!user) return

		var { error } = await this.sb.getClient()
			.from('notifications')
			.delete()
			.eq('user_id', user.id)

		if (error) { ToastManager.error('삭제 실패'); return }

		var listEl = document.getElementById('notif-list')
		if (listEl)
			listEl.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#6B6B8A;font-size:0.875rem;">알림이 없습니다</div>'

		this.unreadCount = 0
		this._updateBadge(0)
	}

	// -----------------------------------------
	// 알림 개별 삭제
	// -----------------------------------------

	async _deleteOne(notifId, isUnread, itemEl)
	{
		var { error } = await this.sb.getClient()
			.from('notifications')
			.delete()
			.eq('id', notifId)

		if (error) { ToastManager.error('삭제 실패'); return }

		if (itemEl) itemEl.remove()

		if (isUnread)
		{
			this.unreadCount = Math.max(0, this.unreadCount - 1)
			this._updateBadge(this.unreadCount)
		}

		// 남은 아이템이 없으면 빈 상태 표시
		var listEl = document.getElementById('notif-list')
		if (listEl && listEl.querySelectorAll('.notif-item').length === 0)
			listEl.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#6B6B8A;font-size:0.875rem;">알림이 없습니다</div>'
	}

	_typeIcon(type)
	{
		var map = {
			prompt_approved:    '✅',
			prompt_rejected:    '❌',
			prompt_liked:       '❤️',
			comment_liked:      '💬',
			purchase_completed: '💰',
			system:             '📢'
		}
		return map[type] || '🔔'
	}

	_typeColor(type)
	{
		var map = {
			prompt_approved:    'rgba(108,99,255,0.2)',
			prompt_rejected:    'rgba(255,101,132,0.2)',
			prompt_liked:       'rgba(255,100,100,0.2)',
			comment_liked:      'rgba(255,101,132,0.2)',
			purchase_completed: 'rgba(255,200,50,0.2)',
			system:             'rgba(100,180,255,0.2)'
		}
		return map[type] || 'rgba(108,99,255,0.15)'
	}
}
