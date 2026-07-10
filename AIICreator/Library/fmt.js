
fmt = (function()
{
	var KST_OFFSET = 9 * 60 * 60 * 1000 // UTC+9

	function _toKST(dateStr)
	{
		return new Date(new Date(dateStr).getTime() + KST_OFFSET)
	}

	function _pad(n) { return String(n).padStart(2, '0') }

	// 'YYYY-MM-DD' (KST)
	function date(dateStr)
	{
		if (!dateStr) return '—'
		var d = _toKST(dateStr)
		return d.getUTCFullYear() + '-' + _pad(d.getUTCMonth() + 1) + '-' + _pad(d.getUTCDate())
	}

	// 상대 시간 ('방금 전', 'N분 전', ...)
	function timeAgo(dateStr)
	{
		if (!dateStr) return ''
		var diff = Date.now() - new Date(dateStr).getTime()
		var min  = Math.floor(diff / 60000)
		if (min < 1)   return '방금 전'
		if (min < 60)  return min + '분 전'
		var hr = Math.floor(min / 60)
		if (hr < 24)   return hr + '시간 전'
		var day = Math.floor(hr / 24)
		if (day < 7)   return day + '일 전'
		return date(dateStr)
	}

	// HTML 이스케이프 (innerHTML에 삽입되는 사용자 입력값 XSS 방지용)
	function esc(str)
	{
		if (str === null || str === undefined) return ''
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
	}

	return { date: date, timeAgo: timeAgo, esc: esc }
})()
