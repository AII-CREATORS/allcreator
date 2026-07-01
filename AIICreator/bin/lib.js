
;
//---------------------------------------------------------------------------------------------------------------------
//  
//  _TinyDom 쪽으로 옮김
//  jQuery 관련 함수는 Element.prototype 에 구현하지 말고 _TimyDom 에 구현하기

/*
Element.prototype.isFocusable = function()
{ 
  if (this.disabled) return false;
  if (this.hidden) return false;

  // display/visibility 체크
  const style = window.getComputedStyle(this);
  if (style.display === 'none' || style.visibility === 'hidden') return false;

  // 기본적으로 포커스 가능한 태그
  const focusableTags = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'OBJECT'];
  if (focusableTags.includes(this.tagName)) return true;

  // a[href] 링크
  if (this.tagName === 'A' && this.hasAttribute('href')) return true;

  // contenteditable
  if (this.hasAttribute('contenteditable')) return true;

  // tabindex 속성이 0 이상일 때
  const tabIndex = this.getAttribute('tabindex');
  if (tabIndex !== null && parseInt(tabIndex, 10) >= 0) return true;

  return false;
};

Element.prototype.isHidden = function() 
{
  // <input type="hidden"> 처리
  if (this instanceof HTMLInputElement && this.type === 'hidden') return true;

  const style = getComputedStyle(this);

  // display:none 또는 visibility:hidden
  if (style.display === 'none' || style.visibility === 'hidden') return true;

  // 렌더 박스가 없는 경우 (폭/높이 0이고 렌더 사각형 없음)
  if (this.offsetWidth === 0 && this.offsetHeight === 0 && this.getClientRects().length === 0) return true;

  return false;
};

Element.prototype.hide = function() 
{
    if(this.isHidden()) return;

    // 인라인 스타일에 display가 지정돼 있으면 저장
    const inline = this.style.display;
    if (inline && inline !== 'none') 
    {
        this.dataset._prevDisplay = inline;
    }

    this.style.display = 'none';
}

Element.prototype.show = function() 
{
    if(!this.isHidden()) return;

    // 1) 저장된 인라인 display 복원 시도
    const prev = this.dataset._prevDisplay || '';
    this.style.display = prev;
    delete this.dataset._prevDisplay;
}
*/

// 여기까지
//------------------------------------------------------------------------------------------------------------------



//class ARect

function ARect(l, t, w, h)
{
	if(h==undefined) this.setEmpty();
	else this.setSizeRect(l,t,w,h);
}

ARect.prototype.setPointRect = function(l, t, r, b)
{
	this.left = l;
	this.top = t;
	this.right = r;
	this.bottom = b;
	
	this.refreshSize();
};

ARect.prototype.setSizeRect = function(l, t, w, h)
{
	this.left = l;
	this.top = t;
	this.width = w;
	this.height = h;
	
	this.refreshRect();
};

ARect.prototype.offsetRect = function(offsetX, offsetY)
{
	this.left += offsetX;
	this.top += offsetY;
	this.right += offsetX;
	this.bottom += offsetY;
	
	this.refreshSize();
};


ARect.prototype.copyRect = function(src)
{
	this.left = src.left;
	this.top = src.top;
	this.right = src.right;
	this.bottom = src.bottom;
	
	this.refreshSize();
};

ARect.prototype.setEmpty = function()
{
	this.setSizeRect(0,0,0,0);
};

ARect.prototype.absRect = function()
{
	if(this.width<0) this.reverseX();
	if(this.height<0) this.reverseY();
};

ARect.prototype.reverseX = function()
{
	var tmp = this.left;
	this.left = this.right;
	this.right = tmp;
	this.refreshSize();
};

ARect.prototype.reverseY = function()
{
	var tmp = this.top;
	this.top = this.bottom;
	this.bottom = tmp;
	this.refreshSize();
};

ARect.prototype.refreshSize = function()
{
	this.width = this.right-this.left;
	this.height = this.bottom-this.top;
};

ARect.prototype.refreshRect = function()
{
	this.right = this.left+this.width;
	this.bottom = this.top+this.height;
};

ARect.prototype.isSubsetPt = function(x, y)
{
	return (x>this.left && x<this.right && y>this.top && y<this.bottom);
};

//포함하는 rect 인지
ARect.prototype.isSubsetRt = function(rt)
{
	return (rt.left>this.left && rt.right<this.right && rt.top>this.top && rt.bottom<this.bottom);
};

//교차하는 rect 인지
ARect.prototype.isIntersectRt = function(rt)
{
	return !(rt.left > this.right || rt.right < this.left || rt.top > this.bottom || rt.bottom < this.top);
};

ARect.prototype.isRectEmpty = function()
{
    return (this.width==0 && this.height==0);
};



/*!
 * tinyDomGeom.js — jQuery-like geometry helpers (offset/position/width/height…)
 * v0.3.0
 * - offset(): 문서 기준 좌표 get/set
 * - position(): offsetParent 기준 좌표 get
 * - width()/height(): 콘텐츠 크기 get/set (window/document 특수처리)
 * - innerWidth/innerHeight(): padding 포함, border 제외
 * - outerWidth/outerHeight(includeMargin?): padding+border(+margin) 포함
 * - offsetParent(): jQuery 유사 규칙
 * - scrollLeft/scrollTop(): get/set
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) define([], factory);
  else if (typeof module === 'object' && module.exports) module.exports = factory();
  else root._TinyDom = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------- Utilities ----------------
  const isWindow = (obj) => obj != null && obj === obj.window;
  const isDocument = (obj) => obj && obj.nodeType === 9;
  const num = (v) => { const n = parseFloat(v); return Number.isNaN(n) ? 0 : n; };
  const px = (n) => (typeof n === 'number' && Number.isFinite(n) ? `${n}px` : n);

  function getRect(el) { return el.getBoundingClientRect(); }

  // 문서 기준 스크롤 오프셋
  function pageOffset(win) {
    return {
      top: win.pageYOffset != null ? win.pageYOffset :
           (win.document.documentElement || win.document.body.parentNode || win.document.body).scrollTop || 0,
      left: win.pageXOffset != null ? win.pageXOffset :
            (win.document.documentElement || win.document.body.parentNode || win.document.body).scrollLeft || 0
    };
  }

  // jQuery 유사 offsetParent
  function offsetParent(el) {
    let op = el && el.offsetParent;
    while (op && op !== document.documentElement && getComputedStyle(op).position === 'static') {
      op = op.offsetParent;
    }
    return op || document.documentElement;
  }

  // ---------------- Offset (doc 기준) ----------------
  function getOffset(el) {
    if (!el || el.nodeType !== 1) throw new Error('Element required');
    const rect = getRect(el);
    const po = pageOffset(window);
    return { top: rect.top + po.top, left: rect.left + po.left };
  }

  function setOffset(el, coords) {
    if (!el || el.nodeType !== 1) throw new Error('Element required');
    if (!coords || typeof coords.top !== 'number' || typeof coords.left !== 'number') {
      throw new Error('coords must be {top:number, left:number}');
    }

    const cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';

    const isFixed = getComputedStyle(el).position === 'fixed';
    const parent = isFixed ? document.documentElement : offsetParent(el);

    // 부모 문서기준 오프셋 + border 보정
    let parentTop = 0, parentLeft = 0;
    if (!isFixed && parent && parent !== document.documentElement) {
      const pOff = getOffset(parent);
      const pcs = getComputedStyle(parent);
      parentTop = pOff.top + num(pcs.borderTopWidth);
      parentLeft = pOff.left + num(pcs.borderLeftWidth);
    } else if (isFixed) {
      const po = pageOffset(window);
      parentTop = po.top; parentLeft = po.left;
    }

    const marginTop = num(cs.marginTop);
    const marginLeft = num(cs.marginLeft);

    el.style.top = px(coords.top - parentTop - marginTop);
    el.style.left = px(coords.left - parentLeft - marginLeft);
    return { top: coords.top, left: coords.left };
  }

  function offset(el, coords) { return coords == null ? getOffset(el) : setOffset(el, coords); }

  // ---------------- Position (offsetParent 기준) ----------------
  function position(el) {
    if (!el || el.nodeType !== 1) throw new Error('Element required');
    const rect = getRect(el);
    const parent = offsetParent(el);
    const parentRect = parent === document.documentElement
      ? { top: 0, left: 0 }
      : getRect(parent);

    const pcs = getComputedStyle(parent);
    const borderTop = num(pcs.borderTopWidth);
    const borderLeft = num(pcs.borderLeftWidth);

    return {
      top: rect.top - parentRect.top - borderTop,
      left: rect.left - parentRect.left - borderLeft
    };
  }

  // ---------------- Width / Height 계열 ----------------
  // window/document 특수값
  function getWindowSize(win, dim) {
    return dim === 'width'
      ? win.document.documentElement.clientWidth
      : win.document.documentElement.clientHeight;
  }

  function getDocumentSize(doc, dim) {
    const el = doc.documentElement;
    const body = doc.body;
    if (dim === 'width') {
      return Math.max(
        body.scrollWidth, el.scrollWidth,
        body.offsetWidth, el.offsetWidth,
        el.clientWidth
      );
    }
    return Math.max(
      body.scrollHeight, el.scrollHeight,
      body.offsetHeight, el.offsetHeight,
      el.clientHeight
    );
  }

  function baseSize(el, dim) {
    if (isWindow(el)) return getWindowSize(el, dim);
    if (isDocument(el)) return getDocumentSize(el, dim);
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    // 콘텐츠 크기 = border-box - padding - border
    if (dim === 'width') {
      return rect.width - num(cs.paddingLeft) - num(cs.paddingRight) - num(cs.borderLeftWidth) - num(cs.borderRightWidth);
    } else {
      return rect.height - num(cs.paddingTop) - num(cs.paddingBottom) - num(cs.borderTopWidth) - num(cs.borderBottomWidth);
    }
  }

  function setSize(el, dim, value) {
    if (isWindow(el) || isDocument(el)) throw new Error('Cannot set size of window/document');
    el.style[dim] = px(value);
    return value;
  }

  function width(el, value) {
    return value == null ? baseSize(el, 'width') : setSize(el, 'width', value);
  }
  function height(el, value) {
    return value == null ? baseSize(el, 'height') : setSize(el, 'height', value);
  }

  function innerWidth(el) {
    if (isWindow(el)) return getWindowSize(el, 'width');
    if (isDocument(el)) return getDocumentSize(el, 'width');
    const cs = getComputedStyle(el);
    // padding 포함, border 제외
    return width(el) + num(cs.paddingLeft) + num(cs.paddingRight);
  }

  function innerHeight(el) {
    if (isWindow(el)) return getWindowSize(el, 'height');
    if (isDocument(el)) return getDocumentSize(el, 'height');
    const cs = getComputedStyle(el);
    return height(el) + num(cs.paddingTop) + num(cs.paddingBottom);
  }

  function outerWidth(el, includeMargin = false) {
    if (isWindow(el)) return getWindowSize(el, 'width');
    if (isDocument(el)) return getDocumentSize(el, 'width');
    const cs = getComputedStyle(el);
    let w = width(el) + num(cs.paddingLeft) + num(cs.paddingRight) + num(cs.borderLeftWidth) + num(cs.borderRightWidth);
    if (includeMargin) w += num(cs.marginLeft) + num(cs.marginRight);
    return w;
  }

  function outerHeight(el, includeMargin = false) {
    if (isWindow(el)) return getWindowSize(el, 'height');
    if (isDocument(el)) return getDocumentSize(el, 'height');
    const cs = getComputedStyle(el);
    let h = height(el) + num(cs.paddingTop) + num(cs.paddingBottom) + num(cs.borderTopWidth) + num(cs.borderBottomWidth);
    if (includeMargin) h += num(cs.marginTop) + num(cs.marginBottom);
    return h;
  }

  // ---------------- Scroll get/set ----------------
  function scrollLeft(el, value) {
    if (value == null) {
      return isWindow(el) ? el.pageXOffset : (isDocument(el) ? pageOffset(window).left : el.scrollLeft);
    }
    if (isWindow(el)) el.scrollTo(value, el.pageYOffset);
    else if (isDocument(el)) window.scrollTo(value, pageOffset(window).top);
    else el.scrollLeft = value;
    return value;
  }

  function scrollTop(el, value) {
    if (value == null) {
      return isWindow(el) ? el.pageYOffset : (isDocument(el) ? pageOffset(window).top : el.scrollTop);
    }
    if (isWindow(el)) el.scrollTo(el.pageXOffset, value);
    else if (isDocument(el)) window.scrollTo(pageOffset(window).left, value);
    else el.scrollTop = value;
    return value;
  }


    function getStyle(el, key)
    {
        if(!el) return ''

        let view = el.ownerDocument.defaultView;
        if ( !view || !view.opener ) view = window;
        return view.getComputedStyle(el)[key];
    }

    function isFocusable(el)
    { 
        if (el.disabled) return false;
        if (el.hidden) return false;

        // display/visibility 체크
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;

        // 기본적으로 포커스 가능한 태그
        const focusableTags = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'OBJECT'];
        if (focusableTags.includes(el.tagName)) return true;

        // a[href] 링크
        if (el.tagName === 'A' && el.hasAttribute('href')) return true;

        // contenteditable
        if (el.hasAttribute('contenteditable')) return true;

        // tabindex 속성이 0 이상일 때
        const tabIndex = el.getAttribute('tabindex');
        if (tabIndex !== null && parseInt(tabIndex, 10) >= 0) return true;

        return false;
    }

    function isHidden(el) 
    {
        // <input type="hidden"> 처리
        if (el instanceof HTMLInputElement && el.type === 'hidden') return true;

        const style = getComputedStyle(el);

        // display:none 또는 visibility:hidden
        if (style.display === 'none' || style.visibility === 'hidden') return true;

        // 렌더 박스가 없는 경우 (폭/높이 0이고 렌더 사각형 없음)
        if (el.offsetWidth === 0 && el.offsetHeight === 0 && el.getClientRects().length === 0) return true;

        return false;
    }

    function hide(el) 
    {
        if(!el) return
        //여기서는 비교하면 안됨. 잠시후에 나타나는 경우도 있음.
        //if(isHidden(el)) return;

        // 인라인 스타일에 display가 지정돼 있으면 저장
        const inline = el.style.display;
        if (inline && inline !== 'none') 
        {
            el.dataset._prevDisplay = inline;
        }

        el.style.display = 'none';
    }

    function show(el) 
    {
        if(!el || !isHidden(el)) return;

        // 1) 저장된 인라인 display 복원 시도
        const prev = el.dataset._prevDisplay || '';
        el.style.display = prev;
        delete el.dataset._prevDisplay;
    }

    // 위로 접기 (jQuery .slideUp 대체)
    function slideUp(element, duration = 400, callback) 
    {
        if (!element) return;

        const style = window.getComputedStyle(element);
        // 이미 숨겨져 있으면 바로 콜백
        if (style.display === 'none') {
            if (typeof callback === 'function') callback();
            return;
        }

        // 현재 높이 고정
        element.style.height = element.offsetHeight + 'px';
        element.style.boxSizing = 'border-box';
        element.style.overflow = 'hidden';

        // 트랜지션 설정
        element.style.transitionProperty = 'height, margin, padding';
        element.style.transitionDuration = duration + 'ms';

        // reflow 강제
        element.offsetHeight;

        // 목표 상태: 0
        element.style.height = 0;
        element.style.paddingTop = 0;
        element.style.paddingBottom = 0;
        element.style.marginTop = 0;
        element.style.marginBottom = 0;

        function handleTransitionEnd(event) {
            if (event.propertyName !== 'height') return;
            element.removeEventListener('transitionend', handleTransitionEnd);

            // 실제로 숨기기
            element.style.display = 'none';

            // 인라인 스타일 정리
            element.style.removeProperty('height');
            element.style.removeProperty('padding-top');
            element.style.removeProperty('padding-bottom');
            element.style.removeProperty('margin-top');
            element.style.removeProperty('margin-bottom');
            element.style.removeProperty('overflow');
            element.style.removeProperty('transition-duration');
            element.style.removeProperty('transition-property');
            element.style.removeProperty('box-sizing');

            if (typeof callback === 'function') callback();
        }

        element.addEventListener('transitionend', handleTransitionEnd);
    }

    // 아래로 펼치기 (jQuery .slideDown 대체)
    function slideDown(element, duration = 400, callback) 
    {
        if (!element) return;

        const style = window.getComputedStyle(element);
        // 이미 보이는 상태면 바로 콜백
        if (style.display !== 'none') {
            if (typeof callback === 'function') callback();
            return;
        }

        // display 복원 (원래 display 값 추정)
        element.style.removeProperty('display');
        let display = window.getComputedStyle(element).display;
        if (display === 'none') {
            display = 'block';
        }
        element.style.display = display;

        // 최종 높이 계산
        const height = element.offsetHeight;

        // 시작 상태: 0
        element.style.height = 0;
        element.style.boxSizing = 'border-box';
        element.style.overflow = 'hidden';
        element.style.paddingTop = 0;
        element.style.paddingBottom = 0;
        element.style.marginTop = 0;
        element.style.marginBottom = 0;

        // reflow 강제
        element.offsetHeight;

        // 트랜지션 설정
        element.style.transitionProperty = 'height, margin, padding';
        element.style.transitionDuration = duration + 'ms';

        // 목표 상태: 원래 높이
        element.style.height = height + 'px';
        // 패딩/마진은 원래 CSS 값으로 돌아가도록 제거
        element.style.removeProperty('padding-top');
        element.style.removeProperty('padding-bottom');
        element.style.removeProperty('margin-top');
        element.style.removeProperty('margin-bottom');

        function handleTransitionEnd(event) {
            if (event.propertyName !== 'height') return;
            element.removeEventListener('transitionend', handleTransitionEnd);

            // 인라인 스타일 정리
            element.style.removeProperty('height');
            element.style.removeProperty('overflow');
            element.style.removeProperty('transition-duration');
            element.style.removeProperty('transition-property');
            element.style.removeProperty('box-sizing');

            if (typeof callback === 'function') callback();
        }

        element.addEventListener('transitionend', handleTransitionEnd);
    }

    function trigger(element, type, detailOrOptions) 
    {
        if (!element) return;

        let event;

        switch (type) {
            case 'click':
            case 'mousedown':
            case 'mouseup':
            case 'mousemove':
            case 'mouseover':
            case 'mouseout':
                event = new MouseEvent(type, Object.assign({
                    bubbles: true,
                    cancelable: true
                }, detailOrOptions));
                break;

            case 'change':
            case 'input':
            case 'submit':
                event = new Event(type, {
                    bubbles: true,
                    cancelable: true
                });
                break;

            default:
                event = new CustomEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    detail: detailOrOptions
                });
        }

        element.dispatchEvent(event);
    }

    function group(iter, selector) 
    {
        const retArr = []

        if(typeof selector == 'function')
        {
            for(const ele of iter)
            {
                retArr.push(selector(ele))
            }
        }
        else if(typeof selector == 'string')
        {
            for(const ele of iter)
            {
                ele.querySelectorAll(selector).forEach(ele=>
                {
                    retArr.push(ele)
                })
            }
        }

        return retArr
    }

    function css(element, key, value) 
    {
        if(value!=undefined)
        {
            element.style[key] = value
        }
        else
        {
            if(typeof key == 'object') Object.assign(element.style, key)
            else if(typeof key == 'string') return getStyle(element, key)
        }
    }

    function addClass(element, ...strClass)
    {
        if(!element || !element.classList) return;

        const classes = strClass.flatMap(v => v?.trim().split(/\s+/)).filter(Boolean);
        element.classList.add(...classes);
    }
    
    function removeClass(element, ...strClass)
    {
        if(!element || !element.classList) return;
        
        const classes = strClass.flatMap(v => v?.trim().split(/\s+/)).filter(Boolean);
        element.classList.remove(...classes);
    }

    function hasClass(element, strClass)
    {
        if(!element || !element.classList) return;

        strClass = strClass?.trim()
        if(strClass) return element.classList.contains(strClass);
    }

    // Public API
    return {
        // 위치
        offset, getOffset, setOffset, position, offsetParent,
        // 크기
        width, height, innerWidth, innerHeight, outerWidth, outerHeight,
        // 스크롤
        scrollLeft, scrollTop, 
        //애니메이션
        slideUp, slideDown,
        //selector
        group, css,
        //class
        addClass, removeClass, hasClass,
        //기타
        isFocusable, isHidden, hide, show, trigger
    };
});


;var AUtil = 
{
};



AUtil.RgbToHsl = function(r, g, b)
{
	//r = parseInt(r)/255, g = parseInt(g)/255, b = parseInt(b)/255;
	
	r /= 255, g /= 255, b /= 255;
	
	var max = Math.max(r,g,b), min = Math.min(r,g,b),
		h, s, l = (max + min) / 2;
		
	if(max==min)
	{
		h = s = 0;
	}
	else
	{
		var d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch(max)
		{
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		
		h /= 6;
	}
	
	//return [h*360, s*100, l*100];
	return [h, s, l];
};

AUtil.OppositeColor = function(r, g, b)
{
	return [255-r, 255-g, 255-b];
};

	
AUtil.formatDate = function(dateStr)
{
	dateStr += '';
	var date = dateStr.replace(/:/g, '');
	return date.substring(0, 2)+':'+date.substring(2, 4)+':'+date.substring(4, 6);
};

AUtil.makeNumString = function(size, value)
{
	var ret = '';
	value = ''+value;

	//빈자리는 0 으로 채움
	var valueInx = size - value.length; 
	for(var i=0; i<valueInx; i++)
		ret += '0';

	//실제 숫자를 채움
	for(var j=0; i<size; i++, j++)
		ret += value.charAt(j);

	return ret;
};

AUtil.autoShrink = function(ele, info) 
{
	if(info)
	{		
		//var $ele = $(ele);
		//var len = $.trim($ele.text()).length;
        let len = ele.textContent.trim().length;
		let unit = info.unit?info.unit:'px';
		len = (info.maxChar-len)/len;
		if(len<0) ele.style.setProperty('font-size', (info.fontSize+info.fontSize*len)+unit, 'important');
		else ele.style.setProperty('font-size', info.fontSize+unit, 'important');
	}
		
};
	
AUtil.makeStack = function(targetDom)
{
	var stack = document.createElement('div');
	stack.style.display = 'none';
	targetDom.appendChild(stack);
	return stack;
};

//curDom에서 tagName을 가진 바로 이전 돔객체 리턴
AUtil.findPrevByTagName = function(curDom, tagName)
{
	var resTag = null;
	var _isVisible = function(el) { return el && !_TinyDom.isHidden(el); };

	// $(curDom).prev(tagName+':visible') - 이전 형제 중 tagName이면서 visible인 것
	var prevEl = curDom.previousElementSibling;
	while(prevEl)
	{
		if(prevEl.tagName.toLowerCase() == tagName.toLowerCase() && _isVisible(prevEl))
		{
			resTag = prevEl;
			break;
		}
		prevEl = prevEl.previousElementSibling;
	}

	if(resTag)
	{
		// resTag 내부에서 visible한 tagName 자식을 찾아 마지막 것 리턴
		var children = resTag.querySelectorAll(tagName);
		var lastVisible = null;
		for(var i=0; i<children.length; i++)
		{
			if(_isVisible(children[i])) lastVisible = children[i];
		}
		if(lastVisible) resTag = lastVisible;
	}
	else
	{
		// $(curDom).parents(tagName+':visible') - 조상 중 tagName이면서 visible인 첫번째
		var parentEl = curDom.parentElement;
		while(parentEl)
		{
			if(parentEl.tagName.toLowerCase() == tagName.toLowerCase() && _isVisible(parentEl))
			{
				resTag = parentEl;
				break;
			}
			parentEl = parentEl.parentElement;
		}
	}

	return resTag;
};


//curDom에서 tagName을 가진 바로 다음 돔객체 리턴
AUtil.findNextByTagName = function(curDom, tagName)
{
	var _isVisible = function(el) { return el && !_TinyDom.isHidden(el); };
	var tag = tagName.toLowerCase();

	// curDom 내부에서 visible한 tagName 자식을 찾아 첫번째 것 리턴
	var children = curDom.querySelectorAll(tagName);
	for(var i=0; i<children.length; i++)
	{
		if(_isVisible(children[i])) return children[i];
	}

	// $(curDom).next(tagName+':visible') - 다음 형제 중 tagName이면서 visible인 것
	var nextEl = curDom.nextElementSibling;
	while(nextEl)
	{
		if(nextEl.tagName.toLowerCase() == tag && _isVisible(nextEl)) return nextEl;
		nextEl = nextEl.nextElementSibling;
	}

	// $(curDom).parents(tagName+':visible') - 조상 중 tagName이면서 visible인 것의 next
	var parentEl = curDom.parentElement;
	while(parentEl)
	{
		if(parentEl.tagName.toLowerCase() == tag && _isVisible(parentEl))
		{
			var parentNext = parentEl.nextElementSibling;
			while(parentNext)
			{
				if(parentNext.tagName.toLowerCase() == tag && _isVisible(parentNext)) return parentNext;
				parentNext = parentNext.nextElementSibling;
			}
		}
		parentEl = parentEl.parentElement;
	}

	return null;
};

AUtil.extractFileName = function(path, split)
{
	if(!split) split = afc.DIV;
	var start = path.lastIndexOf(split);
 	var end = path.length;
 	return path.substring(start+1, end);
};

AUtil.extractFileNameExceptExt = function(path, split)
{
	if(!split) split = afc.DIV;

	var start = path.lastIndexOf(split);
	var end = path.lastIndexOf('.');
	if(end < 0) end = path.length;
 	return path.substring(start+1, end);
};

AUtil.extractLoc = function(path, split)
{
	if(!split) split = afc.DIV;
 	var end = path.lastIndexOf(split);
 	return path.substring(0, end+1);
};
	
AUtil.extractExtName = function(path)
{
 	var start = path.lastIndexOf(".");
 	var end = path.length;
	
	if(start<0) return '';
	
 	return path.substring(start+1, end);
};

AUtil.filePathExceptExt = function(fileName)
{
 	return fileName.substring(0, fileName.lastIndexOf("."));
};


AUtil.shuffle = function(arr) 
{
    var i, j, x;
    for(i=arr.length-1; i>0; i--) 
	{
        j = Math.floor(Math.random() * (i + 1));
        x = arr[i];
        arr[i] = arr[j];
        arr[j] = x;
    }
};

AUtil.randInt = function(min, max) 
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

AUtil.readTextFile = function(filePathName){
	var result = null;

	var pre = '';
	if(PROJECT_OPTION.build.subName) pre = PROJECT_OPTION.build.subName + '/';

	var xhr = new XMLHttpRequest();
	xhr.open('GET', pre + filePathName, false);
	try
	{
		xhr.send(null);
		if(xhr.status >= 200 && xhr.status < 300)
		{
			try { result = JSON.parse(xhr.responseText); }
			catch(e) { result = null; }
		}
	}
	catch(e) {}
	return result;
};

AUtil.isExistFile = function(fileUrl)
{
	var result = null;

	var pre = '';
	if(PROJECT_OPTION.build.subName) pre = PROJECT_OPTION.build.subName + '/';

	var xhr = new XMLHttpRequest();
	xhr.open('GET', pre + fileUrl, false);
	try
	{
		xhr.send(null);
		if(xhr.status >= 200 && xhr.status < 300)
		{
			result = !!xhr.responseText;
		}
		else result = false;
	}
	catch(e)
	{
		result = false;
	}
	return result;
};

//noOverwrite 가 true 이면, 기존의 값이 존재할 경우 덮어쓰지 않는다.
AUtil.optionHelper = function(obj, option, noOverwrite)
{
    for(var p in option)
    {
    	if(!option.hasOwnProperty(p)) continue;
    	
		if(!noOverwrite || obj.option[p]==undefined)
		{
			obj.option[p] = option[p];
		}
    }
};

AUtil.safeDelay = function(chkComp, func, delay)
{
	return setTimeout(function()
   	{
		if(chkComp && !chkComp.isValid()) return;
		
		func();

	}, delay);

};

AUtil.tagEvent = function(tag, e, eventName)
{
	var acomp, parentEle = tag.parentElement;
	while(parentEle) {
		acomp = parentEle.acomp;
		if(acomp) break;
		parentEle = parentEle.parentElement;
	}
	if(acomp) {
		if(acomp.isDev()) return;
		
		var rootView = acomp.getRootView();
		if(rootView[eventName]) {
			rootView[eventName].call(rootView, tag, acomp, e);
		}
	}
};

AUtil.tagCheckedByName = function(tag, name)
{
	var checked = tag.checked;
	var acomp, parentEle = tag.parentElement;
	while(parentEle) {
		acomp = parentEle.acomp;
		if(acomp) break;
		parentEle = parentEle.parentElement;
	}
	if(acomp) {
		parentEle.querySelectorAll(`[name="${name}"]`).forEach(ele => {
			ele.checked = checked;
		});
	}
};

//----------------------------------------------------------------------------

AUtil.textfill = function(element, maxFontPixels)
{
	var fontSize = maxFontPixels;
	var spans = element.querySelectorAll('span');
	var ourText = null;
	for(var i=0; i<spans.length; i++)
	{
		if(!_TinyDom.isHidden(spans[i])) { ourText = spans[i]; break; }
	}
	if(!ourText) return;

	var maxHeight = _TinyDom.height(element), maxWidth = _TinyDom.width(element), textHeight, textWidth;

	do
	{
		ourText.style.fontSize = fontSize + 'px';
		textHeight = _TinyDom.height(ourText);
		textWidth = _TinyDom.width(ourText);
		fontSize = fontSize - 1;
	} while ((textHeight > maxHeight || textWidth > maxWidth) && fontSize > 3);
};

//info : {maxChar:15, fontSize:24, unit:'px'}
//AUtil.autoShrink 는 위에 이미 정의되어 있음

/*
(function($) {
    $.fn.autoShrink = function(info)
	{
		if(info)
		{
			var $ele = $(this);
			var len = $.trim($ele.text()).length;
			var unit = info.unit?info.unit:'px';
			len = (info.maxChar-len)/len;
			if(len<0) $ele[0].style.setProperty('font-size', (info.fontSize+info.fontSize*len)+unit, 'important');
			else $ele[0].style.setProperty('font-size', info.fontSize+unit, 'important');
		}

        return this;
    }
})(jQuery);
*/

/*
(function($) {
    $.fn.removeNoLeak = function()
	{
		var $ele = $(this);
		//$ele.unbind();
		$ele.remove();
    }
})(jQuery);
*/


var tmpl_style = ['font-family', 'font-size', 'font-weight','font-style','color',
    'word-spacing','line-height','text-align','vertical-align',
    'opacity', 'white-space',
    'background',
	'background-color', 'background-image','background-repeat','background-position', 'background-size',
	
    'border', 'padding',
	
	'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content',
	'border-radius', 'word-break',
    ];

var tmpl_style_obj = {
	'border' : ['border-width', 'border-color', 'border-style'],
	'border-width' : ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
	'border-color' : ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'],
	'border-style' : ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'],
	'padding' : ['padding-top', 'padding-right', 'padding-bottom', 'padding-left']
};

//AUtil.getDefinedStyle 는 아래에 이미 정의되어 있음

/*
(function($) {
    $.fn.getDefinedStyle = function(isComputed) {
        var dom = this.get(0), retObj = {}, style, val;

		if(!dom) return retObj;

        if(isComputed)
        {
	        if(window.getComputedStyle)
	        {
	            style = window.getComputedStyle(dom, null);

				_style_helper(tmpl_style);
	        }

        }
        else
        {
            style = dom.style;

			_style_helper(tmpl_style);
        }

		function _style_helper(styleArr)
		{
            for(var i=0; i<styleArr.length; i++)
            {
				if(isComputed) val = style.getPropertyValue(styleArr[i]);
				else val = style[styleArr[i]];

            	if(val) retObj[styleArr[i]] = val;
				else if(tmpl_style_obj[styleArr[i]])
				{
					_style_helper(tmpl_style_obj[styleArr[i]]);
				}
            }
		}

        return retObj;
    };

})(jQuery);
*/

AUtil.hasScrollBar = function(element) {
	return ( element.scrollHeight - _TinyDom.height(element) >= 1 );	//ie 11 에서는 소수점이 나오는 버그 수정
};

/*
(function($)
{
    $.fn.hasScrollBar = function() {
        return ( this.get(0).scrollHeight-this.height() >= 1 );
    };
})(jQuery);
*/

//for ie11
(function(E, d, w) {
    if(!E.composedPath) 
    {
      E.composedPath = function() 
      {
        if (this.path) 
        {
          return this.path;
        } 
        var target = this.target;
      
        this.path = [];
        while (target.parentNode !== null) 
        {
            this.path.push(target);
            target = target.parentNode;
        }
        this.path.push(d, w);
        return this.path;
      };
    }
})(Event.prototype, document, window);

//jQuery 버전과 같은 element 버전 함수도 추가 
//원래 ARect 내부에 만들어야 하는데 변수 재정의 등의 문제로 여기에 추가함

AUtil.getDefinedStyle = function(dom, isComputed) 
{
    let retObj = {}, style, val;
    
    if(!dom) return retObj;
    
    if(isComputed)
    {
        if(window.getComputedStyle)
        {
            style = window.getComputedStyle(dom, null);
            
            _style_helper(tmpl_style);
            /*
            for(var i=0; i<tmpl_style.length; i++)
            {
                val = style.getPropertyValue(tmpl_style[i]);
                if(val) retObj[tmpl_style[i]] = val;
            }*/
        }
        
    }
    else
    {
        style = dom.style;
        
        _style_helper(tmpl_style);
        /*
        for(var i=0; i<tmpl_style.length; i++)
        {
            val = style[tmpl_style[i]];
            if(val) retObj[tmpl_style[i]] = val;
        }*/
    }
    
    function _style_helper(styleArr)
    {
        for(var i=0; i<styleArr.length; i++)
        {
            if(isComputed) val = style.getPropertyValue(styleArr[i]);
            else val = style[styleArr[i]];
            
            if(val) retObj[styleArr[i]] = val;
            else if(tmpl_style_obj[styleArr[i]])
            {
                _style_helper(tmpl_style_obj[styleArr[i]]);
            }
        }
    }
    
    return retObj;
};



  
//---------------------------------------------------------------------------------------------------


function AHistoryInfo()
{
    this.infoHistory = new Array();
    this.curHisIndex = -1;
}

AHistoryInfo.prototype.pushInfo = function(info)
{
	this.curHisIndex++;
    this.infoHistory.length = this.curHisIndex;
    this.infoHistory.push(info);
};

AHistoryInfo.prototype.prevInfo = function()
{
	if(this.canGoPrev())
	{
		this.curHisIndex--;
		return this.infoHistory[this.curHisIndex];
	}
	
	else return null;
};

AHistoryInfo.prototype.nextInfo = function()
{
	if(this.canGoNext())
	{
		this.curHisIndex++;
		return this.infoHistory[this.curHisIndex];
	}
	
	else return null;
};

AHistoryInfo.prototype.canGoPrev = function()
{
	return (this.curHisIndex>0);
};

AHistoryInfo.prototype.canGoNext = function()
{
	return (this.curHisIndex<this.infoHistory.length-1);
};

AHistoryInfo.prototype.clearHistory = function()
{
	this.infoHistory.length = 0;
	this.curHisIndex = -1;
};

//----------------------------------------------------------------------


function AAwait()
{
	this.count = 0;
	this.endCallbacks = [];
	this.proms = [];
    this.waitMap = {};
}

//addProm 과 waitAllProm 은 세트로 사용 
//프라미스를 이용한 완료 대기
AAwait.prototype.addProm = function(prom)
{
	this.proms.push(prom);
	return prom;
};

AAwait.prototype.waitAllProm = function()
{
	return Promise.all(this.proms);
};

AAwait.prototype.resetProm = function()
{
	this.proms = [];
};


//----------------------------------------------------------------------
//add, remove, waitAll 세트로 사용 

//비동기 작업이 시작될 때 호출
AAwait.prototype.begin = function(key)
{
	this.count++;

    //for debug
    this.waitMap[key] = key;
};

//비동기 작업이 완료되면 호출
AAwait.prototype.end = function(key, isCache)
{
    this.count--;

    //for debug
    this.waitMap[key] = null;

    //자신이 마지막 비동기 작업이면
	if(this.count==0) 
	{
        if(!isCache) 
        {
            //console.log('report done : ' + key);
            //등록되어진 콜백함수들을 호출해 준다.
            this._reportDone(key);
        }
	}
};

//등록된 모든 비동기 작업이 완료되면 endCallback 을 호출해 준다.
AAwait.prototype.waitAll = function(endCallback)
{
	if(this.count==0) 
	{
		endCallback();
	}
	
	//차후에 호출할 때는 나중에 추가된 것이 먼저 호출되어야 한다.
    else this.endCallbacks.push(endCallback);
};

AAwait.prototype._reportDone = function(key)
{
    if(this.endCallbacks.length==0) 
    {
        //console.log('end callback clear =========== : ' + key);
        this.waitMap = {};
        return;
    }

    //나중에 추가된 것부터 꺼내온다.
    let callback = this.endCallbacks.pop();

    callback();

    //callback 내부에서 promise 의 resolve 가 호출된다.
    //그 이후 추가로 로드된 스크립트가 있는 지 체크하기 위해 
    //timeout 을 이용한다.
    setTimeout(()=>{

        //더 추가된 것이 없으면 계속 진행
        if(this.count==0) this._reportDone(key);

        //추가로 호출된 스크립트 로드가 있으면 
        //남아 있는 endCallback 이 호출되지 않게 하여 resolve 를 보류한다.
        //else console.log('additional wait -------- : ' + key);

    });

};


;/**
 * @author asoocool
 */

var afc = 
{
    version: '2.0.0',

    BTN_STATE: ['normal', 'touch', 'disable'],
    CHECK_STATE: ['check', 'normal'],
    
    ATTR_BASE: 'data-base',
    ATTR_CLASS: 'data-class',
    //ATTR_COLOR: 'data-color',               //텍스트 색상
    ATTR_GROUP: 'data-group',
    
    //ATTR_BGCOLOR: 'data-bgcolor',  			//배경 색상
    //ATTR_BGIMAGE: 'data-bgimage',  			//배경 이미지
    ATTR_STYLE: 'data-style',           	//스타일
    ATTR_STYLE_TAB: 'data-style-tab',       //탭 버튼 스타일
    ATTR_DEFAULT: 'data-default',           //라디오버튼(초기셀렉트 아이디)
    
    ATTR_LISTENER: 'data-listener',
    ATTR_QUERY_NAME: 'data-query-name',
    //ATTR_RESP: 'data-responsive',
	ATTR_MASK: 'data-mask',
    
    CLASS_MARK: '--',
    CMARK_LEN: 2,
    
    MASK_NONE: 0,
    MASK_MONEY: 1,
	MASK_FLOAT: 2,

	DISABLE_TIME: 500,
	//TOUCH_DELAY_TIME: 300,	//AppManager 로 옮겨짐, 차후 삭제
	CLICK_DELAY: 100,
	
    //키이벤트
	KEY_TAB: 9, KEY_ENTER: 13, KEY_ESC: 27, KEY_SPACE: 32, KEY_PGUP: 33, KEY_PGDOWN: 34, KEY_END: 35, KEY_HOME: 36, 
	KEY_SHIFT: 16, KEY_CTRL: 17, KEY_ALT: 18,
    KEY_LEFT: 37, KEY_UP: 38, KEY_RIGHT: 39, KEY_DOWN: 40, KEY_DEL: 46,
    KEY_A: 65, KEY_B: 66, KEY_C: 67, KEY_D: 68, KEY_E: 69, KEY_F: 70, KEY_G: 71,KEY_H: 72, KEY_N: 78, KEY_O: 79, 
	KEY_Q: 81, KEY_S: 83, KEY_V: 86, KEY_W: 87, KEY_X: 88, KEY_Y: 89, KEY_Z: 90,
    KEY_F1: 112, KEY_F2: 113, KEY_F3: 114, KEY_F4: 115, KEY_F5: 116, KEY_F6: 117, KEY_F7: 118, KEY_F8: 119, KEY_F9: 120, KEY_F10: 121, 
	
	
	LBUTTON: 1, MBUTTON: 2, RBUTTON: 3,
	
	PHONE_DOC_WIDTH: 640,
	TABLET_DOC_WIDTH: 1280,	//1024
	
};

//deprecated 
afc.ClassName =
{
    LABEL:'ALabel',
	TEXTBOX:'ATextBox',
    BUTTON:'AButton',
    CHECKBOX:'ACheckBox',
    RADIOGROUP:'ARadioGroup',
    RADIOBUTTON:'ARadioButton',
    TEXTFIELD:'ATextField',
    TEXTAREA:'ATextArea',
    DROPBOX:'ADropBox',
    SELECTBOX:'ASelectBox',
    GRID:'AGrid',
    TREE:'ATree',
    SWITCHBUTTON:'ASwitchButton',
    IMAGE:'AImage',
    CANVAS:'ACanvas',
    PROGRESS : 'AProgress',
    SLIDER : 'ASlider',
    //DATEPICKER : 'ADatePicker',
    TIMEPICKER : 'ATimePicker',
	SCROLLBAR : 'AScrollBar',
	
    GRIDLAYOUT : 'AGridLayout',
    FLEXLAYOUT : 'AFlexLayout',
	
    VIEW:'AView',
    LISTVIEW:'AListView',
    TABVIEW:'ATabView',
    WEBVIEW:'AWebView',
    SLIDEVIEW:'ASlideView',

    //FLEXVIEW:'AFlexView',
    SPLITVIEW:'ASplitView',
    ACCORDION: 'AAccordion',

	BAR: 'ABar',
    TOOLBAR: 'AToolBar',
	MENUBAR: 'AMenuBar',
	TABBAR: 'ATabBar',
	
	FLOAT: 'AFloat',
	TOAST: 'AToast',
	INDICATOR: 'AIndicator',
	MENU: 'AMenu',
    
    PAGE:'APage',
    WINDOW: 'AWindow',
    APPLICATION: 'AApplication'
    
};

//afc.ACTION_DOWN = 'touchstart';
//afc.ACTION_MOVE = 'touchmove';
//afc.ACTION_UP = 'touchend';

afc.COMP_CTX = {};

//afc.COMP_CTX.defEvents = ['actiondown', 'actionmove', 'actionup'];

afc.compLabel = {
	"ALabel": "Label",
	"ATextBox": "TextBox",
	"AButton": "Button",
	"ACheckBox": "CheckBox",
	"ARadioButton": "RadioButton",
	"ADropBox": "DropBox",
	"ASelectBox": "SelectBox",
	"ATextField": "TextField",
	"ATextArea": "TextArea",
	"ASwitchButton": "SwitchButton",
	"AImage": "Image",
	"AVideo": "Video",
	"ACanvas": "Canvas",
	"AGrid": "Grid",
	"ATree": "Tree",
	"AScrollBar": "ScrollBar",
	"AView": "View",
	"ARadioGroup": "RadioGroup",
	"AListView": "ListView",
	"ATabView": "TabView",
	"AWebView": "WebView",
	"AProgress": "Progress",
	"ASlider": "Slider",
	"AGridLayout": "GridLayout",
	"AFlexLayout": "FlexLayout",
	//"AFlexView": "FlexView",
	"ASplitView": "SplitView",
	"AAccordion": "Accordion",
	"ADataGrid": "DataGrid",
	"ASlideView": "SlideView",
	"APivotGrid": "PivotGrid",
	"AForm": "Form",
	"AVertical": "Vertical",
	"AHorizontal": "Horizontal",
	"ASpacer": "Spacer",
	"AHTMLElement": "HTMLElement"
};

//--------------------------------------- Component -------------------------------------------------------------------------

afc.enableUserSelect = function(enable, element)
{
	var ele = element ? element : document.body;
	var val = enable ? 'auto' : 'none';

	ele.style.webkitUserSelect = val;
	ele.querySelectorAll('span').forEach(function(span) {
		span.style.webkitUserSelect = val;
	});
};

afc.enableScrollIndicator = function()
{
	//var strCss = '';
	
	//strCss += 'div { -ms-overflow-style: none; }';		//ie
	//strCss += '::-webkit-scrollbar { display: none; }';	//webkit
	//$('<style></style>').text(strCss).appendTo('head');	

	afc.isScrollIndicator = true;
};

//----------------------------
//	비동기 쿼리 로드 완료 대기

afc.qryWait = new AAwait();
afc.queryReady = function(acomp, callback)
{
	afc.qryWait.waitAllProm().then(values => 
    {
		acomp._applyLoadedQuery();
        callback(values);

        afc.qryWait.resetProm();
    });
};

//-----------------------------------
// 	비동기 스크립트 로드 완료 대기
//	afc._loadScriptWait 에서 사용

afc.scriptWait = new AAwait();
afc.scriptReady = function(callback)
{
	afc.scriptWait.waitAllProm().then(values => 
    {
        callback(values);
        afc.scriptWait.resetProm();
    });
};

//----------------------------
//	비동기 html 로드 완료 대기
/*
afc.htmlWait = new AAwait();
afc.htmlReady = function(callback)
{
	afc.htmlWait.waitAllProm().then(values => 
    {
        callback(values);
        afc.htmlWait.resetProm();
    });

};
*/

//----------------------------
//	

afc.loadWait = new AAwait();

afc._loadScriptWait = function(url, isReload) 
{
	afc.loadWait.begin(url);

	var prom = new Promise(function(resolve, reject) 
	{
		afc.loadScript(url, function(isCache)
		{
            //이전에 이미 로드되어져 있는 파일은 바로 resolve
            if(isCache)
            {
                afc.loadWait.end(url, true);

                resolve(url);
            }
            else
            {
                //모든 비동기 작업이 완료되면 호출될 콜백을 등록한다.
                //즉, 자신의 스크립트 파일의 로드가 완료되었지만 추가적인 비동기 작업이 등록되어 있으면
                //자신의 resolve 를 보류하고 모든 비동기 작업이 완료되면 다음 콜백이 호출되면서 
                //자신의 promise 를 resolve 시킨다.
                afc.loadWait.waitAll(function()
                {
                    resolve(url);
                });	

                //다음 함수가 호출될 때 자신의 end 가 마지막 비동기이면 등록된 모든 콜백이 호출된다.
                afc.loadWait.end(url);
            }
		}, isReload);
	});
	
	return afc.scriptWait.addProm(prom);
};

//화면 개발시점에는 이 함수를 사용해야 한다.
afc.import = function(url) 
{
    //console.log('script url : ' ,url);
	return afc._loadScriptWait(url);
};


//--------------------------------------------------------------------------------------------
// About Log
//--------------------------------------------------------------------------------------------

afc.disableLog = function()
{
	afc.log = function() { return ''; };
	console.log = function() {};
};

afc.logFilter = 'SpiderGen';
afc.logOption = 
{
	compElement: false,
};

afc.log = function(msg)
{
	var logMsg = '';
	
	if(msg instanceof AComponent || msg instanceof AContainer) logMsg = msg.toString(); 
	else if(msg instanceof HTMLElement) logMsg = msg.outerHTML;
	else if(msg instanceof Object) logMsg = afc.stringifyOnce(msg, undefined, 4);
	else logMsg = msg;

	logMsg = afc.logFilter + ' => ' + logMsg;
	console.log(logMsg);

	if(afc.isIos && window.AppManager) AppManager.consoleLog(logMsg);

	return logMsg;
};

afc.log2 = function(msg)
{
	var logMsg = '';

	if(msg instanceof HTMLElement) logMsg = msg.outerHTML;
	else if(msg instanceof Object) logMsg = afc.stringifyOnce(msg, undefined, 4);
	else logMsg = msg;
	
	logMsg = afc.logFilter + ' => ' + logMsg;
	console.log(logMsg);
	
	if(afc.isIos && window.AppManager) AppManager.consoleLog(logMsg);
	
	return logMsg;
};


afc.setLogFilter = function(filter)
{
	afc.logFilter = filter;
};

afc.setLogOption = function(option)
{
	for(var p in option)
	{
		if(!option.hasOwnProperty(p)) continue;
		afc.logOption[p] = option[p];
	}
};

afc.stringifyOnce = function(obj, replacer, indent)
{
    var printedObjects = [];
    var printedObjectKeys = [];

    function printOnceReplacer(key, value)
    {
        if ( printedObjects.length > 2000) // browsers will not print more than 20K, I don't see the point to allow 2K.. algorithm will not be fast anyway if we have too many objects
        { 
        	return 'object too long';
        }
        
        var printedObjIndex = false;
        printedObjects.forEach(function(obj, index)
        {
            if(obj===value)
                printedObjIndex = index;
        });

		//root element
        if ( key == '')
        {
        	printedObjects.push(obj);
            printedObjectKeys.push("root");
            return value;
        }
        else if(printedObjIndex+"" != "false" && typeof(value)=="object")
        {
            if ( printedObjectKeys[printedObjIndex] == "root") return "(pointer to root)";
            else return "(see " + ((!!value && !!value.constructor) ? afc.getClassName(value).toLowerCase()  : typeof(value)) + " with key " + printedObjectKeys[printedObjIndex] + ")";
        }
        else
        {
            var qualifiedKey = key || "(empty key)";
            printedObjects.push(value);
            printedObjectKeys.push(qualifiedKey);
            
            if(replacer) return replacer(key, value);
            else return value;
        }
    }
    
    return JSON.stringify(obj, printOnceReplacer, indent);
};


//--------------------------------------------------------------------------------------------
// About Time Check
//--------------------------------------------------------------------------------------------

afc.startTime = 0;
afc.oldTime = 0;
afc.beginTimeCheck = function(msg)
{
	afc.startTime = afc.oldTime = Date.now();
	
	if(!msg) msg = '';
	console.log(msg + ' -- Start time ==>			' + afc.startTime + ' --------------------------------------------------');
};

afc.ellapseCheck = function(msg, isEnd)
{
	if(afc.startTime==0) afc.beginTimeCheck(msg);
	else if(isEnd) afc.endTimeCheck(msg);
	else
	{
		if(!msg) msg = '';

		console.log(msg + ' -- Ellapsed time ==>		' + (Date.now() - afc.oldTime));
		afc.oldTime = Date.now();
	}
	
};

afc.endTimeCheck = function(msg)
{
	if(!msg) msg = '';
	
	afc.oldTime = Date.now();
	
	console.log(msg + ' -- End time ==> 			' + afc.oldTime + ' -------------------------------------');
	console.log(msg + ' -- Total Ellapsed time ==>	' + (afc.oldTime - afc.startTime) + ' -------------------------------------');
	
	afc.startTime = 0;
	afc.oldTime = 0;
};

afc.prefixCnt = 0;

afc.makeCompIdPrefix = function()
{
/*
	var time = new Date().getTime(),
		//rnd = parseInt(Math.random()*1000, 10);
		rnd = Math.random(),
		ret = time + rnd + afc.CLASS_MARK;
	
	return ret.replace('.', '');
	*/
	
	// Number.MAX_SAFE_INTEGER == 9007199254740991
	// IE에서는 지원하지 않는 변수이기 때문에 실제 숫자로 비교한다.
	if(afc.prefixCnt == 9007199254740991) afc.prefixCnt = 0;
	
	afc.prefixCnt++;
	
	return '_' + afc.prefixCnt + afc.CLASS_MARK;
};

//-------------------------------------------------------------------
//  function MyObject()
//  {
//      ParentObject.call(this); //부모에 변수 선언이 있다면 호출해 줄 것.
//  }
//  afc.extendsClass(MyObject, ParentObject);
//--------------------------------------------------------------------

//클래스 상속 관련 처리를 해준다.
afc.extendsClass = function(childClass, parentClass)
{
    //이미 상속처리가 되어져 있는 경우는 리턴
    if(childClass.prototype.superClass) return;
	
	if(!parentClass)
	{
		console.error('afc.extendsClass : parentClass is not defined.');
		return;
	}

	//상속 받을 부모의 프로토 타입 객체를 생성한다.
	var superProto = new parentClass(); //파라미터 없이 호출한다.
	for(var p in superProto) 
		if(superProto.hasOwnProperty(p)) delete superProto[p];

	childClass.prototype = superProto;
	childClass.prototype.constructor = childClass;
	childClass.prototype.superClass = parentClass;
};

//newObj 에 존재하는 프로퍼티만 curObj 에 셋팅해 준다.
afc.mergeObject = function(curObj, newObj)
{
	if(newObj)
	{
		for(var p in newObj)
		{
			if (newObj.hasOwnProperty(p))
				curObj[p] = newObj[p];
		}
	}
	
	return curObj;
};


afc.getClassName = function(funcObj)
{
	if(afc.isIE)
	{
		var funcNameRegex = /function (\w*)/;	//   /function (.{1,})\(/;
		var results = (funcNameRegex).exec(funcObj.constructor.toString());
		return (results && results.length > 1) ? results[1] : "";
/*		
  		var f = typeof funcObj == 'function';
  		var s = f && ((funcObj.name && ['', funcObj.name]) || funcObj.toString().match(/function ([^\(]+)/));
  		return (!f && 'not a function') || (s && s[1] || 'anonymous');
  */
	}
	else return funcObj.constructor.name;
};

afc.getUrlParameter = function()
{  
    var ParameterObject = {};  
    var locate = location.href;  
 
    if(locate.indexOf("?")==-1)  
        return ParameterObject;  
 
    var parameter = locate.split("?")[1];  
    var paramAreay = parameter.split("&");  
    for ( var i=0; i<paramAreay.length; i++ )  
    {  
        var tem = paramAreay[i].split("=");  
        ParameterObject[tem[0]] = tem[1];  
    }

    return ParameterObject;  
};


//---------------------------
//	lay, cls 로드 캐시 설정

afc.isLoadCache = true;

afc.enableLoadCache = function(enable)
{
	afc.isLoadCache = enable;
};

afc._loadHtmlHelper = function(trgEle, url, callback, searchValue, newValue, isSync) 
{
	var pre = '';
	if(PROJECT_OPTION.build.subName) pre = PROJECT_OPTION.build.subName + '/';

	//url = pre + url.replace('.lay', '.html');
	url = url.replace('.lay', '.html');

	var tmp = url.split('#'), viewId = null;

	if(tmp.length==2)	//url 뒤에 #view_id 를 붙이면 lay 내의 특정 뷰만 로드한다.
	{
		url = tmp[0];
		viewId = tmp[1];
	}

	if(afc.versionMap)
	{
		var vCode = afc.versionMap[url];
		if(vCode) url += '?v=' + vCode;
	}

	var reqUrl = pre+url;
	if(!afc.isLoadCache)
	{
		var _add = Math.random();
		if(reqUrl.indexOf('?')>-1) reqUrl += '&_=' + _add;
		else reqUrl += '?_=' + _add;
	}

	function _successHandler(txt)
	{
		if(searchValue)
			txt = txt.replace(searchValue, newValue);

		if(trgEle)
		{
			if(viewId)	//url 뒤에 #view_id 를 붙이면 lay 내의 특정 뷰만 로드한다.
			{
				var tempDiv = document.createElement('div');
				tempDiv.innerHTML = txt;
				var loadEl = tempDiv.firstElementChild;

				var _className = loadEl.getAttribute(afc.ATTR_CLASS) + afc.CLASS_MARK,
					_classMap = loadEl.getAttribute('data-class-map');

				var foundEl = loadEl.querySelector('#' + _className + viewId);
				if(foundEl) foundEl.setAttribute('data-class-map', _classMap);

				trgEle.innerHTML = '';
				if(foundEl) trgEle.appendChild(foundEl);
			}
			else trgEle.innerHTML = txt;

			if(callback) callback.call(trgEle, txt);
			//else resolve(txt);
		}
		else
		{
			if(callback) callback(txt);
			//else resolve(txt);
		}
	}

	if(isSync)
	{
		var xhr = new XMLHttpRequest();
		xhr.open('GET', reqUrl, false);
		xhr.send(null);
		if(xhr.status >= 200 && xhr.status < 300) _successHandler(xhr.responseText);
		else { if(callback) callback.call(trgEle, null); }
	}
	else
	{
		fetch(reqUrl).then(function(r) { return r.text(); }).then(function(txt)
		{
			_successHandler(txt);
		}).catch(function()
		{
			if(callback) callback.call(trgEle, null);
			//else resolve(null);
		});
	}
};

afc.loadHtmlSync = function(trgEle, url, callback, searchValue, newValue)
{
	afc._loadHtmlHelper(trgEle, url, callback, searchValue, newValue, true);
};

afc.loadHtml = function(trgEle, url, callback, searchValue, newValue) 
{
    //console.log('html url : ' ,url);  

	return new Promise(function(resolve, reject) 
	{
		afc._loadHtmlHelper(trgEle, url, function(txt)
		{
			if(callback) callback.call(trgEle, txt);
			else 
            {
                if(txt) resolve(txt);
                else reject();
            }
			
		}, searchValue, newValue, false);
	});	
};

afc.scriptMap = {};
afc.cssMap = {};

afc.versionMap = null;

afc.setVersionMap = function(obj)
{
	if(!afc.versionMap) afc.versionMap = {};

	var url, p;
	
    for(p in obj)
	{
		url = p;
		
		url = url.replace('.cls', '.js');
		url = url.replace('.lay', '.html');
		
		afc.versionMap[url] = obj[p];
	}
};


afc.getFileSrc = function(url, isEnc)
{
	var retVal = '';
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, false);
	try
	{
		xhr.send(null);
		if(xhr.status >= 200 && xhr.status < 300)
		{
			if(isEnc)
			{
				//GibberishAES.size(128);
				//retVal = GibberishAES.aesDecrypt(xhr.responseText, 'asydhf745igjdfdf'); //asydhf745igjdfdf 암호화 키(16자리)
			}
			else retVal = xhr.responseText;
		}
		else retVal = null;
	}
	catch(e)
	{
		retVal = null;
	}

	return retVal;
};

//특별히 afc.import 로직을 타지 말아야 할 경우를 제외하면 
//화면 개발 시점에는 afc.import 를 사용할 것.
afc.loadScript = function(url, callback, isReload)
{
	//Promise 지원
	var prom = new Promise(function(resolve, reject) 
	{
		var pre = '';
		if(PROJECT_OPTION.build.subName) pre = PROJECT_OPTION.build.subName + '/';

		//여기서 하면 안됨..
		//url = pre + url.replace('.cls', '.js');

		url = url.replace('.cls', '.js');

		if(isReload) afc.removeScript(url);
		
		
		var scriptObj = afc.scriptMap[url];

		if(scriptObj)
		{
			//네트웍 로딩 상태이면
			if(scriptObj.isPending)
			{
				if(!scriptObj.pendingQueue) scriptObj.pendingQueue = [];

				if(callback) scriptObj.pendingQueue.push(callback);
				else scriptObj.pendingQueue.push(resolve);
			}
			else 
			{
                //cache is true
				if(callback) callback(true);
				else resolve(true);
			}		
		}
		else
		{
			scriptObj = {};
			//펜딩 상태로 셋팅하고 로드를 시작한다.
			scriptObj.isPending = true;

			afc.scriptMap[url] = scriptObj;

			if(afc.versionMap)
			{
				var vCode = afc.versionMap[url];
				if(vCode) url += '?v=' + vCode;
			}

			if(!afc.isLoadCache)
			{
				var _add = Math.random();

				if(url.indexOf('?')>-1) url += _add;
				else url += '?' + _add;
			}
			
			var tag = document.createElement('script');
			
			var retFunc = function(success)
			{
				var pendingQueue = scriptObj.pendingQueue;

				scriptObj.isPending = undefined;
				scriptObj.pendingQueue = undefined;
				
				//실패 시 지운다.
				if(!success) afc.scriptMap[url] = null;

				if(callback) callback();
				else resolve();

				//펜딩큐에 있는 콜백함수들에게도 알린다.
				if(pendingQueue)
				{
					pendingQueue.forEach(function(_callback)
					{
						_callback();
					});
				}			
			
			};

			tag.onload = function()
			{
				//if(callback) callback(resolve);
				//else resolve(url);
				
				
				retFunc(true);
			};
			
			tag.onerror = function()
			{
				//if(callback) callback(resolve);
				//else resolve(null);
				
				
				retFunc(false);
			};
			
			tag.src = pre + url;
			tag.defer = true;
			
            //console.log('script url : ' , tag.src);
			document.getElementsByTagName('head')[0].appendChild(tag);
		}

	});
	
	//if(!callback) afc.scriptWait.addProm(prom);
	
	return prom;
	
};

/*
if(window._isDev_)
{
	afc.loadScript = afc_.loadScript;
	afc._loadScriptWait = function(url)
	{
		var prom = new Promise(function(resolve, reject) 
		{
			afc.loadScript(url);
			
			resolve();
			//if(callback) callback();
		});
		
		return afc.scriptWait.addProm(prom);
	};
}
*/

afc.removeScript = function(url, objNameArr)
{
	var node = document.querySelector('[src="' + url + '"]');
	if(node) node.remove();
	
	afc.scriptMap[url] = undefined;
	
	if(objNameArr)
	{
		objNameArr.forEach(function(name)
		{
			delete window[name];
		});
	}
};

//하나의 파일로 연결할 때도 다음 로직을 사용한다.
afc.existScriptSrc = function(chkSrc)
{
	var ss = document.getElementsByTagName('script'),
		src, loc = window.location.href;
		
	loc = loc.substring(0, loc.lastIndexOf('/')+1);

	for(var i=0; i<ss.length; i++)
	{
		src = ss[i].src.replace(loc, '');
		
		if(src==chkSrc) return true;
	}
	
	return false;
};

afc.setIndexScriptMap = function(loc)
{
	var ss = document.getElementsByTagName('script'), src;

	if(!loc) loc = window.location.href;
		
	var subLen = PROJECT_OPTION.build.subLength;
	
	//html 의 위치와 script 의 위치가 다르면 sbuLen 은 2 이상일 수 있다.
	if(!subLen) subLen = 1;
	
	for(var h=0; h<subLen; h++)
		//loc = loc.substring(0, loc.lastIndexOf('/')+1);
		loc = loc.substring(0, loc.lastIndexOf('/'));
		
	loc += '/';
		
	//console.log('loc => ' + loc);
		
	for(var i=0; i<ss.length; i++)
	{
		src = ss[i].src.replace(loc, '');
		
		src = src.split('?')[0];
		
		if(!afc.scriptMap[src])
		{
			afc.scriptMap[src] = {};

			//console.log('afc.setIndexScriptMap => ' + src);
		}
		//else console.log('afc.setIndexScriptMap already => ' + src);
	}
};


//--------------------------------------------------------------------
//	ex) <link href="styles.css" rel="stylesheet" media="all and (max-width: 1024px)">

afc.loadCss = function(url, attrObj)
{
	var pre = '';
	if(PROJECT_OPTION.build.subName) pre = PROJECT_OPTION.build.subName + '/';
	
	if(!afc.cssMap[url])
	{
		afc.cssMap[url] = true;
	
		/*
		var strAttr = '';
		
		if(attrObj)
		{
			for(var p in attrObj)
				strAttr += ' ' + p + '="' + attrObj[p] + '"';
		}
		
		$('<link rel="stylesheet" href="' + pre + url + '"' + strAttr + '/>').appendTo('head');
		*/
		
		var link = document.createElement('link');
		link.rel = "stylesheet";
		link.href = pre + url;
		
		if(attrObj)
		{
			for(var p in attrObj)
				link[p] = attrObj[p];
		}
		
		document.getElementsByTagName('head')[0].appendChild(link);
	}
};

afc.removeCss = function(url)
{
	var pre = '';
	if(PROJECT_OPTION.build.subName) pre = PROJECT_OPTION.build.subName + '/';
	
	var linkEl = document.querySelector('head link[href="' + pre + url + '"]');
	if(linkEl) linkEl.remove();
	
	// 2번 이상 로드를 하는 경우 로드여부를 제거해야 다시 loadCss를 호출할 수 있으므로 제거한다.
	delete afc.cssMap[url];
};

afc.refreshApp = function(cntr)
{
	var tmp = document.createElement('div');
	Object.assign(tmp.style, {position:'absolute', zIndex:'0', width:'1px', height:'1px'});
	tmp.textContent = ' ';

	if(!cntr) cntr = document.body;

	cntr.appendChild(tmp);

	setTimeout(function() { tmp.remove(); }, 700);
};

//컴포넌트 클래스가 구현 가능한 모든 이벤트 목록을 얻어온다. 
//셋팅한 파라미터의 이벤트 목록만 리턴한다. 둘다 null 이면 AEvent.events 리턴
afc.getEventList = function(baseName)
{
	/*
	var retArr = AEvent.events;
	
	if(baseName) retArr = retArr.concat(window[baseName+'Event'].events);
	if(className && baseName!=className) 
	{
		var evtClass = window[className+'Event'];
		if(evtClass) retArr = retArr.concat(evtClass.events);
	}
	
	return retArr;
	*/
	var ctx = window[baseName].CONTEXT;
	
	if(ctx) return ctx.events.concat(AEvent.defEvents);
	else return [];
};

//컴포넌트 클래스가 구현 가능한 자식이벤트 목록을 얻어온다. AView(_childSelect==2)에서만 사용한다.
afc.getChildEventList = function(baseName)
{
	var ctx = window[baseName].CONTEXT;
	if(ctx && ctx.childEvents) return ctx.childEvents.concat();
	else return [];
};

//--------------------------------------------------------------------------------------------
// About Device & Version
//--------------------------------------------------------------------------------------------

afc.isAndroid = false;
afc.isIos = false;
afc.isTizen = false;
afc.isPC = false;
afc.isMobile = false;
afc.isSimulator = false;
afc.isChrome = false;
afc.isIE = false;
afc.isHybrid = false;
afc.isSamsungBrowser = false;
afc.isFirefox = false;

afc.isTablet = false;
afc.isPhone = false;

//pc
afc.isWindow = false;
afc.isMac = false;
afc.isLinux = false;

//
afc.isExec = false;		//old chrome bridge version
afc.isNwjs = false;		//node webkit, nwjs
afc.isElectron = false;	//electron
afc.isCloud = false;	//클라우드 버전, 웹버전


afc.andVer = 1000.0;	//버전값으로만 ios 제외하기 위해 , 4.1, 4.2 ...
afc.iosVer = 1000.0;	//7.0, 7.1 ...

afc.strAndVer = ''; 	//4.1.2
afc.strIosVer = '';		//7.1.2
afc.strIEVer = '';		//edge

afc.strModuleName = '';
afc.scrlWidth = 17;

afc.OS = '';
afc.DIV = '/';

//Win32
if(window.navigator.platform.indexOf('Win')>-1) 
{
	afc.OS = 'WIN';
	afc.DIV = '\\';
	afc.isWindow = true;
}
//MacIntel
else if(window.navigator.platform.indexOf('Mac')>-1) 
{
	afc.OS = 'MAC';
	afc.DIV = '/';
	afc.isMac = true;
}
else
{
	afc.OS = 'LNX';
	afc.DIV = '/';
	afc.isLinux = true;
}


afc.isDeviceOf = function(device)
{
	return (navigator.userAgent.indexOf(device)>-1);
};

afc.androidVersion = function()
{
	var match = navigator.userAgent.match(/Android\s([0-9\.]*)/);
	afc.strAndVer = match ? match[1] : null;
	
	return afc.strAndVer;
};

afc.iosVersion = function()
{
	var match;
	if(afc.isDeviceOf('iPhone')) 
	{
		match = navigator.userAgent.match(/iPhone OS\s([0-9\_]*)/);
	}
	else if(afc.isDeviceOf('iPad'))
	{
		match = navigator.userAgent.match(/iPad; CPU OS\s([0-9\_]*)/);
	}
	
	afc.strIosVer = match ? match[1] : null;
	
	if(afc.strIosVer) 
	{
		afc.strIosVer = afc.strIosVer.replace(/_/g, '.');
		return afc.strIosVer;
	}
	else return null; 
};

afc.makeMeta = function()
{
	//------------------------------------------------------------------------------
	//  param check
	//------------------------------------------------------------------------------
    var params = afc.getUrlParameter();
    var scale = params['scale'];
    var density = params['density'];
    
	afc.urlParameter = params;
	
    //alert(navigator.userAgent);
    
	//var meta = null,
	//	docWidth = PROJECT_OPTION.general.docWidth;
	
	var meta = document.createElement('meta'), docWidth = null, content;
	meta.setAttribute('name', 'viewport');
	
	//이전 버전
	if(PROJECT_OPTION.general.phoneDocWidth==undefined) docWidth = PROJECT_OPTION.general.docWidth;
	
	//폰, 태블릿 별 세로모드 시점의 document width
	else docWidth = afc.isPhone ? PROJECT_OPTION.general.phoneDocWidth : PROJECT_OPTION.general.tabletDocWidth;

	
	//자동으로 스케일 값을 계산해 주는 경우
	if(PROJECT_OPTION.general.autoScale)
	{
		//킷캣 이하 버전
		//if(density)	meta = '<meta name="viewport" content="width=device-width, target-densitydpi=' + density + 'dpi';
		if(density)	content = `width=device-width, target-densitydpi=${density}dpi`;
		else
		{
			//screen width, height 가 세로모드일 때... 800, 1280 이었으면 
			//가로모드일 때는 1280, 800 이다. 
			
			//가로모드로 시작할 경우, 스케일 계산 오류 수정
			var chkWidth = Math.min(screen.width, screen.height);
			
			//######################################################################
			//	차후 각 기기별(폰, 태블릿, 제품별)로 chkWidth 가 어떻게 나오는지 확인해서
			//	docWidth 를 지정하지 않은 경우 자동으로 할당해줄 최적값을 구하도록 한다.
			//######################################################################
			
			//auto 로 지정한 경우
			if(!docWidth)
			{
				//태블릿 인 경우
				if(afc.isTablet) docWidth = afc.TABLET_DOC_WIDTH;	//1280;
				else docWidth = afc.PHONE_DOC_WIDTH;				//640
			}
			
			//alert(screen.width + ', ' + screen.height);

			if(!scale) scale = chkWidth / docWidth;
			
			//확대시킬 경우, 가로나 세로가 body 를 넘어가 스크롤이 발생
			if(scale>1)
			{
				document.body.style.overflow = 'hidden';
			}
			
			//meta = '<meta name="viewport" content="width=device-width, initial-scale=' + scale;
			content = `width=device-width, initial-scale=${scale}`;
			
			PROJECT_OPTION.general.scaleVal = scale;
		}
	}
	
	//설정값으로 스케일 하는 경우
	else
	{
		//meta = '<meta name="viewport" content="width=' ;
		//meta += !docWidth ? 'device-width' : docWidth;	//자동인 경우는 diveice-width, 아닌 경우는 설정값으로
		//meta += ', initial-scale=' + PROJECT_OPTION.general.scaleVal;
		content = `width=${!docWidth ? 'device-width' : docWidth}, initial-scale=${PROJECT_OPTION.general.scaleVal}`;	
		//자동인 경우는 device-width, 아닌 경우는 설정값으로
	}

	//if(PROJECT_OPTION.general.userScalable && !afc.isHybrid) meta += ', user-scalable=yes"/>';
	//else meta += ', user-scalable=no"/>';
	if(PROJECT_OPTION.general.userScalable && !afc.isHybrid) content += ', user-scalable=yes';
	else content += ', user-scalable=no';
	
	meta.setAttribute('content', content);
	
console.log(meta);
	
	document.getElementsByTagName('head')[0].prepend(meta);//$(meta).prependTo('head');
   	
	var metaCSP = document.createElement('meta');
	metaCSP.setAttribute('http-equiv', 'Content-Security-Policy');
	metaCSP.setAttribute('content', "connect-src *; default-src * gap://ready file:; img-src * data: blob:; style-src * 'unsafe-inline'; script-src * 'unsafe-inline' 'unsafe-eval'");
	document.head.insertBefore(metaCSP, document.head.firstChild);

	//아이폰 숫자 폰번호 인식 방지
	var metaFmt = document.createElement('meta');
	metaFmt.setAttribute('name', 'format-detection');
	metaFmt.setAttribute('content', 'telephone=no');
	document.head.insertBefore(metaFmt, document.head.firstChild);
};

afc.changeScale = function(scale)
{
	if(!scale) scale = PROJECT_OPTION.general.scaleVal;
	var viewport = document.querySelector('meta[name="viewport"]');
	viewport.content = viewport.content.replace(/initial-scale[\s\S]*?(?=,|")/, 'initial-scale='+scale);
};

afc.browserCheck = function()
{
	var agent = navigator.userAgent.toLowerCase(); 
	var name = navigator.appName;

	// IE old version ( IE 10 or Lower ) 
	if ( name == "Microsoft Internet Explorer" ) afc.strIEVer = "msie"; 
	else 
	{
		// IE 11 
		if(agent.indexOf("trident") > -1) afc.strIEVer = "trident"; 
		// Microsoft Edge  
		else if(agent.indexOf("edge/") > -1 )
		{
			afc.strIEVer = "edge";
			//edge에서 12에서 17로 변경.
			afc.scrlWidth = 17;
		}
		
		else if(agent.indexOf("chrome") > -1) 
		{
			afc.isChrome = true;
			afc.scrlWidth = 17;
			
			//프로젝트에서 커스텀한 경우 이 값을 변경한다.
		}
	}
	
	afc.isIE = (afc.strIEVer!='');
	
	if(afc.isDeviceOf('SamsungBrowser')) 
	{
		afc.isSamsungBrowser = true;
	}
	
	if(afc.isDeviceOf('Firefox'))
	{
		afc.isFirefox = true;
		afc.scrlWidth = 17;
	}
};

afc.deviceCheck = function()
{
	if(window.exec) afc.isExec = true;
	else if(window.nw) afc.isNwjs = true;	//node webkit, nwjs
	else 
	{
		if(afc.isDeviceOf(' Electron/')) afc.isElectron = true;
		else
		{
			afc.isCloud = true;				//클라우드 버전, 웹버전
			afc.DIV = '/';
		}
	}

	afc.isMobile = true;
	
	afc.isHybrid = (window.PROJECT_OPTION && PROJECT_OPTION.build.bridgeName!='none');
	
	//스파이더젠 시뮬레이터, 크롬 브라우저이지만 agent 에 Simulator 값을 가지고 있다.
	if(afc.isDeviceOf('Simulator'))
	{
		afc.isSimulator = true;
	}
	
	//----------------------------------------
	
	
	if(afc.isDeviceOf('Android')) 
	{
		afc.isAndroid = true;
		afc.andVer = parseFloat(afc.androidVersion());
	}
	else if(afc.isDeviceOf('iPhone') || afc.isDeviceOf('iPad') || afc.isDeviceOf('iPod')) 
	{
		//ios 13이상의 아이패드에서 userAgent에서 iPad가 빠지고 맥os로 자동변경되어
		//아이패드라는걸 인식하지 못하는 이슈가 있는데 이는 네이티브에서 처리해야한다.
		//RND\SpiderGen3.0\document의 Wkebview 가이드 참고.
		afc.isIos = true;
		afc.iosVer = parseFloat(afc.iosVersion());
		
		//document에 touchend 이벤트를 바인드하지 않으면 아이폰에서 특정 컴포넌트의 touchend가 가끔식 발생하지 않음
		document.addEventListener('touchend', function(e){});
	}
	else if(afc.isDeviceOf('Tizen')) 
	{
		afc.isTizen = true;
	}
	
	//pc 
	else
	{
		//alert(navigator.userAgent);
		
		afc.isPC = true;
		afc.isMobile = false;
		
		//시뮬레이터에서 모바일 모드로 변경할 수 있으므로 여기서 비교하면 안됨.		
		//if(afc.isDeviceOf('Simulator'))
		//{
		//	afc.isSimulator = true;
		//}
	}
	
	if(afc.isMobile)
	{
		var chkWidth = Math.min(screen.width, screen.height);
	
		//###########################################################################################################
		// 예외 상황이 있을 경우 window.devicePixelRatio 값도 비교해 보기
		//###########################################################################################################

		if(!PROJECT_OPTION.general.tabletMinWidth) PROJECT_OPTION.general.tabletMinWidth = 500;
		
		afc.isTablet = (chkWidth>PROJECT_OPTION.general.tabletMinWidth);
		afc.isPhone = !afc.isTablet;
		
		//모바일일때만 키보드매니저를 동적으로 추가해준다. 비동기 로드
		afc.import('Framework/afc/library/KeyboardManager.js');
		afc.import('Framework/afc/library/ScrollIndicator.js');
	}
	
	
	//시뮬레이터 pc모드인데 브릿지 셋팅이 되어 있으면 모바일 처럼 작동하기위해 
	//스크롤바를 숨김
	if(afc.isPC && afc.isSimulator && afc.isHybrid )
	{
		var strCss = '::-webkit-scrollbar { display: none; }'; 
		var styleEl = document.createElement('style');
		styleEl.textContent = strCss;
		document.head.appendChild(styleEl);
	}
	
	if(window.PROJECT_OPTION && !window._isDev_)
	{
		if(PROJECT_OPTION.deployment.checkVersion)
		{
			afc.import('Source/Version.js?ver=' + Date.now());
		}
	
		if(PROJECT_OPTION.build.bridgeName=='cordova')
		{
			//시뮬레이터 모바일 모드에서 오류가 발생하므로
			//무조건 windows/cordova.js 를 로드한다.
			if(afc.isSimulator) afc.import('Bridge/windows/cordova.js');
			else if(afc.isIos) afc.import('Bridge/ios/cordova.js');
			else if(afc.isAndroid) afc.import('Bridge/android/cordova.js');
			else if(afc.isPC) afc.import('Bridge/windows/cordova.js');
		}
	}
};

//--------------------------------------------------------------------------------------------
// About BugFix
//--------------------------------------------------------------------------------------------

//스타일을 동적으로 수정하기
afc.addRule = function(sheet, selector, styles)
{
	if(sheet.insertRule) return sheet.insertRule(selector + '{' + styles + '}');
	if(sheet.addRule) return sheet.addRule(selector, styles);
};

//전화걸기
//This function is deprecated, instead of this, use AppManager.phoneCall()
/*
afc.phoneCall = function(phoneNumber)
{
	var phoneStr = 'tel:'+phoneNumber;
	if(afc.isAndroid) AppManager.goUrl(phoneStr);
	else if(afc.isIos) window.location = phoneStr;
};
*/

//pos자리만큼 소수점 버림
afc.floor = function(value, pos) 
{
	//var digits = Math.pow(10, pos);
	//return parseFloat(parseInt(value*digits, 10)/digits).toFixed(pos);

	if(!pos) pos = 0

	const digits = Math.pow(10, pos);
	return Math.floor((value+Number.EPSILON) * digits) / digits
};

//pos자리만큼 소수점 버림 + '%'
afc.floorPer = function(value, pos) 
{
	var digits = Math.pow(10, pos);
	return parseFloat(parseInt(value*digits, 10)/digits).toFixed(pos)+'%';
};


//pos만큼 소수점 자리 자르기
afc.floatFix = function(value, pos) 
{
	if(!value) value = 0;
	else value = parseFloat(value);
	
	if(!pos) pos = 2;
	return value.toFixed(pos);
};

//천단위마다 콤마 추가
afc.addComma = function(val) 
{
	if(val != undefined)
	{
		var reg = /(^[+-]?\d+)(\d{3})/;   // 정규식
		val += '';  // 숫자를 문자열로 변환
		while (reg.test(val))
			val = val.replace(reg, '$1' + ',' + '$2');
		return val;	
	}
	else return '';
	
	/*
	if(val != undefined) return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	else return '';
	*/
};

//천단위마다 콤마 추가 값이 0인 경우 특수문자 "　" 리턴
afc.hogaComma = function(val) 
{
	if(val != 0)
	{
		var reg = /(^[+-]?\d+)(\d{3})/;   // 정규식
		val += '';  // 숫자를 문자열로 변환
		while (reg.test(val))
			val = val.replace(reg, '$1' + ',' + '$2');
		return val;	
	}
	else return '　';
	
	/*
	if(val != undefined) return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	else return '';
	*/
};

//콤마 삭제
afc.removeComma = function(val) 
{
	if(!val) return '';
	else return val.toString().replace(/,/g, '');
};

//더미 데이터의 길이만큼 '*'를 생성
afc.makeDummyString = function(length) 
{
	var dumStr = '';
	for(var i=0; i<length; i++) dumStr += '●';
	return dumStr;
};

//계좌정보에서 계좌정보에 셋팅할 텍스트를 생성
afc.makeAccText = function(accInfo, isGroup) 
{
	var regAcNo = accInfo['D1계좌번호'];
	var accText = '';
	if(theApp.systemInfo)
	{
		accText = theApp.systemInfo.makeAccNumber(regAcNo);
	}
	else accText = regAcNo.substring(0, 3) + "-" + regAcNo.substring(3, 5) + "-" + regAcNo.substring(5, regAcNo.length);
	return accText;
};

//랜덤컬러값을 생성
afc.getRandomColor = function()
{
	return "#"+((1<<24)*Math.random()|0).toString(16);
};

//DATE객체를 String으로 
afc.dateToString = function(date) 
{
	//return sprintf('%4d%02d%02d', date.getFullYear(), date.getMonth()+1, date.getDate());
	return date.getFullYear().zf(4) + (date.getMonth()+1).zf(2) + date.getDate().zf(2);
};

afc.formatDate = function(dateNum)
{
	if(!parseInt(dateNum, 10)) return '';
    dateNum+='';
    return dateNum.substring(0,4)+'/'+dateNum.substring(4,6)+'/'+dateNum.substring(6,8); 
};

afc.formatDate2 = function(dateNum)
{
	if(!parseInt(dateNum, 10)) return '';
    dateNum+='';
    return dateNum.substring(2,4)+'/'+dateNum.substring(4,6)+'/'+dateNum.substring(6,8); 
};

afc.formatMonth = function(monthNum)
{
    monthNum+='';
	return monthNum.substring(0,4)+'/'+monthNum.substring(4,6); 
};

afc.formatDateTime = function(datetimeNum)
{
    datetimeNum+='';
	return datetimeNum.substring(0,2)+'/'+datetimeNum.substring(2,4)+' '+datetimeNum.substring(4,6)+':'+datetimeNum.substring(6,8); 
};

afc.formatTime = function(time)
{
	if(!parseInt(time, 10)) return '';
	
	var map1 = { '31000000':'장마감',
			   '41000000':'시간외마감',
			   '51000000':'장전',
			   '61000000':'장중',
			   '71000000':'장후',
			   '81000000':'단일가',
			   '88000000':'단일가 마감',
			   '91000000':'BN 마감',
			   '91000001':'BN 마감',
			   '91000002':'BN 마감',
			   '91000003':'BN 마감',
			   '91000004':'BN 마감',
			   '91000005':'BN 마감',
			   '91000006':'BN 마감',
			   '91000007':'BN 마감',
			   '91000008':'단일가BN마감'};
	if(map1[time]) return map1[time];
	
	var map2 = ['3','4','5','6','7','8','9'];
    time+='';
	if(map2.indexOf(time.substring(0,1)) > -1) time = '0' + time;	

	return time.substring(0,2)+':'+time.substring(2,4); 
};

afc.formatHMS = function(time)
{
	if(!parseInt(time, 10)) return '';
	
	var map1 = { '31000000':'장마감',
			   '41000000':'시간외마감',
			   '51000000':'장전',
			   '61000000':'장중',
			   '71000000':'장후',
			   '81000000':'단일가 마감',
			   '88000000':'단일가 마감',
			   '91000000':'BN 마감',
			   '91000001':'BN 마감',
			   '91000002':'BN 마감',
			   '91000003':'BN 마감',
			   '91000004':'BN 마감',
			   '91000005':'BN 마감',
			   '91000006':'BN 마감',
			   '91000007':'BN 마감',
			   '91000008':'단일가BN마감'};
	if(map1[time]) return map1[time];
	
	var map2 = ['3','4','5','6','7','8','9'];
    time+='';
	if(map2.indexOf(time.substring(0,1)) > -1) time = '0' + time;

	return time.substring(0,2)+':'+time.substring(2,4)+':'+time.substring(4,6);
};

afc.formatTic = function(ticNum)
{
    ticNum+='';
	return ticNum.substring(0,2)+' '+ticNum.substring(2,4)+':'+ticNum.substring(4,6)+':'+ticNum.substring(6,8); 
};

afc.formatSecond = function(t)
{
    t+='';
	return t.substring(0,2)*3600+t.substring(2,4)*60+t.substring(4,6)*1; 
};

afc.switchButtonColor = function(comp)
{
	comp.removeClass('BT38_K00007');
	
    if(comp.getText() == 'ON')
	{
		comp.removeClass('BT92_K06102');
		comp.addClass('BT91_K06101');
	}
	else
	{
		comp.removeClass('BT91_K06101');
		comp.addClass('BT92_K06102');
	}
};

afc.returnAsIt = function(val)
{
	return val;
};

afc.abs = function(val)
{/*
	if(val == '') val = 0;
	else val *= 1;
	
	return val<0 ? val*-1 : val;*/
	val = val.toString();
	if(val.charAt(0) == '-') return val.substring(1);
	else return val;
};

afc.addPercent = function(val)
{
	return val + '%';
};

afc.absComma = function(val)
{
	return afc.addComma(afc.abs(val));
};

afc.intComma = function(val)
{
	return afc.addComma(parseInt(val));
};

afc.absPercent = function(val)
{
	return afc.abs(val) + '%';
};

afc.commaPercent = function(val)
{
	return afc.addComma(val) + '%';
};

afc.absCommaPercent = function(val)
{
	return afc.addComma(val) + '%';
};

afc.plusfloorPercent = function(val)
{
	var digits = Math.pow(10, 2);
	var retVal = parseFloat(parseInt(val*digits, 10)/digits).toFixed(2)+'%';
	//if(val > 0) retVal = ('+'+retVal);
	return retVal;
};

//소수점2자리 버림
// afc.floor2 = function(value)
// {
// 	var digits = Math.pow(10, 2);
// 	return afc.addComma( parseFloat(parseInt(value*digits, 10)/digits).toFixed(2) );
// };

afc.floor2 = function(value)
{
	return afc.addComma( Math.floor((value+ Number.EPSILON) * 100) / 100 );
};

//소수점2자리 반올림
afc.toFixed2 = function(value)
{
	return afc.addComma(value.toFixed(2));
};

//절대값 소수점2자리 버림
afc.absFloor2 = function(value)
{
	//var digits = Math.pow(10, 2);
	//value = afc.abs(value);
	//return afc.addComma(parseFloat(parseInt(value*digits, 10)/digits).toFixed(2));

	return afc.floor2(afc.abs(value));
};


//소수점2자리 버림 + '%'
afc.floor2Per = function(value)
{
	
	if(!value) return null;  // 임의 처리 오류 확인을 하기 위함. 2016.12.01
	
//value값이 0.28 등으로 들어올 때 0.29로 javascript에서 처리하기에 toFixed 함수 새로 생성	2016.11.21. 황청유
	//var digits = Math.pow(10, 2);
	//return parseFloat(parseInt(value*digits, 10)/digits).toFixed(2)+'%';
	return ( afc.toFixed(value, 2) + '%' );
};

//num 을 소숫점 fixed 자릿수 이하에서 버리는 함수
afc.toFixed = function (num, fixed) 
{
	if((num != undefined) && (fixed != undefined))
	{
		var numArr = num.toString().split('.');
		var decimal = '';
		if(numArr[1] != undefined)
		{
			var len = numArr[1].length;
			if(len > fixed)
			{
				return parseFloat(numArr[0]+"."+numArr[1].substring(0, fixed)).toFixed(fixed);	
			}
			return parseFloat(num).toFixed(fixed);
		}
		else
		{
			return parseFloat(num).toFixed(fixed);
		}
	}
	else 
	{
		var tmp = '0.';
		for(var i = 0; i < fixed; i++) tmp = tmp + "0";
		return tmp;
	}
	
	/*
	if(!num || !fixed) { // 임의 처리 오류 확인을 하기 위함. 216.12.01
		return null;
	}
	//값이 없을 경우 처리
	if(num*10 == 0) {
		var tmp = '0.';
		for(var i = 0; i < fixed; i++) tmp = tmp + "0";
		return tmp;
	}

    var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0]; // <<- // 오류 사항 : TypeError:null is not an object (evaluation 'a.toString().match(d)'), ....
    */ 
};

afc.absFloor2Per = function(value) 
{
	var digits = Math.pow(10, 2);
	value = afc.abs(value);
	return parseFloat(parseInt(value*digits, 10)/digits).toFixed(2)+'%';
};

afc.sigaTotalAmount = function(value) 
{
	if(!value) return '0';
	else
	{
		value = value/1000000000;
		if(value < 0) return value.toFixed(2);
		else return afc.addComma(parseInt(value, 10));
	}
};

afc.capitalAmount = function(value) 
{
	if(!value) return '0';
	else
	{
		value = value/1000000;
		if(value < 0) return value.toFixed(2);
		else return afc.addComma(parseInt(value, 10));
	}
};

afc.addCommaIfFixed = function(value) 
{
	if(!value) return 0;
	else
	{
		if(value.toString().indexOf('.') > -1)
		{
			if(value<0) value *= -1;
			value = parseFloat(value)*1;
			return afc.addComma(value.toFixed(2));
		}
		else return afc.addComma(value);
	}
};

afc.absCommaIfFixed = function(value) 
{
	if(!value) return 0;
	else
	{
		if(value.toString().indexOf('.') > -1)
		{
			if(value<0) value *= -1;
			value = afc.absComma(parseFloat(value))*1;
			return value.toFixed(2);
		}
		else return afc.absComma(value);
	}
};

afc.oneHundredMillionAmount = function(value)
{
	if(!value) return '0';
	else
	{
		value = value/100000000;
		if(value < 0) return value.toFixed(2);
		else return afc.addComma(parseInt(value, 10));
	}
};

afc.isResize = true;

//------------------------------------------------------------------------------------------------------------------
Date.prototype.format = function(f) 
{
    if (!this.valueOf()) return " ";
    
    var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    var d = this;

    return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ms|ss|a\/p)/gi, function($1) 
    {
        switch ($1) 
        {
            case "yyyy": return d.getFullYear();
            case "yy": return (d.getFullYear() % 1000).zf(2);
            case "MM": return (d.getMonth() + 1).zf(2);
            case "dd": return d.getDate().zf(2);
            case "E": return weekName[d.getDay()];
            case "HH": return d.getHours().zf(2);
            case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
            case "mm": return d.getMinutes().zf(2);
			case "ms": return d.getMilliseconds().zf(3);
            case "ss": return d.getSeconds().zf(2);
            case "a/p": return d.getHours() < 12 ? "오전" : "오후";
            default: return $1;
        }
    });
};

String.prototype.str = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
String.prototype.zf = function(len){return "0".str(len - this.length) + this;};
Number.prototype.zf = function(len){return this.toString().zf(len);};

String.prototype.replaceAt = function(inx, searchVal, newVal)
{
	inx = this.indexOf(searchVal, inx);
	
	if(inx<0) return this;
	else return this.substr(0, inx) + newVal + this.substr(inx + searchVal.length);
};


//------------------------------------------------------------------------------------------------------------------

	
window.onerror = function(message, url, lineNumber, colNumber, error)
{

	if(!lineNumber || !url) return;

	//if(window.theApp) theApp.onError(message, url, lineNumber);
	//if(window.theApp) theApp.onError.apply(theApp, arguments);
	if(window.theApp) theApp.onError(message, url, lineNumber, colNumber, error);
};

window.onunhandledrejection = function(error)
{
	if(error.reason && error.reason.stack)
	{
		error.stack = error.reason.stack;
		const match = error.reason.stack.match(/(\w+:\/\/[\s\S]*?):(\d*):(\d*)/),
			  message = error.reason.message;
			  
		let url, lineNumber, colNumber;
		if(match)
		{
			url = match[1];
			lineNumber = match[2];
			colNumber = match[3];
		}
		
		window.onerror(message, url, lineNumber, colNumber, error);
	}
};

afc.loadCSSIfNotLoaded = function() 
{
    var ss = document.styleSheets;
	var headEle = document.getElementsByTagName("head")[0];
	
	var ssLen = ss.length;
    for(var i=0; i<ssLen; i++) 
	{
		if(ss[i].cssRules.length==0)
		{
			ss[i].disabled = true;
			
			var link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = ss[i].href;
			headEle.appendChild(link);
		}
    }
};

//------------------------------------------------------------------------------------------------------------------
// function call


	afc.deviceCheck();
	afc.browserCheck();

	if(!window._isDev_) afc.makeMeta();


	//다음 주석은 지우지 말 것. 화면 개발 시점에 필요한 정보
	console.log(navigator.userAgent);
	console.log('devicePixelRatio : ' + window.devicePixelRatio);
	console.log('screen : ' + screen.width + 'px, ' + screen.height+'px');
	//------------------------------------------------------------------------------------------------------------------

	afc.setIndexScriptMap();

	afc.beginTimeCheck('---- end of afc ----');







;/*
 * miniDragDrop.js — v0.3.5+appendTo (fix: clone/helper alignment by container, scroll-safe)
 * -------------------------------------------------------------
 * Draggable & Droppable (pure JS) with:
 * - click-friendly gates: cancel, distance(px), delay(ms)
 * - helper: 'original' | 'clone' | (ctx)=>Element
 * - appendTo: 'auto'|'offsetParent'|'parent'|Element|selector
 * - cursorAt: {left?, top?, right?, bottom?}
 * - scope: string | '*' | string[]   (wildcard + arrays)
 * - droppable accept/tolerance/greedy (deepest wins)
 * - transform(left/top) models + re-drag jump fix
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DragDrop = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ----------------- Utilities -----------------
  const isFn = v => typeof v === 'function';
  const isStr = v => typeof v === 'string';
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const toEl = v => (typeof v === 'string' ? document.querySelector(v) : v);
  const px = n => (n == null ? '' : `${n}px`);

  /** Absolute page-space rect (accounts for scroll). */
  function getRect(el) {
    const r = el.getBoundingClientRect();
    return {
      left: r.left + window.scrollX,
      top: r.top + window.scrollY,
      width: r.width,
      height: r.height,
      right: r.left + window.scrollX + r.width,
      bottom: r.top + window.scrollY + r.height,
    };
  }

  function matches(el, selOrFn) {
    if (!selOrFn) return true;
    if (isFn(selOrFn)) return !!selOrFn(el);
    if (isStr(selOrFn)) return el.matches(selOrFn);
    return el === selOrFn;
  }

  function dispatch(el, type, detail) {
    el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
  }

  /** Read current translate from computed transform (matrix / matrix3d). */
  function getTranslate(el) {
    const cs = getComputedStyle(el);
    const t = cs.transform || cs.webkitTransform || cs.mozTransform;
    if (!t || t === 'none') return { x: 0, y: 0 };
    if (t.startsWith('matrix3d(')) {
      const m = t.slice(9, -1).split(',').map(parseFloat);
      return { x: m[12] || 0, y: m[13] || 0 };
    }
    if (t.startsWith('matrix(')) {
      const m = t.slice(7, -1).split(',').map(parseFloat);
      return { x: m[4] || 0, y: m[5] || 0 };
    }
    return { x: 0, y: 0 };
  }

  // --- Scope helpers ---
  function normalizeScopes(v) {
    if (Array.isArray(v)) return v.map(String);
    if (v == null) return ['default'];
    return [String(v)];
  }
  function scopesMatch(draggableScope, droppableScope) {
    const ds = normalizeScopes(draggableScope);
    const zs = normalizeScopes(droppableScope);
    if (ds.includes('*') || zs.includes('*')) return true;
    return ds.some(s => zs.includes(s));
  }

  // ----------------- Manager -----------------
  const Manager = (() => {
    const droppables = new Set();
    let activeDrag = null;
    let rectCache = null;

    function register(dp) { droppables.add(dp); }
    function unregister(dp) { droppables.delete(dp); }
    function setActiveDrag(d) { activeDrag = d; }

    function beginDrag() {
      rectCache = new Map();
      Array.from(droppables)
        .filter(dp => dp.enabled)
        .forEach(dp => rectCache.set(dp, dp.rect()));
    }

    function endDrag() {
      rectCache = null;
      // 드래그 종료 시 hover 상태/캐시 정리
      Array.from(droppables).forEach(dp => {
        if (!dp) return;
        if (dp._over && dp._over.size) dp._over.clear();
        if (dp.el && dp.opts && dp.opts.hoverClass) {
          dp.el.classList.remove(dp.opts.hoverClass);
        }
      });
    }
    function _rect(dp) { return rectCache && rectCache.has(dp) ? rectCache.get(dp) : dp.rect(); }

    function hitTest(draggable, dp, pointer) {
      const dRect = draggable.helperRect();
      const zRect = _rect(dp);
      const tol = dp.opts.tolerance;

      if (tol === 'pointer') {
        return (
          pointer.x >= zRect.left && pointer.x <= zRect.right &&
          pointer.y >= zRect.top && pointer.y <= zRect.bottom
        );
      }

      const inter = !(
        dRect.right < zRect.left ||
        dRect.left > zRect.right ||
        dRect.bottom < zRect.top ||
        dRect.top > zRect.bottom
      );
      if (!inter) return false;
      if (tol === 'touch') return true;

      if (tol === 'intersect') {
        const xo = Math.max(0, Math.min(dRect.right, zRect.right) - Math.max(dRect.left, zRect.left));
        const yo = Math.max(0, Math.min(dRect.bottom, zRect.bottom) - Math.max(dRect.top, zRect.top));
        return xo * yo >= (dRect.width * dRect.height) / 2;
      }

      if (tol === 'fit') {
        return (
          dRect.left >= zRect.left &&
          dRect.top >= zRect.top &&
          dRect.right <= zRect.right &&
          dRect.bottom <= zRect.bottom
        );
      }

      return inter;
    }

    function notify(pointer) {
      if (!activeDrag) return;
      droppables.forEach(dp => {
        if (!dp.enabled) return;
        if (!dp.accepts(activeDrag)) return;
        const isHit = hitTest(activeDrag, dp, pointer);
        const wasOver = dp._over.has(activeDrag);
        if (isHit && !wasOver) {
          dp._over.add(activeDrag);
          dp.el.classList.add(dp.opts.hoverClass);
          dispatch(dp.el, 'dropover', { draggable: activeDrag, droppable: dp });
          isFn(dp.opts.onOver) && dp.opts.onOver({ draggable: activeDrag, droppable: dp });
        } else if (!isHit && wasOver) {
          dp._over.delete(activeDrag);
          dp.el.classList.remove(dp.opts.hoverClass);
          dispatch(dp.el, 'dropout', { draggable: activeDrag, droppable: dp });
          isFn(dp.opts.onOut) && dp.opts.onOut({ draggable: activeDrag, droppable: dp });
        }
      });
    }

    function tryDrop(pointer) {
      if (!activeDrag) return false;
      let dropped = false;
      const list = Array.from(droppables)
        .filter(dp => dp.enabled && dp.accepts(activeDrag))
        .sort((a, b) => b.depth - a.depth);

      for (const dp of list) {
        const isHit = hitTest(activeDrag, dp, pointer);
        if (isHit) {
          dropped = true;
          const detail = {
            draggable: activeDrag,
            droppable: dp,
            pointer,
            helperRect: activeDrag.helperRect()
          };
          dispatch(dp.el, 'drop', detail);
          isFn(dp.opts.onDrop) && dp.opts.onDrop(detail);
          break;
        }
      }
      return dropped;
    }

    return { register, unregister, setActiveDrag, notify, tryDrop, beginDrag, endDrag };
  })();

  // ----------------- Draggable -----------------
  class Draggable {
    constructor(el, opts) {
      this.el = toEl(el);
      this.opts = Object.assign({
        axis: null,
        containment: null,
        grid: null,
        handle: null,
        cancel: 'input,textarea,button,select,option,a,[contenteditable],[role="button"],[data-no-drag]',
        scope: 'default',
        helper: 'original',       // 'original' | 'clone' | function(ctx)=>Element|string
        appendTo: 'auto',         // 'auto'|'offsetParent'|'parent'|Element|selector
        revert: false,
        zIndex: null,
        cursor: 'default',
        useTransform: false,
        raf: true,
        distance: 1,
        delay: 0,
        cursorAt: null,           // {left?, top?, right?, bottom?}
        onStart: null,
        onDrag: null,
        onStop: null,
      }, opts || {});

      this.enabled = true;
      this.dragging = false;
      this._pressed = false;

      this._startX = 0; this._startY = 0;
      this._origX = 0; this._origY = 0;
      this._x = 0; this._y = 0;
      this._nextX = 0; this._nextY = 0;
      this._tx = 0; this._ty = 0;
      this._w = 0; this._h = 0;
      this._pointer = { x: 0, y: 0 };
      this._helperEl = null;
      this._helperContainer = null;
      this._helperOpRect = null;
      this._helperRemoveOnStop = false;
      this._zSaved = '';
      this._rafId = 0;
      this._bounds = null;
      this._baseRect = null;
      this._offsetBase = null;
      this._clickOffX = 0; this._clickOffY = 0;

      // delay helpers
      this._delayPassed = false;
      this._delayTid = 0;
      this._lastPt = null;

      // for useTransform(original)
      this._prevInlineTransform = '';

      this._onDown = this._onDown.bind(this);
      this._onMove = this._onMove.bind(this);
      this._onUp   = this._onUp.bind(this);
      this._tick   = this._tick.bind(this);

      this._init();
    }

    _init() {
      this.el.style.touchAction = 'none';
      this.el.style.cursor = this.opts.cursor || 'grab';
      if (window.PointerEvent) {
        this.el.addEventListener('pointerdown', this._onDown);
      } else {
        this.el.addEventListener('mousedown', this._onDown);
        this.el.addEventListener('touchstart', this._onDown, { passive: false });
      }
    }

    enable() { this.enabled = true; }
    disable() { this.enabled = false; }

    setOption(k, v) { this.opts[k] = v; if (k === 'cursor') this.el.style.cursor = v || 'grab'; return this; }
    setOptions(o) { Object.keys(o || {}).forEach(k => this.setOption(k, o[k])); return this; }
    option(k) { return this.opts[k]; }

    destroy() {
      if (window.PointerEvent) this.el.removeEventListener('pointerdown', this._onDown);
      else {
        this.el.removeEventListener('mousedown', this._onDown);
        this.el.removeEventListener('touchstart', this._onDown);
      }
    }

    _getHandleTarget(e) {
      const t = e.target instanceof Element ? e.target : this.el;
      if (this.opts.cancel && t.closest && t.closest(this.opts.cancel)) return null;
      if (!this.opts.handle) return this.el;
      const h = t.closest(this.opts.handle);
      return h && this.el.contains(h) ? h : null;
    }

    _pointerFromEvent(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].pageX, y: e.touches[0].pageY };
      if (e.pageX != null) return { x: e.pageX, y: e.pageY };
      if (e.clientX != null) return { x: e.clientX + window.scrollX, y: e.clientY + window.scrollY };
      return this._pointer;
    }

    _measureBaseRectNoTransform(el) {
      const prev = el.style.transform;
      el.style.transform = 'none';
      const r = getRect(el);
      el.style.transform = prev;
      return r;
    }

    // appendTo 우선 → 없으면 containment에 따라 기본 컨테이너 결정
    _resolveHelperContainer() {
      const at = this.opts && this.opts.appendTo;
      if (at && at !== 'auto') {
        if (at === 'offsetParent') return this.el.offsetParent || this.el.ownerDocument.body;
        if (at === 'parent')       return this.el.parentElement || this.el.ownerDocument.body;
        if (isStr(at))             return document.querySelector(at) || this.el.ownerDocument.body;
        if (at instanceof Element) return at;
      }
      if (this.opts && this.opts.containment === 'parent') {
        return this.el.parentElement || this.el.ownerDocument.body;
      }
      return this.el.ownerDocument.body;
    }

    _prepHelper() {
      const hOpt = this.opts.helper;

      // --- Custom helper via callback ---
      if (typeof hOpt === 'function') {
        const ctx = {
          element: this.el,
          options: this.opts,
          pointer: Object.assign({}, this._pointer),
          startRect: getRect(this.el),
        };
        let custom = hOpt(ctx);
        if (typeof custom === 'string') custom = document.querySelector(custom);
        if (!(custom instanceof Element)) custom = this.el.cloneNode(true);

        const wasConnected = custom.isConnected;
        const container = this._helperContainer = this._resolveHelperContainer();
        if (!wasConnected) container.appendChild(custom);
        this._helperRemoveOnStop = !wasConnected;

        custom.classList.add('dd-helper');
        custom.style.position = 'absolute';
        custom.style.pointerEvents = 'none';
        custom.style.margin = '0';
        // offsetParent 기준 초기 위치
        if (this.opts.useTransform) {
          custom.style.left = '0px';
          custom.style.top  = '0px';
        } else {
          const op = custom.offsetParent || custom.ownerDocument.body;
          const opRect = getRect(op);
          custom.style.left = px(this._origX - opRect.left);
          custom.style.top  = px(this._origY - opRect.top);
        }
        custom.style.willChange = this.opts.useTransform ? 'transform' : 'left, top';

        this._helperEl = custom;
        this._helperOpRect = getRect(this._helperEl.offsetParent || custom.ownerDocument.body);

        const r = getRect(this._helperEl); this._w = r.width; this._h = r.height;
        this._x = this._origX; this._y = this._origY; this._nextX = this._x; this._nextY = this._y;
        if (this.opts.useTransform) {
          const base = this._helperOpRect;
          this._helperEl.style.transform = `translate3d(${this._x - base.left}px, ${this._y - base.top}px, 0)`;
        }
        return;
      }

      // --- Built-in 'clone' helper ---
      if (hOpt === 'clone') {
        const clone = this.el.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.pointerEvents = 'none';
        clone.style.margin = '0';

        const container = this._helperContainer = this._resolveHelperContainer();
        if (this.opts.useTransform) {
          clone.style.left = '0px';
          clone.style.top  = '0px';
        } else {
          const op = clone.offsetParent || clone.ownerDocument.body;
          const opRect = getRect(op);
          clone.style.left = px(this._origX - opRect.left);
          clone.style.top  = px(this._origY - opRect.top);
        }
        clone.classList.add('dd-helper');
        clone.style.willChange = this.opts.useTransform ? 'transform' : 'left, top';
        (container || this.el.ownerDocument.body).appendChild(clone);

        // z-index 상속(옵션 zIndex가 없을 때)
        if (this.opts.zIndex == null) {
          const z = getComputedStyle(this.el).zIndex;
          if (z && z !== 'auto') clone.style.zIndex = z;
        }

        this._helperEl = clone;
        this._helperOpRect = getRect(this._helperEl.offsetParent || clone.ownerDocument.body);

        const r = getRect(this._helperEl); this._w = r.width; this._h = r.height;
        this._x = this._origX; this._y = this._origY; this._nextX = this._x; this._nextY = this._y;
        if (this.opts.useTransform) {
          const base = this._helperOpRect;
          this._helperEl.style.transform = `translate3d(${this._x - base.left}px, ${this._y - base.top}px, 0)`;
        }
        return;
      }

      // --- 'original' helper (default) ---
      const cs = window.getComputedStyle(this.el);
      if (cs.position === 'static') this.el.style.position = this.opts.useTransform ? 'relative' : 'absolute';
      this.el.style.willChange = this.opts.useTransform ? 'transform' : 'left, top';
      this._helperEl = this.el;
      if (this.opts.useTransform) {
        // 드래그 중 임시 transform만 쓰고, 끝나면 원복하기 위해 백업
        this._prevInlineTransform = this._helperEl.style.transform || '';
        const cur = getTranslate(this._helperEl); this._tx = cur.x || 0; this._ty = cur.y || 0;
        this._baseRect = this._measureBaseRectNoTransform(this._helperEl);
        const rNow = getRect(this._helperEl); this._w = rNow.width; this._h = rNow.height;
        this._x = 0; this._y = 0; this._nextX = 0; this._nextY = 0;
        this._helperEl.style.transform = `translate3d(${this._tx}px, ${this._ty}px, 0)`;
      } else {
        const op = this._helperEl.offsetParent || document.body; this._offsetBase = getRect(op);
        const rNow = getRect(this._helperEl); this._w = rNow.width; this._h = rNow.height;
        this._x = rNow.left - this._offsetBase.left; this._y = rNow.top - this._offsetBase.top;
        this._nextX = this._x; this._nextY = this._y;
        this._helperEl.style.left = px(this._x); this._helperEl.style.top = px(this._y);
      }
    }

    // computes pointer anchor inside helper from options or from initial click
    _computeCursorAt() {
      const ca = this.opts.cursorAt;
      if (!ca) { this._clickOffX = this._startX - this._origX; this._clickOffY = this._startY - this._origY; return; }
      const w = this._w || 0, h = this._h || 0;
      let offX, offY;
      if (ca.left != null) offX = ca.left; else if (ca.right != null) offX = Math.max(0, w - ca.right); else offX = this._startX - this._origX;
      if (ca.top  != null) offY = ca.top;  else if (ca.bottom!= null) offY = Math.max(0, h - ca.bottom); else offY = this._startY - this._origY;
      this._clickOffX = offX; this._clickOffY = offY;
    }

    helperRect() {
      if (this.opts.useTransform && this._helperEl === this.el) {
        const left = this._baseRect.left + this._tx + this._x;
        const top  = this._baseRect.top  + this._ty + this._y;
        return { left, top, right: left + this._w, bottom: top + this._h, width: this._w, height: this._h };
      }
      if (!this.opts.useTransform && this._helperEl === this.el && this._offsetBase) {
        const left = this._offsetBase.left + this._x;
        const top  = this._offsetBase.top  + this._y;
        return { left, top, right: left + this._w, bottom: top + this._h, width: this._w, height: this._h };
      }
      return { left: this._x, top: this._y, right: this._x + this._w, bottom: this._y + this._h, width: this._w, height: this._h };
    }

    _applyPosition(absX, absY) {
      let x = absX, y = absY;
      if (this.opts.axis === 'x') y = this._origY;
      if (this.opts.axis === 'y') x = this._origX;
      if (Array.isArray(this.opts.grid)) { const [gx, gy] = this.opts.grid; x = Math.round(x / gx) * gx; y = Math.round(y / gy) * gy; }

      if (this.opts.useTransform && this._helperEl === this.el) {
        x = x - this._baseRect.left - this._tx;
        y = y - this._baseRect.top  - this._ty;
      } else if (!this.opts.useTransform && this._helperEl === this.el && this._offsetBase) {
        x -= this._offsetBase.left;
        y -= this._offsetBase.top;
      }

      if (this._bounds) {
        x = clamp(x, this._bounds.left, this._bounds.right);
        y = clamp(y, this._bounds.top,  this._bounds.bottom);
      }

      this._nextX = x; this._nextY = y;
      if (!this._rafId && this.opts.raf) this._rafId = requestAnimationFrame(this._tick);
      if (!this.opts.raf) this._commitPosition();
    }

    _commitPosition() {
      this._x = this._nextX; this._y = this._nextY;

      if (this.opts.useTransform) {
        if (this._helperEl === this.el) {
          // 원본 요소: baseRect + tx/ty 기준 델타
          this._helperEl.style.transform =
              `translate3d(${this._tx + this._x}px, ${this._ty + this._y}px, 0)`;
        } else {
          // clone/custom helper: offsetParent 기준 translate
          const base = this._helperOpRect || getRect(this._helperEl.offsetParent || document.body);
          this._helperEl.style.transform =
              `translate3d(${this._x - base.left}px, ${this._y - base.top}px, 0)`;
        }
      } else {
        if (this._helperEl === this.el) {
          // 원본 요소: offsetParent 기준 left/top
          this._helperEl.style.left = px(this._x);
          this._helperEl.style.top  = px(this._y);
        } else {
          // clone/custom helper: offsetParent 기준 left/top
          const opRect = this._helperOpRect || getRect(this._helperEl.offsetParent || document.body);
          this._helperEl.style.left = px(this._x - opRect.left);
          this._helperEl.style.top  = px(this._y - opRect.top);
        }
      }
    }

    _tick() {
      this._rafId = 0;
      this._commitPosition();
      Manager.notify(this._pointer);
      dispatch(this.el, 'dragmove', { draggable: this, pointer: this._pointer });
      isFn(this.opts.onDrag) && this.opts.onDrag({ draggable: this, pointer: this._pointer });
    }

    _computeBounds() {
      const c = this.opts.containment; if (!c) return null;
      const w = this._w, h = this._h;
      const make = r => ({ left: r.left, top: r.top, right: r.right - w, bottom: r.bottom - h });
      let b;
      if (c === 'parent') b = make(getRect(this.el.parentElement));
      else if (typeof c === 'string' || c instanceof Element) b = make(getRect(toEl(c)));
      else if (typeof c === 'object') b = make(c);
      else return null;

      if (this.opts.useTransform && this._helperEl === this.el) {
        b = {
          left:   b.left   - this._baseRect.left - this._tx,
          top:    b.top    - this._baseRect.top  - this._ty,
          right:  b.right  - this._baseRect.left - this._tx,
          bottom: b.bottom - this._baseRect.top  - this._ty,
        };
      } else if (!this.opts.useTransform && this._helperEl === this.el && this._offsetBase) {
        b = {
          left:   b.left   - this._offsetBase.left,
          top:    b.top    - this._offsetBase.top,
          right:  b.right  - this._offsetBase.left,
          bottom: b.bottom - this._offsetBase.top,
        };
      }
      return b;
    }

    _startDragging() {
      // heavy prep happens here (after threshold)
      this._prepHelper();
      this._computeCursorAt();
      this._bounds = this._computeBounds();
      if (this.opts.zIndex != null) { this._zSaved = this._helperEl.style.zIndex; this._helperEl.style.zIndex = String(this.opts.zIndex); }
      //this._helperEl.style.cursor = 'grabbing';

      this.dragging = true;
      Manager.setActiveDrag(this);

      // 1) 먼저 dragstart/사용자 onStart를 호출해, 여기서 droppable을 보여줄 기회를 줌
      dispatch(this.el, 'dragstart', { draggable: this });
      isFn(this.opts.onStart) && this.opts.onStart({ draggable: this });
      // 2) 그 다음에 드롭존 캐시를 구성 (이 시점엔 droppable이 보이는 상태)
      Manager.beginDrag();
      // 3) 즉시 히트테스트/hover 반영
      Manager.notify(this._pointer);

      this._onWinEvt = () => {
        if (this.dragging) {
          Manager.beginDrag();
          if (this._helperEl && this._helperEl !== this.el) {
            this._helperOpRect = getRect(this._helperEl.offsetParent || document.body);
          }
          this._commitPosition();
        }
      };
      window.addEventListener('scroll', this._onWinEvt, { passive: true });
      window.addEventListener('resize', this._onWinEvt, { passive: true });
    }

    _clearDelayTimer() { if (this._delayTid) { clearTimeout(this._delayTid); this._delayTid = 0; } }

    _maybeStartDragOnConditions(e) {
      const thr = this.opts.distance | 0;
      const dx = (this._lastPt ? this._lastPt.x : this._startX) - this._startX;
      const dy = (this._lastPt ? this._lastPt.y : this._startY) - this._startY;
      const dist2 = dx*dx + dy*dy;
      if (this._delayPassed && dist2 >= thr*thr && !this.dragging) {
        if (e && e.type === 'touchmove') e.preventDefault();
        this._startDragging();
      }
    }

    _onDown(e) {
      if (!this.enabled) return;
      const handleTarget = this._getHandleTarget(e);
      if (!handleTarget) return; // canceled by selector

      // Do not preventDefault here; allow clicks to proceed when no drag starts.
      if (e.pointerId != null && this.el.setPointerCapture) {
        try { this.el.setPointerCapture(e.pointerId); } catch (_) {}
      }

      const pt = this._pointerFromEvent(e);
      this._pointer = pt; this._lastPt = { x: pt.x, y: pt.y };
      const rect = getRect(this.el);
      this._origX = rect.left; this._origY = rect.top;
      this._startX = pt.x; this._startY = pt.y;

      this._pressed = true;

      // delay gate
      this._delayPassed = (this.opts.delay|0) <= 0;
      this._clearDelayTimer();
      if (!this._delayPassed) {
        this._delayTid = setTimeout(() => {
          this._delayPassed = true;
          this._maybeStartDragOnConditions();
        }, this.opts.delay|0);
      }

      // listeners for movement / release
      if (window.PointerEvent) {
        //document.addEventListener('pointermove', this._onMove, { passive: true });
        document.addEventListener('pointermove', this._onMove);
        document.addEventListener('pointerup', this._onUp, { once: true });
        document.addEventListener('pointercancel', this._onUp, { once: true });
      } else {
        document.addEventListener('mousemove', this._onMove);
        document.addEventListener('touchmove', this._onMove, { passive: false });
        document.addEventListener('mouseup', this._onUp, { once: true });
        document.addEventListener('touchend', this._onUp, { once: true });
        document.addEventListener('touchcancel', this._onUp, { once: true });
      }
    }

    _onMove(e) {
      const pt = this._pointerFromEvent(e);
      this._pointer = pt; this._lastPt = { x: pt.x, y: pt.y };

      if (!this.dragging) {
        if (!this._pressed) return;
        this._maybeStartDragOnConditions(e);
      }

      if (!this.dragging) return; // not started yet

      //if (e.type === 'touchmove') e.preventDefault();
      e.preventDefault();

      const x = pt.x - this._clickOffX;
      const y = pt.y - this._clickOffY;
      this._applyPosition(x, y);
    }

    _maybeRevert(dropResult) {
      let shouldRevert = false, delay = 0, r = this.opts.revert;
      if (r === true) shouldRevert = !dropResult;
      else if (typeof r === 'number') { shouldRevert = !dropResult; delay = r; }
      else if (isFn(r)) { const out = r(!!dropResult); if (typeof out === 'number') { shouldRevert = !dropResult; delay = out; } else shouldRevert = !!out; }
      if (!shouldRevert) return;
      const el = this._helperEl; el.style.transition = this.opts.useTransform ? 'transform 120ms ease' : 'left 120ms ease, top 120ms ease';
      if (this.opts.useTransform && this._helperEl === this.el) { this._nextX = 0; this._nextY = 0; this._commitPosition(); }
      else if (this.opts.useTransform) { this._nextX = this._origX; this._nextY = this._origY; this._commitPosition(); }
      else if (this._offsetBase) { this._nextX = this._origX - this._offsetBase.left; this._nextY = this._origY - this._offsetBase.top; this._commitPosition(); }
      else { el.style.left = px(this._origX); el.style.top = px(this._origY); }
      setTimeout(() => { el.style.transition = ''; }, delay || 140);
    }

    _cleanupHelper() {
      // helper가 원본(this.el)이 아닌 경우엔 무조건 삭제
      if (this._helperEl && this._helperEl !== this.el) {
        try {
          this._helperEl.remove();
        } catch (_) {
          // IE/특수 DOM 환경 대비
          if (this._helperEl.parentNode) {
            try { this._helperEl.parentNode.removeChild(this._helperEl); } catch(__) {}
          }
        }
      }

      // 원본 요소 스타일/상태 복구
      if (this.opts.zIndex != null) this.el.style.zIndex = this._zSaved;
      this.el.style.cursor = this.opts.cursor || 'grab';
      this.el.style.willChange = '';

      if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = 0; }

      // 레퍼런스 정리
      this._helperEl = null;
      this._helperContainer = null;
      this._helperOpRect = null;
      this._helperRemoveOnStop = false;
      this._helperWasConnected = null;
      this._helperOrigParent = null;
      this._helperOrigNext = null;
    }

    _onUp(e) {
      if (e && e.pointerId && this.el.releasePointerCapture) { try { this.el.releasePointerCapture(e.pointerId); } catch(_){} }

      if (window.PointerEvent) document.removeEventListener('pointermove', this._onMove);
      else { document.removeEventListener('mousemove', this._onMove); document.removeEventListener('touchmove', this._onMove); }

      this._clearDelayTimer();

      if (!this.dragging) { this._pressed = false; return; }

      window.removeEventListener('scroll', this._onWinEvt); window.removeEventListener('resize', this._onWinEvt);

      // useTransform + original helper일 때, 종료 직전 보이는 위치를 잡아둔다
      const needWriteBack = (this.opts.useTransform && this._helperEl === this.el);
      const finalRect = needWriteBack ? this.helperRect() : null;

      const dropped = Manager.tryDrop(this._pointer); this._maybeRevert(dropped);
      this.dragging = false; this._pressed = false; Manager.setActiveDrag(null); Manager.endDrag();
      dispatch(this.el, 'dragstop', { draggable: this, dropped }); isFn(this.opts.onStop) && this.opts.onStop({ draggable: this, dropped });

      // 드래그가 끝났고 revert 애니메이션도 안 쓴 경우: transform 제거 & 위치 쓰기
      if (needWriteBack && !this.opts.revert) {
        // 1) 드래그 중에만 쓰던 임시 transform 제거(원래 inline transform 복구)
        this._helperEl.style.transform = this._prevInlineTransform || '';
        this.el.style.willChange = '';
        // 2) 보이는 좌표를 실제 스타일로 기록
        setVisualPosition(this.el, finalRect.left, finalRect.top);
      }

      this._cleanupHelper();
    }

    // ---- External helper methods ----
    getVisualPosition() { const r = getRect(this._helperEl || this.el); return { left: r.left, top: r.top }; }

    setVisualPosition(left, top) {
      if (this._helperEl && this._helperEl !== this.el) {
        // page 좌표 → offsetParent 좌표로 변환
        const opRect = this._helperOpRect || getRect(this._helperEl.offsetParent || document.body);
        this._helperEl.style.left = px(left - opRect.left);
        this._helperEl.style.top  = px(top  - opRect.top);
        return this;
      }
      setVisualPosition(this.el, left, top);
      if (!this.dragging) {
        if (this.opts.useTransform) {
          const cur = getTranslate(this.el); this._tx = cur.x || 0; this._ty = cur.y || 0;
          this._x = 0; this._y = 0; this._nextX = 0; this._nextY = 0;
          this._baseRect = this._measureBaseRectNoTransform(this.el);
        } else {
          const op = this.el.offsetParent || document.body; const opRect = getRect(op);
          this._x = left - opRect.left; this._y = top - opRect.top; this._nextX = this._x; this._nextY = this._y;
        }
      }
      return this;
    }
  }

  // ----------------- Droppable -----------------
  class Droppable {
    constructor(el, opts) {
      this.el = toEl(el);
      this.opts = Object.assign({
        accept: null,
        tolerance: 'intersect',
        hoverClass: 'dd-hover',
        activeClass: 'dd-active',
        greedy: true,
        scope: 'default',
        onActivate: null,
        onDeactivate: null,
        onOver: null,
        onOut: null,
        onDrop: null,
      }, opts || {});

      this.enabled = true;
      this._over = new Set();
      this.depth = this._computeDepth();
      this.el.setAttribute('data-droppable-active', '');
      this.el.classList.add(this.opts.activeClass);
      Manager.register(this);
      dispatch(this.el, 'dropactivate', { droppable: this });
      isFn(this.opts.onActivate) && this.opts.onActivate({ droppable: this });
    }

    _computeDepth() { let d = 0, n = this.el; while (n && n.parentElement) { d++; n = n.parentElement; } return d; }
    setOption(k, v) { this.opts[k] = v; return this; }
    setOptions(o) { Object.keys(o || {}).forEach(k => this.setOption(k, o[k])); return this; }
    option(k) { return this.opts[k]; }
    enable() { this.enabled = true; }
    disable() { this.enabled = false; }
    accepts(draggable) {
      // Scope gate with wildcard/array support
      const dScope = draggable && draggable.opts ? draggable.opts.scope : 'default';
      const myScope = this.opts && this.opts.scope ? this.opts.scope : 'default';
      if (!scopesMatch(dScope, myScope)) return false;
      // Accept gate (selector/function/element). If not provided, accept any within scope.
      const helper = draggable._helperEl || draggable.el;
      if (!this.opts.accept) return true;
      return matches(helper, this.opts.accept);
    }
    rect() { return getRect(this.el); }
    destroy() {
      this.el.classList.remove(this.opts.activeClass, this.opts.hoverClass);
      this.el.removeAttribute('data-droppable-active');
      Manager.unregister(this);
      dispatch(this.el, 'dropdeactivate', { droppable: this });
      isFn(this.opts.onDeactivate) && this.opts.onDeactivate({ droppable: this });
    }
  }

  // ----------------- Public API -----------------
  function makeDraggable(el, opts) { return new Draggable(el, opts); }
  function makeDroppable(el, opts) { return new Droppable(el, opts); }

  /**
   * setVisualPosition
   * Moves element visually to absolute page coords (left, top), regardless
   * of whether it is currently controlled by transform or left/top.
   */
  function setVisualPosition(el, left, top) {
    el = toEl(el);
    const rectNow = getRect(el);
    const dx = left - rectNow.left;
    const dy = top - rectNow.top;

    const cs = getComputedStyle(el);
    const t = cs.transform;

    if (t && t !== 'none') {
      const cur = getTranslate(el);
      el.style.transform = `translate3d(${cur.x + dx}px, ${cur.y + dy}px, 0)`;
      return;
    }

    // Left/top path relative to offsetParent
    const op = el.offsetParent || document.body;
    const opRect = getRect(op);
    el.style.position = cs.position === 'static' ? 'absolute' : cs.position;
    el.style.left = px(left - opRect.left);
    el.style.top  = px(top  - opRect.top);
  }

  return { makeDraggable, makeDroppable, Draggable, Droppable, setVisualPosition };
});

/* Optional helper CSS:
.dd-hover  { outline: 2px dashed rgba(0,0,0,.35); }
.dd-active { outline-offset: 2px; }
.dd-helper { opacity: .85; }
*/






/*
 * miniResizable.js — v0.1.1 (Pure JS, jQuery UI Resizable–like)
 * -------------------------------------------------------------
 * A tiny, dependency-free resizable library with familiar options.
 *
 * Features
 * - 8 handles: n, e, s, w, ne, nw, se, sw (configurable)
 * - aspectRatio (boolean | number)
 * - minWidth/minHeight/maxWidth/maxHeight
 * - grid: [gx, gy] snapping
 * - containment: selector | Element | 'parent' | {left,top,right,bottom} (page coords)
 * - ghost: outline proxy while resizing (commit on stop)
 * - Pointer Events with mouse/touch fallback
 * - rAF rendering, minimal layout thrash
 * - Public API: makeResizable(), Resizable class, setOption(s), enable/disable/destroy,
 *               getSize(), setSize(), getPosition(), setPosition()
 * - Events: resizestart, resizemove, resizestop (CustomEvent)
 *
 * Usage
 *   const r = Resizable.makeResizable(el, { handles: 'e,s,se', minWidth: 80, aspectRatio: true });
 *   r.setSize(200, 120).setOption('grid', [10,10]);
 *
 * v0.1.1 Changes
 * - ghost를 offsetParent에 부착하여 좌표계 일치
 * - _currRect를 도입해 ghost 모드에서도 최종 사이즈/포지션 커밋 보장
 * - setPosition() 인자를 '페이지 좌표'로 간주하도록 주석 명확화
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Resizable = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ----------------- Utils -----------------
  const isFn = v => typeof v === 'function';
  const isStr = v => typeof v === 'string';
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const toEl = v => (typeof v === 'string' ? document.querySelector(v) : v);
  const px = n => (n == null ? '' : `${Math.round(n)}px`);

  function getRect(el) {
    const r = el.getBoundingClientRect();
    return {
      left: r.left + window.scrollX,
      top: r.top + window.scrollY,
      width: r.width,
      height: r.height,
      right: r.left + window.scrollX + r.width,
      bottom: r.top + window.scrollY + r.height,
    };
  }

  function dispatch(el, type, detail) {
    el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
  }

  const HANDLE_LIST = ['n','e','s','w','ne','nw','se','sw'];

  // ----------------- Resizable -----------------
  class Resizable {
    constructor(el, opts) {
      this.el = toEl(el);
      this.opts = Object.assign({
        handles: 'e,s,se',         // string | array | 'all'
        aspectRatio: false,        // boolean | number
        minWidth: null,
        minHeight: null,
        maxWidth: null,
        maxHeight: null,
        grid: null,                // [gx, gy]
        containment: null,         // selector | Element | 'parent' | rect(page coords)
        ghost: false,              // draw a proxy outline while resizing
        handleSize: 8,             // px (visual only)
        handleClass: 'mr-handle',
        onStart: null,
        onResize: null,
        onStop: null,
      }, opts || {});

      this.enabled = true;
      this._handles = [];
      this._op = null;            // offsetParent
      this._opRect = null;        // offsetParent rect (page)
      this._start = null;         // {x,y,left,top,width,height, handle, ratio}
      this._next = null;          // pending rect {left,top,width,height}
      this._rafId = 0;
      this._ghost = null;
      this._boundRect = null;     // containment converted to offsetParent space
      this._currRect = null;      // 마지막으로 렌더된 rect(ghost/element 공통)

      this._onHandleDown = this._onHandleDown.bind(this);
      this._onMove = this._onMove.bind(this);
      this._onUp = this._onUp.bind(this);
      this._tick = this._tick.bind(this);

      this._init();
    }

    // ---------- Lifecycle ----------
    _init() {
      const cs = getComputedStyle(this.el);
      if (cs.position === 'static') this.el.style.position = 'relative';
      this.el.style.userSelect = 'none';
      this.el.style.touchAction = 'none';
      this._createHandles();
    }

    enable() { this.enabled = true; this._handles.forEach(h => h.style.display = ''); }
    disable() { this.enabled = false; this._handles.forEach(h => h.style.display = 'none'); }

    destroy() {
      this._handles.forEach(h => h.remove());
      this._handles.length = 0;
      this._removeGhost();
      this.el.style.userSelect = '';
      this.el.style.touchAction = '';
    }

    // ---------- Public API ----------
    setOption(k, v) { this.opts[k] = v; if (k === 'handles') { this._rebuildHandles(); } return this; }
    setOptions(o) { Object.keys(o||{}).forEach(k => this.setOption(k, o[k])); return this; }
    option(k) { return this.opts[k]; }

    getSize() { const r = getRect(this.el); return { width: r.width, height: r.height }; }
    setSize(w, h) { if (w != null) this.el.style.width = px(w); if (h != null) this.el.style.height = px(h); return this; }

    getPosition() { const r = getRect(this.el); return { left: r.left, top: r.top }; }

    /**
     * setPosition(left, top)
     * 인자는 **페이지 좌표(page coords)** 입니다.
     * 내부적으로 offsetParent 좌표로 환산하여 style.left/top을 설정합니다.
     */
    setPosition(left, top) {
      const op = this.el.offsetParent || document.body;
      const opRect = getRect(op);
      this.el.style.left = px(left - opRect.left);
      this.el.style.top  = px(top - opRect.top);
      return this;
    }

    // ---------- Handle construction ----------
    _parseHandles() {
      let h = this.opts.handles;
      if (!h) return ['e','s','se'];
      if (h === 'all') return HANDLE_LIST.slice();
      if (Array.isArray(h)) return h.slice();
      if (typeof h === 'string') return h.split(',').map(s => s.trim()).filter(Boolean);
      return ['e','s','se'];
    }

    _rebuildHandles() {
      this._handles.forEach(h => h.remove());
      this._handles.length = 0;
      this._createHandles();
    }

    _createHandles() {
      const list = this._parseHandles();
      list.forEach(dir => {
        const h = document.createElement('div');
        h.className = `${this.opts.handleClass} ${this.opts.handleClass}-${dir}`;
        h.setAttribute('data-dir', dir);
        Object.assign(h.style, {
          position: 'absolute',
          userSelect: 'none',
          touchAction: 'none',
          boxSizing: 'border-box',
          zIndex: 2,
        });
        const s = this.opts.handleSize;
        const cs = this._cursorFor(dir);
        h.style.cursor = cs;
        this._positionHandle(h, dir, s);
        h.addEventListener('pointerdown', this._onHandleDown);
        h.addEventListener('mousedown', this._onHandleDown);
        h.addEventListener('touchstart', this._onHandleDown, { passive: false });
        this.el.appendChild(h);
        this._handles.push(h);
      });
    }

    _cursorFor(dir) {
      switch (dir) {
        case 'n': return 'ns-resize';
        case 's': return 'ns-resize';
        case 'e': return 'ew-resize';
        case 'w': return 'ew-resize';
        case 'ne': return 'nesw-resize';
        case 'sw': return 'nesw-resize';
        case 'nw': return 'nwse-resize';
        case 'se': return 'nwse-resize';
        default: return 'move';
      }
    }

    _positionHandle(h, dir, size) {
      const full = `${size}px`;
      const hs = h.style;
      // reset
      hs.left = hs.right = hs.top = hs.bottom = '';
      hs.width = hs.height = '';
      // corners
      if (dir === 'se') { hs.right = '-2px'; hs.bottom = '-2px'; hs.width = full; hs.height = full; }
      if (dir === 'sw') { hs.left = '-2px';  hs.bottom = '-2px'; hs.width = full; hs.height = full; }
      if (dir === 'ne') { hs.right = '-2px'; hs.top    = '-2px'; hs.width = full; hs.height = full; }
      if (dir === 'nw') { hs.left = '-2px';  hs.top    = '-2px'; hs.width = full; hs.height = full; }
      // edges
      if (dir === 'e')  { hs.right = '-2px'; hs.top='50%'; hs.transform = `translateY(-50%)`; hs.width = full; hs.height = '100%'; }
      if (dir === 'w')  { hs.left  = '-2px'; hs.top='50%'; hs.transform = `translateY(-50%)`; hs.width = full; hs.height = '100%'; }
      if (dir === 's')  { hs.bottom= '-2px'; hs.left='50%'; hs.transform = `translateX(-50%)`; hs.width = '100%'; hs.height = full; }
      if (dir === 'n')  { hs.top   = '-2px'; hs.left='50%'; hs.transform = `translateX(-50%)`; hs.width = '100%'; hs.height = full; }
      hs.pointerEvents = 'auto';
    }

    // ---------- Pointer handlers ----------
    _onHandleDown(e) {
      if (!this.enabled) return;
      if (e.type === 'touchstart') e.preventDefault();
      const handle = (e.currentTarget && e.currentTarget.getAttribute('data-dir')) || 'se';

      // capture pointer
      if (e.pointerId != null && e.currentTarget && e.currentTarget.setPointerCapture) {
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
      }

      this._op = this.el.offsetParent || document.body;
      this._opRect = getRect(this._op);

      const r = getRect(this.el);
      this._start = {
        x: (e.touches && e.touches[0] ? e.touches[0].pageX : (e.pageX ?? e.clientX + window.scrollX)),
        y: (e.touches && e.touches[0] ? e.touches[0].pageY : (e.pageY ?? e.clientY + window.scrollY)),
        left: r.left - this._opRect.left,
        top:  r.top  - this._opRect.top,
        width: r.width,
        height: r.height,
        handle,
        ratio: this._aspectRatioValue(r.width, r.height),
      };

      this._computeContainment();
      if (this.opts.ghost) this._ensureGhost(r);

      //여기 주석 풀면 최초 클릭 시 고스트 가이드 선 위치 이상해 짐
      //this._schedule(r);

      document.addEventListener('pointermove', this._onMove, { passive: true });
      document.addEventListener('pointerup', this._onUp, { once: true });
      document.addEventListener('pointercancel', this._onUp, { once: true });
      document.addEventListener('mousemove', this._onMove);
      document.addEventListener('mouseup', this._onUp, { once: true });
      document.addEventListener('touchmove', this._onMove, { passive: false });
      document.addEventListener('touchend', this._onUp, { once: true });
      document.addEventListener('touchcancel', this._onUp, { once: true });

      dispatch(this.el, 'resizestart', { resizable: this, rect: r, handle });
      isFn(this.opts.onStart) && this.opts.onStart({ resizable: this, rect: r, handle });
    }

    _onMove(e) {
      if (!this._start) return;
      if (e.type === 'touchmove') e.preventDefault();

      const pageX = (e.touches && e.touches[0] ? e.touches[0].pageX : (e.pageX ?? e.clientX + window.scrollX));
      const pageY = (e.touches && e.touches[0] ? e.touches[0].pageY : (e.pageY ?? e.clientY + window.scrollY));
      const dx = pageX - this._start.x;
      const dy = pageY - this._start.y;

      const next = this._computeNext(dx, dy);
      this._schedule(next);
    }

    _onUp() {
      if (!this._start) return;
      document.removeEventListener('pointermove', this._onMove);
      document.removeEventListener('mousemove', this._onMove);
      document.removeEventListener('touchmove', this._onMove);

      // 마지막으로 렌더된 rect를 커밋 (ghost 여부 무관)
      const finalRect = this._currRect || { left: this._start.left, top: this._start.top, width: this._start.width, height: this._start.height };
      this.el.style.left   = px(finalRect.left);
      this.el.style.top    = px(finalRect.top);
      this.el.style.width  = px(finalRect.width);
      this.el.style.height = px(finalRect.height);

      const out = { resizable: this, rect: Object.assign({}, finalRect), handle: this._start.handle };

      this._start = null;
      this._next = null;
      this._currRect = null;
      this._removeGhost();

      dispatch(this.el, 'resizestop', out);
      isFn(this.opts.onStop) && this.opts.onStop(out);
    }

    // ---------- Geometry ----------
    _aspectRatioValue(w, h) {
      if (!this.opts.aspectRatio) return 0;
      if (typeof this.opts.aspectRatio === 'number') return this.opts.aspectRatio;
      return w > 0 && h > 0 ? w / h : 0;
    }

    _computeContainment() {
      const c = this.opts.containment; if (!c) { this._boundRect = null; return; }
      const make = (r) => ({
        left:   r.left  - this._opRect.left,
        top:    r.top   - this._opRect.top,
        right:  r.right - this._opRect.left,
        bottom: r.bottom- this._opRect.top,
      });
      if (c === 'parent') { this._boundRect = make(getRect(this.el.parentElement)); return; }
      if (isStr(c)) { this._boundRect = make(getRect(document.querySelector(c))); return; }
      if (c instanceof Element) { this._boundRect = make(getRect(c)); return; }
      if (typeof c === 'object') { this._boundRect = make(c); return; }
      this._boundRect = null;
    }

    _anchorFor(handle) {
      const s = this._start; const R = { left: s.left, top: s.top, right: s.left + s.width, bottom: s.top + s.height };
      switch (handle) {
        case 'e':  return { ax: R.left, ay: R.top };
        case 's':  return { ax: R.left, ay: R.top };
        case 'se': return { ax: R.left, ay: R.top };
        case 'w':  return { ax: R.right, ay: R.top };
        case 'n':  return { ax: R.left, ay: R.bottom };
        case 'nw': return { ax: R.right, ay: R.bottom };
        case 'ne': return { ax: R.left, ay: R.bottom };
        case 'sw': return { ax: R.right, ay: R.top };
        default:   return { ax: R.left, ay: R.top };
      }
    }

    _computeNext(dx, dy) {
      const s = this._start; const h = s.handle; let left = s.left, top = s.top, width = s.width, height = s.height;
      // 1) Raw from handle
      if (h.includes('e')) { width = s.width + dx; }
      if (h.includes('s')) { height = s.height + dy; }
      if (h.includes('w')) { width = s.width - dx; left = s.left + dx; }
      if (h.includes('n')) { height = s.height - dy; top = s.top + dy; }

      // 2) Grid snap
      if (Array.isArray(this.opts.grid)) {
        const [gx, gy] = this.opts.grid;
        if (gx) width = Math.round(width / gx) * gx;
        if (gy) height = Math.round(height / gy) * gy;
      }

      // 3) Aspect ratio
      const ratio = s.ratio;
      if (ratio) {
        const { ax, ay } = this._anchorFor(h);
        const widthDriven = h.includes('e') || h.includes('w');
        if (widthDriven) {
          height = width / ratio;
        } else {
          width = height * ratio;
        }
        // recompute left/top from anchored corner
        if (ax === s.left && ay === s.top) { /* anchor NW: left/top 유지 */ }
        else if (ax === s.left + s.width && ay === s.top) { left = ax - width; top = ay; }           // NE
        else if (ax === s.left && ay === s.top + s.height) { left = ax; top = ay - height; }         // SW
        else if (ax === s.left + s.width && ay === s.top + s.height) { left = ax - width; top = ay - height; } // SE
      }

      // 4) Min/Max
      const lim = this._limits();
      width = clamp(width, lim.minW, lim.maxW);
      height = clamp(height, lim.minH, lim.maxH);

      // 5) Containment (offsetParent space)
      if (this._boundRect) {
        const right = left + width; const bottom = top + height;
        const b = this._boundRect;
        if (left < b.left)   { const d = b.left - left; left += d; if (h.includes('w') || h.includes('n') || h.includes('sw') || h.includes('nw')) width -= d; }
        if (top  < b.top)    { const d = b.top - top;   top  += d; if (h.includes('n') || h.includes('w') || h.includes('ne') || h.includes('nw')) height -= d; }
        if (right > b.right) { const d = right - b.right; if (h.includes('e') || h.includes('s') || h.includes('se') || h.includes('ne')) width -= d; else left -= d; }
        if (bottom> b.bottom){ const d = bottom - b.bottom; if (h.includes('s') || h.includes('e') || h.includes('se') || h.includes('sw')) height -= d; else top -= d; }
      }

      return { left, top, width: Math.max(0, width), height: Math.max(0, height) };
    }

    _limits() {
      const cs = getComputedStyle(this.el);
      const readPx = (prop) => {
        const v = cs.getPropertyValue(prop);
        if (!v || v === 'none' || v === 'auto') return null;
        const n = parseFloat(v); return Number.isFinite(n) ? n : null;
      };
      const minW = this.opts.minWidth  ?? readPx('min-width')  ?? 0;
      const minH = this.opts.minHeight ?? readPx('min-height') ?? 0;
      const maxW = this.opts.maxWidth  ?? readPx('max-width')  ?? Infinity;
      const maxH = this.opts.maxHeight ?? readPx('max-height') ?? Infinity;
      return { minW, minH, maxW, maxH };
    }

    // ---------- Render ----------
    _schedule(rect) {
      this._next = rect;
      if (!this._rafId) this._rafId = requestAnimationFrame(this._tick);
    }

    _tick() {
      this._rafId = 0;
      if (!this._next) return;
      const r = this._next; this._next = null;

      if (this._ghost) {
        this._ghost.style.left = px(r.left);
        this._ghost.style.top  = px(r.top);
        this._ghost.style.width  = px(r.width);
        this._ghost.style.height = px(r.height);
      } else {
        this.el.style.left = px(r.left);
        this.el.style.top  = px(r.top);
        this.el.style.width  = px(r.width);
        this.el.style.height = px(r.height);
      }

      // 마지막 렌더 결과 저장 (mouseup 커밋용)
      this._currRect = { left: r.left, top: r.top, width: r.width, height: r.height };

      const out = { resizable: this, rect: Object.assign({}, r), handle: this._start && this._start.handle };
      dispatch(this.el, 'resizemove', out);
      isFn(this.opts.onResize) && this.opts.onResize(out);
    }

    _ensureGhost(baseRect) {
      if (this._ghost) return;
      const g = document.createElement('div');
      Object.assign(g.style, {
        position: 'absolute',
        pointerEvents: 'none',
        // ghost는 offsetParent 좌표계로 배치
        left: px(baseRect.left - this._opRect.left),
        top:  px(baseRect.top  - this._opRect.top),
        width: px(baseRect.width),
        height: px(baseRect.height),
        outline: '2px dashed rgba(0,0,0,.35)',
        background: 'transparent',
        zIndex: 9999,
      });
      // offsetParent에 부착하여 좌표계를 일치
      (this._op || this.el.offsetParent || document.body).appendChild(g);
      this._ghost = g;
    }

    _removeGhost() {
      if (this._ghost) {
        this._ghost.remove();
        this._ghost = null;
      }
    }
  }

  // ----------------- Public API -----------------
  function makeResizable(el, opts) { return new Resizable(el, opts); }

  return { makeResizable, Resizable };
});

/* Optional helper CSS (suggested)
.mr-handle { background: #fff; border: 2px solid rgba(0,0,0,.2); border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,.08); }
.mr-handle:after { content: ''; }
*/

Element.prototype.enableDrag = function(option)
{
    this._draggable = DragDrop.makeDraggable(this, option)
}

Element.prototype.setDragOption = function(key, value)
{
    this._draggable?.setOption(key, value) 
}

Element.prototype.enableDrop = function(option)
{
    this._droppable = DragDrop.makeDroppable(this, option)
}

Element.prototype.setDropOption = function(key, value)
{
    this._droppable?.setOption(key, value) 
}

Element.prototype.enableResize = function(option)
{
    this._resizable = Resizable.makeResizable(this, option)
}

Element.prototype.setResizeOption = function(key, value)
{
    this._resizable?.setOption(key, value) 

    if(key=='disabled') value ? this._resizable?.disable() : this._resizable?.enable() 
}
;function TabKeyController()
{
	//depth가 있는 맵. 기본적으로 이곳에 쌓임.
	this.componentMap = 
	[
		
	];
	
	//탭인덱스를 빠르게 검색하기 위한 배열
	this.tabIndexArr =
	[
	
	];
}

TabKeyController.prototype.init = function(rootView)
{
	this.rootView = rootView;
	this.rootView.element.setAttribute('tabindex', -1);
	this.rootView.element.addEventListener('keydown', this._keydown);
};

TabKeyController.prototype.focusOnInit = function(flag, noActive)
{
	if(flag)
	{
		this.makeTabIndexArr();
		var nextComp = this._getFirstComp();
		if(nextComp) nextComp.setFocus(noActive);
		else
		{
			if(this.rootView && this.rootView.isValid())
			{	
				this.rootView.enableActiveFocus(true);
				AComponent.setFocusComp(this.rootView, noActive);
			}
		}
	}
};

//key down 이벤트
TabKeyController.prototype._keydown = function(e)
{
	var acont = this.acomp.getContainer();
	if(!acont) return;

	if(!e.ctrlKey && e.keyCode == 9 && acont.tabKey)
	{
		TabKeyController.nextFocus(AComponent.getFocusComp(), e);
	}
};

//다음 탭이 가능한 컴포넌트를 찾음. 
//없으면 탭이 가능한 첫번째 컴포넌트로. (주로 포커스가 rootView에 있을경우 발생한다.)
TabKeyController.prototype.findNextTab = function(comp, isShift)
{
	if(this.componentMap.length == 0) return;
	
	if(!this._isMakeArr) this.makeTabIndexArr();
	
	var nowIndex = this._getCompIndex(comp);
	
	if(nowIndex != null)
	{
		if(isShift)
		{
			return this._getPrevCompByIndex(nowIndex, nowIndex-1);
		}
		else
		{
			return this._getNextCompByIndex(nowIndex, nowIndex+1);
		}
	}
	else
	{
		return this._getFirstComp();
	}
};



//현재 컴포넌트의 순서를 찾음.
TabKeyController.prototype._getCompIndex = function(comp)
{
	if(!comp) return null;
	
	for(var i=0;i<this.tabIndexArr.length;i++)
	{
		if(this.tabIndexArr[i] == comp)
		{
			return i;
		}
	}
	return null;
};

//다음.
TabKeyController.prototype._getNextCompByIndex = function(start, inx)
{
	if(start == inx) return this.tabIndexArr[start];

	if(inx < this.tabIndexArr.length)
	{
		if(this._checkTabValieComp(this.tabIndexArr[inx])) return this.tabIndexArr[inx];
		else return this._getNextCompByIndex(start, inx+1);
	}
	else
	{
		return this._getNextCompByIndex(start, 0);
	}
};

//이전
TabKeyController.prototype._getPrevCompByIndex = function(start, inx)
{
	if(start == inx) return this.tabIndexArr[start];
	
	if(inx < 0)
	{
		return this._getPrevCompByIndex(start, this.tabIndexArr.length-1);
	}
	else
	{
		if(this._checkTabValieComp(this.tabIndexArr[inx])) return this.tabIndexArr[inx];
		else return this._getPrevCompByIndex(start, inx-1);
	}
};

//탭이 가능한 첫번쨰 컴포넌트를 리턴한다.
TabKeyController.prototype._getFirstComp = function()
{
	for(var i=0;i<this.tabIndexArr.length;i++)
	{
		if(this._checkTabValieComp(this.tabIndexArr[i])) return this.tabIndexArr[i];
	}
};

//뷰에서 호출함. 탭키컨트롤러 배열로 컴포넌트맵을 만듬.
TabKeyController.prototype.addCompMap = function(acomp, owner)
{
	this._isMakeArr = false;
	var inx = acomp.getAttr('tabindex'), map;
	
	if(owner)
	{
		if(owner.ownerTabMap) map = owner.ownerTabMap;
		else 
		{
			owner.ownerTabMap = [];
			map = owner.ownerTabMap;
		}
	}
	
	if(!map) map = this.componentMap;
	
	if(inx == 0 || inx == null)
	{
		this.pushCompIntoMap(map, acomp);
	}
	else
	{
		if(map.length == 0) this.pushCompIntoMap(map, acomp);
		else
		{
			var chk = false;
			for(var i in map)
			{
				if(!map[i].comp.element.getAttribute('tabindex') || parseInt(inx) < parseInt(map[i].comp.element.getAttribute('tabindex')))
				{
					map.splice(i, false, {comp:acomp, childArr:[]});
					chk = true;
					break;
				}
			}
			if(!chk) this.pushCompIntoMap(map, acomp);
		}	
	}
};

//컴포넌트를 추가할때 여러 예외처리를 위해서 따로 함수로 뺌
//예외 사항이 생기면 예외처리 부분에 주석을 달아놓기로함.
TabKeyController.prototype.pushCompIntoMap = function(map, acomp)
{
	//예외1 캘린더피커
	//캘린더피커는 내부적으로 아이템을 가지고 있는데
	//이 아이템에 탭인덱스 지정이 불가능하므로 아이템 자체는 탭 배열에 넣지않고 있다가
	//캘린더피커 자체가 들어가는 시점에서 텍스트 필드를 대신 넣어준다.
	if(acomp.parent && acomp.parent.className == "ACalendarPickerItem") return;
	if(acomp.baseName == "ACalendarPicker") 
	{
		acomp.childComp.textfield.setAttr('tabindex', acomp.getAttr('tabindex'));
		acomp = acomp.childComp.textfield;
	}

	//////////////////////////////////////////////////////////////////////////
	map.push({comp:acomp, childArr:[]});
};
//동적로드된 경우에는 따로 모아두는데
//모아 뒀던 탭인덱스 배열을 세이브하는 함수.
TabKeyController.prototype.saveOwnerMap = function(owner)
{
	if(owner.ownerTabMap)
	{
		var result = this._setOwnerChild(owner, this.componentMap);
		if(!result) this.componentMap.push({comp: owner, childArr: owner.ownerTabMap.slice()});

		delete owner.ownerTabMap;
	}
};

TabKeyController.prototype._setOwnerChild = function(owner, targetArr)
{
	for(var i=0;i<targetArr.length;i++)
	{
		if(targetArr[i].comp == owner) 
		{
			targetArr[i].childArr = targetArr[i].childArr.concat(owner.ownerTabMap.slice());
			let aIndex, bIndex;
			targetArr[i].childArr.sort((a, b) => {
				aIndex = a.comp.getAttr('tabindex');
				bIndex = b.comp.getAttr('tabindex');
                
                //실제로 0으로 입력한 경우에는 오작동하므로 주석처리
                // if(a.comp.element.tagName == 'SPAN' && aIndex == 0) aIndex = null;
                // if(b.comp.element.tagName == 'SPAN' && bIndex == 0) bIndex = null;

                //ACheckBox, ARadioButton 등 init 에서 변경하는 경우 data 속성값으로도 저장하여 예외처리한다.
                if(aIndex == a.comp.getAttr('data-init-tabindex')) aIndex = null;
                if(bIndex == b.comp.getAttr('data-init-tabindex')) bIndex = null;

				if(aIndex == null && bIndex == null) return 0; //둘 다 tabindex가 없는 경우 순서 유지
				if(bIndex == null) return -1;
				if(aIndex == null) return 1;
				return parseInt(aIndex) - parseInt(bIndex);
			});
			return true;
		}
		if(targetArr[i].childArr.length > 0) 
		{
			var res = this._setOwnerChild(owner, targetArr[i].childArr);
			if(res) return res;
		}
	}
};

//트리탐색은 for문이 겹쳐서 매번 탭마다 부하를 줄이기 위해
//빠른탐색 배열을 최초1회 만들어둔다.
TabKeyController.prototype.makeTabIndexArr = function()
{	
	this.tabIndexArr = [];
	this._makeArray(this.componentMap);
	this._isMakeArr = true;
};

TabKeyController.prototype._makeArray = function(arr)
{
	for(var i=0;i<arr.length;i++)
	{
		if(arr[i].childArr.length > 0) this._makeArray(arr[i].childArr);
		else this.tabIndexArr.push(arr[i].comp);
	}
};

//탭키이동이 가능한 컴포넌트인지 검사한다.
// tabindex가 -1이 아님
// 숨겨진 상태가 아님.
// enable false 상태가 아님.
// 탭키가 가능한 컴포넌트인가?
TabKeyController.prototype._checkTabValieComp = function(comp)
{
	if(!comp.isValid()) return false;
	
	if(comp.getAttr('tabindex') == -1) return false;
	
	if(!comp.isEnable) return false;
	
	if(!comp.isShow()) return false;
	
	if(!comp.isTabable) return false;

	//readonly 제외.
	//if(comp.getAttr('readonly') == 'readonly') return false;
	
	return true;
};

TabKeyController.nextFocus = function(acomp, e)
{
	if(!acomp) return;
	var acont = acomp.getContainer();
	if(!acont) return;
	var nextComp = acont.tabKey.findNextTab(acomp, e.shiftKey);
	if(nextComp) nextComp.setFocus(); 
	e.preventDefault();
	e.stopPropagation();
}


;
//차후에 afc 의 library 로 옮기기
/**
 * @author asoocool
 */

ScrollManager = class ScrollManager
{
	constructor()
	{
        this.scrlTimer = null
        
        this.startTime = null
        this.oldTime = null
        
        this.startPos = 0
        this.oldPos = 0
        this.posGap = 0
        
        this.oldDis = 0//distance
        this.totDis = 0
        
        this.scrollState = 0	//1: initScroll, 2: updateScroll, 3: scrollCheck
        this.isScrollStop = false
        this.scrollEnable = true
        //this.disableManager = null
        this.disableManagers = null
        
        this.moveStart = false
        this.stopCallback = null
        
        this.option = 
        {
            moveDelay: 40
        }
        
        window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
        window.cancelAnimationFrame  = window.cancelAnimationFrame || window.webkitCancelAnimationFrame;

	}
}


ScrollManager.prototype.setOption = function(option)
{
    for(var p in option)
    {
		if(!option.hasOwnProperty(p)) continue;
        this.option[p] = option[p];
    }
};

//스크롤 on/off 기능
ScrollManager.prototype.enableScroll = function(enable)
{
	this.scrollEnable = enable;
};

//자신이 스크롤될 때 움직이지 말아야할 스크롤 매니저 지정
/*
ScrollManager.prototype.setDisableManager = function(manager)
{
	this.disableManager = manager;
};
*/

//자신이 스크롤될 때 움직이지 말아야할 스크롤 매니저 지정
ScrollManager.prototype.addDisableManager = function(manager)
{
	if(!this.disableManagers) this.disableManagers = [];
	
	for(var i=0; i<this.disableManagers.length; i++)
		if(this.disableManagers[i]===manager) return;
	
	this.disableManagers.push(manager);
};

ScrollManager.prototype.removeDisableManager = function(manager)
{
	for(var i=0; i<this.disableManagers.length; i++)
	{
		if(this.disableManagers[i]===manager)
		{
			manager.enableScroll(true);
			this.disableManagers.splice(i, 1);
			return;
		}
	}
};

ScrollManager.prototype.removeAllDisableManager = function()
{
	for(var i=0; i<this.disableManagers.length; i++)
		this.disableManagers[i].enableScroll(true);

	this.disableManagers = [];
};


//스크롤 애니메이션이 중지됐을 때 호출할 함수 지정
ScrollManager.prototype.setStopCallback = function(callback)
{
	this.stopCallback = callback;
};

ScrollManager.prototype.stopScrollTimer = function()
{
	//touchmove 인 경우는 계속해서 updateScroll 이 발생할 수 있으므로 
	//DisableManager 를 초기화 하지 않는다.
	
	//auto scroll 상태인 경우만 실행되도록 한다.
	if(this.scrollState!=3) return;

	this.isScrollStop = true;

	if(this.scrlTimer)
	{
		if(window.cancelAnimationFrame) window.cancelAnimationFrame(this.scrlTimer);
		else clearTimeout(this.scrlTimer);

		this.scrlTimer = null;
	}

	if(this.stopCallback) 
	{
		this.stopCallback.call(this);
	}
	
	if(this.disableManagers) 
	{
		for(var i=0; i<this.disableManagers.length; i++)
			this.disableManagers[i].enableScroll(true);
	}
};

ScrollManager.prototype.initScroll = function(pos)
{
	//if(!this.scrollEnable) return;

	//stopScrollTimer 를 호출한 후...
	this.stopScrollTimer();
	
	//상태값을 셋팅해 줘야 타이머가 제거됨.
	this.scrollState = 1;
	
	this.oldTime = this.startTime = Date.now();
	
	this.posGap = 0;
	this.oldPos = this.startPos = pos;
	
	this.oldDis = 0;
	this.totDis = 0;
	
	this.isScrollStop = false;
	this.moveStart = false;

/*
	if(this.disableManagers) 
	{
		for(var i=0; i<this.disableManagers.length; i++)
			this.disableManagers[i].enableScroll(true);
	}
	*/
};

ScrollManager.prototype.updateScroll = function(pos, updateFunc)
{
	if(!this.scrollEnable) return;
	
	this.scrollState = 2;

	var dis = this.oldPos - pos;
	var newTime = Date.now();
	var elapse = newTime - this.oldTime;
	var velocity = dis/elapse;
	
	this.oldTime = newTime;
	this.oldPos = pos;
	
	this.totDis += dis;
	
	//일정한 속도 밑으로 떨어지면 시작 지점을 재설정한다.
	//if(Math.abs(velocity*10)<1)

	//방향이 바뀌면 시작 지점을 재설정한다.
	if(this.oldDis*dis<0 || Math.abs(velocity*10)<1)
	{
		this.startTime = newTime;
		this.startPos = pos;
		
		//if(!this.moveStart) this.posGap = 0;
	}
	
	this.oldDis = dis;	
	
	if(!this.moveStart)
	{
		this.posGap += dis;
		if(Math.abs(this.posGap)<this.option.moveDelay) return;
		
		this.moveStart = true;
		
		if(this.disableManagers) 
		{
			for(var i=0; i<this.disableManagers.length; i++)
				this.disableManagers[i].enableScroll(false);
		}
	}
	
	updateFunc.call(this, dis);
};

ScrollManager.prototype.scrollCheck = function(pos, scrollFunc)
{
	if(!this.scrollEnable || this.isScrollStop) return;

	this.scrollState = 3;
	
	//var dis = (this.startPos+this.posGap) - pos;
	var chkDis = this.startPos - pos;
	var dis = this.oldPos - pos;

	//최종 이동 거리를 이곳에 저장해 둔다.
	this.oldDis = dis;
	this.totDis += dis;

	//if(Math.abs(dis)<this.option.moveDelay) 
	if(!this.moveStart)
	{
		if(Math.abs(chkDis)<this.option.moveDelay) 
		{
			this.stopScrollTimer();
			//this.initScroll(0);
			return;
		}
	}

	//터치 다운부터 터치 업까지 걸린 시간
	var elapse = Date.now() - this.startTime, velocity;
	if(elapse == 0) elapse = 1;
	
	if(window.requestAnimationFrame)
	{
		velocity = chkDis/elapse;
		this.autoScroll(velocity, scrollFunc);
	}
};

ScrollManager.prototype.autoScroll = function(acceleration, scrollFunc)
{
	var thisObj = this, elapsed, move;
	var oldTime = 0, velocity = acceleration*1500, resistance = -0.1;//, totalElapsed = 0;
	
	//scroll up, or scroll down
	if(acceleration<0) resistance = 0.1;
	
	function render(timestamp) 
	{
		if(thisObj.isScrollStop) return;
	
		if(oldTime==0) oldTime = timestamp;

		elapsed = timestamp - oldTime;
		oldTime = timestamp;
		
		//totalElapsed += elapsed;
		
		//console.log('totalElapsed : ' + totalElapsed);
		
		/*
		//after one second, resistance is down of its 10%
		if(totalElapsed>500) 
		{
			resistance = resistance*0.5;
			totalElapsed = 0;
		}
		*/
		
		acceleration += resistance;
		
		velocity += acceleration * elapsed;
		move = (velocity * elapsed)/1000;

		//저항값과 이동값의 부호는 반대이다. 
		//즉, move 값의 부호가 바뀌면 이동을 멈춰야 한다.
		if(resistance*move>0 || !scrollFunc.call(thisObj, move, velocity)) 
		{
			setTimeout(function()
			{
				thisObj.stopScrollTimer();
				//thisObj.initScroll(0);
			}, 50);
			
			return;
		}
		
	  	thisObj.scrlTimer = window.requestAnimationFrame(render);
	}

	this.scrlTimer = window.requestAnimationFrame(render);

};


;/**
 * @author asoocool
 */

function PosUtil(acomp)
{
    this.acomp = acomp;

    //calc 원문 보존용
    acomp._rawCalc = acomp._rawCalc || {};

    this.PIXEL = 10;
    this.moveX = 0;
    this.moveY = 0;
    this.dw = 0;
    this.dh = 0;

    this.stickyMoveX = 0;
    this.stickyMoveY = 0;
}

PosUtil.prototype.setSize = function(width, height)
{
	var acomp = this.acomp;
	if(width) acomp.element.style['width'] = width;
	if(height) acomp.element.style['height'] = height;
	
	//알컴포넌트 리사이즈
	this.resizeRcomp(acomp);
	
};

// 컴포넌트의 현재 위치 기준으로 위치값을 변경하는 함수
// stretch 옵션이 켜져있거나 %로 입력이 되어있는 경우에는 위치값이 변경되지 않는다.
// 스티키 기능 때문에 함수가 너무 길어져서 분리함. moveX와 moveY를 계산하는
// offsetPosMoveX offsetPosMoveY
PosUtil.prototype.offsetPos = function(moveX, moveY, isDetail, isMulti, stickyArr)
{
	var stickyX, stickyY, value, unit, posArr = this.getPosInfo();
	if(stickyArr && stickyArr.length > 0)
	{
		for(var i in stickyArr)
		{
			if(stickyArr[i].type == 'left' || stickyArr[i].type == 'right')
			{
				value = posArr[1];
				value = parseFloat(value);
				unit = posArr[1].replace(value, '');
				if(unit == '%')
				{
					var parentWidth = this.acomp.getElement().parentElement.clientWidth;
					stickyX = stickyArr[i].sticky/parentWidth * 100;
				}
				else
				{
					stickyX = stickyArr[i].sticky;
				}
				
				this.stickyCompX = stickyArr[i];
				this.stickyX = 0;
				this.stickyMoveX = 0;
			}
			else
			{
				value = posArr[3];
				value = parseFloat(value);
				unit = posArr[3].replace(value, '');
				if(unit == '%')
				{
					var parentHeight = this.acomp.getElement().parentElement.clientHeight;
					stickyY = stickyArr[i].sticky/parentHeight * 100;
				}
				else
				{
					stickyY = stickyArr[i].sticky;
				}
				
				this.stickyCompY = stickyArr[i];
				this.stickyY = 0;
				this.stickyMoveY = 0;
			}
		}
	}
	
	if(this.stickyX)
	{
		value = posArr[1];
		value = parseFloat(value);
		unit = posArr[1].replace(value, '');
		if(unit == '%')
		{
			var parentWidth = this.acomp.getElement().parentElement.clientWidth;
			var	pixel = (10/parentWidth).toFixed(2)*parentWidth*10*10;
 			moveX = pixel*parseFloat(moveX/pixel, 10);
		}
		this.stickyMoveX += moveX;
		if(Math.abs(this.stickyMoveX) >= Math.abs(this.stickyX))
		{
			this.stickyCompX = null;
			this.offsetPosMoveX(this.stickyMoveX-this.stickyX, isDetail, isMulti);
			this.stickyMoveX = 0;
			this.stickyX = 0;
		}
	}
	else
	{
		if(stickyX) this.stickyX = stickyX;
		this.offsetPosMoveX(moveX, isDetail, isMulti, stickyX);
	}
	
	if(this.stickyY)
	{
		value = posArr[3];
		value = parseFloat(value);
		unit = posArr[3].replace(value, '');
		if(unit == '%')
		{
			var parentHeight = this.acomp.getElement().parentElement.clientHeight;
			var	pixel = (10/parentHeight).toFixed(2)*parentHeight*10*10;
 			moveY = pixel*parseFloat(moveY/pixel, 10);
		}
		this.stickyMoveY += moveY;
		if(Math.abs(this.stickyMoveY) >= Math.abs(this.stickyY))
		{
			this.stickyCompY = null;
			this.offsetPosMoveY(this.stickyMoveY-this.stickyY, isDetail, isMulti);
			this.stickyMoveY = 0;
			this.stickyY = 0;
		}
	}
	else
	{
		if(stickyY) this.stickyY = stickyY;
		this.offsetPosMoveY(moveY, isDetail, isMulti, stickyY);
	}
};

PosUtil.prototype.offsetPosMoveX = function(moveX, isDetail, isMulti, stickyX)
{
	var acomp = this.acomp,
		posArr = this.getPosInfo(), 
		pixel = this.PIXEL, chgPos, sign = 1, roundFunc,
		chgX = 0, chgY = 0;
	
	if(_TinyDom.css(acomp.element, 'position') != 'absolute')
	{
		posArr = this.getMarginInfo();
	}

	//% -> px 안되게 수정 관련 변수
	var value, unit, parentWidth = acomp.getElement().parentElement.clientWidth;

	if(moveX != 0)
	{
		value = posArr[1];
		value = parseFloat(value);
		unit = posArr[1].replace(value, '');

		//stretch 상태이거나 단위가 %가 아닌 경우 위치값은 무조건 px로 변경한다.
		if(acomp.sgapW || unit != '%')
		{
			value = parseFloat(_TinyDom.css(acomp.element, posArr[0]));
			unit = 'px';
		}
		//stretch 가 아니고 위치값에 %인 경우
		else if(unit == '%')
		{
			moveX *= 100;
			value = value*parentWidth;

			//detail 인 경우에는 pixel 값은 1%에 해당하는 값
			if(isDetail)
			{
				pixel = parentWidth;
				isDetail = false;
			}
			//detail이 아닌 경우 pixel 값은 10px 과 근접한 값
			else pixel = (10/parentWidth).toFixed(2)*parentWidth*10*10;
		}

		this.moveX += moveX;
		
		if(!stickyX && Math.abs(this.moveX) > 0)
		{
			if(!isDetail) moveX = pixel*parseInt(this.moveX/pixel, 10);
			
			if(moveX)
			{
				// right 기준인 경우 보수값으로 변경
				if(posArr[0].includes('right')) moveX *= sign = -1;
				
				if(!isDetail)
				{
					// move값이 음수:올림 양수:내림
					if(moveX < 0) roundFunc = Math.ceil;
					else roundFunc = Math.floor;

					//다수의 컴포넌트 이동시 변경위치값은 현재위치값에 단위값을 더한값
					if(isMulti) chgPos = parseInt(roundFunc(value+moveX), 10);
					//하나의 컴포넌트 이동시 변경위치값은 단위값의 배수에 해당하는 값
					else chgPos = pixel*parseInt(roundFunc((value+moveX)/pixel), 10);
				}
				else chgPos = value+moveX;

				if(value != chgPos)
				{
					chgX = (value-chgPos);
					this.moveX += chgX*sign;
					value = chgPos;
				}
			}
		}
		
		if(unit == '%')
		{
			//value(실제px*100)/부모넓이 => n%
			value = value/parentWidth;
			
			//chgX(이동px*100)/100 => 이동px
			chgX = chgX/100;
		}
		
		if(stickyX)
		{
			if(posArr[0] == 'right') stickyX *= sign = -1;
			value += stickyX;
		}
		
		value += unit;
		
		//acomp.$ele.css(posArr[0], value);
		//값이 변경되지 않은 경우 세팅하지 않는다.
        if((posArr[1] == '' && parseFloat(value) == 0) || posArr[1] == value) return;
		this.setStyle(posArr[0], value);
		
		if(acomp.sgapW)
		{
			//스트레치 정보가 있으면 먼저 방향값을 변경한다.
			this.setStretchValue(posArr[0], value);
			
			unit = this.getStretchValue('width');
			value = parseFloat(unit);
			unit = unit.replace(value, '');

			if(unit == '%')
			{
				//스트레치값 % -> px 변경
				value = value*parentWidth/10/10;
				unit = 'px';
			}
			
			//방향값을 번경한 뒤 넓이값을 변경한다.
			this.setStretchValue('width', value + chgX + unit);
			//this.setStretchValue('width', parseFloat(this.getStretchValue('width')) + chgX);
		}
	}
};

PosUtil.prototype.offsetPosMoveY = function(moveY, isDetail, isMulti, stickyY)
{
	var acomp = this.acomp,
		posArr = this.getPosInfo(), 
		pixel = this.PIXEL, chgPos, sign = 1, roundFunc,
		chgX = 0, chgY = 0;
	
	if(_TinyDom.css(acomp.element, 'position') != 'absolute')
	{
		posArr = this.getMarginInfo();
	}

	//% -> px 안되게 수정 관련 변수
	var value, unit, parentHeight = acomp.getElement().parentElement.clientHeight;

	if(moveY != 0)
	{
		sign = 1;
		pixel = this.PIXEL;

		value = posArr[3];
		value = parseFloat(value);
		unit = posArr[3].replace(value, '');

		//stretch 상태이거나 단위가 %가 아닌 경우 위치값은 무조건 px로 변경한다.
		if(acomp.sgapH || unit != '%')
		{
			value = parseFloat(_TinyDom.css(acomp.element, posArr[2]));
			unit = 'px';
		}
		//stretch 가 아니고 위치값에 %인 경우
		else if(unit == '%')
		{
			moveY *= 100;
			value = value*parentHeight;
			
			//detail 인 경우에는 pixel 값은 1%에 해당하는 값
			if(isDetail)
			{
				pixel = parentHeight;
				isDetail = false;
			}
			//detail이 아닌 경우 pixel 값은 10px 과 근접한 값
			else pixel = (10/parentHeight).toFixed(2)*parentHeight*10*10;
		}
		
		this.moveY += moveY;
		
		if(!stickyY && Math.abs(this.moveY) > 0)
		{
			if(!isDetail) moveY = pixel*parseInt(this.moveY/pixel, 10);
			
			if(moveY)
			{
				// bottom 기준인 경우 보수값으로 변경
				if(posArr[2].includes('bottom')) moveY *= sign = -1;

				if(!isDetail)
				{
					// move값이 음수:올림 양수:내림
					if(moveY < 0) roundFunc = Math.ceil;
					else roundFunc = Math.floor;

					//다수의 컴포넌트 이동시 변경위치값은 현재위치값에 단위값을 더한값
					if(isMulti) chgPos = parseInt(roundFunc(value+moveY), 10);
					//하나의 컴포넌트 이동시 변경위치값은 단위값의 배수에 해당하는 값
					else chgPos = pixel*parseInt(roundFunc((value+moveY)/pixel), 10);
				}
				else chgPos = value+moveY;

				if(value != chgPos)
				{
					chgY = (value-chgPos);
					this.moveY += chgY*sign;
					value = chgPos;
				}
			}
		}
		
		if(unit == '%')
		{
			//value(실제px*100)/부모넓이 => n%
			value = value/parentHeight;
			
			//chgY(이동px*100)/100 => 이동px
			chgY = chgY/100;
		}
		
		if(stickyY)
		{
			if(posArr[0] == 'bottom') stickyY *= sign = -1;
			value += stickyY;
		}
		
		value += unit;
		
		//acomp.$ele.css(posArr[2], value);
		//값이 변경되지 않은 경우 세팅하지 않는다.
        if((posArr[3] == '' && parseFloat(value) == 0) || posArr[3] == value) return;
		this.setStyle(posArr[2], value);
		
		if(acomp.sgapH)
		{
			//스트레치 정보가 있으면 먼저 방향값을 변경한다.
			this.setStretchValue(posArr[2], value);
			
			unit = this.getStretchValue('height');
			value = parseFloat(unit);
			unit = unit.replace(value, '');

			if(unit == '%')
			{
				//스트레치값 % -> px 변경
				value = value*parentHeight/10/10;
				unit = 'px';
			}
			
			//방향값을 번경한 뒤 넓이값을 변경한다.
			this.setStretchValue('height', value + chgY + unit);
			//this.setStretchValue('height', parseFloat(this.getStretchValue('height')) + chgY);
		}
	}
};


PosUtil.prototype.setPos = function(pos, posVal)
{
	var acomp = this.acomp;
	
	//acomp.setStyle(pos, posVal);
	//acomp.$ele.css(pos, posVal);
	this.setStyle(pos, posVal);
	
	if(pos=='left' || pos=='top') this.setStyle(pos=='left'?'right':'bottom', '');//acomp.$ele.css(pos=='left'?'right':'bottom', '');
	else if(pos=='right' || pos=='bottom') this.setStyle(pos=='right'?'left':'top', '');//acomp.$ele.css(pos=='right'?'left':'top', '');
	
// 	if(acomp.sgapW || acomp.sgapH) this.setStretchValue(pos, posVal);
};

PosUtil.prototype.resizeComp = function(guideInx, moveX, moveY, isDetail, isMulti)
{
	var acomp = this.acomp, isAbs = (_TinyDom.css(acomp.element, 'position')=='absolute'),
		posArr = isAbs ? this.getPosInfo(true) : this.getMarginInfo(true),
		// acomp.setWidth → _TinyDom.width(el, v) 가 box-sizing 무관 그대로 style.width = v 를 설정
		// 하므로 measure 도 border-box 단위(outerWidth)로 통일해야 set/measure 단위가 일치한다.
		// width() 를 그대로 쓰면 padding/border 가 있는 element 에서 그만큼 줄어드는 증상 발생.
		oriW = _TinyDom.outerWidth(acomp.element),	outerW = _TinyDom.outerWidth(acomp.element),
		oriH = _TinyDom.outerHeight(acomp.element),	outerH = _TinyDom.outerHeight(acomp.element),
		borderW = outerW - oriW , borderH = outerH - oriH,
		pixel = this.PIXEL, chgPos, chgVal, sign = 1, roundFunc;
	
	// 컴포넌트 방향이동 유무
	var compMoveX, compMoveY;
	var dw = moveX, dh = moveY;
	
	if(posArr[0].includes('left'))
	{
		switch(guideInx)
		{
			case 1:
			case 5:
				moveX = dw = 0;
			break;
			case 0: //pw pw
			case 6: //-+ +-
			case 7:
				compMoveX = true;
				dw *= -1;
			break;
			case 2:	//pw pw
			case 3: //0- 0+
			case 4:
				moveX = 0;
			break;
		}
	}
	else
	{
		switch(guideInx)
		{
			case 1:
			case 5:
				moveX = dw = 0;
			break;
			case 0:	//pw pw
			case 6: //0+ 0-
			case 7:
				moveX = 0;
				dw *= -1;
			break;
			case 2: //pw pw
			case 3: //+- -+
			case 4:
				compMoveX = true;
			break;
		}
	}
	
	this.moveX += moveX;
	this.dw += dw;
	posArr[1] = parseFloat(posArr[1]);
	
	// 방향값이 있는 경우
	if(compMoveX)
	{
		if(!isDetail) moveX = pixel*parseInt(this.moveX/pixel, 10);
		
		// right 기준인 경우 보수값으로 변경
		if(posArr[0].includes('right')) moveX *= sign = -1;
		
		// move값이 음수:올림 양수:내림
		if(moveX < 0) roundFunc = Math.ceil;
		else roundFunc = Math.floor;
		
		if(isMulti) chgPos = parseInt(roundFunc(posArr[1]+moveX), 10);
		else chgPos = pixel*parseInt(roundFunc((posArr[1]+moveX)/pixel), 10);
		
		//(현재 포지션값 != 계산한 이동값)
		if(posArr[1] != chgPos)
		{
			//(현재 포지션값+넓이값 < 계산한 이동값)
			if(posArr[1]+oriW < chgPos) chgPos = posArr[1]+oriW;
			
			chgVal = (posArr[1]-chgPos)*sign;
			this.moveX += chgVal;
			posArr[1] = chgPos;
		
			if(posArr[0].includes('right')) chgVal *= sign;
		}
	}
	// 방향값이 없는경우 outerWidth 사용(위치값에 padding, border값을 더한 값이 반대위치이므로)
	else
	{
		if(!isDetail) dw = pixel*parseInt(this.dw/pixel, 10);
		
		// 크기 변경값
		if(dw)
		{
			//if(posArr[0].includes('right')) dw *= sign = -1;	// right 기준인 경우 보수값으로 변경
			if(!isDetail)
			{
				// dw값이 음수:올림 양수:내림
				if(dw < 0) roundFunc = Math.ceil;
				else roundFunc = Math.floor;
				
				if(isMulti) chgPos = parseInt(roundFunc(posArr[1]+outerW+dw), 10);
				else chgPos = pixel*parseInt(roundFunc((posArr[1]+outerW+dw)/pixel), 10);
			}
			else chgPos = posArr[1]+outerW+dw;
			
			if(posArr[1] + borderW > chgPos) chgPos = posArr[1] + borderW;
			
			chgVal = (posArr[1]+outerW-chgPos)*sign;
			this.dw += chgVal;
			chgVal *= -1;
			chgPos = null;
		}
	}
	
	// 변경된 값이 있는 경우에만 방향값을 변경한다.
	if(chgPos != undefined)
	{
		posArr[1] += 'px';
		//acomp.$ele.css(posArr[0], posArr[1]);
		this.setStyle(posArr[0], posArr[1]);
	}
	
	if(chgVal)
	{
		if(isAbs) chgVal += borderW;

		acomp.setWidth(oriW+chgVal);	//acomp.$ele.outerWidth(oriW+chgVal);
		if(acomp.sgapW) this.setStretchValue('data-stretch-width', true);
	}

//------------------------------------------------------------------------
	
	if(posArr[2].includes('top'))
	{
		switch(guideInx)
		{
			case 3:
			case 7:
				moveY = dh = 0;
			break;					
			case 0: //pw pw
			case 1: //-+ +-
			case 2:
				dh *= -1;
				compMoveY = true;
			break;
			case 4: //pw pw
			case 5: //0- 0+
			case 6:
				moveY = 0;
				break;
		}
	}
	else
	{
		switch(guideInx)
		{
			case 3:
			case 7:
				moveY = dh = 0;
			break;
			case 0:	//pw pw
			case 1: //0+ 0-
			case 2:
				moveY = 0;
				dh *= -1;
			break;
			case 4:	//pw pw
			case 5: //+- -+
			case 6:
				compMoveY = true;
			break;
		}
	}
	
	sign = 1;
	chgVal = 0;
	this.moveY += moveY;
	this.dh += dh;
	posArr[3] = parseFloat(posArr[3]);
	if(compMoveY)
	{
		if(!isDetail) moveY = pixel*parseInt(this.moveY/pixel, 10);
		// bottom 기준인 경우 보수값으로 변경
		if(posArr[2].includes('bottom')) moveY *= sign = -1;
		// move값이 음수:올림 양수:내림
		if(moveY < 0) roundFunc = Math.ceil;
		else roundFunc = Math.floor;
		
		if(isMulti) chgPos = parseInt(roundFunc((posArr[3]+moveY)), 10);
		else chgPos = pixel*parseInt(roundFunc((posArr[3]+moveY)/pixel), 10);
		
		//(현재 포지션값 != 계산한 이동값)
		if(posArr[3] != chgPos)
		{
			//(현재 포지션값+넓이값 < 계산한 이동값)
			if(posArr[3]+oriH < chgPos) chgPos = posArr[3]+oriH;
			
			chgVal = (posArr[3]-chgPos)*sign;
			this.moveY += chgVal;
			posArr[3] = chgPos;
		
			if(posArr[2].includes('bottom')) chgVal *= sign;
		}
	}
	// 방향값이 없는경우 outerHeight 사용(위치값에 padding, border값을 더한 값이 반대위치이므로)
	else
	{
		if(!isDetail) dh = pixel*parseInt(this.dh/pixel, 10);
		
		// 크기 변경값이 있고 방향값의 크기와 다른 경우
		if(dh)
		{
			// if(posArr[2].includes('bottom')) dh *= sign = -1;	// right 기준인 경우 보수값으로 변경
			if(!isDetail)
			{
				// dh값이 음수:올림 양수:내림
				if(dh < 0) roundFunc = Math.ceil;
				else roundFunc = Math.floor;
				
				
				if(isMulti) chgPos = parseInt(roundFunc((posArr[3]+outerH+dh)), 10);
				else chgPos = pixel*parseInt(roundFunc((posArr[3]+outerH+dh)/pixel), 10);
			}
			else chgPos = posArr[3]+outerH+dh;
			
			if(posArr[3]+ borderH > chgPos) chgPos = posArr[3] + borderH;	//(현재 포지션값 > 계산한 이동값)

			chgVal = (posArr[3]+outerH-chgPos)*sign;
			this.dh += chgVal;
			chgVal *= -1;
			chgPos = null;
		}
	}
	
	// 변경된 값이 있는 경우에만 방향값을 변경한다.
	if(chgPos != undefined)
	{
		posArr[3] += 'px';
		//acomp.$ele.css(posArr[2], posArr[3]);
		this.setStyle(posArr[2], posArr[3]);
	}
	
	if(chgVal)
	{
		if(isAbs) chgVal += borderH;

		acomp.setHeight(oriH+chgVal);	//acomp.$ele.outerHeight(oriH+chgVal);
		if(acomp.sgapH) this.setStretchValue('data-stretch-height', true);
	}
	
	this.resizeRcomp(acomp);
	this.resetSticky(true);
};

PosUtil.prototype.resizeRcomp = function(comp)
{
	if(comp.className == "RGrid")
	{
		comp.gridApp.resize();
	}
	else if(comp.ChartNameOfType)
	{
		comp.rChartElement.resize();
	}
	else if(comp.className == "AView")
	{
		var child = comp.getChildren();
		for(var i=0;i<child.length;i++)
		{
			if(child[i].ChartNameOfType)
			{
				child[i].rChartElement.resize();
			}

			if(child[i].className == "RGrid")
			{
				child[i].gridApp.resize();
			}

			if(child[i].className == "AView")
			{
				this.resizeRcomp(child[i]);
			}
		}
	}
	
	comp.updatePosition();
	
};

PosUtil.prototype.resetSticky = function(chk)
{
	if(chk && this.stickyX)
	{
		this.stickyCompX = null;
		this.stickyMoveX = 0;
		this.stickyX = 0;
	}
	
	if(chk && this.stickyY)
	{
		this.stickyCompY = null;
		this.stickyMoveY = 0;
		this.stickyY = 0;
	}
	
	this.stickyMoveX = this.stickyMoveY = 0;
};

PosUtil.prototype.setPosInfo = function(arr)
{
	this.moveX = this.moveY = 0;
	this.dw = this.dh = 0;
	this.setStyle(arr[0], arr[1]);
	this.setStyle(arr[2], arr[3]);
	
	this.resetSticky();
};

PosUtil.prototype.setStyle = function(key, value)
{
    if(typeof value === 'number') value += 'px';

    //calc 원문 보존
    if(typeof value === 'string' && value.indexOf('calc(') === 0)
    {
        this.acomp._rawCalc[key] = value;
    }
    
    //px 값이면 calc 폐기
    else if(this.acomp._rawCalc && (key === 'width' || key === 'height'))
    {
        delete this.acomp._rawCalc[key];
    }

    this.acomp.setStyle(key, value);
};


// isPixel true면 해당 위치기준의 값을 무조건 px값으로 리턴
// return ['left', 113, 'bottom', 10]
PosUtil.prototype.getPosInfo = function(isPixel)
{
	var arr = [],
		acomp = this.acomp;
	
	var pos = 'left';
	var posVal = acomp.element.style[pos];
	
	if(posVal=='' || posVal.indexOf('auto')>-1) 
	{
		pos = 'right';
		posVal = _get_style_value(pos);
		
		if(posVal=='' || posVal.indexOf('auto')>-1) 
		{
			pos = 'left';
			posVal = '0px';
		}
	}
	else posVal = _get_style_value(pos);
	
	arr.push(pos);
	arr.push(posVal);
	
	pos = 'top';
	posVal = acomp.element.style[pos];
	
	if(posVal=='' || posVal.indexOf('auto')>-1) 
	{
		pos = 'bottom';
		posVal = _get_style_value(pos);
		
		if(posVal=='' || posVal.indexOf('auto')>-1) 
		{
			pos = 'top';
			posVal = '0px';
		}
	}
	else posVal = _get_style_value(pos);
	
	arr.push(pos);
	arr.push(posVal);
	
	return arr;
	
	function _get_style_value(pos)
	{
		if(isPixel) return _TinyDom.css(acomp.element, pos);
		else return acomp.element.style[pos];
	}
};

PosUtil.prototype.getMarginInfo = function(isPixel)
{
	var arr = [],
		acomp = this.acomp;
	
	var pos = 'margin-left';
	var posVal = _get_style_value(pos);
	//var posVal = acomp.element.style[pos];
	
	/*if(posVal=='' || posVal.indexOf('auto')>-1) 
	{
		pos = 'margin-right';
		posVal = _get_style_value(pos);
		
		if(posVal=='' || posVal.indexOf('auto')>-1) 
		{
			pos = 'margin-left';
			posVal = '0px';
		}
	}
	else posVal = _get_style_value(pos);*/
	
	arr.push(pos);
	arr.push(posVal);
	
	pos = 'margin-top';
	posVal = _get_style_value(pos);
	//posVal = acomp.element.style[pos];
	
	/*if(posVal=='' || posVal.indexOf('auto')>-1) 
	{
		pos = 'margin-bottom';
		posVal = _get_style_value(pos);
		
		if(posVal=='' || posVal.indexOf('auto')>-1) 
		{
			pos = 'margin-top';
			posVal = '0px';
		}
	}
	else posVal = _get_style_value(pos);*/
	
	arr.push(pos);
	arr.push(posVal);
	
	return arr;
	
	function _get_style_value(pos)
	{
		if(isPixel) return _TinyDom.css(acomp.element, pos);
		else return acomp.element.style[pos];
	}
};

// stretch 관련 정보를 꺼낸다.
PosUtil.prototype.getStretchValue = function(dataKey, isForce)
{
    var acomp = this.acomp,
        pos = 'left',

        //핵심: raw calc 우선
        raw = acomp._rawCalc && acomp._rawCalc[dataKey],
        value = raw || acomp.element.style[dataKey],

        stretchType, posVal, start, end;

    if(dataKey == 'width')
    {
        stretchType = acomp.getSgapW();
        pos = 'left';
    }
    else if(dataKey == 'height')
    {
        stretchType = acomp.getSgapH();
        pos = 'top';
    }
    else
    {
        dataKey = dataKey.replace('data-auto-', '');
        value = acomp.element.style[dataKey]=='auto'?true:false;
    }

    if(!isForce && (!stretchType || value.indexOf('calc') < 0)) return value;

    start = value.lastIndexOf('(') + 1;
    end = value.lastIndexOf(')');
    value = value.slice(start, end).replace(/\)|\(/g, '').split(' - ');

    posVal = acomp.element.style[pos];
    if(posVal=='' || posVal=='auto')
    {
        pos = pos=='left'?'right':'bottom';
        posVal = acomp.element.style[pos];
    }

    // calc(80%)
    if(value.length==1)
    {
        value = 100 - parseFloat(value[0]) - parseFloat(posVal);
        value += '%';
    }
    // calc(100% - X) 형태만 처리
    else if(value.length==2 && value[0]=='100%')
    {
        value = parseFloat(value[1]) - parseFloat(posVal);
        value += 'px';
    }
    // 그 외 (rawCalc가 진실이므로 마지막 값만 참고)
    else
    {
        value = value[value.length - 1];
    }    

    return value;
};


// dataKey : 'left', 'right', 'top', 'bottom', 'width', 'height'
// value : number(+'px' or +'%') or boolean
PosUtil.prototype.setStretchValue = function(dataKey, value)
{
	var thisObj = this,
		acomp = this.acomp;
	
	//넓이 auto checkbox를 누른 경우
	if(dataKey == 'data-auto-width')
	{
		dataKey = 'width';
		if(value == '') value = [_TinyDom.outerWidth(acomp.element), null];
		else value = [value, null];
	}
	//높이 auto checkbox를 누른 경우
	else if(dataKey == 'data-auto-height')
	{
		dataKey = 'height';
		if(value == '') value = [_TinyDom.outerHeight(acomp.element), null];
		else value = [value, null];
	}
	//그외 방향값 입력, stretch checkbox 누른 경우, 넓이/높이 입력
	else
	{
		var posArr =['left', 'right', 'top', 'bottom'],
			posIdx = posArr.indexOf(dataKey),
			stretchType, posVal, sizeVal;

		//방향값 입력
		if(posIdx > -1)
		{
			if(posIdx < 2) stretchType = acomp.getSgapW();	//getAttr('data-sgap-width');
			else stretchType = acomp.getSgapH();			//getAttr('data-sgap-height');
			
			//stretch 옵션이 아닌 경우 리턴
			if(!stretchType) return;

			dataKey = 'width';
			if(posIdx > 1) dataKey = 'height';

			value = _calc_helper(posArr[posIdx], this.getStretchValue(dataKey));
		}
		//체크박스 선택
		else if(typeof(value) == 'boolean')
		{
			dataKey = dataKey.replace('data-stretch-', '');
			
			//체크
			if(value)
			{
				if(dataKey == 'width') posIdx = 0;
				else if(dataKey == 'height') posIdx = 2;

				value = _calc_helper(posArr[posIdx], null);
			}
			//언체크
			else
			{
                //raw calc 제거
                if(acomp._rawCalc)
                {
                    delete acomp._rawCalc[dataKey];
                }
                                
				//체크박스를 언체크할 때는 이미 sgapWH 값이 null로 변경 되기 때문에
				//기존 getStretchValue 에서는 stretchValue를 뽑아올 수 없어서 isForce값을 추가
				if(dataKey == 'width')
				{
					if(this.getStretchValue('width', true).includes('%')) value = [this.calcPercentValue(_TinyDom.outerWidth(acomp.element), acomp.getParent().getWidth()), null];
					else value = [_TinyDom.outerWidth(acomp.element), null];
				}
				else if(dataKey == 'height')
				{
					if(this.getStretchValue('height', true).includes('%')) value = [this.calcPercentValue(_TinyDom.outerHeight(acomp.element), acomp.getParent().getHeight()), null];
					else value = [_TinyDom.outerHeight(acomp.element), null];
				}
			}
		}
		//그 외 넓이/높이 입력
		else
		{
			if(dataKey == 'width') stretchType = acomp.getSgapW();
			else if(dataKey == 'height') stretchType = acomp.getSgapH();
			
			//stretch 옵션이 아닌 경우 리턴
			if(!stretchType)
			{
				// 넓이 값을 변경이므로 rComp resize 호출 필요
				this.resizeRcomp(acomp);
				return;
			}
			
			value = _calc_helper(dataKey=='width'?posArr[0]:posArr[2], value);
		}
	}

	if(dataKey == 'width') acomp.setSgapW(value[1]);
	else acomp.setSgapH(value[1]);
	value = value[0];
	
	//acomp.element.style[dataKey] = value;
	//acomp.$ele.css(dataKey, value);
	this.setStyle(dataKey, value);

	//알컴포넌트 리사이즈
	this.resizeRcomp(acomp);
	
	//계산 함수
	function _calc_helper(pos, size)
    {
        var posVal = acomp.element.style[pos],
            stretchType;

        if(posVal=='' || posVal.indexOf('auto')>-1)
        {
            pos = pos=='left'?'right':'bottom';
            posVal = acomp.element.style[pos];
        }

        if(size == undefined)
        {
            var parentWH, compWH;
            if(pos=='left' || pos=='right')
            {
                parentWH = acomp.getParent().getWidth();
                compWH = _TinyDom.outerWidth(acomp.element);
                size = acomp.getStyle('width');
            }
            else
            {
                parentWH = acomp.getParent().getHeight();
                compWH = _TinyDom.outerHeight(acomp.element);
                size = acomp.getStyle('height');
            }

            if(posVal.includes('%'))
            {
                if(size.includes('%'))
                    size = 100 - parseFloat(posVal) - parseFloat(size) + '%';
                else
                    size = (parentWH * (100 - parseFloat(posVal)) / 100) - compWH + 'px';
            }
            else
            {
                if(size.includes('%'))
                    size = (parentWH - parseFloat(posVal) - (parseFloat(size)/100*parentWH))/parentWH*100 + '%';
                else
                    size = parentWH - parseFloat(posVal) - parseFloat(size) + 'px';
            }
        }
        else
        {
            if(!isNaN(size)) size += 'px';
        }

        if(posVal.indexOf('%') > -1)
            stretchType = size.indexOf('%') > -1 ? 4 : 3;
        else
            stretchType = size.indexOf('%') > -1 ? 2 : 1;

        var calcStr = 'calc(100% - ' + posVal + ' - ' + size + ')';

        //calc 원문 갱신
        acomp._rawCalc[dataKey] = calcStr;

        return [calcStr, stretchType];
    }

};

PosUtil.prototype.calcPercentValue = function(val, parentVal)
{
	return val*100/parentVal + '%';
};


//----------------------------------------------------------------------------------------------

;/*
	로컬라이즈 특정언어에서 테스트가 필요할때 방법
	theApp에서 ready된후에
	LocalizeManager.LANGUAGE 에 언어를 지정해준다. en, ko, zh 등등
	!!주의 : 첫 페이지를 로드하기 전에 해야함.
*/

var LocalizeManager = {};

LocalizeManager.loadMap = function()
{
	LocalizeManager.resMap = AUtil.readTextFile('Resource/LocalizeInfo.json');
};

if(PROJECT_OPTION.general.localizing)
{
	LocalizeManager.loadMap();
}


LocalizeManager.isExistFile = function(url, lang)
{
	if(LocalizeManager.resMap && LocalizeManager.resMap[lang])
	{
		return LocalizeManager.resMap[lang][url] || LocalizeManager.resMap[lang][LocalizeManager.FLAVOR][url];
	}
};

LocalizeManager.getFlavor = function()
{
	return PROJECT_OPTION.general.flavor;
};

LocalizeManager.setFlavor = function(flavor)
{
	LocalizeManager.FLAVOR = flavor || PROJECT_OPTION.general.flavor;
	
	//변경시 화면 전부 변경처리
	document.querySelectorAll('[data-localizing-key]').forEach(ele => {
		if(!ele.acomp || !ele.acomp.setText) return;
		ele.acomp.setText(LocalizeManager.getLocalizedStr(ele.getAttribute('data-localizing-key')));
	});
};

LocalizeManager.getLanguage = function()
{	
	var langStr;
	//ie11
	if(afc.isIE && afc.strIEVer == "msie") langStr = navigator.browserLanguage;
	else langStr = navigator.language;
	
	if(langStr) return langStr.split('-')[0];
	else return PROJECT_OPTION.general.language || 'en';
};

LocalizeManager.LANGUAGE = LocalizeManager.getLanguage();
LocalizeManager.FLAVOR = LocalizeManager.getFlavor();

LocalizeManager.conversionText = function(key, callback)
{
	//if(PROJECT_OPTION.general.localizing)
	{
		LocalizeManager.getLocalizedStr(key, callback);
	}
};

LocalizeManager.getLocalizedStr = function(key, callback)
{
	var ret, arr = LocalizeManager.DATA_ARRAY,
		flavor = LocalizeManager.FLAVOR;
	if(!arr)// || LocalizeManager.DATA_ARRAY[0] != LocalizeManager.LANGUAGE)
	{
		arr = LocalizeManager.DATA_ARRAY = [];
		const lang = PROJECT_OPTION.general.localizing?LocalizeManager.LANGUAGE:'common';
		arr.push(lang);
		var resData = AUtil.readTextFile('Resource/'+lang+'.json');
		if(resData)
		{
			var obj = resData[flavor];
			if(!obj) { 
				obj = {};
				obj[flavor] = resData;
				resData = obj;
			}
			arr.push(resData);
		}
		else
		{
			//arr.push({});
		}
	}
	
	if(arr[1]) ret = arr[1][flavor][key];
	else ret = null;
	
	if(callback) callback(ret);
	return ret;
};

String.prototype.localize = function()
{
	if(!window.LocalizeManager) return this;
	return LocalizeManager.getLocalizedStr(this);
};

;
/**
 * @author asoocool
 */

/*
this.dataKeyMap = 
{
	obcpp_logn_025a:
	{
		InBlock1: ['UI_UNIT_CLS', 'WRAP_ACNT_YN', '', '', ''], 
		InBlock2: ['', '' ,'ACNO', 'ASNO', '']
	},
	
	obcpp_logn_101a:
	{
		OutBlock1: ['UI_UNIT_CLS', 'WRAP_ACNT_YN', '', '', ''], 
		OutBlock2: ['', '' ,'ACNO', 'ASNO', ''],
		NextBlock1: ['WRAP_ACNT_YN'],
	}
}
*/

class AComponent
{
	constructor()
	{
		this.element = null;		//dom tree object
		this.$ele = null;			//jQuery object
		this.parent = null;			//parent AView
		//this.aevent = null;

		//클릭 이벤트시 상위로 터치 이벤트 전달 막음
		//상위 전달이 필요한 경우 개별적으로 설정(false)
		this.eventStop = true;

		this.isEnable = true;
		this.events = null;
		this.baseName = '';
		this.className = afc.getClassName(this);

		this.compId = '';
		this.groupName = '';

		//	드래그 & 드랍 Manager
		//this.ddManager = null;

		//자신이 사용할 네트웍 블럭의 data key
		this.dataKeyMap = null;
		this.mappingType = 0;

		this.sgapW = null;
		this.sgapH = null;
		//this.centerX = null;
		//this.centerY = null;

		this.rect = null;

		//attr 에서 값을 불러올 경우
        //여기에서 값을 초기화 하면 안됨. init 함수에서 setOption 함수를 이용함.
		this.option = {};
	
	}

    //개발 시점에만 사용하는 함수
    //공통 구현 각 컴포넌트마다 상황이 다르면 개별 구현
    devApplyStateStyles(state, styleNames)
    {
        //기본 구현을 적용하려면 아래처럼 함수 호출
        //this._devApplyStateStyles(state, styleNames)
    }
 
    _devApplyStateStyles(state, styleNames)
    {
        let curStyles = this.getAttr('data-cur-applys')

        //최초 적용하는 경우
        if(!curStyles) 
        {
            //기본 상태를 선택하면 이미 셋팅되어져 있으므로 리턴
            if(state=='default') return;

            curStyles = this.getAttr('data-style')
        }

        this.removeClass(curStyles)
        this.removeAttr('data-cur-applys')

        this.addClass(styleNames)
        this.setAttr('data-cur-applys', styleNames)
    }


}

window.AComponent = AComponent

AComponent.focusComp = null;

AComponent.setFocusComp = function(newComp, noActive) 
{
	if(AComponent.focusComp!==newComp)
	{
        if(window.theApp?.mdiManager) MDIManager.curMdiManager = window.theApp.mdiManager 
        
		//기존 컴프의 포커스 제거
		//if(AComponent.focusComp && AComponent.focusComp.$ele) AComponent.focusComp.$ele.blur();
		//--> blur 이벤트가 두번 발생해서 주석... 이걸 왜 해줬는지 기억이 나지 않음. 살펴볼 것.
		//--> coding 으로 직접 다른 컴포넌트로 포커스를 주기 위해 넣은 코드 같음.

		//새로운 컴프에게 포커스를 줌.
		//if(newComp && newComp.$ele) newComp.$ele.focus();

		//포커스가 이동하는 엘리먼트가 아닌 경우 이전 포커스 컴포넌트에 직접 블러처리를 해준다.
		//newComp가 codemirror인 경우 $ele는 element이므로 다시 jquery로 감싸서 확인한다.

		if(AComponent.focusComp && (!newComp || !_TinyDom.isFocusable(newComp.element)) && AComponent.focusComp.element) 
            AComponent.focusComp.element.blur();

		AComponent.focusComp = newComp;

		//if(newComp)
		//	console.log(newComp.className);

        if(newComp && !noActive)
        {
            let cntr = newComp.getContainer()
            if(cntr instanceof AWindow)
            {
                AWindow.makeTopWindow(cntr);
            }
        }
	}
	
	//rMate 컨텍스트 메뉴 종료 관련 예외처리, asoocool
	if(!window._isDev_ && window['rMate'])
	{
        /*
		var $ctxMenu = theApp.rootContainer.$ele.find('.rMateH5__ContextMenu');
		
		$ctxMenu.each(function()
		{
			if( !$(this).is(':hidden') )
				$(this).parent().remove();
		});
        */

        const ctxMenus = theApp.rootContainer.element.getElementsByClassName('rMateH5__ContextMenu');
        for (const menuEle of ctxMenus) 
        {
			if( !_TinyDom.isHidden(menuEle) )
				menuEle.parentElement?.remove();
        }
	}
	
};

AComponent.getFocusComp = function() { return AComponent.focusComp; };

/*
if(window._isDev_)
{
	AComponent.getFocusComp = AComponent_.getFocusComp;
	AComponent.setFocusComp = AComponent_.setFocusComp;
}
*/

//---------------------------------------------------------------------------------

AComponent.VISIBLE = 0;
AComponent.INVISIBLE = 1;
AComponent.GONE = 2;

AComponent.MASK = [afc.returnAsIt, afc.addComma, afc.addPercent, afc.commaPercent, afc.absPercent,
				   afc.absComma, afc.absCommaPercent, afc.abs, afc.formatDate, afc.formatTime,
				   afc.formatMonth, afc.formatDateTime, afc.formatTic, afc.floor2, afc.floor2Per,
				   afc.intComma, afc.plusfloorPercent, afc.absFloor2, afc.absFloor2Per, afc.formatHMS,
				   afc.sigaTotalAmount, afc.capitalAmount, afc.intComma, afc.addCommaIfFixed, afc.absCommaIfFixed,
				   afc.absFloor1, afc.formatDate2, afc.oneHundredMillionAmount ];
				   
//-------------------------------------------------------------------------------------



AComponent.realizeContext = function(context, container, rootView, parentView, listener)
{
	var className = context.getAttribute(afc.ATTR_CLASS);

	//item
	if(!className) 
	{
		//동적 로드(afc.loadHtml)를 위해 추가된 div 는 생성하지 않기 위해 
        if(context.getAttribute('data-load-html')) return null
        
        className = 'AHTMLElement'
        //return null
	}

	var classFunc = window[className];
	if(!classFunc) 
	{
		afc.log('We can not find the class of ' + className );
		//alert(afc.log('We can not find the class of ' + className ));
		
		className = context.getAttribute(afc.ATTR_BASE);
		classFunc = window[className];
		
		//return null;
	}

	var acomp = new classFunc();
	
	context.container = container;
	
	if(rootView) context.rootView = rootView;
	else context.rootView = acomp;

	//parent 변수만 셋팅해야 하므로 setParent 함수를 호출하지 않는다.
	//acomp.setParent(parentView);

	acomp.parent = parentView;
	
	acomp.init(context, listener);

	return acomp;
};

//--------------------------------------------------------------------------------------------

AComponent.prototype.enableKeyPropagation = function(enable)
{
	this.keyPropagation = enable;
};

AComponent.prototype.createElement = function(context)
{
	//컨텍스트를 지정하지 않은 경우
	if(!context) context = this.className;
	
	//컨텍스트를 생성하도록 문자열로 지정한 경우. 즉, 클래스 이름으로 지정
	if(typeof(context)=="string") 
	{
		var compInfo = window[context].CONTEXT;	//AButton.CONTEXT
		
		if(!compInfo)
		{
			//확장컴포넌트인 경우 부모클래스를 얻어온다.
			context = window[context].prototype.superClass.name;
			compInfo = window[context].CONTEXT;
		}

		//context = $(compInfo.tag);
		//context.css(compInfo.defStyle);
		//this.element = context[0];

        context = document.createElement('div');
        context.innerHTML = compInfo.tag;
        this.element = context.firstElementChild;
        Object.assign(this.element.style, compInfo.defStyle)
	}
	
	//컨텍스트를 직접 지정한 경우
	else this.element = context;
	
	this.rect = new ARect();
    
	this.events = {};
    this.element.acomp = this;	//AComponent object
	
	//기존 버전과의 호환을 위해, 프로젝트에서 별도로 로드했으면 만들어 준다.
	if(typeof jQuery != 'undefined') this.$ele = $(this.element);
	
	//this.version = this.$ele.attr('data-ver');
    this.version = this.element.getAttribute('data-ver');
	
	if(!this.version) this.version = 0;
	else this.version = Number(this.version);
};

AComponent.prototype.init = function(context, evtListener)
{
    let oldEle = null;
	
	//같은 메모리 주소의 context 가 온 경우(같은 리소스를 다시 초기화 하는 경우)
	this.reInitComp = (this.element===context);
	
	//기존에 이미 생성되어져 있는 컴포넌트이면 context 를 교체한다. reInitComp 가 아닌 경우
	//기존 리소스를 삭제하기위해 this.$ele 백업
    if(this.element && !this.reInitComp) 
	{
        oldEle = this.element;
	}

	if(!this.reInitComp) this.createElement(context);
	
	if(oldEle)
	{
		oldEle.after(this.element);
		oldEle.remove();
	}
	
	var rootView = this.getRootView();
	
	if(this.element.id)
	{
		//컴포넌트 아이디값 셋팅, 클래스 명은 제거한다.
		var inx = this.element.id.indexOf(afc.CLASS_MARK);
		if(inx>-1) 
		{
			this.compId = this.element.id.substring(inx+afc.CMARK_LEN);

			//아이디를 지정한 경우 멤버 변수로 셋팅해 준다.
			//var rv = this.getRootView();
			if(rootView) rootView[this.compId] = this;
		}
	}
	
	//element 값 생성후 초기화 되기 이전에 필요한 작업을 하는 함수
	//if(this.preset) this.preset.call(this);
	if(this.beforeInit) this.beforeInit();
	
	//루트뷰에게 각각의 컴포넌트가 초기화 되기 이전임을 알린다.
	if(rootView && rootView.beforeChildInit) rootView.beforeChildInit(this);
	
	//----------------------------------------------------------------------------------	
	
	//그룹네임을 셋팅한다.
	this.groupName = this.getAttr(afc.ATTR_GROUP);
    
	this.baseName = this.getAttr(afc.ATTR_BASE);

	//div,span 같은 일반 태그는 baseName 이 없다.
    if(!this.baseName) this.baseName = 'AHTMLElement'
	//APage 와 같이 delegator 방식인 경우 className 을 다싯 셋팅해야 하기 때문에 
	//다시 한번 셋팅한다.
	//this.className = this.getAttr(afc.ATTR_CLASS);

	this.sgapW = this.getAttr('data-sgap-width');
	this.sgapH = this.getAttr('data-sgap-height');
	//this.centerX = this.getAttr('data-center-left');
	//this.centerY = this.getAttr('data-center-top');
	
	if(!evtListener) evtListener = rootView;
	
	//런타임 시점(프로그램 실행 시점)
	if(!this.isDev())
	{
		this.eventStop = !this.getAttr('data-event-propagation');
		//this.loadQueryInfo( (rootView && rootView.isAsyncQryLoad) );
		this.loadQueryInfo();
		
		// 런타임시에만 disabled -> enable 변경 처리
		if(this.getAttr('disabled'))
		{
			this.removeAttr('disabled');
			this.enable(false);
		}

        // 애니메이션 init
        if(this.getAttr('data-animation-init')) this.playAnimate();
	}
	
	if(afc.isIos && !afc.isHybrid)
	{
		if(this.getAttr('data-ios-scroll')) this.escapePreventDefault();
	}
	
	//if(this.defaultAction) this.defaultAction();
	
	if(!this.reInitComp) 
	{
		this.loadEventInfo(evtListener);
		//툴팁설정
		this.initTooltip();
	}
	
	this.loadDataMask();
	
	this.loadShrinkInfo();
	
	// 위치 변경 Util 내부변수 설정
	if(this.isDev())
	{
		this.posUtil = new PosUtil(this);
		
		//--------------------------------------------------------
		//	data-flag="1100", 현재는 앞에 두자리만 사용
		//	attribute 보다 CONTEXT.flag 에 셋팅된 값을 우선한다.
		//	마지막 자리값이 셋팅되어져 있는 것은 예전에 사용하던 값, 이제는 사용안함.
		//	다음 사항이 필요한 경우가 아니면, 컴포넌트 태그에 기본적으로 data-flag 는 셋팅하지 않는다.
		
		var flag = window[this.baseName].CONTEXT.flag || this.getAttr('data-flag');
		if(flag)
		{
			//개발 시점에 자신의 컴포넌트가 선택되지 않도록 하는 옵션
			//하위의 여러 컴포넌트 중에서 특정 컴포넌트만 선택되지 않도록 할 경우
			if(flag.charCodeAt(0)==0x31) this._noSelectComp = true;	//--------------> 이 옵션이 필요한지 검토, 안 쓰고 있는듯
			
			//개발 시점에 하위 컴포넌트 관련 옵션
			//1: 하위 컴포넌트 선택불가 2: 하위 컴포넌트 선택가능하지만 순서변경 및 삭제는 불가
			this._childSelect = Number(flag.charAt(1));
		}
	}
	
	//로컬라이징..
	//if(PROJECT_OPTION.general.localizing)
	{
		var key_loc = this.getAttr('data-localizing-key');
		if(key_loc && this.setText)
		{
			var thisObj = this;
			LocalizeManager.conversionText(key_loc, function(result){
				if(result) thisObj.setText(result);
			});
		}
	}	
};

//터치나 마우스 다운 시 자신이 포커스 컴포넌트 되기, 필요한 컴포넌트만 호출해서 쓰기
AComponent.prototype.actionToFocusComp = function()
{
	var thisObj = this;
	
	this.bindEvent(AEvent.ACTION_DOWN, function(e)
	{
		//e.stopPropagation();
		//최초로 클릭된 컴포넌트만 셋팅하기 위해

		//currentTarget으로 바꿔야하는 이유가 있었는지는 모르겠지만
		//일단 target으로 바꿔서 최초 이벤트 수신 컴포넌트가 포커스 컴포넌트가 되도록 한다.
		//추후 focusComp가 넘어가도 되는 경우 플래그변수를 지정하여 다음 컴포넌트가 포커스 컴포넌트 되도록 한다.
		//타겟이 컴포넌트 안에 포함된 요소인 경우를 위해 _get_helper 함수 추가
		if(e.target===thisObj.element || _get_helper(e.target) === thisObj)
		//if(e.target===thisObj.element)
		//if(e.currentTarget===thisObj.element)
			AComponent.setFocusComp(thisObj);
	});

	function _get_helper(ele)
	{
		if(!ele) return;
		if(ele.acomp) return ele.acomp;
		return _get_helper(ele.parentElement);
	}
};

/*
AComponent.prototype.reuse = function()
{
	//기존 정보를 이용하여 aquery.addQueryComp() 다시 셋팅한다.
	this.reuseQueryInfo();
};
*/

//Do not call directly 
AComponent.prototype.release = function()
{
	if(this.aevent)
	{
		if(this.aevent.bindKeyDown) theApp.removeKeyEventListener('keydown', this.aevent);
		if(this.aevent.bindKeyUp) theApp.removeKeyEventListener('keyup', this.aevent);
	}

	this.removeFromAQuery();
	this.ddManager = undefined;
};

//현재 받은 데이터의 key에 값이 없을경우 이전 데이터를 merge함
//#### 코스콤에서 네트웍 성능 향상을 위해 사용하너 같은데...
//#### 현재는 사용하는 곳이 없어 보임... 나중에 사용하는지 확인 ####
AComponent.prototype.preValMerge = function(comp, data, keyArr)
{
	if(!comp.preVal) comp.preVal = {};
	
	var keyOne = null;
	for(var i = 0; i<keyArr.length; i++)
	{
		keyOne = keyArr[i];
		if(data[keyOne]) comp.preVal[keyOne] = data[keyOne];
		else data[keyOne] = comp.preVal[keyOne];
	}
};

AComponent.prototype.getContainer = function()
{
	if(this.isValid()) return this.element.container; 
	else return null;
};

AComponent.prototype.getContainerId = function()
{
	if(this.isValid() && this.element.container) return this.element.container.getContainerId();
	else return null;
};

AComponent.prototype.getRootView = function()
{
	if(this.isValid()) return this.element.rootView; 
	else return null;
};

//컨테이너의 메인뷰를 리턴한다.
AComponent.prototype.getContainerView = function()
{
	if(this.isValid()) return this.element.container.getView();
	else return null;
};

AComponent.prototype.getElement = function()
{
    return this.element;
};

//deprecated
AComponent.prototype.get$ele = function()
{
	return this.$ele;
};

AComponent.prototype.getStyle = function(key, isComputedStyle)
{
	//if(this.isValid()) return this.element.style[key];
	//else return '';

	if(this.isValid())
	{
		return isComputedStyle?_TinyDom.css(this.element, key):this.element.style[key];
	}
	else return '';
};

AComponent.prototype.setStyle = function(key, value)
{
	if(this.isValid()) this.element.style[key] = value;
};

AComponent.prototype.setStyleObj = function(obj)
{
	if(this.isValid())
	{
		//for(let p in obj)
    	//	this.element.style[p] = obj[p];

        Object.assign(this.element.style, obj)
	}
};

//url: 'Asset/test.png', pos: '10px 50%', size: '100% 100px', repeat: 'no-repeat'
AComponent.prototype.setBackgroundImage = function(url, pos, size, repeat)
{
	if(this.isValid()) 
	{
		this.element.style['background-image'] = 'url('+url+')';
		
		if(pos) this.element.style['background-position'] = pos;
		if(size) this.element.style['background-size'] = size;
		if(repeat) this.element.style['background-repeat'] = repeat;
	}
};

/*
//defVal : 아무값도 셋팅되어져 있을 않을 경우 리턴
AComponent.prototype.getAttr = function(key, defVal)
{
	var val = this.element.getAttribute(key);
	
	//아무값도 셋팅하지 않았으면
	if(!val && defVal!=undefined) val = defVal;
	else if(val=='false') val = Boolean(val);
	
	return val;
};
*/

AComponent.prototype.getAttr = function(key, defVal)
{
	if(this.isValid()) 
    {
        let val = this.element.getAttribute(key);
        //값이 없으면 기본값 리턴
        if(!val && defVal!=undefined) val = defVal;
        
        return val;
    }
	else return null;
};


AComponent.prototype.setAttr = function(key, value)
{
	if(this.isValid()) return this.element.setAttribute(key, value);
	else return null;
};

AComponent.prototype.removeAttr = function(key)
{
	if(this.isValid()) return this.element.removeAttribute(key);
	else return null;
};

AComponent.prototype.isValid = function()
{
	return Boolean(this.element);
};


AComponent.prototype.setSgapW = function(sgapW)
{
	if(sgapW)
	{
		this.sgapW = sgapW;
		this.setAttr('data-sgap-width', sgapW);
	}
	else
	{
		this.sgapW = null;
		this.removeAttr('data-sgap-width');
	}
};

AComponent.prototype.setSgapH = function(sgapH)
{
	if(sgapH)
	{
		this.sgapH = sgapH;
		this.setAttr('data-sgap-height', sgapH);
	}
	else
	{
		this.sgapH = null;
		this.removeAttr('data-sgap-height');
	}
};

AComponent.prototype.getSgapW = function()
{
	return this.sgapW;
};

AComponent.prototype.getSgapH = function()
{
	return this.sgapH;
};


/*
AComponent.prototype.addClass = function(className)
{
	var curClass = this.element.className;
	
    if(curClass.indexOf(className)==-1)
    	this.element.className = curClass+' '+className;
};

AComponent.prototype.removeClass = function(className)
{
	this.element.className = this.element.className.replace(' '+className, '');
};
*/

AComponent.prototype.addClass = function(className)
{
	//if(this.$ele) this.$ele.addClass(className);
	//className = className?.trim()
    //if(this.element && className) this.element.classList.add(className);

    _TinyDom.addClass(this.element, className)
};

AComponent.prototype.removeClass = function(className)
{
	//if(this.$ele) this.$ele.removeClass(className);
	//className = className?.trim()
    //if(this.element && className) this.element.classList.remove(className);

    _TinyDom.removeClass(this.element, className)
};

AComponent.prototype.hasClass = function(className)
{
	// return this.$ele.hasClass(className);
	//className = className?.trim()
    //if(this.element && className) return this.element.classList.contains(className);

    return _TinyDom.hasClass(this.element, className)
};

//직접 호출하지 말것. 실제로 컴포넌트의 부모를 바꾸러면 parent.addComponent 를 사용해야 함.
//addComponent 만 호출하면 이전 부모에서 자동으로 새로운 부모로 이동함, 이전 부모에서 삭제하지 않아도 됨.
AComponent.prototype.setParent = function(parent)
{
	// 20171214 parent 무조건 세팅하게 임시처리 -김민수
	//if(this.parent===parent) return;
	
	if(parent)
	{
		this.element.container = parent.getContainer();
		this.element.rootView = parent.getRootView();
		
		if(this.compId)
		{
			//새로 바뀐 부모의 prefix 로 변경해 준다.
			this.element.id = this.element.rootView.compIdPrefix+this.compId;
			
			//--------------------------------------------------------------------------------------
			//	TODO. ★
			//	새로운 부모가 가지고 있는 자식중에 같은 아이디가 존재할 수 있으므로...변경 로직이 필요...
			//	그렇다고 지정한 아이디를 임의로 바꾸는 것도 문제....
			//	아이디 중복을 체크하여 중복이라는 알림을 보여주는 로직 생각해 보기
			//--------------------------------------------------------------------------------------
		}
	}
	
	this.parent = parent;
};

//AView
AComponent.prototype.getParent = function()
{
	return this.parent;
};

AComponent.prototype.getOwner = function()
{
	return this.owner;
};

AComponent.prototype.getPrevComp = function()
{
	//var ele = this.$ele.prev().get(0);
    const ele = this.element.previousElementSibling;
    
	if(ele) return ele.acomp;
	return null;
};

AComponent.prototype.getNextComp = function()
{
	//var ele = this.$ele.next().get(0);
    const ele = this.element.nextElementSibling;
    
	if(ele) return ele.acomp;
	return null;
};

//편집기에서 셋팅한 id
AComponent.prototype.getComponentId = function()
{
	return this.compId;
};

AComponent.prototype.setComponentId = function(compId)
{
	//if(this.element.id)
	//	this.element.id.replace(afc.CLASS_MARK+this.compId, afc.CLASS_MARK+compId);
	
	if(this.isValid() && this.element.rootView) 
		this.element.id = this.element.rootView.compIdPrefix+compId;
	
	this.compId = compId;
};

AComponent.prototype.getGroupName = function()
{
	return this.groupName;
};

AComponent.prototype.setGroupName = function(groupName)
{
	this.setAttr('data-group', groupName);
	this.groupName = groupName;
};

AComponent.prototype.getClassName = function()
{
	return this.className;
};

AComponent.prototype.setClassName = function(className)
{
	this.setAttr(afc.ATTR_CLASS, className);
	this.className = className;
};

//태그의 id attribute (실제 id)
AComponent.prototype.getElementId = function()
{
	return this.element.id;
};

AComponent.prototype.setName = function(name)
{
	this.setAttr('name', name);
};

AComponent.prototype.getName = function()
{
	return this.getAttr('name');
};

AComponent.prototype.isShow = function()
{
	if(!this.isValid()) return false;
	
	//return this.$ele.is(":visible");
    return !_TinyDom.isHidden(this.element);
};

/*
AComponent.prototype.show = function(showType)
{
	switch(showType)
	{
		case AComponent.VISIBLE:
			this.$ele.show(); 
			this.$ele.css('visibility', 'visible');
		break;
		
		case AComponent.INVISIBLE: 
			this.$ele.css('visibility', 'hidden');
		break;
			
		case AComponent.GONE: this.$ele.hide(); break;
	}
};
*/

AComponent.prototype.show = function() 
{ 
	if(!this.isValid()) return;
	
	//this.$ele.css('visibility', 'visible'); 
	//this.$ele.show(); 
	
    this.element.style.visibility = 'visible'
	_TinyDom.show(this.element); 
};

AComponent.prototype.hide = function() 
{ 
	if(!this.isValid()) return;
	
	//this.$ele.hide(); 
    _TinyDom.hide(this.element)
};

AComponent.prototype.visible = function() 
{ 
	if(!this.isValid()) return;
	
	//this.$ele.css('visibility', 'visible'); 
    this.element.style.visibility = 'visible'
};

AComponent.prototype.invisible = function() 
{ 
	if(!this.isValid()) return;
	
	//this.$ele.css('visibility', 'hidden'); 
    this.element.style.visibility = 'hidden'
};

AComponent.prototype.enable = function(isEnable)
{
	this.isEnable = isEnable;
	
	//ios 14.6 에서 pointer-events : none 이 작동하지 않는다. 터치 작동이 막히지도 않고 css 도 반영되지 않는다.
	//임시로 disabled 어트리뷰트를 사용, 이 속성은 input 계열에서만 작동된다.
	//즉, input 계열이 아닌 다른 컴포넌트에서 enable(false) 를 호출해도 disable 되지 않는다.
	//이 증상은 ios 14.6 의 자체 버그이다. 14.7 에서 fix 될 예정
	if(afc.iosVer==14.5 || afc.iosVer==14.6)
	{
		//if(isEnable) this.$ele.removeAttr('disabled');
		//else this.$ele.attr('disabled', 'true');

		if(isEnable) this.element.removeAttribute('disabled');
		else this.element.setAttribute('disabled', 'true');
	}
	
	else
	{
		//if(isEnable) this.$ele.css('pointer-events', 'auto');
		//else this.$ele.css('pointer-events', 'none');
		if(isEnable) this.element.style.pointerEvents = 'auto';
		else this.element.style.pointerEvents = 'none';
	}
	
};

//{left,top,right,bottom}
AComponent.prototype.getBoundRect = function()
{
	return this.element.getBoundingClientRect();
};

//return ARect
AComponent.prototype.getCompRect = function()
{
	var pos = this.getPos();
	this.rect.setSizeRect(pos.left, pos.top, this.getWidth(), this.getHeight());
	
	return this.rect;
};

AComponent.prototype.setCompRect = function(x, y, w, h)
{
	//this.$ele.css( { left: x+'px', top: y+'px', width: w+'px', height: h+'px' });

    Object.assign(this.element.style, { left: x+'px', top: y+'px', width: w+'px', height: h+'px' });
};

AComponent.prototype.getOffset = function()
{
	//return this.$ele.offset();
    return _TinyDom.offset(this.element);
};

AComponent.prototype.getPos = function()
{
	//return this.$ele.position();
    return _TinyDom.position(this.element);
};

AComponent.prototype.setPos = function(x, y)
{
	//x 가 object 인 경우, {left: 100, top:100}
	if(typeof(x)=='object')
	{
		y = x.top;
		x = x.left;
	}
	
	x = Math.floor(x);
	y = Math.floor(y);
	
	//this.$ele.css( { 'left': x+'px', 'top': y+'px' });
    this.element.style.left = x+'px'
    this.element.style.top = y+'px'
};

//deprecated
AComponent.prototype.offsetPos = function(dx, dy)
{
	//var curPos = this.$ele.position();
	//this.$ele.css( { 'left': (curPos.left+dx)+'px', 'top': (curPos.top+dy)+'px' });

	const curPos = this.getPos();
    this.element.style.left = (curPos.left+dx)+'px'
    this.element.style.top = (curPos.top+dy)+'px'

};

AComponent.prototype.movePos = function(dx, dy)
{
	//var curPos = this.$ele.position();
	//this.$ele.css( { 'left': (curPos.left+dx)+'px', 'top': (curPos.top+dy)+'px' });

	const curPos = this.getPos();
    this.element.style.left = (curPos.left+dx)+'px'
    this.element.style.top = (curPos.top+dy)+'px'
};

AComponent.prototype.getWidth = function()
{
	//return this.$ele.width();

    return _TinyDom.width(this.element);
};

AComponent.prototype.getHeight = function()
{
	//return this.$ele.height();

    return _TinyDom.height(this.element);
};

AComponent.prototype.getOuterWidth = function()
{
	//return this.$ele.outerWidth();

    return _TinyDom.outerWidth(this.element);
};

AComponent.prototype.getOuterHeight = function()
{
	//return this.$ele.outerHeight();

    return _TinyDom.outerHeight(this.element);
};

AComponent.prototype.setWidth = function(w)
{
	//this.$ele.width(w);
    _TinyDom.width(this.element, w);
};

AComponent.prototype.setHeight = function(h)
{
	//this.$ele.height(h);
    _TinyDom.height(this.element, h);
};

AComponent.prototype.setSize = function(w, h)
{
	//this.$ele.width(w);
	//this.$ele.height(h);
    this.setWidth(w)
    this.setHeight(h)
};

AComponent.prototype.offsetSize = function(dw, dh)
{
	//this.setSize(this.$ele.width()+dw, this.$ele.height()+dh);
    this.setSize(this.getWidth()+dw, this.getHeight()+dh);
};

AComponent.prototype.centerX = function()
{
	//this.$ele.css('left', 'calc(50% - ' + this.$ele.width()/2 + 'px)');
	//this.$ele.css('right', '');

	this.element.style.left = 'calc(50% - ' + this.getWidth()/2 + 'px)';
	this.element.style.right = '';
};

AComponent.prototype.centerY = function()
{
	//this.$ele.css('top', 'calc(50% - ' + this.$ele.height()/2 + 'px)');
	//this.$ele.css('bottom', '');

	this.element.style.top = 'calc(50% - ' + this.getHeight()/2 + 'px)';
    this.element.style.bottom = '';
};

AComponent.prototype.setInlineStyle = function(pos)
{
	if(!pos) pos = 'static';
	
	this.setStyleObj({ position:pos, display:'inline-block', 'vertical-align':'top' });	//'margin-bottom':'-5px'
	//this.setStyleObj({ position:'static', display:'inline-table', 'margin-bottom':'-5px' });
};

AComponent.prototype.removeFromView = function(onlyRelease)
{
	this.release();
	
	//리스트뷰가 view pool 을 사용할 경우 
	if(!onlyRelease)
	{
		//let con = this.getContainer();
		this.setParent(null)
		//this.$ele.remove()
        this.element.remove()

    	this.$ele = null
		this.element = null

        this.hideTooltip()
	}
};

AComponent.prototype.addEventListener = function(evtName, listener, funcName, isPrepend)
{
	var evts = this.events[evtName];
	if(!evts) 
	{
		evts = [];
		this.events[evtName] = evts;
		
		//AXEvent 가 구현해 놓은 event 처리 함수를 얻어온다.
		if(this.aevent)
		{
			var evtFunc = this.aevent[evtName];
			if(evtFunc) evtFunc.call(this.aevent);
		}
	}
	
	//기존에 같은 이벤트, 같은 리스너가 등록되어 있다면 삭제 -> removeEventListener 함수 내부에서 체크
	else this.removeEventListener(evtName, listener);
	
	var info =
	{
		'listener': listener,
		'funcName': funcName
	};
	
	if(isPrepend) evts.unshift(info);
	else evts.push(info);
};

AComponent.prototype.removeEventListener = function(evtName, listener)
{
	var evts = this.events[evtName];
	
	if(evts)
	{
		for(var i=0; i<evts.length; i++)
		{
			if(evts[i].listener===listener)
			{
				evts.splice(i, 1);
				return;
			}
		}
	}
};

//setTimeout so slow...
AComponent.prototype.reportEvent = function(evtName, info, event)
{
	//if(window._isDev_ && !this._unitTest) return;
	
	if(!this.isValid()) return;
	
	var evts = this.events[evtName];
	
	if(evts)
	{
		var evt, func;
		for(var i=0; i<evts.length; i++)
		{
			evt = evts[i];
			func = evt.listener[evt.funcName];
			if(func) func.call(evt.listener, this, info, event);
			
			//evt.listener[evt.funcName](this, info, event);
		}
	}
};

AComponent.prototype.reportEventDelay = function(evtName, info, delay, event)
{
	var thisObj = this;
	
	setTimeout(function()
	{
		//if(thisObj.isValid())
		thisObj.reportEvent(evtName, info, event);
		
	}, delay);
};

//pWidth : parent width, pHeight : parent height
AComponent.prototype.updatePosition = function(pWidth, pHeight)
{

};

/*
AComponent.prototype.calcStretch = function(key, margin, pSize)
{
	var isPercent = (margin.indexOf('%')>-1);
	
	margin = parseInt(margin, 10);
	
	//if(isPercent) alert(margin);	
	
	var pos = this.getStyle(key);
	if(!pos || pos=='auto')
	{
		key = (key=='left') ? 'right' : 'bottom';
		pos = this.getStyle(key);
	}
	
	if(isPercent) margin = pSize*(margin/100);

	return (pSize - margin - parseInt(pos, 10));
};
*/

AComponent.prototype.setDataMask = function(func, param, ele)
{
	if(!ele) ele = this.element;
	
	var dm = null;
	
	if(typeof(func)=='string') 
	{
		func = func.split('.');
		
		dm = new ADataMask(ele);
		dm.insertMaskFunc(ADataMask[func[0]][func[1]].func, param);
	}
	else if(typeof(func)=='function') 
	{
		dm = new ADataMask(ele);
		dm.insertMaskFunc(func, param);
	}
	else dm = func;
	
	ele.dm = dm;
	
	if(dm)
	{
		dm.ele = ele;
		dm.acomp = this;
	}
};

AComponent.prototype.loadDataMask = function(ele)
{
	if(!ele) ele = this.element;

	var maskfunc = ele.getAttribute('data-maskfunc');
	
	if(maskfunc)
	{
		var dm = new ADataMask(ele, this), temp, i,
			maskparam = ele.getAttribute('data-maskparam'),
			attrObj = {'maskfunc': [], 'maskparam': []},
			isTryCatch;
		
		dm.setOriginal(ele.getAttribute('data-maskorigin'));
		
		maskfunc = maskfunc.split('|');
		if(maskparam) maskparam = maskparam.split('|');
		else
		{
			// 기존에 maskparam이 없었던 경우
			maskparam = [];
			for(i=0; i<maskfunc.length; i++)
			{
				maskparam.push('[]');
			}
		}
		
		for(i=0; i<maskfunc.length; i++)
		{
			//타입과 함수명 분리
			temp = maskfunc[i].split('.');
			attrObj.maskfunc.push(maskfunc[i]);
			attrObj.maskparam.push(maskparam[i]);
			try
			{
				dm.insertMaskFunc(ADataMask[temp[0]][temp[1]].func, JSON.parse(maskparam[i]));
			}
			catch(err)
			{
				isTryCatch = true;
				attrObj.maskfunc.pop();
				attrObj.maskparam.pop();
				if(ADataMask.removedArr.indexOf(maskfunc[i]) < 0) ADataMask.removedArr.push(maskfunc[i]);
			}
		}
		
		// fmt 파일에 사용자 포맷 함수를 만들어 설정하고 fmt 파일을 제거한 경우에 알림처리
		if(isTryCatch)
		{
			//문서의 읽기모드와 관계없이 무조건 수정처리한다.
			//MDIManager가 여러개인 경우 수정여부가 다른 문서에 전달되어 수정여부 체크 제거
			dm.resetElement();

			if(attrObj.maskfunc.length < 1)
			{
				ele.removeAttribute('data-maskfunc');
				ele.removeAttribute('data-maskparam');
				ele.removeAttribute('data-maskorigin');
			}
			else
			{
				ele.setAttribute('data-maskfunc', attrObj.maskfunc.join('|'));
				ele.setAttribute('data-maskparam', attrObj.maskparam.join('|'));
			}
		}
		
		ele.dm = dm;
		
		return dm;
	}
	
	else return null;
};

AComponent.prototype.getDataMask = function(idx, ele)
{
	if(!ele) ele = this.element;
	
	if(idx == undefined) return ele.dm;
	else if(!ele.dm) return null;
	else return ele.dm.getMaskFunc(idx);
};

AComponent.prototype.loadShrinkInfo = function(ele)
{
	if(!ele) ele = this.element;

	var shrinkInfo = ele.getAttribute('data-shrink-info');
	if(shrinkInfo)
	{
		shrinkInfo = shrinkInfo.split(',');
		this.setShrinkInfo({fontSize:Number(shrinkInfo[0]), maxChar:Number(shrinkInfo[1]), unit:shrinkInfo[2]}, ele);
	}
};

AComponent.prototype.loadEventInfo = function(evtListener)
{
	var evtClass = window[this.baseName+'Event']; 
	//이벤트 구현 클래스가 존재하지 않을 경우
	if(!evtClass) 
    {
        //console.warn(this.baseName+'Event is not defined.');
        //return;

		evtClass = AEvent
    }
	
	this.aevent = new evtClass(this);
	
	//if(this.presetEvent) this.presetEvent.call(this);
	if(this.beforeLoadEvent) this.beforeLoadEvent();
	
	this.aevent.defaultAction();
	
	if(evtListener)
	{
        let evtObj = this.getMultiAttrInfo(afc.ATTR_LISTENER+'-');
        for(let p in evtObj)
        {
			evtInfo = evtObj[p];
			if(evtInfo)
			{
				evtInfo = evtInfo.split(':');
				this.addEventListener(p, evtListener, evtInfo[1]?.trim());
			}
        }
        /*
		var evtInfo, events = afc.getEventList(this.baseName);
	
		for(var i=0; i<events.length; i++)
		{
			evtInfo = this.getAttr(afc.ATTR_LISTENER+'-'+events[i]);
			if(evtInfo)
			{
				evtInfo = evtInfo.split(':');
				this.addEventListener(events[i], evtListener, $.trim(evtInfo[1]));
			}
		}
        */
	}
};

AComponent.prototype.bindEvent = function(eventName, callback, options)
{
	return AEvent.bindEvent(this.element, eventName, callback, options);
};

AComponent.prototype.unbindEvent = function(eventName, callback, options)
{
	AEvent.unbindEvent(this.element, eventName, callback, options);
};

AComponent.prototype.setQueryInfo = async function(qryName, blockName, dataKeyArr, index)
{
	if(!qryName || !blockName || !dataKeyArr) return;

	//이미 로드해 놓은 정보가 없으면 메모리 할당
	if(!this.dataKeyMap) this.dataKeyMap = {};
	
	var aquery = await AQuery.getSafeQuery(qryName),
		ctnrId = this.getContainerId();

	if(!aquery) return;

	//auto mapping --> 필드키를 매핑한 상태를 보고 자동으로 블럭을 셋팅한다.
	if(this.mappingType==0)
	{
		if(blockName)
		{
			if(aquery.getValue('input')[blockName])
			{
				//if(aquery.getQueryComps(ctnrId, 'input').indexOf(this) > -1)
				if(this.dataKeyMap[blockName]) aquery.removeQueryComp(ctnrId, 'input', this);
				aquery.addQueryComp(ctnrId, 'input', this);
			}
			if(aquery.getValue('output')[blockName])
			{
				if(this.dataKeyMap[blockName]) aquery.removeQueryComp(ctnrId, 'output', this);
				aquery.addQueryComp(ctnrId, 'output', this);
			}
		}
	}
	//inblock mapping --> 필드키를 등록하지 않고도 input 영역에 컴포넌트를 등록할 수 있다.
	else if(this.mappingType==1)
	{
		if(this.dataKeyMap[blockName]) aquery.removeQueryComp(ctnrId, 'input', this);
		aquery.addQueryComp(ctnrId, 'input', this);
	}
	//outblock mapping --> 필드키를 등록하지 않고도 output 영역에 컴포넌트를 등록할 수 있다.
	else if(this.mappingType==2)
	{
		if(this.dataKeyMap[blockName]) aquery.removeQueryComp(ctnrId, 'output', this);
		aquery.addQueryComp(ctnrId, 'output', this);
	}

	if(!this.dataKeyMap[qryName]) this.dataKeyMap[qryName] = {};
	if(!this.dataKeyMap[qryName][blockName]) this.dataKeyMap[qryName][blockName] = [];
	
	if(index == undefined) this.dataKeyMap[qryName][blockName] = dataKeyArr;
	//index를 넣었다는 얘기는 dataKeyArr이 field명이라는 뜻이므로 해당 위치에 넣어준다.
	else this.dataKeyMap[qryName][blockName][index] = dataKeyArr;
};

//쿼리로드 완료시 처리 함수
AComponent.prototype._qryLoadDone = function(aquery)
{
	if(!this.isValid() || !aquery) return;
		
	//--------------------------------------
		
	var keyBlocks, dataKeyArr, keyMapObj, qryName = aquery.getName(), ctnrId = this.getContainerId();
		
//console.log('query load done - ' + qryName);

	//"InBlock1,UI_UNIT_CLS,WRAP_ACNT_YN,,,|OutBlock2,,,ACNO,ASNO,"
	keyBlocks = this.getAttr('data-blocks-'+qryName);

	//auto mapping --> 필드키를 매핑한 상태를 보고 자동으로 블럭을 셋팅한다.
	//블락명이 InBlock 으로 시작하지 않는 경우가 있어서 아래 dataKeyMap 세팅 부분에서
	//input, output 영역에 해당 블락정보가 있는지 체크하여 쿼리컴포넌트에 추가한다.
	/*if(this.mappingType==0)
	{
		//쿼리는 셋팅했지만 필드키를 매핑하지 않은 경우는 
		//쿼리에 컴포넌트를 등록하지 않는다.
		if(keyBlocks)
		{
			if(keyBlocks.indexOf('InBlock')>-1) aquery.addQueryComp(ctnrId, 'input', this);
			if(keyBlocks.indexOf('OutBlock')>-1) aquery.addQueryComp(ctnrId, 'output', this);
		}
	}*/

	//inblock mapping --> 필드키를 등록하지 않고도 input 영역에 컴포넌트를 등록할 수 있다.
	if(this.mappingType==1) aquery.addQueryComp(ctnrId, 'input', this);

	//outblock mapping --> 필드키를 등록하지 않고도 output 영역에 컴포넌트를 등록할 수 있다.
	else if(this.mappingType==2) aquery.addQueryComp(ctnrId, 'output', this);

	//AView 에서만 사용함
	//child mapping -> 부모 뷰가 자식의 updateComponent 를 호출해 주므로 addQueryComp 를 하지 않는다.
	//else if(this.mappingType==3);

	if(!keyBlocks || keyBlocks=='') this.dataKeyMap[qryName] = null;
	else 
	{
		keyMapObj = this.dataKeyMap[qryName] = {};

		//["InBlock1,UI_UNIT_CLS,WRAP_ACNT_YN,,,", "OutBlock2,,,ACNO,ASNO,"]
		keyBlocks = keyBlocks.split('|');
		
		var blockName;
		for(var j=0; j<keyBlocks.length; j++)
		{
			dataKeyArr = keyBlocks[j].split(',');

			//obcpp_logn_101a: 
			//{ 
			//	InBlock1: ['UI_UNIT_CLS', 'WRAP_ACNT_YN', '', '', ''], 
			//	OutBlock2:['', '' ,'ACNO', 'ASNO', ''] 
			//}
			blockName = dataKeyArr[0];
			keyMapObj[blockName] = dataKeyArr;
			dataKeyArr.shift();	//첫번째 원소 blockName 은 삭제
			
			//auto mapping --> 필드키를 매핑한 상태를 보고 자동으로 블럭을 셋팅한다.
			if(this.mappingType==0)
			{
				if(aquery.hasQueryBlock('input', blockName)) aquery.addQueryComp(ctnrId, 'input', this);
				if(aquery.hasQueryBlock('output', blockName)) aquery.addQueryComp(ctnrId, 'output', this);
			}
		}
	}
	
};

AComponent.prototype.loadQueryInfo = async function()
{
	//수신된 데이터 적용 방법, default, add, remove, select
	this.applyType = this.getAttr('data-apply-type');

	//if(this.isDev()) return;
	
	//"obacb_balc_041r|obcpp_scrn_001r"
	var queryNames = this.getAttr(afc.ATTR_QUERY_NAME);
	
	if(!queryNames) return;

	//정보가 존재하면 메모리 할당
	this.dataKeyMap = {};
	
	//쿼리 매핑 방법에 대한 셋팅 값
	var mtype = this.getAttr('data-mapping-type');
	if(mtype) this.mappingType = parseInt(mtype, 10);
	
	queryNames = queryNames.split('|');	//[obacb_balc_041r, obcpp_scrn_001r]
	
	/*
	for(var i=0; i<queryNames.length; i++)
	{
		this._qryLoadDone(await AQuery.getSafeQuery(queryNames[i]));
	}
	*/
	
	/*
	var qrys = await AQuery.getSafeQuerys(queryNames);
	for(var i=0; i<qrys.length; i++)
	{
		this._qryLoadDone(qrys[i]);
	}
	*/
	
	this.qryProms = AQuery.getSafeQuerys(queryNames, true);
};

AComponent.prototype._applyLoadedQuery = function()
{
	if(this.qryProms)
	{
		Promise.all(this.qryProms).then( values =>
		{
			for(var i=0; i<values.length; i++)
			{
				this._qryLoadDone(values[i]);
			}
		});
	}
};

AComponent.prototype.removeFromAQuery = function()
{
	if(!this.dataKeyMap) return;
	
	var aquery, qryName;
	var ctnrId = this.getContainerId();
	for(qryName in this.dataKeyMap)
	{
		aquery = AQuery.getQuery(qryName);
		
		if(aquery)
		{
			//afc.log(ctnrId + ':' + qryName);
		
			aquery.removeQueryComp(ctnrId, 'input', this);
			aquery.removeQueryComp(ctnrId, 'output', this);
		}
	}
};

AComponent.prototype.getQueryData = function(dataArr, keyArr, queryData)
{
	/*	
	//---- example ----
	
	if(!keyArr) return;
	
	var data, value;
	for(var i=0; i<3; i++)
	{
		data = dataArr[i];
		for(var j=0; j<keyArr.length; j++)
		{
			value = ... ;
			data[keyArr[j]] = value;
		}
	}
	
	//InBlock 이 occurs 인 경우
	//실제로 셋팅된 개수로 맞춰줘야 한다. 이후의 원소는 삭제된다.	
	dataArr.length = 3;	
	
	//--------------------
	// simple
	//--------------------
	
	if(!keyArr) return;
	
	var data = dataArr[0];
	data[keyArr[0]] = this.getText();
	*/
};

AComponent.prototype.setQueryData = function(dataArr, keyArr, queryData)
{
	/*	
	//---- example ----
	
	if(!keyArr) return;
	
	var data, value;
	for(var i=0; i<dataArr.length; i++)
	{
		data = dataArr[i];
		for(var j=0; j<keyArr.length; j++)
		{
			value = data[keyArr[j]];
			...
		}
	}
	
	//--------------------
	// simple
	//--------------------
	
	if(!keyArr) return;
	
	var data = dataArr[0];
	this.setText(data[keyArr[0]]);
	*/
};

//Component 의 값을 QueryData 에 반영한다.
AComponent.prototype.updateQueryData = function(queryData)
{
	var keyMap = this.dataKeyMap[queryData.getQueryName()];
	if(keyMap)
	{
		for(var blockName in keyMap)
		{
			// OutBlock 정보는 송신데이터에 세팅되지않는다.
			if(blockName.indexOf('OutB')>-1) continue;
		
			this.getQueryData(queryData.getBlockData(blockName), keyMap[blockName], queryData);
		}
	}
	
	else this.getQueryData(null, null, queryData);
};


//queryData 의 값을 컴포넌트에 반영한다.

//--------------------------------------------------------------------------------------------------------------------
//리얼데이터 수신 시 dataKey 가 동일한 컴포넌트 들은 일단 모두 updateComponent 가 호출된다.
//자신이 사용하는 fid 와 사용하지 않는 fid 가 혼합되어 들어오기 때문에(자신이 사용하지 않는 fid 만 셋팅 되어져 올 수도 있다.)
//setQueryData 내부에서 비교 로직을 구현해야 한다. io 엔진에서 미리 비교하여 사용하지 않으면 넘겨주지 않을 수도 있지만
//여러개중에서 하나라도 사용되면 넘겨주기때문에 어차피 setQueryData 내부에서 다시 비교해야 하므로 비효율적이다.

//--> 다음과 같이 변경
	
//자신과 상관없는 queryData 는 들어오지 않도록 체크해 주고 있음.
//하지만 자신이 사용하는 fid 와 사용하지 않는 fid 가 혼합되어 들어오기 때문에(여러개 중에서 하나라도 사용되면 넘겨준다.)
//setQueryData 내부에서 비교 로직을 구현해야 한다. 
//--------------------------------------------------------------------------------------------------------------------

AComponent.prototype.updateComponent = function(queryData)
{
	var qryName = queryData.getQueryName(), keyMap, blockName;

	keyMap = this.dataKeyMap[qryName];
	if(keyMap)
	{
		for(blockName in keyMap)
		{
			// InBlock 정보는 데이터 수신 후 컴포넌트에 세팅되지않는다.
			if(blockName.indexOf('InB')>-1) continue;
			var blockData = queryData.getBlockData(blockName);

			//데이터가 없거나 길이가 0인 경우는 처리하지 않는다.
			if(!blockData || blockData.length==0) continue;
			
			//현재 처리중인 블록명을 지정한다. updateChildMappingComp 를 호출되는 경우에 사용된다.
			queryData.curBlockName = blockName;
			ADataMask.setQueryData(blockData[0], keyMap[blockName], queryData);
			this.setQueryData(blockData, keyMap[blockName], queryData);
		}
	}
	else this.setQueryData(null, null, queryData);

	ADataMask.clearQueryData();
	
	//현재 처리중인 블록명을 제거한다.
	delete queryData.curBlockName;
};

AComponent.prototype.updateChildMappingComp = function(dataArr, queryData)
{
	var keyMap, blockName = queryData.curBlockName;
	
	//listview 에서 subview 를 호출하는 경우, dataKeyMap 자체가 없을 수도 있다.
	if(this.dataKeyMap) keyMap = this.dataKeyMap[queryData.getQueryName()];
		
	if(keyMap)
	{
		//처리중인 블록명이 있으면 블록명에 해당하는 매핑정보만 처리한다.
		if(blockName) this.setQueryData(dataArr, keyMap[blockName], queryData);
		else
		{
			for(blockName in keyMap)
			{
				this.setQueryData(dataArr, keyMap[blockName], queryData);
			}
		}
	}
	else this.setQueryData(dataArr, null, queryData);
};


//----------------------

AComponent.prototype.toString = function()
{
	var ret = '\n{\n', value;
    for(var p in this) 
    {
        if(!this.hasOwnProperty(p)) continue;
        
        value = this[p];
        
        if(typeof(value) == 'function') continue;
        
        else if(value instanceof HTMLElement)
        {
        	if(afc.logOption.compElement) ret += '    ' + p + ' : ' + value.outerHTML + ',\n';
        	else ret += '    ' + p + ' : ' + value + ',\n';
        }
        else if(value instanceof Object) ret += '    ' + p +' : ' + afc.getClassName(value) + ',\n';
		else ret += '    ' + p + ' : ' + value + ',\n';
    }
    ret += '}\n';
    
    return ret;
};

//drag & drop 관련
AComponent.prototype.enableDrag = function(isDraggable, offsetX, offsetY, listener)
{
	if(!this.ddManager) this.ddManager = new DDManager(this);
	
	if(!offsetX) offsetX = 0;
	if(!offsetY) offsetY = 0;
	
	this.ddManager.setOffset(offsetX, offsetY);
	this.ddManager.enableDrag(isDraggable, listener);
};

AComponent.prototype.enableDrop = function(isDroppable, listener)
{
	if(!this.ddManager) this.ddManager = new DDManager(this);
	this.ddManager.enableDrop(isDroppable, listener);
};

/*
AComponent.prototype.actionDelay = function(filter)
{
	var fComp = this.$ele;
	if(filter) fComp = this.$ele.find(filter);
	 
	if(!fComp) return;
	
	fComp.css('pointer-events', 'none');
	
	var thisObj = this;
	setTimeout(function() 
	{
		if(thisObj.$ele) fComp.css('pointer-events', 'auto'); 
	}, afc.DISABLE_TIME);
};
*/

AComponent.prototype.actionDelay = function()
{
	var thisObj = this;
	
	this.enable(false);
	
	setTimeout(function() 
	{
		if(thisObj.isValid()) thisObj.enable(true); 
		
	}, afc.DISABLE_TIME);
};

//android 4.3 이하, BugFix
//윈도우가 구현한 preventDefault 가 실행되지 않도록, AWindow.prototype.preventTouch 참조
AComponent.prototype.escapePreventTouch = function()
{
/*
	if(afc.andVer>4.3) return;
	
	if(this.getContainer() instanceof AWindow)
	{
		var thisObj = this;
	    this.$ele.on('touchstart', function(e)
	    {
			//스크롤 매니저가 구현된 컴포넌트는 리턴
			if(thisObj.scrlManager || thisObj.scrlManagerX || thisObj.scrlManagerY) return;
	    	
	    	if(thisObj.isScroll && !thisObj.isScroll()) return; 
	    	
	    	e.stopPropagation();
	    });
	}
	*/
};

//컨테이너에 기본 touch 를 disable 시켜 드래그 바운스 효과를 없앨 경우 
//기본적인 스크롤 기능도 사라진다. 이 경우 scrollManager 를 사용하거나
//자체 스크롤 기능을 활성화 시키기 위해 이 함수를 호출하면 특정 컴포넌트만 활성화 된다.
AComponent.prototype.escapePreventDefault = function()
{
	//iphone web
    /*
	this.$ele.bind('touchstart', function(e)
	{
		e.target.noPreventDefault = true;
	});
    */

    //iphone web
    this.element.addEventListener('touchstart', function(e) 
    {
        e.target.noPreventDefault = true;
    });
	
};

AComponent.prototype.setEventSync = function(dstEventEle) 
{
	if(dstEventEle)
	{
		if(this.downHandler) this.setEventSync(null);
	
		this.downHandler = AEvent.bindEvent(this.element, AEvent.ACTION_DOWN, function(e)	{ AEvent.triggerEvent(dstEventEle, AEvent.ACTION_DOWN, e); });
		this.moveHandler = AEvent.bindEvent(this.element, AEvent.ACTION_MOVE, function(e)	{ AEvent.triggerEvent(dstEventEle, AEvent.ACTION_MOVE, e); });
		this.upHandler = AEvent.bindEvent(this.element, AEvent.ACTION_UP, function(e)	{ AEvent.triggerEvent(dstEventEle, AEvent.ACTION_UP, e); });
	}
	else
	{
		AEvent.unbindEvent(this.element, AEvent.ACTION_DOWN, this.downHandler);
		AEvent.unbindEvent(this.element, AEvent.ACTION_MOVE, this.moveHandler);
		AEvent.unbindEvent(this.element, AEvent.ACTION_UP, this.upHandler);
		
		this.downHandler = this.moveHandler = this.upHandler = null;
	}
};

//info : {maxChar:15, fontSize:24}
AComponent.prototype.autoShrink = function(info) 
{
	//this.$ele.autoShrink(info);
    
    AUtil.autoShrink(this.element, info) 
};

//info : {maxChar:15, fontSize:24, unit:'px'}
AComponent.prototype.setShrinkInfo = function(info, ele)
{
	if(!ele) ele = this.element;

	if(info) ele.shrinkInfo = info;
	else
	{
		delete ele.shrinkInfo;
		ele.style['font-size'] = '';
	}
};




//start make by ukmani
//툴팁설정
AComponent.prototype.initTooltip = function()
{
	const thisObj = this;
	
	this.ttMsg = this.getAttr('data-tooltip');
	
	if(this.ttMsg)
	{
		if(!window['ATooltip'])
		{
			AToast.show('ATooltip is not imported.');
			return;
		}
		
		let timer = null;
		
        /*
		this.$ele.hover(
			function()
			{ 
				timer = setTimeout(function()
				{
					timer = null;
					thisObj.showTooltip(); 
				}, 700);
				
			},
			function()
			{ 
				if(timer) 
				{
					clearTimeout(timer);
					timer = null;
				}
				else thisObj.hideTooltip(); 
			}
		);
        */

        // 마우스가 올라왔을 때 실행할 동작
        this.element.addEventListener('mouseenter', function()
        {
			timer = setTimeout(function()
			{
				timer = null;
				thisObj.showTooltip(); 

			}, 700);
        });

        // 마우스가 나갔을 때 실행할 동작
        this.element.addEventListener('mouseleave', function()
        {
			if(timer) 
			{
				clearTimeout(timer);
				timer = null;
			}
			else thisObj.hideTooltip(); 
        });
	}
};

AComponent.prototype.showTooltip = function()
{
	if(this.tooltip)
	{
		this.tooltip.hide();
		this.tooltip = null;
	}

    if(this.isValid())
    {
	    this.tooltip = new ATooltip();
	    this.tooltip.show(this.ttMsg, this.getBoundRect());
    }
};

AComponent.prototype.hideTooltip = function()
{
	if(this.tooltip)
	{
		this.tooltip.hide();
		this.tooltip = null;
	}
};

AComponent.prototype.reloadTooltip = function()
{
	this.hideTooltip();
	this.showTooltip();
};

AComponent.prototype.getTooltip = function()
{
	return this.ttMsg;
};

AComponent.prototype.setTooltip = function(ttMsg)
{
	//this.$ele.attr('data-tooltip', ttMsg);
    this.element.setAttribute('data-tooltip', ttMsg)

	if(!this.ttMsg) this.initTooltip();
	else this.ttMsg = ttMsg;
};

//	현재 스타일을 객체로 반환한다.
AComponent.prototype.getCompStyleObj = function()
{
	//	getDefinedStyle 함수는 AUtil에서 만든 함수
    return { "main": AUtil.getDefinedStyle(this.element) };
};

//	스타일을 다른 컴포넌트의 스타일로 변경한다.
AComponent.prototype.setCompStyleObj = function(obj)
{
	for(var p in obj.main) this.setStyle(p, obj.main[p]);
};

// 매핑가능한 개수를 리턴한다.
AComponent.prototype.getMappingCount = function()
{
	return 1;
};

//cursor
AComponent.prototype.setCursor = function(cursorName)
{
	//this.$ele.css('cursor', !cursorName ? 'default' : cursorName);

    this.element.style.cursor = !cursorName ? 'default' : cursorName;
};

AComponent.prototype.getCursor = function()
{
	return this.element.style.cursor;
};

AComponent.prototype.setFocus = function(noActive)
{
	if(this.isValid())
	{
		this.element.focus();
		AComponent.setFocusComp(this, noActive);
	}
};

//compIdPrefix 는 AView 인 경우만 사용한다.

//이미 초기화 된 컴포넌트의 클론은 문제 발생 요소가 많아 제거함
AComponent.prototype.cloneComponent = function()
{
	if(!this.isValid()) return null;

	let cloneComp = new window[this.getClassName()](),
		//context = this.$ele.clone()[0];
        context = this.element.cloneNode(true);

    context.id = undefined
	context.container = undefined
	context.rootView = undefined
	
	cloneComp.init(context);
	
	return cloneComp;
};

AComponent.prototype.getMultiAttrInfo = function(dataKey)
{
	var attrs = this.element.attributes, obj = {}, attrName, key;

	//dataKey 가 포함된 태그의 attribute 들을 object 로 만들어 리턴한다.
	//attribute 이름에서 dataKey 부분을 제외한 영역을 오브젝트의 키로 하고 attribute value 를 
	//object 의 값으로 한다.
	for(var p in attrs)	//p is 0,1,2, ...
	{
		attrName = attrs[p].name;
		if(attrName && attrName.indexOf(dataKey)>-1)
		{
			key = attrName.replace(dataKey, '');
			obj[key] = this.element.getAttribute(attrName);
		}
	}
	
	return obj;
};

// 컴포넌트 내부에 드랍 가능여부 리턴
AComponent.prototype.getDroppable = function()
{
	return false;
};

//noOverwrite 가 true 이면, 기존의 값이 존재할 경우 덮어쓰지 않는다.
AComponent.prototype.setOption = function(option, noOverwrite)
{
    for(var p in option)
    {
    	if(!option.hasOwnProperty(p)) continue;
    	
		if(!noOverwrite || this.option[p]==undefined)
		{
			this.option[p] = option[p];
		}
    }
};

AComponent.prototype.setUpdateType = function(updateType)
{
	this.updateType = updateType;
};

AComponent.prototype.includeChildView = function(parentView, groupName)
{
    let inx = 0

    if(!groupName)
    {
        parentView.eachChild((acomp)=>
        {
            if(acomp !== this && acomp instanceof AView) this._includeView(acomp, inx++)
        })
    }
    else
    {
        parentView.findCompByGroup(groupName).forEach((acomp)=>
        {
            if(acomp !== this && acomp instanceof AView) this._includeView(acomp, inx++)
        })
    }
}

AComponent.prototype._includeView = function(view, inx)
{

}

//-----------------------------------------------------------------
//	다음 두 함수는 개발 시점에만 사용되어진다.

//Apperance 의 style 에 추가된 css class 값들을 object 형태로 리턴
//default style 값만 리턴한다.
//서브 태그에 data-style- 이 추가된 컴포넌트는 함수를 재구현한다.
AComponent.prototype._getDataStyleObj = function()
{
	var ret = {}, val = this.getAttr(afc.ATTR_STYLE);
	
	//attr value 에 null 이나 undefined 가 들어가지 않도록
	ret[afc.ATTR_STYLE] = val ? val : '';
	
	return ret;
};

// object 형식의 css class 값을 컴포넌트에 셋팅한다.
// default style 값만 셋팅한다.
AComponent.prototype._setDataStyleObj = function(styleObj)
{
	//this._set_class_helper(this.$ele, null, styleObj, afc.ATTR_STYLE);
    this._set_class_helper(this.element, null, styleObj, afc.ATTR_STYLE);
};

/*
AComponent.prototype._set_class_helper = function($attrEle, $cssEle, styleObj, attrKey)
{
	var attrVal = $attrEle.attr(attrKey);
	
	if(!$cssEle) $cssEle = $attrEle;

	//기존에 추가되어져 있던 default style 을 제거하고
	if(attrVal) $cssEle.removeClass(attrVal);

	attrVal = styleObj[attrKey];

	//새로 셋팅되는 default style을 추가한다.
	if(attrVal) $cssEle.addClass(attrVal);
	
	$attrEle.attr(attrKey, attrVal);
};
*/

AComponent.prototype._set_class_helper = function(attrEle, cssEle, styleObj, attrKey)
{
    //이전에 jQuery 객체로 넘기던 코드들과의 호환을 위해
    //차후 호출하는 쪽에서 jQuery 객체 넘기는 코드 제거하면 이 코드도 제거
    if(attrEle instanceof jQuery) attrEle = attrEle[0]
    if(cssEle instanceof jQuery) cssEle = cssEle[0]

	let attrVal = attrEle.getAttribute(attrKey);
	
	if(!cssEle) cssEle = attrEle;

	//기존에 추가되어져 있던 default style 을 제거하고
	if(attrVal) _TinyDom.removeClass(cssEle, attrVal);

	attrVal = styleObj[attrKey];

	//새로 셋팅되는 default style을 추가한다.
	if(attrVal) _TinyDom.addClass(cssEle, attrVal);
	
	attrEle.setAttribute(attrKey, attrVal);
};

//컴포넌트에 데이터를 세팅하는 함수, 가져오는 함수
AComponent.prototype.setData = function(){};
AComponent.prototype.getData = function(){};

//개발시점을 판단하는 함수
AComponent.prototype.isDev = function()
{
	return window._isDev_;
};

//컴포넌트의 animation을 재생하는 함수.
AComponent.prototype.playAnimate = function()
{
    let keyframeArr;
	try
	{
		keyframeArr = JSON.parse(this.getAttr('data-keyframe'));
	}
	catch(e)
	{
		return;
	}

    if(!keyframeArr) return;

	//이미 재생중인 애니메이션을 cancel 요청한뒤에 잠시후에 다시 재생시도.
	if(this.__AnimObj) 
	{	
		this.__AnimObj.cancel();
		setTimeout(()=>{
			this.playAnimate();
		}, 50)
		return;
	}
	
	let option = {
		duration: parseTime(this.element.style.getPropertyValue('animation-duration'), 0),
		easing: this.element.style.getPropertyValue('animation-timing-function') || 'linear',
		delay: parseTime(this.element.style.getPropertyValue('animation-delay'), 0),
		iterations: parseIterations(this.element.style.getPropertyValue('animation-iteration-count'), 1),
		direction: this.element.style.getPropertyValue('animation-direction') || 'normal',
		fill: this.element.style.getPropertyValue('animation-fill-mode') || 'none'
	};
		
	let AnimObj = this.element.animate(keyframeArr, option);
	this.__AnimObj = AnimObj;
	AnimObj.onfinish = () => {
		this.__AnimObj = null;
	}
	
	AnimObj.oncancel = () => {
		this.__AnimObj = null;
	}
	
	function parseTime(timeString, defaultValue) {
		if (timeString === "" || timeString === undefined) return defaultValue;
		if (timeString.endsWith('ms')) {
			return parseFloat(timeString);
		} else if (timeString.endsWith('s')) {
			return parseFloat(timeString) * 1000;
		}
		return defaultValue;
	}

	function parseIterations(iterationsString, defaultValue) {
		if (iterationsString === "" || iterationsString === undefined) return defaultValue;
		if (iterationsString === 'infinite') return Infinity;
		return parseFloat(iterationsString);
	}
};


;               
/**
 * @author asoocool
 */

class ALayout extends AComponent
{
	constructor()
	{
		super()
	
	}

    

}

window.ALayout = ALayout

ALayout.prototype.init = function(context, evtListener)
{
	AComponent.prototype.init.call(this, context, evtListener);

	
};


ALayout.prototype.setParent = function(parent)
{
	AComponent.prototype.setParent.call(this, parent);
	
	var children = this.getAllLayoutComps();
	
	for(var i=0; i<children.length; i++)
		children[i].setParent(parent);
};


ALayout.prototype.getAllLayoutComps = function()
{
	return [];
};

ALayout.prototype.eachChild = function(callback, isReverse)
{

};

ALayout.prototype.updatePosition = function(pWidth, pHeight)
{
	AComponent.prototype.updatePosition.call(this, pWidth, pHeight);
	
	this.eachChild(function(acomp, inx)
	{
		acomp.updatePosition();
	});
};

ALayout.prototype.onContextAvailable = function()
{
	this.eachChild(function(acomp, inx)
	{
		if(acomp.onContextAvailable) acomp.onContextAvailable();
	});
};


ALayout.prototype.removeFromView = function(onlyRelease)
{
	this.eachChild(function(acomp, inx)
	{
		acomp.removeFromView(onlyRelease);
	});

	AComponent.prototype.removeFromView.call(this, onlyRelease);
};

ALayout.prototype._changeCompIdPrefix = function() 
{
	var compId;
	
	this.eachChild(function(acomp, inx)
	{
		compId = acomp.getComponentId();
		
		//componentId 가 존재하면 새로운 compIdPrefix 가 적용되도록 다시 호출해 준다.
		if(compId) acomp.setComponentId(compId);
		
		//자신이 포함하고 있는 하위의 컴포넌트들도 바꿔주기 위해, AView, ALayout
		if(acomp._changeCompIdPrefix) acomp._changeCompIdPrefix();
	});
};

ALayout.prototype.getMappingCount = function(isNumber)
{
	//return this.getAllLayoutComps().length;

    let tot = [], mc

	this.getAllLayoutComps().forEach((child, i)=>{
        mc = child.getMappingCount();
        if(!Array.isArray(mc)) mc = Array.from({ length: mc }, (_, j) => j+1);
		tot = tot.concat(mc);
	})

	return isNumber?tot.length:tot;
};

ALayout.prototype.getQueryData = function(dataArr, keyArr, queryData)
{
	var keyVal, children = this.getAllLayoutComps(), child;
	for(var i=0; i<children.length; i++)
	{
		child = children[i];
		
		keyVal = keyArr[i];
		if(keyVal) child.getQueryData(dataArr, [keyVal], queryData);
	}
};

ALayout.prototype.setQueryData = function(dataArr, keyArr, queryData)
{
	//매핑한 keyArr 가 없어도 child mapping 처리를 위해 주석처리
	//if(!keyArr) return;
	
	let children = this.getAllLayoutComps(), child, i, cnt, keyIdx = 0;
	for(i=0; i<children.length; i++)
	{
		child = children[i];
		
		//하위 컴포넌트가 그리드인 경우 데이터가 변경되므로 매번 처음 인덱스값으로 변경
		//dataArr 가 없는 경우도 있으므로 예외처리한다.
		if(dataArr) ADataMask.setQueryData(dataArr[0], keyArr, queryData);
		
		if(child.mappingType==3) child.updateChildMappingComp(dataArr, queryData);
		else if(keyArr) //keyArr 있는 경우에만 처리
		{
            cnt = child.getMappingCount(true)
            child.setQueryData(dataArr, keyArr.slice(keyIdx, keyIdx+cnt), queryData);
			keyIdx += cnt
		}
	}
};

// 컴포넌트 내부에 드랍 가능여부 리턴
ALayout.prototype.getDroppable = function()
{
	//return true;
	//_childSelect 가 세팅되어있지 않거나 0인 경우에만 드랍가능
	return !this._childSelect;
};

ALayout.prototype._callSubActiveEvent = function(funcName, isFirst) 
{
	this.eachChild(function(acomp, inx)
	{
		if(acomp._callSubActiveEvent) acomp._callSubActiveEvent(funcName, isFirst);
	});

};

ALayout.prototype.reset = function()
{
	this.eachChild(function(acomp)
	{
		if(acomp.reset) acomp.reset();
	});
};

//컴포넌트에 데이터를 세팅하는 함수
ALayout.prototype.setData = function(data)
{
	var children = this.getAllLayoutComps();
	if(Object.prototype.toString.call(data) == '[object Array]')
	{
		var len = Math.min(children.length, data.length);
		for(var i=0; i<len; i++)
		{
			if(data[i] != undefined) children[i].setData(data[i]);
		}
	}
	else if(Object.prototype.toString.call(data) == '[object Object]')
	{
		var keys = Object.keys(data);
		var len = Math.min(children.length, keys.length);
		for(var i=0; i<len; i++)
		{
			if(data[keys[i]] != undefined) children[i].setData(data[keys[i]]);
		}
	}
};

//컴포넌트의 데이터를 얻어오는 함수
ALayout.prototype.getData = function()
{
	var arr = [];
	var children = this.getAllLayoutComps();
	children.forEach(function(comp)
	{
		arr.push(comp.getData());
	});
	
	return arr;
};

ALayout.prototype._applyLoadedQuery = function()
{
	AComponent.prototype._applyLoadedQuery.call(this);
	
	this.eachChild(function(acomp, inx)
	{
		acomp._applyLoadedQuery();
	});
};

;
/**
 * @author asoocool
 */
 
//------------------------------------------------------------------------
//	뷰에는 내부에 다른 뷰를 로드하는 기능이 없도록 한다. 
//	뷰는 오로지 addcomponent 를 통해서만 다른 컴포넌트를 추가할 수 있다. 
//	폼을 구성하기 위한 기본 요소이다.
//------------------------------------------------------------------------

class AView extends AComponent
{
	constructor()
	{
		super()
	
		this.isActiveActionDelay = afc.isMobile;   //모바일인 경우만 true

		//AView 의 소유자, 자신을 로드한 주체
		this.owner = null;
		this.document = null;
		this.url = null;

		//중복 아이디를 막기 위해 동적으로 할당된 prefix
		//afc.CLASS_MARK 를 포함하고 있다. ex, 4736352637362--
		this.compIdPrefix = '';

		//자체적인 스크롤 구현
		this.scrlManagerX = null;
		this.scrlManagerY = null;

		//this.isInitDone = false;	//init 이 완전히 완료되었는지, 알메이트 컴포넌트 관련해서 체크해야 함


		this.ldView = null;	//loaded view --> deprecated
		this.ldCntr = null;
	}

	
	
}

window.AView = AView


//--------------------------------------------------------------------------------------------
//	static area

AView.CONTEXT = 
{
    tag: '<div data-base="AView" data-class="AView" class="AView-Style"></div>',

    defStyle: 
    {
        width:'400px', height:'200px'
    },

    //events: ['swipe', 'longtab', 'scroll', 'scrollleft', 'scrollright', 'scrolltop', 'scrollbottom', 'drop', 'dragStart', 'dragEnd' ]
    events: ['click', 'dblclick', 'swipe', 'longtab', 'scroll', 'scrollleft', 'scrollright', 'scrolltop', 'scrollbottom' ]
};

AView.NAME = "AView";

//lay 에 매칭된 cls 파일이 이미 로드되어 있어도 재로드 한다.
AView.enforceClsLoad = false;

AView.setViewInItem = function(aview, item, owner)
{
	Object.assign(aview.element.style,
	{
		position: 'relative',
		left: '0px', top: '0px'
	});

	item.appendChild(aview.element);

	aview.owner = owner;	//자신을 로드한 주체(AComponent, AContainer)
	aview._item = item;		//뷰를 감싸고 있는 dom element 값을 item 이란 변수로 저장
	item.view = aview;		//item 은 view 란 변수로 AView 객체를 저장

	if(owner) aview.element.container = owner.getContainer();
	
	return aview;
};


//	뷰 객체만 로드하여 얻고 싶은 경우는 
//	item 에 null 값을 주고 url 만 입력하면 됨
//	--> AView.createView(null, 'view/test.lay');
//
//	turnback 은 비동기 함수인 callback 에 다시 되돌려주는 변수
//	callback 변수를 거짓으로 넘기면서 turnback 에 이미 로드된 html 을 넘기면 loadHtml 를 호출하지 않고 view 를 생성한다.

AView.createView = function(item, url, owner, eventListener, skipUpdatePos, skipActiveDone, callback, turnback)
{
	//Promise 지원
	return new Promise(function(resolve, reject) 
	{
		var aview = null;
		//var searchValue = AUtil.extractFileNameExceptExt(url, '/') + afc.CLASS_MARK;

		if(!item) item = document.createElement('div');

		//반응형 사용여부
		if(PROJECT_OPTION.general.responsiveLay)
		{
			var RESPONSIVE_MODE = null;

			if(afc.isPC) RESPONSIVE_MODE = 'Pc'; 
			else if(afc.isMobile) 
			{
				if(afc.isTablet) RESPONSIVE_MODE = 'Pc';
				else RESPONSIVE_MODE = 'Mobile';

				//RESPONSIVE_MODE = 'Mobile';
			}

			if(afc.isSimulator && PROJECT_OPTION.general.responsiveTest)
			{
				RESPONSIVE_MODE = PROJECT_OPTION.general.responsiveTest;
			}

			if(RESPONSIVE_MODE)
			{
				var path = AUtil.extractLoc(url,'/');
				var fileName = AUtil.extractFileNameExceptExt(url,'/');
				var resUrl = path + RESPONSIVE_MODE + '/' +fileName+'.lay';
				if(ResponsiveManager.isExistFile(url, RESPONSIVE_MODE)) url = resUrl;
			}
		}

		//로컬라이징 사용여부
		if(PROJECT_OPTION.general.localizing)
		{
			let path = AUtil.extractLoc(url,'/');
			let fileName = AUtil.extractFileNameExceptExt(url,'/');
			let resUrl = path + LocalizeManager.LANGUAGE + '/' +fileName+'.lay';
			if(LocalizeManager.isExistFile(url, LocalizeManager.LANGUAGE)) url = resUrl;
		}
		
		//afc.asyncWait.reg(url);

		// turnback 은 비동기 함수인 callback 에 다시 되돌려주는 변수
		// callback 변수를 거짓으로 넘기면서 turnback 에 이미 로드된 html 을 넘기면 loadHtml 를 호출하지 않고 view 를 생성한다.

		if(!callback && turnback) 
		{
			item.innerHTML = turnback;

			_loadHelper.call(item, turnback);
		}
		else 
		{
			//afc.loadHtml(item, url, _loadHelper, null, null, Boolean(asyncCallback));
			afc.loadHtml(item, url, _loadHelper); 
		}

		async function _loadHelper(retHtml)
		{
			//retHtml 이 null 인 경우는 ajax 에러이므로 리턴한다.
			if(!retHtml) 
			{
				if(callback) callback(null);
				else resolve(null);
				
				//afc.asyncWait.unreg(url);
				return;
			}
		
			//마지막으로 로드 성공한 html 문자열 정보를 저장해 둔다.
			//if(retHtml) AView.lastLoadedHtml = retHtml;
			if(owner) owner.lastLoadedHtml = retHtml;

            //let viewObj = item.children;
	        let viewContext = item.children[0];

			//AView의 absolute 옵션을 relative로 바꿔준다.
			//그래야 자식 컴포넌트들이 자신을 기준으로 배치된다.
			Object.assign(viewContext.style,
			{
				position: 'relative',
				left: '', top: ''
			});

			var _className = viewContext.getAttribute(afc.ATTR_CLASS), isAView = (_className=='AView'),	//lay 에 매칭된 cls 가 없는 경우는 기본 AView class 이다.
				isRespCss = _TinyDom.hasClass(viewContext, _className+'-resp');
				//viewObj.hasClass(_className+'-resp');

			if(!_className)
			{
				console.warn(afc.log('There is no className in attribute. url : ' + url));
			}

			if(isRespCss)
			{
				afc.loadCss('Template/' + _className + '-resp.css');
			}

			//-------------------------------------------------------------------------
			// 컴포넌트 파일 동적 로딩
			//if(PROJECT_OPTION.build.dynamicComp && !isAView) 
			if(PROJECT_OPTION.build.frwLoadOption=='inTimeLoad')// && !isAView) 
			{
				//var classMap = viewObj.attr('data-class-map');
				var classMap = viewContext.getAttribute('data-class-map');

				if(classMap)
				{
					var arr, p, i;

					classMap = JSON.parse(classMap);
					for(p in classMap)
					{
						arr = classMap[p];

						for(i=0; i<arr.length; i++)
						{
							afc.import('Framework/' + p + '/component/' + arr[i] + '.js');
							afc.import('Framework/' + p + '/event/' + arr[i] + 'Event.js');
						}
					}
				}
			}
			//-------------------------------------------------------------------------

			//-------------------------------------------------------------------------
			// cls 파일 동적 로딩
			//if(PROJECT_OPTION.build.dynamicInc && !isAView) 
			//cls 파일은 무조건 동적 로딩으로 바뀌어서 PROJECT_OPTION.build.dynamicInc 이 옵션을 비교할 필요 없음.
			if(!isAView && url) 
			{
				//로컬라이징 사용여부
				if(PROJECT_OPTION.general.localizing) url = url.replace("/"+LocalizeManager.LANGUAGE+"/","/");
				//반응형
				if(PROJECT_OPTION.general.responsiveLay) url = url.replace("/"+RESPONSIVE_MODE+"/","/");

				//로드가 완료된 이후에 scriptReady 가 호출되어야 한다.
				await afc._loadScriptWait( url.substring(0, url.lastIndexOf(".")) + '.js', AView.enforceClsLoad);	//true, 무조건 강제 로드
			}
			//-------------------------------------------------------------------------		

			//위에서 동적으로 로드한 스크립트가 모두 로드된 후에 진행되도록
			//위의 스크립트 내부에서 호출된 await afc.import(); 까지 모두 로드되어야 호출된다.
			afc.scriptReady(function()
			{
                let _classFunc = window[_className];
                if(!_classFunc) 
                {
                    //alert(afc.log('We can not find the class of ' + _className ));
                    console.warn(afc.log('We can not find the class of ' + _className ));

                    aview = new AView();
                }
                else aview = new _classFunc();

				aview.url = url;
				aview.owner = owner;	//자신을 로드한 주체(AComponent, AContainer)
				aview._item = item;		//뷰를 감싸고 있는 dom element 값을 item 이란 변수로 저장
				item.view = aview;		//item 은 view 란 변수로 AView 객체를 저장


				var rootView = aview;

				if(owner) 
				{
					viewContext.container = owner.getContainer();

					//단독으로 로드된 lay 인 경우 owner 의 루트뷰로 변경해 준다.
					if(isAView && owner.getRootView) //AContainer 인 경우는 함수가 없다.
					{
						rootView = owner.getRootView();
					}
				}

				if(!eventListener) eventListener = rootView;

				//비동기 로드이면 쿼리 파일도 비동기로 로드되도록
				//rootView.isAsyncQryLoad = true;

				viewContext.rootView = rootView;
				viewContext.compIdPrefix = afc.makeCompIdPrefix();

				aview.init(viewContext, eventListener);

                //hot reload 기능
                if(theApp.isHotReload())
                {
                    //로드된 뷰인 경우만
                    if(!isAView && url) theApp.watchReloadFile(aview);
                }

                //afc.queryReady의 타이밍 이슈로 afc.queryReady호출되기전에 처리.
                aview._rMateManage(skipUpdatePos, skipActiveDone, function()
                {
                    afc.queryReady(aview, function()
                    {
                        //initDone, activeDone 이전에 호출된다.
                        if(callback) callback(aview, turnback);
                        else resolve(aview);

                        aview._initDoneManage(skipUpdatePos, skipActiveDone);
                    })
                })

			});
		}
	
	});
	
	//return aview;

};

AView._findTextContains = function(viewComp, text, ignoreCase, retArr)
{
	var ret = null, tmp;
	
	if(retArr) ret = retArr;
	else ret = [];
	
	if(ignoreCase) text = text.toLowerCase();
	
	viewComp.eachChild(function(acomp)
	{
		if(acomp instanceof AView || acomp instanceof ALayout) 
		{
			AView._findTextContains(acomp, text, ignoreCase, ret);
		}
		else if(acomp.getText) 
		{
			tmp = acomp.getText();

			if(ignoreCase) tmp = tmp.toLowerCase();

			if(tmp.indexOf(text)>-1) ret.push(acomp);
		}
	});
	
	return ret;
};


//--------------------------------------------------------------------------------------------


AView.prototype.init = function(context, evtListener)
{
	AComponent.prototype.init.call(this, context, evtListener);
	
	//context 에 rootView 가 셋팅되어져 있지 않으면 자신을 rootView 로 셋팅한다.	
	if(!this.element.rootView) this.element.rootView = this;

	//var respClass = this.getAttr(afc.ATTR_RESP);
	//if(respClass) this.addClass(respClass);
	
	this.setOption(
	{
		getDataAsArray : this.getAttr('data-option-getdata-as-array')
		
	}, true);
	
	//jQuery droppable 클래스 제거
	this.removeClass('ui-droppable');
	
	//if(!this.element.noRealizeChildren) this._realizeChildren(evtListener);
	
	this._realizeChildren(evtListener, this.reInitComp);
	
	// 개발중에 하위 컴포넌트를 선택하지 못하는 경우 직접 하위 컴포넌트의 이벤트를 등록하여 전달해준다.
	this.loadChildEventInfo(evtListener);
	
	/*
	if(afc.isIos)
	{
		if(this.$ele.css('overflow')!='hidden')
			this.$ele.css('-webkit-overflow-scrolling', 'touch');
	}
	else
	{
		var val = this.$ele.css('overflow');
		
		//뷰에 스크롤이 발생할 경우 가속기능을 부여하기 위해, z-index가 없거나 auto인 경우 0으로 대체
		//이 부분이 없으면 크롬 브라우저에서 뷰 스크롤 시 안보이던 부분이 안그려지는 버그가 생김
		if(val=='auto' || val=='scroll')
		{
			val = this.$ele.css('z-index');
			if(!val || val == 'auto') this.$ele.css('z-index', 0);
			
			// 여러 absolue 태그가 중첩되어 스크롤 기능이 작동될 때
			// 겹쳐지는 버그 수정(z-index 관련 오류)
			this.$ele.css('-webkit-backface-visibility', afc.isSimulator?'':'hidden');
			// 이미 backface0visibility 값이 SpiderGen에서 화면 오픈 할 때 hidden으로 처리되었으므로 일단 제거하고
			// 추후에 아래의 내용으로 변경할지 고민 필요
			//if(!afc.isSimulator && !window._isDev_) this.$ele.css('-webkit-backface-visibility', 'hidden');
		}
		
		
		//android 4.3 이하, BugFix
		//스크롤뷰 안의 컴포넌트 터치 안되는 버그 수정
		if(afc.andVer<4.4)
		{
			this.$ele.css('-webkit-transform', 'translateZ(0)');
			
			//thisObj = this;
			//setTimeout(function() { thisObj.$ele.css('-webkit-transform', ''); }, 100);
		}
	}
	*/
	
	//-----------------------------------------------------------------------
	//	asoocool 2019.04.09 
	var val = _TinyDom.css(this.element, 'overflow');

	if(val=='auto' || val=='scroll')
	{
		if(afc.isIos)
		{
			this.element.style.setProperty('-webkit-overflow-scrolling', 'touch');
		}

		//	android
		//	뷰에 스크롤이 발생할 경우 가속기능을 부여하기 위해, z-index가 없거나 auto인 경우 0으로 대체
		//	이 부분이 없으면 크롬 브라우저에서 뷰 스크롤 시 안보이던 부분이 안그려지는 버그가 생김
		else
		{
			val = _TinyDom.css(this.element, 'z-index');
			if(!val || val == 'auto') this.element.style.zIndex = 0;

			// 여러 absolue 태그가 중첩되어 스크롤 기능이 작동될 때
			// 겹쳐지는 버그 수정(z-index 관련 오류)
			this.element.style.setProperty('-webkit-backface-visibility', afc.isSimulator?'':'hidden');

			// 이미 backface0visibility 값이 SpiderGen에서 화면 오픈 할 때 hidden으로 처리되었으므로 일단 제거하고
			// 추후에 아래의 내용으로 변경할지 고민 필요
			//if(!afc.isSimulator && !window._isDev_) this.$ele.css('-webkit-backface-visibility', 'hidden');
			
			if(afc.isScrollIndicator) 
			{
				this._enableScrollIndicatorX();
				this._enableScrollIndicatorY();
			}
		}
	}
	
	//-----------------------------------------------------------------------	
	
	//this.escapePreventTouch();
	
	if(!this.reInitComp)
	{
		this.actionToFocusComp();

		if(context && context.compIdPrefix) this._changeCompIdPrefix(context.compIdPrefix);

		//for mirae - crud component 확인
		//this._initCrudComponent();


		var loadUrl = this.getAttr('data-load-url');
		if(loadUrl && !this.isDev()) 
		{
			var thisObj = this;

			//setTimeout(function()
			//{
				thisObj.loadView(loadUrl);

			//}, 0);
		}
	}
	
	
};


AView.prototype._initCrudComponent = function() 
{
	if(typeof CrudManager != "function") return;
	
	this.crudObj = CrudManager.getCrudbyFileName(this.className);
	if(!this.crudObj) return;
    var children = this.getChildren();

	for(var i=0;i<children.length;i++)
	{
		this._findChildCrudComp(children[i]);
	}

};

AView.prototype._findChildCrudComp = function(comp) 
{
	if(comp.baseName == 'AGridLayout' || comp.baseName == 'AFlexLayout')
	{
		var thisObj = this;
		comp.eachChild(function(acomp){
			thisObj._findChildCrudComp(acomp);
		});
	}
	else if(comp.baseName == 'AView' || comp.baseName == 'ARadioGroup')
	{
		var childView = comp.getChildren();
		for(var i in childView)
		{
			this._findChildCrudComp(childView[i]);
		}
	}
	else
	{
		var crud = comp.getAttr('data-crud');
		switch(crud)
		{
			case '1':
				if(this.crudObj.create == '0') comp.enable(false);
			break;
			case '2':
				if(this.crudObj.read == '0') comp.enable(false);
			break;
			case '3':
				if(this.crudObj.update == '0') comp.enable(false);
			break;
			case '4':
				if(this.crudObj.delete == '0') comp.enable(false);
			break;
		}
	}
};

//리턴값과 상관없이 callback 만 있으면 되지만 기존 코드와의 호환성을 위해 유지
AView.prototype._rMateManage = function(skipUpdatePos, skipActiveDone, callback) 
{
	if(!window.rMate) 
    {
        if(callback) callback()
        return false;
    }

	let rGridList = this.element.querySelectorAll('.RGrid-Style'),
		rChartList = this.element.querySelectorAll('.RChart-Style'),
		gridCnt = rGridList.length, chartCnt = rChartList.length, thisObj = this;

	function _initDoneCheck()
	{
		if( gridCnt+chartCnt == 0 && thisObj.isValid())
		{
			//thisObj._initDoneManage(skipUpdatePos, skipActiveDone);
            if(callback) callback()
            else thisObj._initDoneManage(skipUpdatePos, skipActiveDone);
		}
	}

	if(gridCnt+chartCnt > 0)
	{
		let delegator = 
		{
			onChartReady: function(rChart)
			{
				//console.log(rChart.className + ':' + chartCnt);

				chartCnt--;
				_initDoneCheck();
			},

			onGridReady: function(rGrid)
			{
				//console.log(rGrid.className + ':' + gridCnt);

				gridCnt--;
				_initDoneCheck();
			}
		};

		$rGrid.each(function() { this.acomp.setDelegator(delegator); });
		$rChart.each(function() { this.acomp.setDelegator(delegator); });

		return true;
	}
	
	else 
    {
        if(callback) callback()
        return false;
    }
};

AView.prototype.onContextAvailable = function()
{
    this.eachChild(function(acomp)
    {
        if(acomp.onContextAvailable) acomp.onContextAvailable();
    });
};

AView.prototype._initDoneManage = function(skipUpdatePos, skipActiveDone) 
{
	var thisObj = this;
	
	//화면이 렌더링된 후 onInitDone 이 호출되도록 
	setTimeout(function()
	{
		if(!thisObj.isValid()) return;
	
		//thisObj.onInitDone();

		if(!skipUpdatePos) 
        {
            thisObj.onContextAvailable();
            thisObj.updatePosition();
        }

        thisObj.onInitDone();

		if(!skipActiveDone) 
		{
			thisObj.onActiveDone(true);

			var tabview = thisObj.owner;

			//동적 로드 옵션인 경우는 없을 수도 있다.
			if(window['ATabView'] && tabview instanceof ATabView)
			{
				if(tabview.delegator && tabview.delegator.afterTabChanged) 
				{
					var oldView = tabview.oldTab ? tabview.oldTab.content.view : null;
					tabview.delegator.afterTabChanged(oldView, thisObj, true, tabview);
				}
			}
		}
	
	}, 0);
	
};


AView.prototype.getUrl = function() 
{
	return this.url;
};

AView.prototype._callSubActiveEvent = function(funcName, isFirst) 
{
	//최초 onActiveDone 은 initDoneManage 에서 호출해 주므로 스킵한다.
	if(funcName=='onActiveDone' && isFirst) return;

	if(this.ldView)
	{
		this.ldView[funcName].call(this.ldView, isFirst);
	}
	
	else if(this.ldCntr)
	{
		this.ldCntr[funcName].call(this.ldCntr, isFirst);
	}
	
	else
	{
		for(const el of this.element.children)
		{
			if(!el.acomp) continue;

			//서브 아이템으로 뷰를 가지고 있는 컴포넌트들(ATabView, ASplitView)은
			//_callSubActiveEvent 란 함수를 가지고 있다.	AListView는 필요시 동적으로 함수를 만든다.
			if(el.acomp._callSubActiveEvent) el.acomp._callSubActiveEvent(funcName, isFirst);
		}
	}
	
};

AView.prototype.enableActiveFocus = function(enable) 
{
	this.isActiveFocus = enable;
};


AView.prototype.onInitDone = function() 
{

};


//필요한 곳에서 재구현해서 사용한다.
//_callSubActiveEvent 함수 호출하면 서브 컴포넌트에 전달해 준다.

//뷰가 활성화되기 바로 전에 호출된다.
AView.prototype.onWillActive = function(isFirst) 
{
	if(this.isActiveFocus) AComponent.setFocusComp(this);
	
	var cntr = this.getContainer();
	if(cntr && cntr.isActiveRecursive) this._callSubActiveEvent('onWillActive', isFirst);
};

//뷰의 활성화가 시작되면 호출된다.
AView.prototype.onActive = function(isFirst) 
{
	var cntr = this.getContainer();
	if(cntr && cntr.isActiveRecursive) this._callSubActiveEvent('onActive', isFirst);
};

//뷰의 활성화가 완료되면 호출된다.
AView.prototype.onActiveDone = function(isFirst) 
{
	var cntr = this.getContainer();
	if(cntr && cntr.isActiveRecursive) this._callSubActiveEvent('onActiveDone', isFirst);
	
	//IOS 웹 브라우저에서 스크롤이 안되는 버그 수정
	if(!AContainer.disableIosScroll && afc.isIos && !afc.isHybrid) afc.refreshApp(this.element);
	
	//뷰가 활성화 될 때 화면을 다시 한번 그려준다.
	//브라우저의 여러 경우에 따라 화면 렌더링의 버그가 있을 경우 옵션을 설정해 준다.
	//else if(this.option.isActiveRerender) afc.refreshApp();
};

AView.prototype.onWillDeactive = function() 
{
	var cntr = this.getContainer();
	if(cntr && cntr.isActiveRecursive) this._callSubActiveEvent('onWillDeactive');
};

AView.prototype.onDeactive = function() 
{
	var cntr = this.getContainer();
	if(cntr && cntr.isActiveRecursive) this._callSubActiveEvent('onDeactive');
};

AView.prototype.onDeactiveDone = function() 
{

	var cntr = this.getContainer();
	if(cntr && cntr.isActiveRecursive) this._callSubActiveEvent('onDeactiveDone');
};


//--------------------------------------------------------

/*
AView.prototype.reuse = function()
{
	AComponent.prototype.reuse.call(this);
	
	var container = this.getContainer();
	
	this.$ele.children().each(function()
	{
		if(this.acomp) 
		{
			this.container = container;
			//루트뷰는 변경되지 않는다.
			//this.rootView = rootView;
			this.acomp.reuse();
		}
	});
};
*/

AView.prototype.setScrollArrowX = function()
{
	var sa = new ScrollArrow();
	sa.setArrow('horizontal');
	sa.apply(this.element);
};

AView.prototype.setScrollArrowY = function()
{
	var sa = new ScrollArrow();
	sa.setArrow('vertical');
	sa.apply(this.element);
};


AView.prototype._enableScrollIndicatorX = function()
{
	this.scrlIndicatorX = new ScrollIndicator();
	this.scrlIndicatorX.init('horizontal', this.element);
	
	var thisObj = this;
	
	//scrollIndicator 는 상위 element 에 추가된다.
	//view 는 scrollArea 가 없기 때문에 스크롤바의 위치를 보정해야 함.
	this.scrlIndicatorX.resetScrollPos(function()
	{
		if(!thisObj.isValid()) return;
		var value = thisObj.getPos().left;
		
		this.setStyle({left: value+'px'});
		this.setScrollOffset(value);
	});	
};

AView.prototype._enableScrollIndicatorY = function()
{
	this.scrlIndicatorY = new ScrollIndicator();
	this.scrlIndicatorY.init('vertical', this.element);
	
	var thisObj = this;
	
	this.scrlIndicatorY.resetScrollPos(function()
	{
		if(!thisObj.isValid()) return;
		var value = thisObj.getPos().top;
		
		this.setStyle({top: value+'px'});
		this.setScrollOffset(value);
	});	
};

AView.prototype.enableScrlManagerX = function()
{
	if(this.scrlManagerX) return this.scrlManagerX;
	
	this.scrlManagerX = new ScrollManager();
	
	//animationFrame 이 지원되지 않는 경우만 작동되는 옵션
	this.scrlManagerX.setOption(
	{
		startDelay: 10,
		endDelay: 20,
		scrollAmount: 10,
		speedRatio: 0.03
	});
	
	Object.assign(this.element.style, {'overflow':'auto', '-webkit-overflow-scrolling': ''});
	
	this._scrollXImplement();
	this.aevent._scroll();
	
	return this.scrlManagerX;
};

AView.prototype.enableScrlX = function()
{
	this.scrlManagerX.enableScroll(true);
};

AView.prototype.disableScrlX = function()
{
	this.scrlManagerX.enableScroll(false);
};

AView.prototype.enableScrlManagerY = function()
{
	if(this.scrlManagerY) return this.scrlManagerY;
	
	this.scrlManagerY = new ScrollManager();
	Object.assign(this.element.style, {'overflow':'auto', '-webkit-overflow-scrolling': ''});
	
	this._scrollYImplement();
	this.aevent._scroll();
	
	return this.scrlManagerY;
};

AView.prototype.setScrollXComp = function(acomp)
{
	this.scrollXComp = acomp;
};

AView.prototype._scrollXImplement = function()
{
	var aview = this;
	//PC인 경우 자신의 영역 mousedown 과 상관없이 mousemove 가 무조건 발생한다.
	var isDown = false;
	
	this.bindEvent(AEvent.ACTION_DOWN, function(e)
	{
		isDown = true;
		
		//e.preventDefault();
		
		aview.scrlManagerX.initScroll(e.changedTouches[0].clientX);
	});
	
	this.bindEvent(AEvent.ACTION_MOVE, function(e)
	{
		if(!isDown) return;
		
		e.preventDefault();
		
		var scrlArea = this;
		aview.scrlManagerX.updateScroll(e.changedTouches[0].clientX, function(move)
		{
			scrlArea.scrollLeft += move;
			if(aview.scrollXComp) aview.scrollXComp.element.scrollLeft += move;
		});
	});
	
	this.bindEvent(AEvent.ACTION_UP, function(e)
	{
		if(!isDown) return;
		isDown = false;
		
		//e.preventDefault();
		
		var scrlArea = this;
		aview.scrlManagerX.scrollCheck(e.changedTouches[0].clientX, function(move)
		{
			scrlArea.scrollLeft += move;
			if(aview.scrollXComp) aview.scrollXComp.element.scrollLeft += move;
			
			return true;
		});
	});
};

AView.prototype._scrollYImplement = function()
{
	var aview = this;
	//PC인 경우 자신의 영역 mousedown 과 상관없이 mousemove 가 무조건 발생한다.
	var isDown = false;
	
	this.bindEvent(AEvent.ACTION_DOWN, function(e)
	{
		isDown = true;
		
		//e.preventDefault();
		
		aview.scrlManagerY.initScroll(e.changedTouches[0].clientY);
	});
	
	this.bindEvent(AEvent.ACTION_MOVE, function(e)
	{
		if(!isDown) return;
		
		e.preventDefault();
		
		var scrlArea = this;
		aview.scrlManagerY.updateScroll(e.changedTouches[0].clientY, function(move)
		{
			scrlArea.scrollTop += move;
		});
	});
	
	this.bindEvent(AEvent.ACTION_UP, function(e)
	{
		if(!isDown) return;
		isDown = false;
		
		//e.preventDefault();
		
		var scrlArea = this;
		aview.scrlManagerY.scrollCheck(e.changedTouches[0].clientY, function(move)
		{
			scrlArea.scrollTop += move;
			return true;
		});
	});
};


AView.prototype._scrollTopManage = function()
{
	if(this.scrlManagerY) this.scrlManagerY.stopScrollTimer();
	
	return true;
};

AView.prototype._scrollBottomManage = function()
{
	if(this.scrlManagerY) this.scrlManagerY.stopScrollTimer();

	return true;
};

AView.prototype._scrollLeftManage = function()
{
	if(this.scrlManagerX) this.scrlManagerX.stopScrollTimer();
	
	return true;
};

AView.prototype._scrollRightManage = function()
{
	if(this.scrlManagerX) this.scrlManagerX.stopScrollTimer();
	
	return true;
};

AView.prototype._realizeChildren = function(evtListener, reInitComp)
{
	var thisObj = this, acomp,
		container = this.getContainer(), rootView = this.getRootView();
	
	if(reInitComp)
	{
		for(const el of this.element.children)
		{
			if(el.acomp) el.acomp.init(el.acomp.element, evtListener);

			//뷰를 감싸고 있는 item 인 경우
			else
			{
				acomp = el.children[0].acomp;
				acomp.init(acomp.element);
			}
		}
	}
	else
	{
		for(const el of this.element.children)
		{
			acomp = AComponent.realizeContext(el, container, rootView, thisObj, evtListener);
			if(acomp)
			{
				if(acomp.baseName != 'AView' && container && container.tabKey) container.tabKey.addCompMap(acomp, rootView.owner);
			}

			//뷰를 감싸고 있는 item 인 경우
			else
			{
				//동적으로 로드한 뷰에 대한 realize 를 시작한다.
				acomp = AComponent.realizeContext(el.children[0], container);

				acomp.owner = thisObj;
				acomp._item = el;		//뷰를 감싸고 있는 dom element 값을 item 이란 변수로 저장
				el.view = acomp;		//item 은 view 란 변수로 AView 객체를 저장
			}

		}
		
		if(container && container.tabKey && rootView.owner) container.tabKey.saveOwnerMap(rootView.owner);
		
	}
	
};

AView.prototype._applyLoadedQuery = function()
{
	AComponent.prototype._applyLoadedQuery.call(this);
	
	this.eachChild(function(acomp, inx)
	{
		acomp._applyLoadedQuery();
	});
};

AView.prototype._changeCompIdPrefix = function(newPrefix) 
{
	//compIdPrefix 값은 rootView 만 가지고 있다.
	if(newPrefix) this.compIdPrefix = newPrefix;
	
	var compId;
	
	this.eachChild(function(acomp, inx)
	{
		compId = acomp.getComponentId();
		
		//componentId 가 존재하면 새로운 compIdPrefix 가 적용되도록 다시 호출해 준다.
		if(compId) acomp.setComponentId(compId);
		
		//자신이 포함하고 있는 하위의 컴포넌트들도 바꿔주기 위해, AView, ALayout
		if(acomp._changeCompIdPrefix) acomp._changeCompIdPrefix();
	});
};

// 개발중에 하위 컴포넌트를 선택하지 못하는 경우 직접 하위 컴포넌트의 이벤트를 등록하여 전달해준다.
AView.prototype.loadChildEventInfo = function(evtListener)
{
	//setTimeout 을 사용해야만 해당 컴포넌트의 super init 이후의 코드도 호출되므로
	//이벤트 등록시점에 super init 이후의 코드상에서 저장한 멤버변수 등에 접근하여 사용이 가능하다.
	//setTimeout(() => {
		if(!this.aevent) return;
		const flag = window[this.baseName].CONTEXT.flag || this.getAttr('data-flag');
		if(!flag || flag.charCodeAt(1)!=0x31) return;
		//if(!flag || Number(flag.charAt(1)) != 1) return;

		if(evtListener)
		{
			var evtInfo, events = afc.getChildEventList(this.baseName);

			for(var i=0; i<events.length; i++)
			{
				evtInfo = this.getAttr(afc.ATTR_LISTENER+'-'+events[i]);
				if(evtInfo)
				{
					evtInfo = evtInfo.split(':');
					this.addEventListener(events[i], evtListener, $.trim(evtInfo[1]));
				}
			}
		}
	//});
};

/*
AView.prototype._realizeChildren = function(evtListener)
{
	var thisObj = this, container = this.getContainer(), rootView = this.getRootView();
	
	_realize_helper(this.$ele.children(), evtListener, null);
	
	//--------------------------------------------------------------------
	
	function _realize_helper($children, listener, item)
	{
		var acomp, className, classFunc;
		
		$children.each(function()
		{
			className = this.getAttribute(afc.ATTR_CLASS);

			//item
			if(!className) 
			{
				//동적으로 로드한 뷰에 대한 realize 를 시작한다.
				_realize_helper($(this).children(), null, this);
				return;
			}

			classFunc = window[className];
			if(!classFunc) 
			{
				alert(afc.log('We can not find the class of ' + className ));
				return;
			}

			acomp = new classFunc();
			this.container = container;

			//item 이 참이면 동적 로드뷰 이므로 parent 가 없다. 즉, 자신이 rootView 이다.
			if(item)
			{
				//this.owner = thisObj;
				acomp._item = item;		//뷰를 감싸고 있는 dom element 값을 item 이란 변수로 저장
				item.view = acomp;		//item 은 view 란 변수로 AView 객체를 저장
				
				this.rootView = acomp;
				//listener = acomp;		//init 시점에 listener 가 null 이면 자동으로 rootView 가 리스너가 된다.
			}
			else 
			{
				//parent 변수만 셋팅해야 하므로 setParent 함수를 호출하지 않는다.
				//acomp.setParent(thisObj);
			
				acomp.parent = thisObj;
				this.rootView = rootView;
			}

			acomp.init(this, listener);
		});
	}
};
*/

AView.prototype.setParent = function(parent)
{
	AComponent.prototype.setParent.call(this, parent);
	
	var children = this.getChildren();
	
	for(var i=0; i<children.length; i++)
	{
		// 자식들의 부모까지 바뀐 것은 아니므로 parent 를 넘겨선 안됨.
		// 그대신 자신을 넘기면서 새로운 값으로 변경된 this 의 값들을 자식들에게 셋팅해 준다.
		children[i].setParent(this);
	}
};

AView.prototype.setHtml = function(html)
{
	this.element.innerHTML = html;
};

AView.prototype.findCompById = function(strId)
{
	//var ele = document.getElementById(this.getRootView().compIdPrefix+strId);
	var ele = this.element.querySelector('#'+this.getRootView().compIdPrefix+strId);
	
	if(ele) return ele.acomp;
	else return null;
};

//return : Array
AView.prototype.findCompByGroup = function(strGroup)
{
	var ret = [];
	for(const el of this.element.querySelectorAll('*[data-group="'+strGroup+'"]'))
	{
		if(el.acomp)
			ret.push(el.acomp);
	}

	return ret;
};

//return : Array
AView.prototype.findCompByClass = function(className)
{
	var ret = [];
	for(const el of this.element.querySelectorAll('*['+afc.ATTR_CLASS+'="'+className+'"]'))
	{
		if(el.acomp)
			ret.push(el.acomp);
	}

	return ret;
};

//return : Array
AView.prototype.findCompByBase = function(baseName)
{
	var ret = [];
	for(const el of this.element.querySelectorAll('*['+afc.ATTR_BASE+'="'+baseName+'"]'))
	{
		if(el.acomp)
			ret.push(el.acomp);
	}

	return ret;
};

AView.prototype.findCompByText = function(text)
{
	return AView._findTextContains(this, text, true);
};

AView.prototype.findCompByName = function(name)
{
	var ret = [];
	for(const el of this.element.querySelectorAll('*[name="'+name+'"]'))
	{
		if(el.acomp)
			ret.push(el.acomp);
	}

	return ret;
};

AView.prototype.addComponent = function(acomp, isPrepend, posComp)
{
	if(!acomp.element) 
	{
		alert('First of all, you must call function init();');
		return;
	}
	
	if(posComp)
	{
		if(isPrepend) posComp.element.before(acomp.element);
		else posComp.element.after(acomp.element);
	}
	else
	{
		if(isPrepend) this.element.prepend(acomp.element);
		else this.element.appendChild(acomp.element);
	}
	
	//1.0에 있던 사라진 기능
	//var arrange = this.$ele.attr('data-arrange');
	//if(arrange) acomp.$ele.css({'position':'relative', left:'0px', top:'0px', 'float':arrange});
	
	acomp.setParent(this);
};

AView.prototype.removeComponent = function(acomp)
{
	acomp.removeFromView();
};

AView.prototype.getFirstChild = function()
{
	var ele = this.element.children[0];
	if(ele) return ele.acomp;
	else return null;
};

AView.prototype.getLastChild = function()
{
	var ele = this.element.lastElementChild;
	if(ele) return ele.acomp;
	else return null;
};

AView.prototype.getChild = function(index)
{
	var ele = this.element.children[index];
	if(ele) return ele.acomp;
	else return null;
};

AView.prototype.getChildCount = function()
{
	return this.element.children.length;
};

AView.prototype.eachChild = function(callback, isReverse)
{
	//live HTMLCollection 순회 중 콜백이 자식을 이동/제거하면 건너뜀이 생기므로 스냅샷으로 순회
	var children = Array.from(this.element.children);

	if(isReverse) children.reverse();

	let inx = 0;
	for(const el of children)
	{
		if(!el.acomp) { inx++; continue; }

		if(callback(el.acomp, inx)==false) break;
		inx++;
	}
};

AView.prototype.getChildren = function()
{
	var ret = [];
	for(const el of this.element.children)
	{
		if(el.acomp)
			ret.push(el.acomp);
	}

	return ret;
};

AView.prototype.removeChildren = function(onlyRelease)
{
	for(const el of Array.from(this.element.children))
	{
		if(el.acomp)
			el.acomp.removeFromView(onlyRelease);
	}
};

AView.prototype.removeFromView = function(onlyRelease)
{
	this.removeChildren(onlyRelease);
	
	this.removeLoadView();
	
	this.removeLoadContainer();

    //hot reload 기능
    if(theApp.isHotReload() && this.url) theApp.unWatchFile(this);
	
	AComponent.prototype.removeFromView.call(this, onlyRelease);
};

AView.prototype.setWidth = function(w)
{
	AComponent.prototype.setWidth.call(this, w);
	
	this.updatePosition();
};

AView.prototype.setHeight = function(h)
{
	AComponent.prototype.setHeight.call(this, h);
	
	this.updatePosition();
};

AView.prototype.updatePosition = function(pWidth, pHeight)
{
	//AView 클래스만 다음 비교를 한다.
	if(pWidth!=undefined) 
		AComponent.prototype.updatePosition.call(this, pWidth, pHeight);
	
	if(this.ldView)
	{
		this.ldView.updatePosition();
	}
	
	else if(this.ldCntr)
	{
		this.ldCntr.onResize();
	}
	
	else
	{
		var width = _TinyDom.width(this.element);
		var height = _TinyDom.height(this.element);

		for(const el of this.element.children)
		{
			if(el.acomp)
				el.acomp.updatePosition(width, height);
		}

		if(this.onUpdatePosition) this.onUpdatePosition(width, height);
	}
};

//툴바의 inline 기능을 추가
AView.prototype.inlineChildren = function()
{
	var children = this.getChildren();
	
	for(var i=0; i<children.length; i++)
		children[i].setInlineStyle();
};


/*
//스크롤이 있을경우 스크롤을 가운데로 셋팅
AView.prototype.scrollToCenter = function(tHeight)
{
	var tremHeight = 0;
	if(tHeight) tremHeight = tHeight;
	this.element.scrollTop = ((this.element.scrollHeight + tremHeight) - this.element.offsetHeight)/2;
};
*/

AView.prototype.scrollTo = function(pos)
{
	this.element.scrollTop = pos;
};

AView.prototype.scrollOffset = function(offset)
{
	this.element.scrollTop += offset;
};

AView.prototype.scrollToTop = function()
{
	this.element.scrollTop = this.element.scrollHeight*-1;
};

AView.prototype.scrollToBottom = function()
{
	this.element.scrollTop = this.element.scrollHeight;
};

AView.prototype.scrollToCenter = function()
{
	this.element.scrollTop = (this.element.scrollHeight - this.element.offsetHeight)/2;
};

AView.prototype.isMoreScrollTop = function()
{
	if(this.element.scrollTop > 0) return true;
	else return false;	
};

AView.prototype.isMoreScrollBottom = function()
{
	if(this.element.offsetHeight + this.element.scrollTop < this.element.scrollHeight) return true;
	else return false;	
};

AView.prototype.isMoreScrollLeft = function()
{
	if(this.element.scrollLeft > 0) return true;
	else return false;	
};

AView.prototype.isMoreScrollRight = function()
{
	if(this.element.offsetWidth + this.element.scrollLeft < this.element.scrollWidth) return true;
	else return false;
};

AView.prototype.isHscroll = function()
{
	return (this.element.offsetWidth < this.element.scrollWidth);
};

AView.prototype.isVscroll = function()
{
    return (this.element.offsetHeight < this.element.scrollHeight);
};

AView.prototype.isScroll = function()
{
	return (this.isHscroll() || this.isVscroll());
};

/*
enable 은 원래가 자신만 하면 되는데..
버그 때문에 하위까지 하게 된 것.... 그러므로...
하위까지 해야 하는 경우를 enable 함수의 파람으로 구별해서 처리하게 한다.
하위까지 해야 하는 경우는...
disable 시점에 기존의 정보를 저장해 두었다가 enable 시점에 확인하여 
기존의 값으로 복원...
하위까지 변경하는 경우 disable 없이 enable 만 호출하면 모두 풀리게 되는 것이 정상
*/
AView.prototype.enable = function(isEnable)
{
	AComponent.prototype.enable.call(this, isEnable);

	//input, textarea tag 도 같이 해줘야 이벤트 전달시 키보드 오픈을 막을 수 있다.
    this.enableChildren(isEnable);
};

AView.prototype.enableChildren = function(isEnable)
{
	//input, textarea tag 도 같이 해줘야 이벤트 전달시 키보드 오픈을 막을 수 있다.
	_enable_helper(this.element.getElementsByTagName('input'))
	_enable_helper(this.element.getElementsByTagName('textarea'))
	_enable_helper(this.element.getElementsByClassName('RGrid-Style'))
	_enable_helper(this.element.getElementsByTagName('button')) //button 도 전달되므로 추가
	
    //@param {HTMLCollection} forms `요소의 문서 내 순서대로 정렬된 일반 컬렉션`
	function _enable_helper(forms)
	{
        if(isEnable)
        {
            // 엘리먼트이거나 컴포넌트인데 이전에 isEnable true 였던 경우 auto 처리
            // **엘리먼트인 경우에도 이전에 isEnable false 였다면 문제가 될수도 있을듯함
            Array.prototype.forEach.call(forms, function(ele) {
                if(!ele.acomp || (ele.acomp && ele.acomp.isEnable))
                    ele.style.setProperty('pointer-events', 'auto')
            })
        }
        else
        {
            Array.prototype.forEach.call(forms, function(ele)
            {
                ele.style.setProperty('pointer-events', 'none')
            })
        }
	}
};

AView.prototype.show = function()
{
	if(this.isShow()) return;
	
	this.onWillActive(false);
	
	AComponent.prototype.show.call(this);
	
	this.onActive(false);

	var thisObj = this;
	setTimeout(function() 
	{
		thisObj.onActiveDone(false);
	}, 0);
};

AView.prototype.hide = function()
{
	if(!this.isShow()) return;
	
	this.onWillDeactive();

	AComponent.prototype.hide.call(this);

	this.onDeactive();
	
	var thisObj = this;
	setTimeout(function() 
	{
		if(thisObj.isValid()) thisObj.onDeactiveDone();
	}, 0);
};

AView.prototype.shrinkChildren = function(ratio)
{
	var children = this.getChildren(), acomp, newTop, newHeight, newFontSize, unit;
	
	for(var i=0; i<children.length; i++)
	{
		acomp = children[i];
		
		//afc.log('[' + acomp.$ele.css('bottom') + ']');
		
		//newTop = acomp.getPos().top * ratio;
		//newHeight  = acomp.getHeight() * ratio;
		
		newTop = acomp.getPos().top;
		newHeight  = acomp.getHeight();
		newFontSize = _TinyDom.css(acomp.element, 'font-size');

		unit = newFontSize.substring(newFontSize.length-2);
		newFontSize = Number(newFontSize.substring(0, newFontSize.length-2));

		//afc.log('[' + unit + ']');

		newTop = parseInt(newTop * ratio, 10);
		newHeight = parseInt(newHeight * ratio, 10);
		newFontSize = parseInt(newFontSize * ratio, 10);

		if(_TinyDom.css(acomp.element, 'bottom')!='auto')
		{
			acomp.element.style.height = newHeight+'px';

			acomp.element.style.setProperty('font-size', newFontSize+unit, 'important');
		}
		else
		{
			Object.assign(acomp.element.style,
			{
				'top': newTop+'px',
				'height': newHeight+'px'
			});

			acomp.element.style.setProperty('font-size', newFontSize+unit, 'important');
		}
		
		//afc.log('[' + newFontSize+unit + ']');
		
		if(acomp.baseName=='AView') acomp.shrinkChildren(ratio);
	}

};

//컴포넌트에 데이터를 세팅하는 함수
AView.prototype.setData = function(data)
{
	if(Object.prototype.toString.call(data) == '[object Array]')
	{
		var children = this.getChildren();
		var len = Math.min(children.length, data.length);
		for(var i=0; i<len; i++)
		{
			if(data[i] != undefined) children[i].setData(data[i]);
		}
	}
	else if(Object.prototype.toString.call(data) == '[object Object]')
	{
		for(var key in data)
		{
			this.findCompByName(key).forEach(function(comp)
			{
				if(data[key] != undefined) comp.setData(data[key]);
			});
		}
		/*this.eachChild(function(comp)
		{
			compName = comp.getName();
			if(data[compName]) comp.setData(data[compName]);
		});*/
	}
};

//컴포넌트의 데이터를 얻어오는 함수
//isRecursive : 내부적으로 호출했는지 여부
AView.prototype.getData = function()
{
	if(this.option.getDataAsArray)
	{
		var arr = [];
		this.eachChild(function(comp)
		{
			if(comp instanceof AView || comp instanceof ALayout) arr.push(comp.getData());
			else arr.push(comp.getData());
		});

		return arr;
	}
	else
	{
		var obj = {};
		var finder = this.element.querySelectorAll('[name]:not([name=""])');
		if(finder.length > 0)
		{
			var comp;
			for(const ele of finder)
			{
				comp = ele.acomp;
				if(comp && !obj[comp.getName()]) obj[comp.getName()] = comp.getData();
			}
		}
		return obj;
	}
	
};

AView.prototype.getQueryData = function(dataArr, keyArr, queryData)
{
	var keyVal, children = this.getChildren(), child;
	for(var i=0; i<children.length; i++)
	{
		child = children[i];
		
		keyVal = keyArr[i];
		if(keyVal) child.getQueryData(dataArr, [keyVal], queryData);
	}
};

AView.prototype.setQueryData = function(dataArr, keyArr, queryData)
{
	//매핑한 keyArr 가 없어도 child mapping 처리를 위해 주석처리
    //if(!keyArr) return;

	let children = this.getChildren(), child, i, cnt, keyIdx = 0
	for(i=0; i<children.length; i++)
	{
		child = children[i];
		
		//하위 컴포넌트가 그리드인 경우 데이터가 변경되므로 매번 처음 인덱스값으로 변경
		//dataArr 가 없는 경우도 있으므로 예외처리한다.
		if(dataArr) ADataMask.setQueryData(dataArr[0], keyArr, queryData);
		
		//AView 에서만 사용함
		//매핑 타입이 child mapping 이면 자식 컴포넌트 자체에 셋팅된 필드키를 적용한다.
		if(child.mappingType==3) child.updateChildMappingComp(dataArr, queryData);
		else if(keyArr) //keyArr 있는 경우에만 처리
		{
            cnt = child.getMappingCount(true)
            child.setQueryData(dataArr, keyArr.slice(keyIdx, keyIdx+cnt), queryData);
			keyIdx += cnt
		}
	}
	
};

AView.prototype.getDocument = function() 
{
	return this.document;
};

AView.prototype.bindDocument = function(doc) 
{
	this.document = doc;
	
	doc.setView(this);
};

AView.prototype.setLoadView = function(view)
{
	this.ldView = view;
	
	AView.setViewInItem(view, this.element, this);
};
 
AView.prototype.loadView = async function(url)//, asyncCallback, turnback)
{
	//기존에 존재하던 로드뷰가 있으면 제거
	this.removeLoadView();

    var item = document.createElement('div');
    Object.assign(item.style,
    {
        width: '100%', height: '100%', overflow: 'auto'
    });

    this.element.replaceChildren(item);

	//this.ldView = await AView.createView(item, url, this);
    this.ldProm = AView.createView(item, url, this);
    this.ldView = await this.ldProm;

    //여기에 하면 안됨... createView 에서 로드되는 태그들은 실제 활성화된 돔에 추가되어야 한다. 
	//this.$ele.html($item);
	
	return this.ldView;
};

AView.prototype.loadContainer = async function(viewUrl, cntrId, data, cntrClass)
{
	//기존에 존재하던 로드컨테이너가 있으면 제거
	this.removeLoadContainer();

	if(cntrClass==undefined) cntrClass = 'APanel';
	
	var acont = new window[cntrClass](cntrId);
	
	this.ldCntr = acont;

	acont.init();
		
	this.element.replaceChildren(acont.element);

	//새로운 값으로 변경
	acont._item = this.element;
	this.element.acont = acont;
	acont.parent = this.getContainer();
	acont.owner = this;

	Object.assign(acont.element.style, { left:'0px', top:'0px', width:'100%', height:'100%' });
	
	acont.setData(data);
	
	if(viewUrl) 
	{
		await acont.setView(viewUrl);
	}

	acont.onCreate();
	
	return acont;
};

AView.prototype.getLoadCntr = function()
{
	return this.ldCntr;
};


AView.prototype.getLoadView = function()
{
	return this.ldView;
};

AView.prototype.awaitLoadView = function()
{
	return this.ldProm;
};

AView.prototype.removeLoadView = function()
{
	if(this.ldView)
	{
		this.ldView.removeFromView();
		this.ldView = null;
        this.ldProm = null;
	}
};

AView.prototype.removeLoadContainer = function()
{
	if(this.ldCntr)
	{
		this.ldCntr.close();
		this.ldCntr = null;
	}
};

// 매핑가능한 개수를 리턴한다.
AView.prototype.getMappingCount = function(isNumber)
{
	//return this.getChildren().length;

    let tot = [], mc

	this.getChildren().forEach((child, i)=>{
        mc = child.getMappingCount();
        if(!Array.isArray(mc)) mc = Array.from({ length: mc }, (_, j) => j+1);
		tot = tot.concat(mc);
	})

	return isNumber?tot.length:tot;
};

// 컴포넌트 내부에 드랍 가능여부 리턴
AView.prototype.getDroppable = function()
{
	//return true;
	//_childSelect 가 세팅되어있지 않거나 0인 경우에만 드랍가능
	return !this._childSelect;
};

AView.prototype.getItem = function()
{
	return this._item;
};


//탭뷰에 로드되어진 경우 선택시 넘겨준 데이터를 얻어온다.
AView.prototype.getTabData = function()
{
	if(this._item.tab) return this._item.tab.data;
	else return null;
};

AView.prototype.setTabData = function(data)
{
	if(this._item.tab) this._item.tab.data = data;
};


AView.prototype.getItemData = function()
{
	if(this._item) return this._item.itemData;
	else return null;
};

AView.prototype.setItemData = function(data)
{
	if(this._item) this._item.itemData = data;
};


AView.prototype.getCntrData = function()
{
	var cntr = this.getContainer();
	
	if(cntr) return cntr.getData();
	else return null;
};

AView.prototype.setCntrData = function(data)
{
	var cntr = this.getContainer();
	if(cntr) cntr.setData(data);
};

AView.prototype.getOwnerData = function()
{
    if(window['ATabView'] && this.owner instanceof ATabView) return this.getTabData()
    else if(window['AListView'] && this.owner instanceof AListView) return this.getItemData()
    else return this.getCntrData()
};

AView.prototype.reset = function()
{
	this.eachChild(function(acomp)
	{
		if(acomp.reset) acomp.reset();
	});
};


;
/**
 * @author asoocool
 */

class AFloat
{
	//팝업된 AFloat 객체들을 모아 둔다.
	static floatList = [];

	//AFloat.floatList 에 윈도우를 추가한다.
	//윈도우 오픈 시 내부적으로 자동 호출해 준다.
	static addFloat(afloat)
	{
		let length = AFloat.floatList.length;

		//이미 존재하는지 체크
		for(let i=0; i<length; i++)
		{
			if(AFloat.floatList[i]===afloat) return false;
		}
		
		AFloat.floatList.push(afloat);
		return true;
	}

	//AFloat.floatList 에서 윈도우를 제거한다.
	//윈도우 close 시 내부적으로 자동 호출해 준다.
	static removeFloat(afloat)
	{
		let length = AFloat.floatList.length;

		for(let i=0; i<length; i++)
		{
			if(AFloat.floatList[i]===afloat)
			{
				AFloat.floatList.splice(i,1);
				break;
			}
		}
	}

	constructor()
	{
		//this.$frame = null;
		//this.$bg = null;

		this.frame = null;
		this.bg = null;

		this.isBgCheck = true;
		this.isFocusLostClose = true;

		this.zIndex = 9999;
		this.closeCallback = null;
	
	}

}

window.AFloat = AFloat

AFloat.prototype.init = function()
{
	//this.$frame = $('<div></div>');

    this.frame = document.createElement('div')
	this.frame.className = 'AFloat-Style'
};


AFloat.prototype.append = function(ele)
{
	//this.$frame.append(ele);
    this.frame.append(ele);
};


/*
AFloat.prototype.popup = function(left, top, width, height)
{
	//window position size
	if(!isNaN(left)) left += 'px';
	if(!isNaN(top)) top += 'px';
	if(!isNaN(width)) width += 'px';
	if(!isNaN(height)) height += 'px';
	
	this.$frame.css( { 'position':'fixed', 'left':left, 'top':top, 'z-index':this.zIndex });
	if(width) this.$frame.css('width', width);
	if(height) this.$frame.css('height', height);
	
	if(this.isBgCheck) this._checkBg();
	
	$('body').append(this.$frame);
};
*/

AFloat.prototype.popup = function(left, top, width, height, closeCallback, cntr)
{
	//window position size
	if(!isNaN(left)) left += 'px';
	if(!isNaN(top)) top += 'px';
	if(!isNaN(width)) width += 'px';
	if(!isNaN(height)) height += 'px';
	
	this.popupEx({ 'left': left, 'top': top, 'width': width, 'height': height }, closeCallback, cntr);
};

AFloat.prototype.popupEx = function(info, closeCallback, cntr)
{
	if(!cntr) 
	{
		//현재 활성화된 브라우저의 body 에 Element 를 추가하기 위해
		cntr = AApplication.getFocusedApp()?.getRootContainer();
		if(!cntr) return
	}
	
	info['position'] = 'fixed';
	info['z-index'] = this.zIndex;
	info['pointer-events'] = 'auto';
	
	//this.$frame.css( info );
    Object.assign(this.frame.style, info)
	
	this.closeCallback = closeCallback;
	
	if(this.isBgCheck) this._checkBg(cntr);
	
	//cntr.$ele.append(this.$frame);
    cntr.element.append(this.frame);

	AFloat.addFloat(this)
};

/*
AFloat.prototype.moveToCenter = function()
{
    //var cenX = theApp.rootContainer.getWidth()/2 - this.getWidth()/2;
    //var cenY = theApp.rootContainer.getHeight()/2 - this.getHeight()/2;
	
	var cenX, cenY;
	
	if(this.option.inParent)
	{
    	cenX = this.parent.$ele.width()/2 - this.getWidth()/2;
    	cenY = this.parent.$ele.height()/2 - this.getHeight()/2;
	}
	else
	{
    	cenX = $(window).width()/2 - this.getWidth()/2;
    	cenY = $(window).height()/2 - this.getHeight()/2;
	}
    
    this.move(cenX, cenY);
};
*/

AFloat.prototype.close = function(result)
{
	if(this.frame)
	{
    	this.frame.remove();
    	this.frame = null;
    }
    
    if(this.bg)
    {
		this.bg.remove();
		this.bg = null;
	}
	
	if(this.closeCallback) this.closeCallback(result);

	AFloat.removeFloat(this)
};

AFloat.prototype.enableBgCheck = function(enable)
{
	this.isBgCheck = enable;
};

AFloat.prototype._checkBg = function(cntr)
{
	// if(this.$bg) return;
	
	// this.$bg = $('<div></div>');
	// this.$bg.css(
	// {
	// 	'width':'100%', 'height':'100%',
	// 	'position':'fixed',
	// 	'top':'0px', 'left':'0px',
	// 	'z-index': (this.zIndex-1),
	// 	'pointer-events': 'auto'
	// });
	
	// //$('body').append(this.$bg);
	// cntr.$ele.append(this.$bg);
	
	// if(this.isFocusLostClose)
	// {
	// 	var thisObj = this;
	// 	AEvent.bindEvent(this.$bg[0], AEvent.ACTION_DOWN, function(e)
	// 	{
	// 		e.preventDefault();
	// 		e.stopPropagation();

	// 		thisObj.close();
	// 	});
	// }

	if(this.bg) return;
	
	this.bg = document.createElement('div');

    Object.assign(this.bg.style, {
		'width':'100%', 'height':'100%',
		'position':'fixed',
		'top':'0px', 'left':'0px',
		'z-index': (this.zIndex-1),
		'pointer-events': 'auto'
	})
	
	cntr.element.append(this.bg);
	
	if(this.isFocusLostClose)
	{
		AEvent.bindEvent(this.bg, AEvent.ACTION_DOWN, (e)=>
		{
			e.preventDefault();
			e.stopPropagation();

			this.close();
		});
	}

};

;
/**
 * @author asoocool
 */
 
//-------------------------------------------------------------------------------------------------------- 
//	* AContainer 는 추상적인 클래스로만 사용
//	1) 컨테이너가 init 만 호출하고 open 을 호출하지 않으면 프레임만 존재하고 어떤 영역에도 추가되어져 있지 않은 상태이다.
//	2) 컨테이너가 open 을 호출했지만 url 을 셋팅하지 않은 경우는 컨테이너의 빈 프레임만 부모에 추가된 상태이고 내부 영역(클라이언트 영역)에는
//	뷰가 없는 상태이다. 내부 뷰는 setView 를 통해 이후에 셋팅할 수 있다.
//
//	* 컨테이너는 오직 하나의 뷰만을 갖는다. 뷰가 내부적으로 스플릿뷰나 플렉스뷰를 가지고 화면을 다시 분할 할 수 있다.
//---------------------------------------------------------------------------------------------------------  

class AContainer	
{
	constructor(containerId)	//필요시만 셋팅
	{
		this.view = null;

		//뷰를 감싸고 있는 아이템
		this.viewItem = null;

		this.containerId = containerId;	//컨테이너를 구분 짓는 아이디(APage, AWindow)

		this.element = null;
		this.$ele = null;

		this.parent = null;			//parent AContainer
		this.url = null;

		this.className = afc.getClassName(this);

		//같은 컨테이너를 여러 윈도우가 disable 시킬 수 있으므로 레퍼런스 카운팅을 한다.
		this.disableCount = 0;

		//여기에서 값을 초기화 하면 안됨. init 함수에서 setOption 함수를 이용함.
		/*
		this.option = 
		{
			isAsync: true,
			inParent: true
		};
		*/
		this.option = {};

		this.wndList = [];
	
	}

    awaitView()
    {
        return this.viewProm;
    }


}

window.AContainer = AContainer

//-------------------------------------------------------------------------
//	static area

AContainer.openContainers = {};

AContainer.findOpenContainer = function(cntrId)
{
	return AContainer.openContainers[cntrId];
};

AContainer.getDefaultParent = function(self)
{
    //현재 활성화된 브라우저의 body 에 Element 를 추가하기 위해
    var fApp = AApplication.getFocusedApp();

	var parent = fApp.getMainContainer();
	if(!parent) 
	{
		var navi = ANavigator.getRootNavigator();
		if(navi) parent = navi.getActivePage();
	}

	if(!parent || parent===self) parent = fApp.rootContainer;
	
	return parent;
};


AContainer.TAG = '<div class="AContainer-Style"></div>';

AContainer.disableIosScroll = false;

//AContainer.isAsyncLoad = true;

//--------------------------------------------------------------------------


AContainer.prototype.init = function(context, noViewItem)
{
	this.setOption(
	{
		//isAsync: AContainer.isAsyncLoad,
		inParent: true
		
	}, true);	

	if(!context) 
	{
		//context = $(AContainer.TAG)[0];
		context = document.createElement('div')
		context.className = 'AContainer-Style'	
	}

    this.element = context;
    this.element.acont = this;	//AContainer
    
	//기존 버전과의 호환을 위해, 프로젝트에서 별도로 로드했으면 만들어 준다.
	if(typeof jQuery != 'undefined') this.$ele = $(this.element);

	
	//this.isActiveRecursive = !afc.isMobile;
	
	this.isActiveRecursive = false;
	
	this.tabKey = new TabKeyController();
	
	if(!noViewItem) this.makeViewItem();
};


AContainer.prototype.setData = function(data) { this.data = data; };
AContainer.prototype.getData = function() { return this.data; };

AContainer.prototype.makeViewItem = function()
{
    /*
	var $item = $('<div class="_view_item_"></div>');
	
    $item.css(
    {
        width: '100%',
        height: '100%',
        position: 'relative'
    });
    */
	const item = document.createElement('div');
    item.className = '_view_item_';

    item.style.width = '100%'
    item.style.height = '100%'
    item.style.position = 'relative'

    //this.$ele.append($item);
    this.element.appendChild(item)

    this.viewItem = item;
};

AContainer.prototype.deleteView = function()
{
	if(this.view)
	{
		var doc = this.view.getDocument();
		if(doc) doc.closeDocument();
		
		this.view.removeFromView();
		this.view = null;
        this.viewProm = null;
	}
}

AContainer.prototype.setView = async function(view, isFull)//, asyncCallback)
{
	var thisObj = this;

    this.deleteView();

	if(typeof(view)=='string') view = await AView.createView(this.viewItem, view, this);
	else
	{
		this.viewItem.appendChild(view.element);

		//기존의 뷰가 들어올 경우 새로운 값으로 변경
		view.owner = this;
		view._item = this.viewItem;
		this.viewItem.view = view;
		view.element.container = this.getContainer();
		view.element.rootView = view;

		//기존의 뷰가 들어올경우에는 view의 realizeChild가 호출을 안하므로
		//여기서 탭키추가를 위해 호출해준다.

		var _find_child = function(item)
		{
			item.eachChild(function(acomp){
				//하위 컴포넌트에도 컨테이너를 다시 넣어준다.
				acomp.element.container = view.element.container;
				thisObj.tabKey.addCompMap(acomp, item.owner);
				if(acomp.eachChild) _find_child(acomp);
			});
		}

		_find_child(view);

		this.tabKey.saveOwnerMap(view.owner);
	}

	_after_helper(view);

	//새로 생성되어진 뷰를 리턴
	return this.view;
	

	function _after_helper(_view)
	{
		thisObj.view = _view;
		
		if(!_view || !_view.isValid()) return;
		
		//컨테이너에 셋팅되는 기본 뷰를 가득차게 한다.
		//if(isFull) _view.$ele.css({ left:'0px', top:'0px', width:'100%', height:'100%' });
        if(isFull) 
        {
            _view.setStyleObj({ left:'0px', top:'0px', width:'100%', height:'100%' })
        }

		thisObj.tabKey.init(thisObj.view);

		//iphone web
		if(AContainer.disableIosScroll)
		{
			if(afc.isIos && !afc.isHybrid)
			{
				//컨테이너에 기본 touch 를 disable 시켜 드래그 바운스 효과를 없앰.
				//thisObj.$ele.bind('touchstart', function(e)
                thisObj.element.addEventListener('touchstart', function(e)
				{
					//자체 스크롤이 필요한 컴포넌트는 예외, AComponent 의 escapePreventDefault 함수를 호출하면 된다.
					if(!e.target.noPreventDefault) e.preventDefault();
				});	
			}
		}
	}

};

//return : Promise
AContainer.prototype.open = async function(url, parent, left, top, width, height)
{
	//parent 가 지정 되어져 있지 않으면
	if(!parent) parent = AContainer.getDefaultParent(this);
	
	if(!(parent instanceof AContainer)) 
	{
		console.error('parent must be AContainer');
	}
	
	this.parent = parent;
    this.url = url;
    
	//init 이 호출되지 않은 경우 
	if(!this.element) this.init();

	//position size
	if(!isNaN(left)) left += 'px';
	if(!isNaN(top)) top += 'px';
	if(!isNaN(width)) width += 'px';
	if(!isNaN(height)) height += 'px';
	
	if(!width) width = 'auto';
	if(!height) height = 'auto';
	
	// container 의 넓이 높이에 비율이 주어지면 리사이즈 시 이벤트를 보내주기위해
	//if( width.indexOf('%')>-1 || height.indexOf('%')>-1 ) this.isResizeEvent = true;
	
	//this.$ele.css( { 'left':left, 'top':top, 'width': width, 'height': height, 'display': 'none' }); //뷰의 로드가 완료되면 보여준다.
    //뷰의 로드가 완료되면 보여준다.
    Object.assign(this.element.style, { 'left':left, 'top':top, 'width': width, 'height': height, 'display': 'none' });
	
    //현재 활성화된 브라우저의 body 에 Element 를 추가하기 위해
    let fApp = AApplication.getFocusedApp();
    
	//비동기 구조로 인해 컨테이너를 숨김상태로 일단 추가한 후
    //_after_setview 함수에서 보여줌.
    if(this.option.inParent) this.parent.element.appendChild(this.element);
    else fApp?.rootContainer.element.appendChild(this.element);


	let thisObj = this;

    if(this.option.isTitleBar && this._makeTitle) await this._makeTitle();

	if(url) 
	{
		//await this.setView(url);
        this.viewProm = this.setView(url);
        await this.viewProm;
	}
	
	//if(this.option.isTitleBar && this._makeTitle) await this._makeTitle();
	
	_after_setview();
	
	//return true;
	
	function _after_setview()
	{
        //창을 생성 후 위치를 이동하는 경우.. 화면에 보였다가 이동하는 문제때문에
        //로드 완료 후 컨테이너를 보여줌.
        //thisObj.$ele.css('display', 'block');
        thisObj.element.style.display = 'block';

		thisObj.tabKey.focusOnInit(thisObj.option.focusOnInit, true);
	
		//컨테이너가 오픈되면 전역 메모리에 컨테이너아이디를 키로 하여 모두 저장해 둔다.
		AContainer.openContainers[thisObj.getContainerId()] = thisObj;

		//parent 가 static 으로 지정되어 있으면 자신도 static 로 변경해 준다.
		//container split 시 static 으로 지정할 경우 셋팅되어짐.
		if(thisObj.parent!==fApp?.rootContainer && thisObj.parent.element.style.position=='static')
		{
			//thisObj.$ele.css('position', 'static');
            thisObj.element.style.position = 'static';
		}

		//모바일이고 noAutoScale 값이 참이면 
		if(afc.isMobile && thisObj.option.noAutoScale)
		{
			//autoScale 이 적용되지 않은 효과가 나타나도록
			//반대로 줌을 적용해 준다.
			const scale = 1/PROJECT_OPTION.general.scaleVal;
			//thisObj.$ele.css('zoom', scale);
            thisObj.element.style.zoom = scale;
		}
		
		thisObj.onCreate();
	}
	
    /*
	function _append_helper()
	{
		if(thisObj.option.inParent) 
		{
			//루트컨테이너를 생성할 때는 viewItem 을 만들지 않기 때문에 비교
			//if(thisObj.parent.viewItem) thisObj.parent.viewItem.appendChild(thisObj.element);
			//else thisObj.parent.element.appendChild(thisObj.element);

            //핫리로드 기능때문에 viewItem 에 넣으면 안됨. 
            //이전에 왜 viewItem 에 넣었는지 확인 필요. 아마도 타이틀 밑으로 들어가도록 하기위해서인듯.
            thisObj.parent.element.appendChild(thisObj.element);
		}
		else 
		{
			//if(fApp.rootContainer.viewItem) fApp.rootContainer.viewItem.appendChild(thisObj.element);
			//else fApp.rootContainer.element.appendChild(thisObj.element);

            fApp.rootContainer.element.appendChild(thisObj.element);
		}
        
	}
    */
};

AContainer.prototype.close = function(result, data)
{
	this.onClose();
	
    //아우터 윈도우로 띄운 후 부모창이 닫힐 때, 외부로 뜬 자식창까지 닫히는 버그 수정
    if(!this.outerWnd)
    {
		//컨테이너 내에 윈도우가 떠 있는 경우 닫아준다.
		for(let i=this.wndList.length-1; i>-1; i--)
		{
			this.wndList[i].setResultListener(null);
			this.wndList[i].setResultCallback(null);
			this.wndList[i].close();
		}
		this.wndList.length = 0;
	}
	
	//자신이 네비게이터의 프레임 컨테이너인 경우
	if(this.childNavigator)
	{
		this.childNavigator.closeAllPage();
	}
	
	else //if(this.view) 
	{
        this.deleteView();
	}

    if(this.title && this.title.view)
	{
		this.title.view.removeFromView();
	}
	
	//if container is splitted, destroy all them
	this.destroySplit();
	
    //this.$ele.remove();
    this.element.remove()
    this.$ele = null;
	this.element = null;
	
	//delete AContainer.openContainers[this.getContainerId()];
	AContainer.openContainers[this.getContainerId()] = undefined;	
	
	//return true;
};

AContainer.prototype.setParent = function(newParent, styleObj)
{
	if(!newParent) newParent = AContainer.getDefaultParent(this);
	
	if(!(newParent instanceof AContainer)) 
	{
		console.error('parent must be AContainer');
		//return null;
	}
	
	var oldParent = this.parent;
	this.parent = newParent;

	//if(styleObj) this.$ele.css(styleObj);
    if(styleObj) Object.assign(this.element.style, styleObj)

	//inParent 옵션이 있는 경우만 element 를 이동시켜 준다.
	if(this.option.inParent)
	{
		//this.parent.$ele.append(this.$ele);
        this.parent.element.appendChild(this.element);

		this.onResize();
	}
	
	return oldParent;
};

AContainer.prototype.getClassName = function()
{
	return this.className;
};

//active 이벤트를 자식들에게 재귀적으로 호출해 줄지 여부
//이 값이 false 이고 원하는 자식에게만 전달하고 싶을 경우
//수동으로 뷰의 onActive 함수내에서 _callSubActiveEvent 함수를 호출해 주면 된다.
AContainer.prototype.setActiveRecursive = function(isRecursive) 
{
	this.isActiveRecursive = isRecursive;
};

AContainer.prototype.show = function()
{
	//this.$ele.show();
    _TinyDom.show(this.element);
};

AContainer.prototype.hide = function()
{
    //this.$ele.hide();
    _TinyDom.hide(this.element);
};

//컨테이너의 리소스 로드가 완료되면 호출, 최초 한번만 호출된다.
//리소스는 로드됐지만 컨테이너가 보여지진 않는다. 
//안전하게 접근하려면 onCreateDone 사용
AContainer.prototype.onCreate = function()
{
	var thisObj = this;
	setTimeout(function() 
	{
		if(thisObj.onCreateDone) thisObj.onCreateDone();
		
	}, 0);

};


//Application 이 Background 로 이동하는 경우
AContainer.prototype.onAppPause = function() 
{
};

//Application 이 Foreground 로 이동하는 경우
AContainer.prototype.onAppResume = function()
{
};

AContainer.prototype.onClose = function()
{
    const view = this.getView();
    if(view && view.onCloseView) view.onCloseView()
};


AContainer.prototype._callSubActiveEvent = function(funcName, isFirst)
{
	if(!this.isValid()) return;
	if(this.splitter)
	{
		var count = this.getSplitCount(), acont;

		for(var i=0; i<count; i++)
		{
			acont = this.getSplitPanel(i);
			if(acont) acont[funcName].call(acont, isFirst);
		}
	}
	
	else if(this.view && this.view.isValid()) 
	{
		// isFirst 가 참인 경우, onInitDone 이후 자동으로 호출됨.
		if(funcName=='onActiveDone' && isFirst) return;
		
		this.view[funcName].call(this.view, isFirst);
	}

};

//--------------------------------------------------------------------

//뷰가 활성화되기 바로 전에 호출된다.
AContainer.prototype.onWillActive = function(isFirst) 
{
	this._callSubActiveEvent('onWillActive', isFirst);
};

//뷰의 활성화가 시작되면 호출된다.
AContainer.prototype.onActive = function(isFirst) 
{
	this._callSubActiveEvent('onActive', isFirst);
};

//뷰의 활성화가 완료되면 호출된다.
AContainer.prototype.onActiveDone = function(isFirst) 
{
	this._callSubActiveEvent('onActiveDone', isFirst);
};

AContainer.prototype.onWillDeactive = function() 
{
	this._callSubActiveEvent('onWillDeactive');
};

AContainer.prototype.onDeactive = function() 
{
	this._callSubActiveEvent('onDeactive');
};

AContainer.prototype.onDeactiveDone = function() 
{
	this._callSubActiveEvent('onDeactiveDone');
};


//-------------------------------------------------------------------

AContainer.prototype.onOrientationChange = function(info)
{
	
};

AContainer.prototype.onBackKey = function()
{
	return false;
};

AContainer.prototype.onResize = function()
{
	if(this.splitter) 
	{
		this.splitter.updateSize();
	}
	
	//자신이 네비게이터의 프레임 컨테이너인 경우
	else if(this.childNavigator)
	{
		this.childNavigator.onResize();
	}

	else if(this.view) this.view.updatePosition();
	
	//자신을 부모로 해서 open 을 호출한 자식 컨테이너들
    /*
	this.$ele.children('.AContainer-Style').each(function()
	{
		if(this.acont && this.acont.isShow())
			this.acont.onResize();
	});
    */

	const children = this.element.querySelectorAll(':scope > .AContainer-Style');
	children.forEach(child => 
	{
		if(child.acont && child.acont.isShow())
            child.acont.onResize();		
	});

};

//----------------------------------------------------------------------

AContainer.prototype.getPos = function()
{
	//return this.$ele.position();
    return _TinyDom.position(this.element);
};

AContainer.prototype.setPos = function(pos)
{
	//this.$ele.css( { 'left': pos.left+'px', 'top': pos.top+'px' });
    this.element.style.left = pos.left+'px'
    this.element.style.top = pos.top+'px'
};

AContainer.prototype.getWidth = function()
{
	//return this.$ele.width();
    return _TinyDom.width(this.element);
};

AContainer.prototype.getHeight = function()
{
	//return this.$ele.height();
    return _TinyDom.height(this.element);
};

AContainer.prototype.setWidth = function(width)
{
	//return this.$ele.width(width);
    _TinyDom.width(this.element, width);
};

AContainer.prototype.setHeight = function(height)
{
	//return this.$ele.height(height);
    _TinyDom.height(this.element, height);
};

AContainer.prototype.getStyle = function(key, isComputedStyle)
{
    return isComputedStyle ? _TinyDom.css(this.element, key) : this.element.style[key];
	//return this.element.style[key];
};

AContainer.prototype.setStyle = function(key, value, priority)
{
	this.element.style.setProperty(key, value, priority);
};

AContainer.prototype.setStyleObj = function(obj)
{
	Object.assign(this.element.style, obj);
};

//----------------------------------------------------------------------------------------

AContainer.prototype.getParent = function()
{
	return this.parent;
};


AContainer.prototype.setContainerId = function(containerId)
{
	this.containerId = containerId;
};

AContainer.prototype.getContainerId = function()
{
	return this.containerId;
};

AContainer.prototype.getContainer = function()
{
	return this;
};

AContainer.prototype.getView = function()
{
	return this.view;
};

AContainer.prototype.isShow = function()
{
	//return this.$ele.is(":visible");

    return !_TinyDom.isHidden(this.element);
};

AContainer.prototype.isOpen = function()
{
	return (this.element!=null);
};

AContainer.prototype.isValid = function()
{
	return Boolean(this.element);
};

AContainer.prototype.getElement = function()
{
    return this.element;
};

//deprecated
AContainer.prototype.get$ele = function()
{
	return this.$ele;	
};


AContainer.prototype.toString = function()
{
	var ret = '\n{\n', value;
    for(var p in this) 
    {
        if(!this.hasOwnProperty(p)) continue;
        
        value = this[p];
        
        if(typeof(value) == 'function') continue;
        
        else if(value instanceof HTMLElement)
        {
        	if(afc.logOption.compElement) ret += '    ' + p + ' : ' + value.outerHTML + ',\n';
        	else ret += '    ' + p + ' : ' + value + ',\n';
        }
        else if(value instanceof Object) ret += '    ' + p +' : ' + afc.getClassName(value) + ',\n';
		else ret += '    ' + p + ' : ' + value + ',\n';
    }
    ret += '}\n';
    
    return ret;
};

/*
AContainer.prototype.actionDelay = function(filter)
{
	if(this.view) this.view.actionDelay(filter);
};
*/

AContainer.prototype.actionDelay = function()
{
	var thisObj = this;
	
	this.enable(false);
	
	setTimeout(function() 
	{
		if(thisObj.isValid()) thisObj.enable(true);
		
	}, afc.DISABLE_TIME);
};

//tabview 를 찾아서 selectedView 에 enable 처리를 하면
//문제가 해결되는지... 컨테이너의 $ele.find 하면 탭뷰까지 찾아서 처리해 주고 있는게 아닌지... 확인
AContainer.prototype.enable = function(isEnable)
{
	//스플릿되어 있는 경우는 뷰가 없는 경우인데 처리해야 하므로
	//아래 처럼 view 의 enable 을 호출하면 안되고 직접 찾아서 해야 함.
	
	//if(this.view) this.view.enable(isEnable);
	
	this.isEnable = isEnable;
	
	//if(isEnable) this.$ele.css('pointer-events', 'auto');
	//else this.$ele.css('pointer-events', 'none');

	if(isEnable) this.element.style.pointerEvents = 'auto';
	else this.element.style.pointerEvents = 'none';
	
	this.enableChildren(isEnable);
};

AContainer.prototype.enableChildren = function(isEnable)
{
	//input, textarea tag 도 같이 해줘야 이벤트 전달시 키보드 오픈을 막을 수 있다.
	_enable_helper(this.element.getElementsByTagName('input'))
	_enable_helper(this.element.getElementsByTagName('textarea'))
	_enable_helper(this.element.getElementsByClassName('.RGrid-Style'))
	_enable_helper(this.element.getElementsByTagName('button')) //button 도 전달되므로 추가
	
	//탭뷰는 선택된 뷰가 pointer-events: auto 되어있으므로 이벤트 전달을 막기 위해 처리한다.
	Array.prototype.forEach.call(this.element.getElementsByClassName('.ATabView-Style'), function(ele)
	{
		if(ele.acomp)
		{
			var view = ele.acomp.getSelectedView();
			if(view)
			{
				if(isEnable)
				{
					if(view.isEnable) view.setStyle('pointer-events', 'auto')
				}
				else view.setStyle('pointer-events', 'none')
			}
		}
	})
	
    //@param {HTMLCollection} forms `요소의 문서 내 순서대로 정렬된 일반 컬렉션`
	function _enable_helper(forms)
	{
        if(isEnable)
        {
            // 엘리먼트이거나 컴포넌트인데 이전에 isEnable true 였던 경우 auto 처리
            // **엘리먼트인 경우에도 이전에 isEnable false 였다면 문제가 될수도 있을듯함
            Array.prototype.forEach.call(forms, function(ele) {
                if(!ele.acomp || (ele.acomp && ele.acomp.isEnable))
                    ele.style.setProperty('pointer-events', 'auto')
            })
        }
        else
        {
            Array.prototype.forEach.call(forms, function(ele)
            {
                ele.style.setProperty('pointer-events', 'none')
            })
        }
	}
};

/*
//--------------------------------------------------------------
//	패널은 다른 컨테이너의 부분 컨테이너 역할만 할 수 있다. 
AContainer.prototype.addPanel = function(panel)
{
	this.panels.push(panel);
	
	//차후 실제로 컨테이너 밑으로 들어가도록 하는 작업하기
	
};

AContainer.prototype.removePanel = function(panel)
{
	//this.panels.push(panel);
	
};
*/


//----------------------------------------------------------------------------------------
// split functions

//	createSplit 호출 시 내부에 분할 개수만큼의 빈 컨테이너가 생긴다.
//	이후 분할된 컨터이너에 setView 함수를 호출하여 뷰를 셋팅 또는 로드한다.
//	cntrClass 는 분할 시 셋팅할 컨테이너 클래스. 생략하면 APanel. null 이나 '' 이면 컨테이너를 셋팅하지 않는다. 이 경우 차후 setSplitPanel 을 호출하여 셋팅해 줘야한다.
//	APanel 이외의 다른 클래스는 지정할 수 없다.
AContainer.prototype.createSplit = function(count, sizeArr, splitDir, barSize, panelClass)
{
	if(this.splitter) return null;
	
	if(!window.ASplitter)
	{
		console.error('ASplitter is not defined.');
		console.info("Check Default Load Settings. or ");
		console.info("afc.import('Framework/afc/library/ASplitter.js');");
		return;
	}

	this.splitter = new ASplitter(this, barSize);
	this.splitter.createSplit(this.viewItem, count, sizeArr, splitDir);

	if(panelClass==undefined) panelClass = 'APanel';
	
	//null 이나 '' 을 입력하면 셋팅하지 않음.
	else if(!panelClass) return null;	
	
	var newCntr = null, ret = [];
	for(var i=0; i<count; i++)
	{
		newCntr = new window[panelClass]();
		newCntr.init();
		this.setSplitPanel(i, newCntr);
		
		newCntr.onCreate();
		
		ret.push(newCntr);
	}
	
	return ret;
};

AContainer.prototype.destroySplit = function()
{
	if(!this.splitter) return;
	
	var count = this.getSplitCount(), acont;
	
	for(var i=0; i<count; i++)
	{
		acont = this.getSplitPanel(i);
		if(acont) acont.close();
	}
	
	this.splitter.removeAllSplit();
	this.splitter = null;
};

//새롭게 분할 컨테이너를 추가한다.
AContainer.prototype.insertSplit = function(inx, splitSize, isAfter, cntrClass)
{
	if(!this.splitter) return null;
	
	var item = this.splitter.insertSplit(inx, splitSize, isAfter);
	
	if(cntrClass==undefined) cntrClass = 'APanel';
	
	//null 이나 '' 을 입력하면 셋팅하지 않음.
	else if(!cntrClass) return null;
	
	var newCntr = new window[cntrClass]();
	newCntr.init();
	this.setSplitPanel(item, newCntr);
	
	newCntr.onCreate();
	
	return newCntr;
};

AContainer.prototype.appendSplit = function(splitSize, cntrClass)
{
	return this.insertSplit(-1, splitSize, true, cntrClass);
};

AContainer.prototype.prependSplit = function(splitSize, cntrClass)
{
	return this.insertSplit(0, splitSize, false, cntrClass);
};

AContainer.prototype.removeSplit = function(inx)
{
	this.splitter.removeSplit(inx, function(removeItem)	
	{ 
		removeItem.acont.close();
	});
};

AContainer.prototype.getSplit = function(inx)
{
	return this.splitter.getSplit(inx);
};

AContainer.prototype.getSplitPanel = function(inx)
{
	var split = this.splitter.getSplit(inx);
	if(split) return split.acont;
	else return null;
	
	//return this.splitter.getSplit(inx).acont;
};

AContainer.prototype.getSplitCount = function()
{
	if(!this.splitter) return -1;
	return this.splitter.getSplitCount();
};

AContainer.prototype.indexOfPanel = function(panel)
{
	var count = this.getSplitCount();
	for(var i=0; i<count; i++)
	{
		if(panel===this.getSplitPanel(i)) return i;
	}
	
	return -1;
};

//open 되어 있지 않은 Panel 은 open 과 같은 효과를 갖는다.
//split 인 경우 parent 를 기준으로 open 함수를 호출할 수 없다.
//parent frame 으로 들어가는 것이 아니라 parent 밑의 split frame 로 들어가기 때문에
//setSplitPanel 함수를 호출해 줘야 한다.
AContainer.prototype.setSplitPanel = function(inx, acont)
{
	if(!(acont instanceof APanel)) 
	{
		alert('Container class should be APanel');
		return;
	}
	
    /*
	var $item;
	if(typeof(inx) == 'number') $item = $(this.splitter.getSplit(inx));
	else $item = $(inx);
	
	$item.append(acont.$ele);
    */
	let item;
	if(typeof(inx) == 'number') item = this.splitter.getSplit(inx);
	else item = inx;
	
	item.appendChild(acont.element);

	
	//새로운 값으로 변경
	//acont._item = $item[0];
	//$item[0].acont = acont;
	acont._item = item;
	item.acont = acont;
	acont.parent = this;
	
	//if(this.splitter.isStatic) acont.$ele.css('position', 'static');
    if(this.splitter.isStatic) acont.element.style.position = 'static';
	
	//acont.$ele.css({ left:'0px', top:'0px', width:'100%', height:'100%' });
    Object.assign(acont.element.style, { left:'0px', top:'0px', width:'100%', height:'100%' })

};


AContainer.prototype.onSplitChanged = function(splitFrame)
{
	if(splitFrame.acont)
		splitFrame.acont.onResize();
};


//전역 리얼을 등록하기 위해 컨테이너도 registerReal 이 가능하도록 함.
//리얼데이터 수신시 컨테이너의 updateComponent 가 호출됨.
AContainer.prototype.updateComponent = function(queryData)
{

};

//noOverwrite 가 true 이면, 기존의 값이 존재할 경우 덮어쓰지 않는다.
AContainer.prototype.setOption = function(option, noOverwrite)
{
    for(var p in option)
    {
    	if(!option.hasOwnProperty(p)) continue;
    	
		if(!noOverwrite || this.option[p]==undefined)
		{
			this.option[p] = option[p];
		}
    }
};

AContainer.prototype.addWindow = function(awnd)
{
	var length = this.wndList.length;

	//이미 존재하는지 체크
	for(var i=0; i<length; i++)
	{
		if(this.wndList[i]===awnd) return false;
	}
	
	this.wndList.push(awnd);
	return true;
};

AContainer.prototype.removeWindow = function(awnd)
{
	var length = this.wndList.length;

	for(var i=0; i<length; i++)
	{
		if(this.wndList[i]===awnd)
		{
			this.wndList.splice(i,1);
			break;
		}
	}
};


//-----------------------------------------------------------------------
//	deprecated
//
AContainer.prototype.setId = function(containerId)
{
	this.containerId = containerId;
};

AContainer.prototype.getId = function()
{
	return this.containerId;
};

AContainer.prototype.addComponent = function(acomp, isPrepend, insComp)
{
	this.view.addComponent(acomp, isPrepend, insComp);
};

AContainer.prototype.findCompById = function(strId)
{
	return this.view.findCompById(strId);
};

AContainer.prototype.findCompByGroup = function(strGroup)
{
	return this.view.findCompByGroup(strGroup);
};

//-----------------------------------------------------------------------

;/**
 *	@author asoocool
 * 
 */

class AWindow extends AContainer
{
	constructor(containerId)
	{
		super(containerId)
	
		this.modalBg = null;	//모달용 배경 div

		this.isOpenActionDelay = true;


		//show 함수 호출시 delay 를 주었는지
		this.isDelayShow = false; 
		//사라지면서 터치한 정보가 하위 컨테이너에게 전달되는 것을 시간 지연을 통해서 막음.
		this.isDisableTime = true;

		//init 함수에서 초기화 함
		//AContainer 로 옮겨짐
		//this.option = {};

		/*
		if(afc.andVer<4.4) 
		{
			//4.3 이하에서만 작동
			this.option.isPreventTouch = true;
		}
		*/

		//this.resultListener = null;
	}

	

}

window.AWindow = AWindow


//--------------------------------------------------------------------------------
//	static area
//--------------------------------------------------------------------------------

AWindow.BASE_ZINDEX = 1000;

//팝업된 AWindow 객체들을 모아 둔다.
AWindow.wndList = [];

//top window has the max z-index 
AWindow.topWindow = null;

//AWindow.wndList 에 윈도우를 추가한다.
//윈도우 오픈 시 내부적으로 자동 호출해 준다.
AWindow.addWindow = function(awnd)
{
	var length = AWindow.wndList.length;

	//이미 존재하는지 체크
	for(var i=0; i<length; i++)
	{
		if(AWindow.wndList[i]===awnd) return false;
	}
	
	AWindow.wndList.push(awnd);
	return true;
};

//AWindow.wndList 에서 윈도우를 제거한다.
//윈도우 close 시 내부적으로 자동 호출해 준다.
AWindow.removeWindow = function(awnd)
{
	var length = AWindow.wndList.length;

	for(var i=0; i<length; i++)
	{
		if(AWindow.wndList[i]===awnd)
		{
			AWindow.wndList.splice(i,1);
			break;
		}
	}
};

// @deprecated, use AContainer.findOpenContainer
AWindow.findWindow = function(cntrId)
{
	var length = AWindow.wndList.length, retWnd = null;

	for(var i=0; i<length; i++)
	{
		retWnd = AWindow.wndList[i];
		
		if(retWnd.getContainerId()==cntrId) return retWnd;
	}
	
	return null;
};


//보여지고 있는 윈도우 중에서 최상단 윈도우에게 backKey 이벤트를 전달한다.
//디바이스에서 backKey 가 눌려지면 자동으로 호출된다. 
AWindow.reportBackKeyEvent = function()
{
	var topWnd = AWindow.getTopWindow();

	if(topWnd) return topWnd.onBackKey();

	return false;
};

//오픈된 윈도우들에게 resize 이벤트를 전달한다.
//네이티브 WebView 의 사이즈가 변경되면 자동으로 호출된다.
/*
AWindow.reportResizeEvent = function()
{
	var length = AWindow.wndList.length;

	for(var i=0; i<length; i++)
		AWindow.wndList[i].onResize();
};
*/

AWindow.reportMoveCenter = function()
{
	var length = AWindow.wndList.length;
	var wnd;
	for(var i=0; i<length; i++)
	{
		wnd = AWindow.wndList[i];
		if(wnd.option.isCenter) wnd.moveToCenter();
	}
};

AWindow.getTopWindow = function()
{
	return AWindow.topWindow;
};

//close 나 hide 가 호출되면 z-index 를 0 으로 셋팅한 후 updateTopWindow 가 호출된다.
AWindow.updateTopWindow = function()
{
	var toTopWnd = null, length = AWindow.wndList.length, max = 0, tmp;

	//hide 된 윈도우까지 값을 비교해도 됨.
	for(var i=0; i<length; i++)
	{
		//asoocool test
		//if(AWindow.wndList[i].option.isAbsolute) continue;
	
		tmp = Number(AWindow.wndList[i].getStyle('z-index'));
		
		//console.log( '(' + max + ', ' + tmp +')' );

		if(max<tmp)
		{
			toTopWnd = AWindow.wndList[i];
			max = tmp;
		}
	}
	
	//마지막 윈도우가 닫히면서 호출될 경우, 더이상의 윈도우가 없으면 toTopWnd 는 null 이 될 수 있다.
	AWindow.makeTopWindow(toTopWnd);
};

//---------------------------------------------------------------------------------------------
//modalBg 및 윈도우의 z-index 변경 로직과 container 의 active, deactive 이벤트를 발생시켜준다.
//toTopWnd 		: 최상위로 활성화 될 윈도우, null 이 될 수도 있으며 deactive 이벤트만 발생
//isFirst 		: 최초 오픈 시점인지
AWindow.makeTopWindow = function(toTopWnd, isFirst)
{
	//새로운 toTopWnd 가 활성화 되면서 현재 AWindow.topWindow 는 비활성화 된다.
	//최초 윈도우가 띄워지는 경우 deactWnd 는 null 이 된다.
	
	var deactWnd = AWindow.topWindow, zIndex = AWindow.BASE_ZINDEX;
	
	if(deactWnd===toTopWnd) return;
	
	//활성, 비활성 이벤트를 발생시켜줄 지 여부
	//활성 또는 비활성되는 창이 참인 경우만 호출...
	var isActive = 	 Boolean(toTopWnd);
	var isDeactive = Boolean(deactWnd);
	
	//1) 비활성화 창이 null 일 수 있으므로 비교하고, 2) 비활성창의 부모가 활성화 되는 경우, 3) 비활성창이 inParent 옵션으로 열렸으면
	//부모가 활성화되어도 비활성창이 그 앞에 그대로 보여지므로 결국 변화가 없는 것이므로 이벤트를 발생시키지 않는다.
	isActive &= !(deactWnd && deactWnd.getParent()===toTopWnd && deactWnd.option.inParent);
	//위와 같은 이유로... 
    //1) 활성화 창이 null 일 수 있으므로 비교하고, 2) 활성창의 부모가 비활성화되는 경우, 3) 활성창이 inParent 옵션으로 열렸으면
    //부모가 비활성화되어도 활성창이 그 앞에 그대로 보여지므로 결국 변화가 없는 것이므로 이벤트를 발생시키지 않는다.
	isDeactive &= !(toTopWnd && toTopWnd.getParent()===deactWnd && toTopWnd.option.inParent);
	
	if(isActive) toTopWnd.onWillActive(isFirst, deactWnd);
	if(isDeactive) deactWnd.onWillDeactive(toTopWnd);
	
	//최초 윈도우가 띄워지는 경우 AWindow.topWindow 가 null 이 될 수 있다.
	if(deactWnd) //isDeactive 로 바꾸지 말것
	{
		zIndex = Number(deactWnd.getStyle('z-index')) + 2;	//비활성 윈도우보다 2단계 높게, modalBg 자리를 비워둠
	
		//topWindow 에서 close 가 호출되면 z-index 를 0 으로 셋팅한 후 updateTopWindow 가 호출된다.
		//즉, deactWnd의 zIndex 가 0이면 곧 닫힐 윈도우이다.
		//그런 경우는 z-index 를 deactWnd의 의 값을 기준으로 셋팅해선 안되고 현재 자신의 값을 유지하면 된다.
		
		if(zIndex==2 && toTopWnd) zIndex = toTopWnd.getStyle('z-index');
	}
	
	//활성화되는 창이 부모 element 안에 있는 경우는 부모의 z-index 를 변경해야 한다.
	if(isActive) 
	{
		var tmp = toTopWnd;

        //deactWnd 의 자손중에 toTopWnd 이 있는 경우 tmp 가 deactWnd 이 되어버리므로 예외처리
        if(!deactWnd || !deactWnd.element.contains(tmp.element)) {
		
		//비활성화되는 창의 z-index 값보다 높은값을 추가하는 것이므로 isDeactive 가 참인 경우만
		while(isDeactive && tmp)
		{
			//부모 엘리먼트가 같을 때까지 검색
			if(tmp.option.inParent && tmp.element.parentNode!==deactWnd.element.parentNode)
			{
				tmp = tmp.getParent();
				
				//SubFolder 프로퍼티 세팅되어 다른 웹 프로젝트에 서브로 세팅되어 동작되는 경우
				//tmp의 부모컴포넌트가 존재하지 않을 수 있으므로 예외처리한다.
				if(!tmp)
				{
					tmp = toTopWnd;
					break;
				}
			}
			else break;
		}
		
        }

		//APage 등, 즉 AWindow 가 아닌 컨테이너는 z-index 값이 셋팅되지 않도록
		if(tmp && tmp instanceof AWindow) tmp.setStyle('z-index', zIndex);
	}
	
	AWindow.topWindow = toTopWnd;
	
	//모달 다이얼로그인 경우 modalBg 의 z-index 도 변경시켜준다.	
	if(isActive && toTopWnd.option.isModal) 
	{
		if(toTopWnd.modalBg) toTopWnd.modalBg.style.zIndex = zIndex-1;
		else toTopWnd.modalManage(zIndex-1);
	}
	
	if(isActive) toTopWnd.onActive(isFirst, deactWnd);
	if(isDeactive) deactWnd.onDeactive(toTopWnd);
	
	//topWindow 가 close 되는 경우는 setTimeout 을 주면 안됨. 
	//윈도우가 먼저 클로즈 된 후 onDeactiveDone 이 호출되어 $ele 가 null 인데도 _callSubActiveEvent 함수를 호출한다.
	
	if(zIndex>2) setTimeout(_active_done_helper, 0);
	else _active_done_helper();
	
	function _active_done_helper()
	{
		if(isActive && toTopWnd.isValid() ) toTopWnd.onActiveDone(isFirst, deactWnd);
		if(isDeactive && deactWnd.isValid() ) deactWnd.onDeactiveDone(toTopWnd);
	}
	
};

//개발중에 AWindow open 할 경우 z-index가 공유되지 않아 윈도우가 뒤로 뜨는 버그 수정
/*
if(window._isDev_)
{
	AWindow.addWindow = AWindow_.addWindow;
	AWindow.removeWindow = AWindow_.removeWindow;
	AWindow.getTopWindow = AWindow_.getTopWindow;
	AWindow.updateTopWindow = AWindow_.updateTopWindow;
	AWindow.makeTopWindow = AWindow_.makeTopWindow;
}
*/

//---------------------------------------------------------------------------------------------

AWindow.prototype.init = function(context)
{
	//-------------------------------------------------------------------------------
	//	isModal 은 모바일인 경우만 (ios 브라우저 등에서) 
	//	윈도우 밑(뒤)에 있는 화면에 터치 액션이 전달되는 버그가 있으므로 기본값을 true 로 한다.
	//	isModal 이 true 이면 windowTouchBugFix 에서 부모를 disable 시켜 오류를 방지한다.
	//	모달리스로 셋팅을 하게 되면 ios 에서는 터치 액션이 배경에 전달됨. --> 차후 이 경우도 처리 필요.
	
	this.setOption(
	{
		//isModal: afc.isMobile,		//모바일이면 기본을 modal 로 셋팅, 위에 설명 참조.
		isModal: false,				//윈도우 모달/모달리스 여부, 위에 설명 참조.
		isCenter: false,			//자동 중앙정렬 할지
		isFocusLostClose: false,	//모달인 경우 포커스를 잃을 때 창을 닫을지
		isFocusLostHide: false,		//모달인 경우 포커스를 잃을 때 창을 숨길지
		modalBgOption: afc.isMobile ? 'dark' : 'none',		//none, light, dark 모달인 경우 배경을 어둡기 정도
		overflow: 'hidden',			//hidden, auto, visible, scroll
		dragHandle: null,			//드래가 핸들이 될 클래스명이나 아이디, .windowHandle or #windowHandle
		isResizable: false,			//윈도우 창을 리사이즈 가능하게 할지
		isResizeGhost: false,       //창 리사이즈 시 가이드를 점선으로 보여주고 마지막에 리사이즈 
		isDraggable: false,			//윈도우 창을 드래그로 움직이게 할지
		inParent: true,				//부모 컨테이너 안에 창을 띄울 경우, 모달리스(isModal:false)이고 부모를 클릭해도 항상 부모보다 위에 보이게 하려면 이 값을 true 로 셋팅해야 한다.
		focusOnInit: true,			//init될때 자동으로 윈도우의 첫번째 컴포넌트(tabIndex기준)에 포커스
		//activePropagation: true		//윈도우가 활성화 될 때 컨테이너의 active 호출여부(onWillActive, onActive, onActiveDone)
		
	}, true);

	//	no overwrite 가 true 이기 때문에 init 위에 두어야 한다.
	//------------------------------------------------------------

	AContainer.prototype.init.call(this, context);
	
	
	//타이틀을 만든다던가....등등의 태그 생성 작업
	
	//afc.log('AWindow init');
	
	
	if(theApp.webHistoryMgr) theApp.webHistoryMgr.setHistoryTarget(this.getContainerId(), this);
	
};

AWindow.prototype.onCreate = function()
{
	AContainer.prototype.onCreate.call(this);

	if(this.option.isCenter) this.moveToCenter();
	
    if(this.option.isDraggable) this.enableDrag();
	if(this.option.isResizable) this.enableResize();

	this.windowTouchManage();
	
	this.setStyle('overflow', this.option.overflow);
	
};

AWindow.prototype.setDragOption = function(key, value)
{
	if(this.option.isDraggable) 
	{
		//하위 버전 호환
        if(window.DragDrop) this.element.setDragOption(key, value)
        else this.$ele.draggable('option', key, value);
	}
};

AWindow.prototype.setResizeOption = function(key, value)
{
	if(this.option.isResizable) 
	{
		//하위 버전 호환
        if(window.DragDrop) this.element.setResizeOption(key, value)
        else this.$ele.resizable('option', key, value);
	}
};

AWindow.prototype.onDragStart = function(event, ui)
{

};

AWindow.prototype.onDragStop = function(event, ui)
{
    if(window.DragDrop)
    {
        const dm = event;

        let rect = dm.draggable.getVisualPosition()

        //상단은 외부로 나가지 않도록
        if(rect.top<0) 
        {
            // 드래그 종료 시점에 transform 값을 제거하면서 left, top 을 셋팅한다.
            // 그 이후에 이동되도록 timeout 사용
            setTimeout(()=> dm.draggable.setVisualPosition(rect.left, 0))
        }

    }
    else
    {
        //상단은 외부로 나가지 않도록
        if(ui.position.top<0) this.moveY(0);
    }
};

AWindow.prototype.onResize = function()
{
	//if(this.option.isCenter) this.moveToCenter();

	AContainer.prototype.onResize.call(this);
};

AWindow.prototype.enableDrag = function()
{
    if(window.DragDrop) this.enableDrag2()
    else this.enableDrag1()
};

//하위 버전 호환 버전
AWindow.prototype.enableDrag1 = function()
{
    //윈도우를 오픈한 이후에 옵션을 켤 수도 있으므로 변수값을 셋팅한다.
    this.option.isDraggable = true;
    
    var dragOpt = 
    {
        scroll: false,
        //containment: 'window'
    };
    
    if(this.option.dragHandle) dragOpt.handle = this.option.dragHandle;

    this.$ele.draggable(dragOpt);
    
    var thisObj = this;
    
    //drag start
    this.setDragOption('start', function(event, ui)
    {
        thisObj.onDragStart(event, ui);
    });
    
    this.setDragOption('stop', function(event, ui)
    {
        thisObj.onDragStop(event, ui);
    });
};

AWindow.prototype.enableDrag2 = function()
{
    //윈도우를 오픈한 이후에 옵션을 켤 수도 있으므로 변수값을 셋팅한다.
    this.option.isDraggable = true;
    
    var dragOpt = 
    {
        useTransform: true,
    };

    if(this.option.dragHandle) dragOpt.handle = this.option.dragHandle;
    //if(this.option.inParent) dragOpt.containment = 'parent';

    this.element.enableDrag(dragOpt);
    
    var thisObj = this;
    
    //drag start
    this.setDragOption('onStart', function(drag)
    {
        thisObj.onDragStart(drag);
    });
    
    this.setDragOption('onStop', function(drag)
    {
        thisObj.onDragStop(drag);
    });
};

AWindow.prototype.enableResize = function()
{
    if(window.DragDrop) this.enableResize2()
    else this.enableResize1()
};

//하위 버전 호환 버전
AWindow.prototype.enableResize1 = function()
{
    //윈도우를 오픈한 이후에 옵션을 켤 수도 있으므로 변수값을 셋팅한다.
    this.option.isResizable = true;

    var thisObj = this;
    this.$ele.resizable(
    {
        handles: 'all',
        resize: function(event, ui)
        {
            //ui.size.height = Math.round( ui.size.height / 30 ) * 30;
            thisObj.onResize();
        },
        stop: function(event, ui)
        {
			//상단은 외부로 나가지 않도록
			let top = 0;
            if(ui.position.top < top) thisObj.moveY(top);
        }
    });
    
    //resizable 을 호출하면 position 값이 바뀌므로 다시 셋팅해 준다.
    this.setStyle('position', 'absolute');

};

AWindow.prototype.enableResize2 = function()
{
    //윈도우를 오픈한 이후에 옵션을 켤 수도 있으므로 변수값을 셋팅한다.
    this.option.isResizable = true;

    var thisObj = this;
    this.element.enableResize(
    {
        handles: 'all',
        ghost: this.option.isResizeGhost,
        onResize: function({ resizable, rect })
        {
            //console.log('onResize')
            //ui.size.height = Math.round( ui.size.height / 30 ) * 30;

            if(!thisObj.option.isResizeGhost) thisObj.onResize();
        },
        onStop: function({ resizable, rect })
        {
            //console.log('onStop')
            if(thisObj.option.isResizeGhost) thisObj.onResize();

			//상단은 외부로 나가지 않도록
			//let top = 0;
            //if(ui.position.top < top) thisObj.moveY(top);
        }
    });
    
    //resizable 을 호출하면 position 값이 바뀌므로 다시 셋팅해 준다.
    //this.setStyle('position', 'absolute');

};

AWindow.prototype.setResultListener = function(resultListener)
{
	this.resultListener = resultListener;
};

AWindow.prototype.setResultCallback = function(callback)
{
	this.callback = callback;
};

AWindow.prototype.moveToCenter = function()
{
    var w = this.getWidth()/2;
    var h = this.getHeight()/2;

    var cenX = 'calc(50% - ' + w +'px)';
    var cenY = 'calc(50% - ' + h +'px)';
    
    this.move(cenX, cenY);
};

//This is deprecated, use setOption
AWindow.prototype.setWindowOption = function(option, noOverwrite)
{
	for(var p in option)
    {
		if(!option.hasOwnProperty(p)) continue;
		
		if(!noOverwrite || this.option[p]==undefined)
		{
			this.option[p] = option[p];
		}
    }
};

AWindow.prototype.setModalBgOption = function(option)
{
	this.option.modalBgOption = option;

	if(this.option.modalBgOption=='light') this.modalBg.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
	else if(this.option.modalBgOption=='dark') this.modalBg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
	else this.modalBg.style.backgroundColor = '';
};


//window buf fix
/*
AWindow.prototype.windowTouchBugFix = function(isOpen)
{
	if(!afc.isMobile || afc.isIos) return;
	
	if(isOpen)
	{
		//IOS UIWebOverflowContentView BugFix
		if(afc.isIos && window.AppManager) AppManager.touchDelay();
		
		this.isDisableTime = true;
		
		var isActionDelay = (!afc.isIos && this.isOpenActionDelay);
		
		//이전 윈도우가 사라지면서 자신을 띄웠을 때, 이전 윈도우가 터치한 정보가 자신에게 전달되는 것을 막음.
		//아이폰에서는 this.actionDelay('input'); 이 작동하지 않는다.
		//actionDelay 호출 때문에...ios 웹브라우저에서는 윈도우 자체 스크롤이 안되고 배경이 스크롤되는 버그가 발생한다.
		//그럴 경우 actionDelay 가 호출되지 않도록 한다.
		if(isActionDelay) this.actionDelay();
		
		//자신을 띄운 하위 컨테이너에게 터치 정보가 전달되는 것을 막음. 
		if(this.option.isModal)
		{
			if(++this.parent.disableCount==1)
			{
				this.parent.enable(false);
			}
			
			//actionDelay 가 호출된 경우는 delay 후에 풀어 주므로 
			if(!isActionDelay)
			{
				//자식인 자신도 disable 되므로 자신은 풀어준다.
				this.enable(true);
			}
			
			this.modalBg.style.pointerEvents = 'auto';
		}
	}
	
	//close
	else
	{
		var thisObj = this;

		//IOS UIWebOverflowContentView BugFix
		if(afc.isIos && window.AppManager) AppManager.touchDelay();
		
		if(this.option.isModal)
		{
			//사라지면서 터치한 정보가 하위 컨테이너에게 전달되는 것을 시간 지연을 통해서 막음.
 			if(this.isDisableTime) setTimeout(_closeHelper, afc.DISABLE_TIME);
			//Disable delay가 없는 경우
 			else _closeHelper();
 			
		}
		else
		{
			//모달리스인 경우는 띄울 때 배경을 disable 시키지 않으므로 
			//닫을 때 터치 정보가 배경으로 전달된다. 그렇기 때문에 닫힐 경우 무조건 disable 시킨 후
			//활성화 시켜준다.
			if(++this.parent.disableCount==1) this.parent.enable(false);
			setTimeout(_closeHelper, afc.DISABLE_TIME);
		}
		
		
		function _closeHelper()
		{
			if(!thisObj.parent.isOpen()) return;

			if(--thisObj.parent.disableCount==0)
			{
				//var $ele = thisObj.parent.get$ele();
				//$ele.find('input').css('pointer-events', 'auto');
				//$ele.css('pointer-events', 'auto');

				thisObj.parent.enable(true);
			}
		}
		
	}
};
*/

AWindow.prototype.windowTouchManage = function()
{
	var thisObj = this;
	
    AEvent.bindEvent(this.element, AEvent.ACTION_DOWN, function(e)
    {
		e.stopPropagation();
		
		if(thisObj.isValid()) AWindow.makeTopWindow(thisObj);
    });
};

//android 4.3 이하, BugFix
//배경으로 터치 전달되어 스크롤되는 버그
AWindow.prototype.preventTouch = function()
{
/*
	if(afc.andVer>4.3) return;
	
    AEvent.bindEvent(this.element, AEvent.ACTION_DOWN, function(e)
    {
		e.preventDefault();
		e.stopPropagation();
    });
	*/
};

//윈도우가 모달 모드인 경우의 처리
AWindow.prototype.modalManage = function(zIndex)
{
	this.modalBg = document.createElement('div');
	this.modalBg.classList.add('_modal_bg_');
	
	Object.assign(this.modalBg.style, {
		'width':'100%', 'height':'100%',
		'position':'absolute',
		'top':'0px', 'left':'0px',
		'z-index':zIndex, 
		//아래 값이 inherit 되어 none 값이 세팅되면 모달 뒷부분에 포인터 이벤트가 전달되므로 auto로 지정한다.
		'pointer-events': 'auto'
	});
	
	if(this.option.isModal)
	{
		if(this.option.modalBgOption=='light') this.modalBg.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
		else if(this.option.modalBgOption=='dark') this.modalBg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
	}

	//현재 활성화된 브라우저의 body 에 Element 를 추가하기 위해
	var fApp = AApplication.getFocusedApp();

	if(this.option.inParent) this.parent.element.appendChild(this.modalBg);
	else fApp.rootContainer.element.appendChild(this.modalBg);

	//modalBg의 enable 로는 바로 닫히는 경우는 해결가능하지만 기존에 떠있는 윈도우가 있는 경우
	//enable 되기전에 클릭시 기존 윈도우의 z-index가 높게 설정되어 Top으로 위치하게 되는 버그가 있어 이벤트를 나중에 바인드하게 수정(setTimeout)
	//위의 로직은 윈도우A, B, C 가 있는 경우 A가 B를 띄우면서 B가 Top Window가 되지만 A에서 빠르게 두번 버튼을 클릭하게 되면
	//A가 Top Window가 되고 C를 띄우게 되면 B와 C의 z-index가 동일해져 C가 안보이게 되는 현상이 있어 이벤트는 바로 바인드하고 시간으로 막는다.
	var thisObj = this;
	var appendTime = Date.now();
	AEvent.bindEvent(thisObj.modalBg, AEvent.ACTION_DOWN, function(e) {
	
		e.preventDefault();
		e.stopPropagation();

		//오픈
		if(appendTime + afc.DISABLE_TIME > Date.now()) return;

		if(thisObj.option.isFocusLostClose) 
		{
			thisObj.isDisableTime = false;

			//close가 호출되어 modalBg afc.DISABLE_TIME 이후에 제거되는데
			//그전에 ACTION_DOWN이 호출되면 close가 또 발생되므로 isValid로 체크한다.
			//unbindEvent 를 하는 방법도 생각해 볼 것.
			if(thisObj.isValid()) thisObj.close();
		}
		else if(thisObj.option.isFocusLostHide) 
		{
			thisObj.isDisableTime = false;
			thisObj.hide();
		}
	});

/*
	//화면에서 클릭시 닫는 로직이 있는 경우 이벤트가 전달되어 바로 닫히는 현상이 있어 enable로 처리
	this.enable(false);
	setTimeout(()=> { if(this.isValid()) this.enable(true); }, afc.DISABLE_TIME);
	*/
};

//다이얼로그와 같은 속성으로 윈도우를 오픈한다.
AWindow.prototype.openAsDialog = function(viewUrl, parent, width, height)
{
	//var bgOpt = '';
	
	//if(afc.isPC) bgOpt = 'none';
	//else bgOpt = 'light';
	
	this.setOption(
	{
		isModal: true,
		isCenter: true,
		//modalBgOption: bgOpt
	});
	
	return this.open(viewUrl, parent, 0, 0, width, height);
};

//팝업메뉴와 같은 속성으로 윈도우를 오픈한다.
AWindow.prototype.openAsMenu = function(viewUrl, parent, width, height)
{
	this.setOption(
	{
		isModal: true,
		isCenter: true,
		isFocusLostClose: true,
	});
	
	return this.open(viewUrl, parent, 0, 0, width, height);
};

AWindow.prototype.openCenter = function(viewUrl, parent, width, height)
{
	this.setOption(
    {
		isCenter: true
    });
	
	return this.open(viewUrl, parent, 0, 0, width, height);
};


AWindow.prototype.openFull = function(viewUrl, parent)
{
	return this.open(viewUrl, parent, 0, 0, '100%', '100%');
};



//	윈도우 창을 연다.
//
AWindow.prototype.open = async function(viewUrl, parent, left, top, width, height)
{
	await AContainer.prototype.open.call(this, viewUrl, parent, left, top, width, height);
	
	//부모 wndList 에 추가. 닫힐 때 같이 닫아주기 위함
	if(this.option.inParent) this.parent.addWindow(this);
	
    //전역 wndList 에 추가
	AWindow.addWindow(this);
	
	AWindow.makeTopWindow(this, true);
	
	//modalBg 가 생성된 후 호출되어야 하므로 makeTopWindow 이후에 호출
	//this.windowTouchBugFix(true);

	if(theApp.webHistoryMgr) theApp.webHistoryMgr.pushHistory({target:this.getContainerId(), id:this.getContainerId()});
};

/*
AWindow.prototype.setView = function(view, isFull)
{
	AContainer.prototype.setView.call(this, view, isFull);
	
	//윈도우에 한해서 뷰터치시 포커스를 준다.
	this.view.actionToFocusComp();
};
*/

//윈도우 창을 닫는다.
//----------------------------------------------------------
//	result function
//	function onWindowResult(result, awindow);
//----------------------------------------------------------

AWindow.prototype.close = function(result, data)
{
	var thisObj = this;
	//현재는 최상위 z-index 이지만 
	//곧 닫힐 윈도우이기 때문에 정렬에서 맨 하위가 되도록 0을 셋팅한다.
	this.setStyle('z-index', 0);
	
	AWindow.updateTopWindow(this);
	
	//--------------------------------

	//back key로 키보드를 내리면 포커스가 유지되어 resize 이벤트가 발생하지 않아
	//onKeyBoardHide가 호출되지 않는 경우, topWnd가 초기화되지 않는 문제 수정
	if(window.KeyboardManager && KeyboardManager.topWnd === this) KeyboardManager.onKeyBoardHide();

	AContainer.prototype.close.call(this, result, data);
	
	//this.windowTouchBugFix(false);
	
	if(this.option.isModal) 
	{
		this.modalBg.remove();
	 	this.modalBg = null;
	}
	
	//부모 wndList 에서 제거
	if(this.option.inParent) this.parent.removeWindow(this);
	
	//전역 wndList 에서 제거
	AWindow.removeWindow(this);
	
	if(this.resultListener) 
	{
		setTimeout(function()
		{
			thisObj.resultListener.onWindowResult(result, data, thisObj);
		}, 10);
	}
	
	if(this.callback)
	{
		setTimeout(function()
		{
			thisObj.callback(result, data);
		}, 10);
	}
	
	//result -909 is from WebHistoryManager
	if(theApp.webHistoryMgr && result!=-909) theApp.webHistoryMgr.popHistory();
};

AWindow.prototype.show = function(delay)
{	
	//this.windowTouchBugFix(true);
	
	AWindow.makeTopWindow(this);	
	
	if(this.option.isModal) _TinyDom.show(this.modalBg);
	
    if(delay==undefined) _TinyDom.show(this.element);
	else
    {
      	var thisObj = this;
       	thisObj.isDelayShow = true;

       	setTimeout(function() 
       	{
       		if(thisObj.isDelayShow) 
       			_TinyDom.show(thisObj.element);
       	}, delay);
    }

};

AWindow.prototype.hide = function()
{
	this.isDelayShow = false;
	
	//this.windowTouchBugFix(false);
	
	this.setStyle('z-index', 0);
	
	AWindow.updateTopWindow(this);
	
    _TinyDom.hide(this.element);
	
	if(this.option.isModal) _TinyDom.hide(this.modalBg);
};

/*
AWindow.prototype.restore = function()
{

};

AWindow.prototype.minimize = function()
{

};

AWindow.prototype.maximize = function()
{

};
*/

AWindow.prototype.move = function(x, y)
{
	if(!isNaN(x)) x += 'px';
	if(!isNaN(y)) y += 'px';
	
	this.setStyleObj( { 'left':x, 'top':y });
};

AWindow.prototype.moveX = function(x)
{
	if(!isNaN(x)) x += 'px';
	this.setStyle('left', x);
};

AWindow.prototype.moveY = function(y)
{
	if(!isNaN(y)) y += 'px';
	this.setStyle('top', y);
};

AWindow.prototype.offset = function(x, y)
{
	var pos = this.getPos();
	this.setStyleObj( { 'left':(pos.left+x)+'px', 'top':(pos.top+y)+'px' });
};

AWindow.prototype.onBackKey = function()
{
	this.close();
	return true;
};




;                 
/**
 * @author asoocool
 */

//	APage 는 부모컨테이너 밑의 풀화면으로 추가될 수 있다.
//	싱글페이지만 사용할 경우 open() 함수를 호출하면 된다.
//	네비게이션 기능을 이용할 경우 ANavigator 객체와 같이 사용해야 한다.
class APage extends AContainer
{
	constructor(containerId)
	{
		super(containerId)
		
		this.navigator = null;
		this.pageData = null;	//deprecated
	}

	

	
}

window.APage = APage

APage.prototype.init = function(context)
{
	this.setOption(
	{
		isOneshot: false,			//활성화시 로드되고 비활성화시 바로 삭제한다. true 이면 매번 새로 로드된다.
		
	}, true);

	//	no overwrite 가 true 이기 때문에 
	//	부모의 옵션보다 우선 하려면 init 위에 두어야 한다.
	//------------------------------------------------------------

	AContainer.prototype.init.call(this, context);

	//afc.log('APage init');
};

APage.prototype.open = function(viewUrl, parent)
{
	return AContainer.prototype.open.call(this, viewUrl, parent, 0, 0, '100%', '100%');
};

APage.prototype.getNavigator = function()
{
	return this.navigator;
};

//deprecated, instead use getData
APage.prototype.getPageData = function()
{
	return this.pageData;
};

APage.prototype.onBackKey = function()
{
    if(this.navigator.canGoPrev())
    {
        this.navigator.goPrevPage(false);
        return true;
    }
    
	return false;
};

;
/**
 * @author asoocool
 */

class AApplication
{
	constructor()
	{
		//this.navigator = null;

		this.rootContainer = null;		//응용프로그램이 시작되는 최상위 컨테이너, 화면을 표현하지는 않는다. mainContainer 의 부모 컨테이너 역할만 한다.
		this.mainContainer = null;		//루트 컨테이너 밑으로, 화면을 표현하는 시작 컨테이너 
		this.rootElement = null;

		//this.indicator = null;
		this.orientation = 'portrait';

		//this.appContainer = null;
		this.curPath = null;

		//this.resPool = null;
		this.mdiManager = null;

		this.keyDownListeners = null;
		this.keyUpListeners = null;

	}

}

window.AApplication = AApplication

//현재 활성화된 브라우저의 body 에 Element 를 추가하기 위해 필요한 변수
AApplication.focusedBrowser = window;

AApplication.getFocusedApp = function()
{
    return AApplication.focusedBrowser.theApp;
};

AApplication.prototype.unitTest = function(unitUrl)
{
//console.log('unitTest : ' + unitUrl);

	//if(this.mainContainer) this.mainContainer.close();

	//this.rootContainer.$ele.children().remove();
	
	//this.setMainContainer(new APage('unit'));
	//this.mainContainer.open(unitUrl);
	
	
	//this.rootContainer.$ele.children().hide();
	
	var cntr = new APage('unit');
	cntr.open(unitUrl);
};


AApplication.prototype.onReady = function()
{
	this.setCurrentPath();

	//라이브러리 추가시 동적으로 생성
	//
	if(window['ResPool']) this.resPool = new ResPool();
	//if(window['MDIManager']) this.mdiManager = new MDIManager();
	if(window['WebHistoryManager']) 
	{
		this.webHistoryMgr = new WebHistoryManager();
		this.webHistoryMgr.init();
	}
	//-------------------------

	this.rootContainer = new AContainer();

    
    if(!this.rootElement)
    {
        if(PROJECT_OPTION.build.subName) 
        {
            this.rootElement = document.querySelector('._global_style_')
        }

        if(!this.rootElement) this.rootElement = document.querySelector('body')
    }

    //onReady 이전에 직접 원하는 Element 를 셋팅할 수도 있음.
    //의미없는 작업이라 주석
    //else this.rootElement = $(this.rootElement)[0];
	
	this.rootContainer.init(this.rootElement, true);	//default is body
	
	//edge 소수점 전화번호 인식 버그 수정
	//this.rootContainer.$ele.attr('x-ms-format-detection','none');
    this.rootContainer.element.setAttribute('x-ms-format-detection','none');
	
	/*
	if(afc.isPC)
	{
		//pc 버전용 글로벌 스크롤 스타일 추가
		this.rootContainer.$ele.addClass('_global_scroll_style_');
	}
	*/
	
	if(this.isLoadTheme) this.loadThemeInfo();

	//키보드 이벤트 초기화
	this.initKeyEvent();
	
	//var windowHeight = $(window).height(),
	//	_originalSize = $(window).width() + windowHeight, isKeypadVisible = false,
	//	_originalViewport = document.querySelector("meta[name=viewport]").content;
	let windowHeight =  _TinyDom.height(window),
		_originalSize = _TinyDom.width(window) + windowHeight, isKeypadVisible = false,
		_originalViewport = document.querySelector("meta[name=viewport]").content;
		
	//console.log('--> ' + windowHeight + ',' + _originalSize);

    var thisObj = this;
    window.addEventListener('orientationchange', function()
    {
		//console.log("... orientationchange ...");
		
		//PC 로 로드된 뒤에 디버그창에서 Mobile로 변경시에는 
		//키보드매니저가 추가되지 않아 에러가 나므로 새로고침 해준다.
		if(!window.KeyboardManager)
		{
			console.log('We need to reload.');
			location.reload();
			return;
		}
		
		var _cntr = KeyboardManager.container;
		
		if(_cntr && _cntr.isValid() && KeyboardManager.resizeWebview) KeyboardManager.restoreHeight(_cntr);
		
      	switch (window.orientation) 
      	{
        	case 0: //portrait
        	case 180:
        		thisObj.orientation = 'portrait';
				//windowHeight = $(window).width();	//반대값을 저장해야 실제 회전된 후의 값이 된다.
                windowHeight = _TinyDom.width(window)
          	break;
          	
        	case 90: 
        	case -90: //landscape
        		thisObj.orientation = 'landscape';
				//windowHeight = $(window).height();	//반대값을 저장해야 실제 회전된 후의 값이 된다.
                windowHeight = _TinyDom.height(window);
          	break;
          	
        	default:
	            //viewport.setAttribute('content', 'width=' + vpwidth + ', initial-scale=0.25, maximum-scale=1.0;')
          	break;
      	}
		
    }, false);
	
    window.addEventListener('resize', function(e)
    {
		//키보드가 떠 있는 상태에서 오리지날 사이즈를 변경하게 되면 문제가 생길 수 있으므로 비교한다.
		if(!isKeypadVisible)
		{
			//마지막으로 originalSize가 저장된 viewport 정보와 다른 경우 originalSize를 갱신한다.
            var metaViewPort = document.querySelector("meta[name=viewport]");

            if(metaViewPort)
            {
                var curViewport = metaViewPort.content;
                if(_originalViewport != curViewport)
                {
                    windowHeight = _TinyDom.height(window);
                    _originalSize = _TinyDom.width(window) + windowHeight;
                    _originalViewport = curViewport;
                    
                    //originalSize를 변경했기 때문에 아래의 키보드 오픈은 되지 않는다.
                }
            }
		}
	
		let isResize = true;
		
		//#########################################################
		// 아이폰의 경우 키패드가 올라올 때, resize 가 발생하지 않는다.
		// 아이폰인 경우, 다음 키패드 로직을 타면 안됨
		
		//모든 모바일 브라우저, native 의 경우도 adjustResize 일 경우 발생한다.
		if(afc.isMobile && !afc.isIos)
		{
			let wh = _TinyDom.height(window), ww = _TinyDom.width(window);
			
			//console.log('====> ' + ww + ',' + wh + ',' + _originalSize);
			
			//# 키패드가 올라 오는 경우
			//키패드 없이, 가로/세로 모드 전환 시 2픽셀 정도 차이가 날 수 있으므로 
			//if(ww+wh!=_originalSize) 이렇게 비교하면 안됨. 좀 더 차이가 날 경우 수치를 조정한다.
			if(Math.abs(ww+wh - _originalSize) > 2)
			{
				//console.log("keyboard show up");
				
				isResize = false;			//키패드에 의해 리사이즈 이벤트가 발생된 경우는 reportEvent 를 전송하지 않는다.
				isKeypadVisible = true;
				
				KeyboardManager.onKeyBoardShow(wh, windowHeight - wh);
			}
			
			//# 키패드가 사라지는 경우
			else if(isKeypadVisible)
			{
				//console.log("keyboard closed");
				
				isResize = false;			//키패드에 의해 리사이즈 이벤트가 발생된 경우는 reportEvent 를 전송하지 않는다.
				isKeypadVisible = false;

				KeyboardManager.onKeyBoardHide();
				
				AWindow.reportMoveCenter();
			}
			
			windowHeight = wh;
		}
		
		// resize를 해도 되는 경우에만 resize 처리한다.
		// 키패드에 의해 리사이즈 이벤트가 발생된 경우는 reportEvent 를 전송하지 않는다.
		if(isResize)
		{
			/*
			AWindow.reportResizeEvent();

			if(theApp.mainContainer)
				theApp.mainContainer.onResize();

			else ANavigator.reportResizeEvent();
			*/
			
			theApp.rootContainer.onResize();
		}

    });	

    if(afc.isSimulator && location.origin == 'file://') this.enableHotReload();

};

//현재 응용프로그램의 작업 디렉토리 셋팅
AApplication.prototype.setCurrentPath = function()
{
	var curPath = decodeURI(window.location.pathname);
	
    if(afc.isWindow) 
    {
    	curPath = AUtil.extractLoc(curPath.replace(/[/]/g, afc.DIV));
    	//this.curPath = curPath.slice(1, curPath.length);
		this.curPath = curPath.slice(1);
    }
    //mac, linux
    else 
    {
    	curPath = AUtil.extractLoc(curPath);
    	//this.curPath = curPath.slice(0, curPath.length);
		//this.curPath = curPath.slice(0);
		this.curPath = curPath;
    }
};

//다음 세 함수는 필요한 경우
//실제 응용 프로그램(~App.cls)에서 상황에 맞게 재구현한다.

//index.html location
AApplication.prototype.getCurrentPath = function()
{
	return this.curPath;
};

//user data path to write something
AApplication.prototype.getDataPath = function()
{
	return this.curPath;
};

//exe file path
AApplication.prototype.getProcessPath = function()
{
	return this.curPath;
};


//android 의 백키 터치시 기본적으로 처리해 줘야 할 것들. 
//true를 리턴하면 받는 곳에서 아무처리도 하지 않도록 한다.
AApplication.prototype.onBackKeyManage = function()
{
    if(AWindow.reportBackKeyEvent()) return true;
    
    /*
    if(this.navigator.canGoPrev())
    {
        this.navigator.goPrevPage(true);
        return true;
    }
    */
   
   /*
   //asoocool
   	var page = this.navigator.getActivePage();
   	if(page && page.onBackKey()) return true;
	*/
	
	return ANavigator.reportBackKeyEvent();
};

AApplication.prototype.getOrientation = function()
{
	return this.orientation;
};

/*
AApplication.prototype.getCurrentPage = function()
{
	//asoocool
	//return this.navigator.getActivePage();
	return null;
};
*/

AApplication.prototype.setMainContainer = function(container)
{
	this.mainContainer = container;
};

AApplication.prototype.getMainContainer = function()
{
	return this.mainContainer;
};

AApplication.prototype.getRootContainer = function()
{
	return this.rootContainer;
};


AApplication.prototype.getActiveContainer = function()
{
	//(this.mdiManager) return this.mdiManager.getActiveContainer();
	//else return null;

	return this.mdiManager?.getActiveContainer();
};

AApplication.prototype.getActiveView = function()
{
    //var childContainer = this.getActiveContainer();
    //if(childContainer) return childContainer.getView();
    //else return null;

	return this.getActiveContainer()?.getView();
};

AApplication.prototype.getActiveDocument = function()
{
    //var childContainer = this.getActiveContainer();
    //if(childContainer) return childContainer.getView().getDocument();
    //else return null;

	return this.getActiveContainer()?.getView()?.getDocument();
};

AApplication.prototype.changeActiveMdiManager = function(mdiManager)
{
	this.mdiManager = mdiManager;
	
};

/* 
//------------------------------------------------------------------
var docTmpl = 
{
	containerClass: 'MDIPage',
	documentClass: 'MDIDocument',
	viewUrl: 'views/MainPageView.lay',
	extNames: ['txt','js','cls'],
};
//------------------------------------------------------------------
*/

AApplication.prototype.openDocTmplFile = async function(filePath, noLoad, bSilent)
{
	if(!this.mdiManager) return null;
	
	return await this.mdiManager.openDocContainer(filePath, null, noLoad, bSilent);
};

AApplication.prototype.saveActiveDocTmplFile = function()
{
	if(!this.mdiManager) return false;
	
	var doc = this.getActiveDocument();
	if(doc) this.mdiManager.saveDocContainer(doc.uri);
};

AApplication.prototype.closeActiveDocTmplFile = function(callback, isForce, isSave)
{
	if(!this.mdiManager) return false;
	
	var doc = this.getActiveDocument();
	if(doc) this.mdiManager.closeDocContainer(doc.uri, callback, isForce, isSave);
	else if(callback) callback(-1);
};

AApplication.prototype.initKeyEvent = function()
{
	var keyDownListeners = this.keyDownListeners = [],
		keyUpListeners = this.keyUpListeners = [];

	//$(document).keydown(function(e)
	document.addEventListener('keydown', (e)=>
	{
		//리스너는 메인윈도우의 리스너를 바라보게
		if(theApp.isSharedIFrame) keyDownListeners = opener.window.theApp.keyDownListeners;
		
		if(afc.isMac) e.ctrlKey = e.metaKey;

		var listener = null;
		for(var i=keyDownListeners.length-1; i>-1; i--)
		{
			//이전 onKeyDown 에서 리스너가 삭제될 수도 있으므로 null 비교를 해야함.
			listener = keyDownListeners[i];
			
			//onKeyDown 함수에서 true 를 리턴하면 다른 리스너에게 더 이상 전달되지 않는다.
			//마지막에 추가된 리스너가 우선적으로 호출된다.
			if(listener && listener.onKeyDown(e)) break;
		}
	});

	//$(document).keyup(function(e)
	document.addEventListener('keyup', (e)=>
	{
		//리스너는 메인윈도우의 리스너를 바라보게
		if(theApp.isSharedIFrame) keyUpListeners = opener.window.theApp.keyUpListeners;
		
		if(afc.isMac) e.ctrlKey = e.metaKey;

		var listener = null;
		for(var i=keyUpListeners.length-1; i>-1; i--)
		{
			//이전 onKeyUp 에서 리스너가 삭제될 수도 있으므로 null 비교를 해야함.
			listener = keyUpListeners[i];
			
			//onKeyUp 함수에서 true 를 리턴하면 다른 리스너에게 더 이상 전달되지 않는다.
			//마지막에 추가된 리스너가 우선적으로 호출된다.
			if(listener && listener.onKeyUp(e)) break;
		}
	});
	
};

AApplication.prototype.addKeyEventListener = function(type, listener)
{
	//기존에 추가된 것이 있으면 제거
	this.removeKeyEventListener(type, listener);

	//마지막에 추가된 리스너가 우선적으로 호출 되도록 
	if(type=='keydown') this.keyDownListeners.push(listener);
	//keyup
	else this.keyUpListeners.push(listener);
};

AApplication.prototype.removeKeyEventListener = function(type, listener)
{
	var keyListeners = this.keyUpListeners;
	
	if(type=='keydown') keyListeners = this.keyDownListeners;

	if(!keyListeners) return;
	
   	for(var i=0; i<keyListeners.length; i++)
	{
		if(keyListeners[i]===listener)
		{
			keyListeners.splice(i,1);
			break;
		}
	}
};



AApplication.prototype.onClose = function()
{
	return true;
};



AApplication.prototype.onError = function(message, url, lineNumber, colNumber, error)
{
	if(window['AIndicator']) AIndicator.hide();
	
	var totMsg = message + ', Line - ' + lineNumber + ', ' + url + ' ====> ' + error.stack;
	
	//AfcMessageBox('error', totMsg);
    alert(totMsg);
	
	return totMsg;
};

AApplication.prototype.loadThemeInfo = function()
{
	var pre = '';
	if(PROJECT_OPTION.build.subName) pre = PROJECT_OPTION.build.subName + '/';
	
	theApp.themeInfo = {};
	
    /*
    $.ajax(
    {
        url: pre + 'Template/Theme/themeInfo.inf',
        dataType: 'text',
        success: function(jsonStr)
        {
			try
			{
				theApp.themeInfo = JSON.parse(jsonStr);
			}
			catch(e){}
			
			var theme = theApp.themeInfo.activeTheme;
			if(theme)
			{
				//기존에 값을 클리어 해주고 changeTheme 를 해야 제대로 작동
				//theApp.setTheme();
				theApp.changeTheme(theme);
			}
		},
        
        error: function() 
        {
        }
    });
    */

    fetch(pre + 'Template/Theme/themeInfo.inf')
    .then(response => response.json())
    .then(json => 
    {
        theApp.themeInfo = json;
        
        let theme = theApp.themeInfo.activeTheme;
        if(theme)
        {
            //기존에 값을 클리어 해주고 changeTheme 를 해야 제대로 작동
            //theApp.setTheme();
            theApp.changeTheme(theme);
        }
    })
    .catch(error => 
    {
    });
};

AApplication.prototype.changeTheme = function(theme)
{
	var curTheme = this.getTheme();
	
	//asoocool
	//이 비교를 하는게 성능상 유리한데... 잘 작동하는지 kb 프로젝트에서 테스트 해보기
	
	//if(curTheme != theme)
	{
		var i, info;
		if(curTheme)
		{
			info = theApp.themeInfo[curTheme];
			for(i=0; i<info.length; i++)
			{
				afc.removeCss(info[i]);
			}
		}
		
		info = theApp.themeInfo[theme];
		for(i=0; i<info.length; i++)
		{
			afc.loadCss(info[i]);
		}
		
		this.setTheme(theme);

		this.reportThemeEvent(curTheme, theme);
	}
};

AApplication.prototype.getTheme = function()
{
	return this.themeInfo.activeTheme;
};

AApplication.prototype.setTheme = function(theme)
{
	this.themeInfo.activeTheme = theme;
};

AApplication.prototype.reportThemeEvent = function(preTheme, curTheme)
{
    /*
	var event = document.createEvent('CustomEvent');
	event.initCustomEvent('themechange', false, false, {preTheme: preTheme, curTheme: curTheme});
	//e.detail = {preTheme: preTheme, curTheme: curTheme}
	window.dispatchEvent(event);
    */

    const event = new CustomEvent('themechange', {
        bubbles: false,
        cancelable: false,
        detail: { preTheme: preTheme, curTheme: curTheme }
    });

    window.dispatchEvent(event);
};

AApplication.prototype.addThemeEventListener = function(callback)
{
	window.addEventListener('themechange', callback);
};

AApplication.prototype.removeThemeEventListener = function(callback)
{
	window.removeEventListener('themechange', callback);
};

///////////////////////////////////////////////////////////////
// hot reload 

AApplication.prototype.enableHotReload = function()
{
    this.hrfs = nodeRequire('fs');
    this.watchers = {};
};

AApplication.prototype.disableHotReload = function()
{
    this.hrfs = null;

    for(let info of this.watchers)
    {
        if(info.watcher) info.watcher.close()
    }

    this.watchers = undefined;
};

AApplication.prototype.isHotReload = function()
{
    return this.hrfs;
};

AApplication.prototype._watchHelper = function(aview, path, isJs)
{
    let timer, info = this.watchers[path];

    //변경 감시를 이미 하고 있으면 
    if(info)
    {
        //변경시 리로드할 뷰 추가, 하나의 lay 파일로 여러개의 뷰가 생성될 수 있으므로
        info.views.push(aview)

        //console.log('already - ' + path + ' : ' + info.views.length)
    }

    //새롭게 변경 감시를 시작하는 경우
    else
    {
	    var pre = '';
	    if(PROJECT_OPTION.build.subName) pre = PROJECT_OPTION.build.subName + '/';

        info = 
        {
            watcher: null,
            views: []
        }

        this.watchers[path] = info

        //변경시 리로드할 뷰 추가, 하나의 lay 파일로 여러개의 뷰가 생성될 수 있으므로
        info.views.push(aview)

        //console.log(path + ' : ' + info.views.length)
        
        //변경시 감지할 파일을 등록한다.
        info.watcher = this.hrfs.watch(__dirname+'/'+ pre + path, (event, fileName) =>
        {
            if(event=='change')
            {
                if(timer) clearTimeout(timer);

                //운영체제의 변경 감지 이벤트를 사용하므로
                //변경 감지 이벤트가 여러번 발생한다. 
                //타임아웃을 이용하여 0.7초 안에 다시 발생하는 변경 감지는 무시한다.
                timer = setTimeout(async function() 
                {
                    //console.log('change ---- ' + fileName)
                    timer = null

                    //뷰와 연결된 자바스크립트 파일이 변경되면
                    //js도 다시 로드하고 연관된 뷰도 다시 로드한다.
                    if(isJs) await afc._loadScriptWait(path, true);  //true, 무조건 강제 로드

                    let cntr, view;
                    //파일 변경과 연관된 모든 뷰들을 리로드한다.
                    //info.views.forEach((view)=>

                    for(let i=0; i<info.views.length; i++)
                    {
                        view = info.views[i]

                        //owner가 탭뷰인 경우 탭에 로드된 뷰만 다시 로드
                        if(window.ATabView && view.owner instanceof ATabView)
                        {
                            let tabView = view.owner,
                                tab = tabView.getTabByUrl(aview.url)
                            
                            if(tab)
                            {
                                tabView.clearTabContent(tab)
                                tabView._loadTabContent(tab)
                            }
                            else
                            {
                                console.log('parent loading... ' + aview.url)
                            }
                        }

                        //그 외 컨테이너(APage, AWindow, APanel...)의 뷰나 
                        //리스트뷰, 슬라이드뷰 등은 자신의 컨테이너를 다시 로드한다.
                        else
                        {
                            cntr = view.getContainer()
                            if(cntr && cntr.view) cntr.setView(cntr.view.url)
                        }

                        //위의 reload 과정에서 소멸되면 에서 삭제되면
                        //unWatchFile 함수에서 info.views 의 원소가 삭제된다.
                        if(!view.isValid()) 
                        {
                            //console.log('setView remove from view')
                            i--;
                        }
                    }

                }, 700);
            }
        });

    }
};

AApplication.prototype.watchReloadFile = function(aview)
{
    let url = aview.url,
        htmlPath = url.replace('.lay', '.html'),
        jsPath = url.substring(0, url.lastIndexOf(".")) + '.js';

    this._watchHelper(aview, htmlPath);
    this._watchHelper(aview, jsPath, true);
};

AApplication.prototype._unWatchHelper = function(aview, path)
{
    let info = this.watchers[path];

    //변경 감시 객체가 있으면 
    if(info)
    {
        for(let i=0; i<info.views.length; i++)
        {
            if(info.views[i]===aview)
            {
                info.views.splice(i, 1)
                break
            }
        }

        //console.log('unWatchFile : ' + path + ' : ' + info.views.length)

        //더이상 등록된 뷰가 없으면
        if(info.views.length==0)
        {
            if(info.watcher) info.watcher.close()
            delete this.watchers[path]
        }
    }
};

AApplication.prototype.unWatchFile = function(aview)
{
    let url = aview.url,
        htmlPath = url.replace('.lay', '.html'),
        jsPath = url.substring(0, url.lastIndexOf(".")) + '.js';

    this._unWatchHelper(aview, htmlPath);
    this._unWatchHelper(aview, jsPath);
};




//---------------------------------------------------------------------------------
//	called from native


function onCloseApp()
{
	setTimeout(function()
	{
		if(theApp.onClose()) 
		{
			if(afc.isExec) window.exec(null, null, 'AppPlugin', 'CloseApp', []);
			else if(afc.isNwjs) theApp.nwWin.close(true);
			else if(afc.isElectron)
			{
				var wnd = theApp.elecRemote.getCurrentWindow();
				theApp.forceClose = true;
				wnd.close();
			}
			else window.close();
		}
		
	}, 0);
}

//native open event
function onOpenDocument(filePath)
{
	
}

/*
async function AfcMessageBox(title, message, type, callback, modaless)
{
	if(!window['AMessageBox']) return null;
	
	var wnd = new AMessageBox();
	wnd.setOption({isModal: !modaless});
	await wnd.openBox(null, message, type, callback);
	wnd.setTitleText(title);
	
	return wnd;
}
*/




;
/**
 *	AComponent 를 상속받아 새로운 컴포넌트를 생성하는 예
 */
 AHTMLElement = class AHTMLElement extends AComponent
{
    static CONTEXT = 
    {
        //	실제로 구현하고자 하는 컴포넌트의 태그로 변경하십시요.
        tag: '',//'<div data-base="AHTMLElement" data-class="AHTMLElement" class="AHTMLElement-Style">AHTMLElement</div>',

        //	컴포넌트를 lay 파일에 최초로 추가한 후 적용될 속성을 나열합니다.
        //	주로 컴포넌트 사이즈에 관련된 속성을 선언합니다.
        defStyle: 
        {
            width:'100px', height:'80px' 
        },
    
        //	AEvent.defEvents = ['actiondown', 'actionmove', 'actionup', 'actioncancel', 'actionenter', 'actionleave', 'keydown', 'keyup'];
        //	기본 이벤트 즉, AEvent.defEvents 에 정의된 이벤트 외에 
        //	추가적으로 발생시키고자 하는 이벤트 명을 나열합니다.
        
        events: []
    }

    constructor()
    {
        super();

        //TODO:edit here
        
        //	자신이 포함되어져 있는 프레임웍 이름을 지정합니다.
        this.frwName = 'afc'
    }

    init(context, evtListener)
    {
        super.init(context, evtListener)

        this._realizeChildren(evtListener, this.reInitComp);
    }

    addComponent(acomp, isPrepend, posComp)
    {
        if(!acomp.element) 
        {
            alert('First of all, you must call function init();');
            return;
        }
        
        if(posComp)
        {
            if(isPrepend) posComp.element.before(acomp.element);
            else posComp.element.after(acomp.element);
        }
        else
        {
            if(isPrepend) this.element.prepend(acomp.element);
            else this.element.append(acomp.element);
        }
        
        //1.0에 있던 사라진 기능
        //var arrange = this.$ele.attr('data-arrange');
        //if(arrange) acomp.$ele.css({'position':'relative', left:'0px', top:'0px', 'float':arrange});
        
        acomp.setParent(this);
    };    

    getChildCount()
    {
        return this.element.children.length;
    }

    getChildren()
    {
        let ret = [];
        for(const ele of this.element.children)
        {
            if(ele.acomp) 
                ret.push(ele.acomp);
        }
        
        return ret;        
    }

    removeFromView(onlyRelease)
    {
        this.removeChildren(onlyRelease);
        
        super.removeFromView(onlyRelease);
    }

    removeChildren(onlyRelease)
    {
        for(const ele of this.element.children)
        {
            if(ele.acomp) 
                ele.acomp.removeFromView(onlyRelease);
        }
    }

    setText(text)
    {
        this.element.textContent = text
    }

    getText(text)
    {
        return this.element.textContent
    }

    getDroppable()
    {
        return true;
    }

    eachChild(callback, isReverse)
    {
        let items;
        
        if(isReverse) items = [...this.element.children].reverse();
        else items = this.element.children;

        for(let i=0; i<items.length; i++)
        {
            if(!items[i].acomp) continue;
            if(callback(items[i].acomp, i)==false) break;
        }
    }
    
    _realizeChildren(evtListener, reInitComp)
    {
        var acomp,
            container = this.getContainer(), rootView = this.getRootView();
        
        if(reInitComp)
        {
            for(const ele of this.element.children)
            {
                if(ele.acomp) ele.acomp.init(ele.acomp.element, evtListener);
                
                //뷰를 감싸고 있는 item 인 경우
                else
                {
                    acomp = ele.children[0].acomp;
                    acomp.init(acomp.element);
                }
            }
        }
        else
        {
            for(const ele of this.element.children)
            {
                acomp = AComponent.realizeContext(ele, container, rootView, this, evtListener);
                if(acomp)
                {
                    //if(acomp.baseName != 'AView' && container && container.tabKey) container.tabKey.addCompMap(acomp, rootView.owner);
                }
            }
            
            //if(container && container.tabKey && rootView.owner) container.tabKey.saveOwnerMap(rootView.owner);
            
        }
        
    }
}


;
/**
 * @author asoocool
 */

//-----------------------------------------------------------------------------------------
//  AEvent class
//-----------------------------------------------------------------------------------------

class AEvent
{
	constructor(acomp)
	{
		this.acomp = acomp;
		this.isTouchValid = false;
	}
}
window.AEvent = AEvent;

//--------------------------------------------------------------
// static area

AEvent.defEvents = ['actiondown', 'actionmove', 'actionup', 'actioncancel', 'actionenter', 'actionleave', 'keydown', 'keyup'];

//AEvent.TOUCHTIME = 0;
AEvent.LONGPRESS_TIME = 700;

AEvent.TOUCHLEAVE = 20;
if(afc.isIos) AEvent.TOUCHLEAVE = 40;


AEvent.actMap = null;

if(afc.isPC)
{
	AEvent.ACTION_DOWN = 'mousedown';
	AEvent.ACTION_MOVE = 'mousemove';
	AEvent.ACTION_UP = 'mouseup';
	
	//pc 에서는 발생하지 않는 이벤트지만 변수를 맞추기 위해 넣어 놓음, 
	//실제로 pc 버전에서는 아무작동도 하지 않아야 함.
	AEvent.ACTION_CANCEL = 'touchcancel';
	
	AEvent.actMap = 
	{
		touchstart: 'mousedown',
		touchmove: 'mousemove',
		touchend: 'mouseup'
	};
}
else
{
	AEvent.ACTION_DOWN = 'touchstart';
	AEvent.ACTION_MOVE = 'touchmove';
	AEvent.ACTION_UP = 'touchend';
	AEvent.ACTION_CANCEL = 'touchcancel';
	
	AEvent.actMap = 
	{
		mousedown: 'touchstart',
		mousemove: 'touchmove',
		mouseup: 'touchend'
	};
}

//pc 환경에서 touch 관련 이벤트 이름을 mouse 로 바꿔줌...또는 그 반대로
AEvent.actName = function(name)
{
	var ret = AEvent.actMap[name];
	return ret ? ret : name;
};


//The mouseout(over) event triggers when the mouse pointer leaves any child elements as well the selected element.
//The mouseleave(enter) event is only triggered when the mouse pointer leaves the selected element.

AEvent.ACTION_OVER = 'mouseover';
AEvent.ACTION_OUT = 'mouseout';
AEvent.ACTION_ENTER = 'mouseenter';
AEvent.ACTION_LEAVE = 'mouseleave';

AEvent.bindCallback = null;
AEvent.isFreezing = false;

AEvent.bindEvent = function(element, eventName, callback, options)
{
	var returnCallback = null;
	
	if(afc.isPC)
	{
		returnCallback = function(e)
		{
			if(!e.isTrigger && AEvent.isFreezing) 
			{
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		
			if(e.clientX != undefined)
			{
				e.targetTouches = e.touches = e.changedTouches = [ e ];
			}

			if(AEvent.bindCallback) AEvent.bindCallback(element, eventName, e);

			callback.call(this, e);
		};
	}
	else
	{
		returnCallback = function(e)
		{
			//트리거가 아니고 프리징 된 경우, 즉 실제로 발생된 이벤트인 경우만 프리징 체크를 한다.
			//임의로 발생시킨 트리거는 프리징변수에 영향을 받지 않는다.
			if(!e.isTrigger && AEvent.isFreezing) 
			{
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
			
			if(AEvent.bindCallback) AEvent.bindCallback(element, eventName, e);

			callback.call(this, e);
		};
	}
		
	element.addEventListener(eventName, returnCallback, options);
	
	return returnCallback;
};

AEvent.unbindEvent = function(element, eventName, callback, options)
{
	element.removeEventListener(eventName, callback, options);
};

AEvent.triggerEvent = function(element, eventName, info)
{
	var evt = null;
	
	if(window.Event) 
	{
		evt = new Event(eventName, { bubbles: true, cancelable: true });
	}
	else
	{
		evt = document.createEvent('Event');
		evt.initEvent(eventName, true, true);
	}
	
	if(info)
	{
		evt.clientX = info.clientX;
		evt.clientY = info.clientY;
		evt.pageX = info.pageX;
		evt.pageY = info.pageY;
		
		evt.changedTouches = info.changedTouches;
		evt.targetTouches = info.targetTouches;
		evt.touches = info.touches;
	
		if(info.userData) evt.userData = info.userData;
	}
	
	evt.isTrigger = true;
	
   	element.dispatchEvent(evt);
};

AEvent.keyTrigger = function(element, eventName, which, ctrlKey)
{
	var e = new KeyboardEvent(eventName, { bubbles: true, cancelable: true, which: which, ctrlKey: ctrlKey });
	e.isTrigger = true;
	element.dispatchEvent(e);

	return e;
};



//모든 클릭 이벤트들이 중복해서 발생되지 않도록 체크함.
AEvent.clickComp = null;

//-------------------------------------------------------------




//	overloading functions

//각 터치 상태에 따라 컴포넌트 상태를 상속받아 구현한다.
AEvent.prototype.actionDownState = function(){};
AEvent.prototype.actionMoveState = function(){};
AEvent.prototype.actionUpState = function(){};
AEvent.prototype.actionCancelState = function(){};
AEvent.prototype.actionEnterState = function(){};
AEvent.prototype.actionLeaveState = function(){};
AEvent.prototype.actionClickState = function(){};

//defaultAction 을 제외한 나머지 이벤트 함수들은 이벤트 함수 등록시만 호출된다.
AEvent.prototype.defaultAction = function(){};
//------------------------------------------------------



//---------------------------------------------------------------------------------------------------
//	Component Event Functions

AEvent.prototype.actiondown = function()
{
	this._actiondown();
};

AEvent.prototype.actionmove = function()
{
	this._actionmove();
};

AEvent.prototype.actionup = function()
{
	this._actionup();
};

AEvent.prototype.actioncancel = function()
{
	this._actioncancel();
};

AEvent.prototype.keydown = function()
{
	this._keydown();
};

AEvent.prototype.keyup = function()
{
	this._keyup();
};

AEvent.prototype.actionenter = function()
{
	this._actionenter();
};

AEvent.prototype.actionleave = function()
{
	this._actionleave();
};




//---------------------------------------------------------------------------------------------------


//공통으로 사용되어질 수 있는 이벤트 액션 구현
//상속받아 이벤트 함수를 선언하고 그 함수 안에서 다음 함수들 중 필요한 함수를 호출하면 됨.

AEvent.prototype._actiondown = function()
{
	var thisObj = this;
	this.acomp.bindEvent(AEvent.ACTION_DOWN, function(e)
	{
		thisObj.actionDownState();
		thisObj.acomp.reportEvent('actiondown', null, e);
	});
};

AEvent.prototype._actionmove = function()
{
	var thisObj = this;
	
	this.acomp.bindEvent(AEvent.ACTION_MOVE, function(e)
	{
		thisObj.actionMoveState();
		thisObj.acomp.reportEvent('actionmove', null, e);
	});
};

AEvent.prototype._actionup = function()
{
	var thisObj = this;
	
	this.acomp.bindEvent(AEvent.ACTION_UP, function(e)
	{
		thisObj.actionUpState();
		thisObj.acomp.reportEvent('actionup', null, e);
	});
};

AEvent.prototype._actioncancel = function()
{
	var thisObj = this;
	
	this.acomp.bindEvent(AEvent.ACTION_CANCEL, function(e)
	{
		thisObj.actionCancelState();
		thisObj.acomp.reportEvent('actioncancel', null, e);
	});
};

AEvent.prototype._dblclick = function()
{
	var thisObj = this;
	
	this.acomp.element.addEventListener('dblclick', function(e)
	{
		thisObj.acomp.reportEvent('dblclick', null, e);
	});
};

AEvent.prototype._click = function(evtName)
{
	var thisObj = this, acomp = this.acomp;
	var startX = 0, startY = 0;
	
	if(!evtName) evtName = 'click';
	
	acomp.bindEvent(AEvent.ACTION_DOWN, function(e)
	{
		//좌클릭만 허용
		if(e.which==3) return;
		 
		//afc.log('AEvent.ACTION_DOWN');
		if(!acomp.isEnable || e.touches.length > 1) return;
		if(acomp.ddManager && acomp.ddManager.isDraggable) return;
		
		//AEvent.TOUCHTIME = Date.now();
		
		if(acomp.eventStop) e.stopPropagation();
		
		/*
		if(AEvent.clickComp) return;
		AEvent.clickComp = acomp;
		*/

		thisObj.isTouchValid = true

		var oe = e.changedTouches[0];
		startX = oe.clientX;
		startY = oe.clientY;
		
		thisObj.actionDownState();
		
	});
	
	//모바일인 경우 자신의 영역에 touchstart 를 하지 않으면 touchmove 가 발생하지 않는다.
	//PC인 경우 자신의 영역 mousedown 과 상관없이 mousemove 가 무조건 발생한다. 
	acomp.bindEvent(AEvent.ACTION_MOVE, function(e)
	{
		
		if(!thisObj.isTouchValid || !acomp.isEnable || e.touches.length > 1) return;
		if(acomp.ddManager && acomp.ddManager.isDraggable) return;
		
		if(acomp.eventStop) e.stopPropagation();
		
		//PC 버전의 AButton 은 AButtonEvent 의 action leave 에서 처리
		if(afc.isPC && window.AButton && acomp instanceof AButton) return;
		
		var oe = e.changedTouches[0];
		if(Math.abs(oe.clientX - startX) > AEvent.TOUCHLEAVE || Math.abs(oe.clientY - startY) > AEvent.TOUCHLEAVE) 
		{
			thisObj.isTouchValid = false;
			thisObj.actionCancelState();
		}
	});
	
	acomp.bindEvent(AEvent.ACTION_UP, function(e) 
	{
		if(!thisObj.isTouchValid || !acomp.isEnable || e.touches.length > 1) return;
		if(acomp.ddManager && acomp.ddManager.isDraggable) return;

	   	//상위 뷰가 터치 이벤트를 받지 않도록, ex)리스트뷰의 셀렉트 이벤트 발생 방지
	    if(acomp.eventStop) e.stopPropagation();
	
		thisObj.actionUpState();
		
		//acomp.reportEvent(evtName, null, e);
		
	});
	
	acomp.bindEvent(AEvent.ACTION_CANCEL, function(e) 
	{
		thisObj.isTouchValid = false;
		
		thisObj.actionCancelState();
		
	});
	
	//웹접근성 관련 처리, 스크린리더기가 작동되면 input 계열의 태그인 경우 위 세가지 이벤트가 발생되지 않음(label 등은 발생함)
	//그래서 위 세 이벤트는 각 상태를 변경하는 용도로만 사용하고 실제 이벤트는 웹의 실제 클릭 이벤트를 사용하도록
	//구조가 변경됨. 이 경우 isSafeClick 은 작동하지 않을 수 있음. 차후에 테스트 해보기
	//acomp.$ele.on('click', function(e)
	acomp.bindEvent('click', function(e)
	{
		if(!acomp.isEnable || !thisObj.isTouchValid) return;
		
	   	//상위 뷰가 터치 이벤트를 받지 않도록, ex)리스트뷰의 셀렉트 이벤트 발생 방지
	    if(acomp.eventStop) e.stopPropagation();
	
		//click 이벤트에는 changedTouches 이벤트가 없기 때문에 셋팅
		//이전 버전에서 사용하고 있기때문에 오류를 막기 위해 셋팅, 향후 제거하기
		e.targetTouches = e.touches = e.changedTouches = [ e ];
		
		//특정한 경우에 click이벤트만 동작하고 actionup이 발생되지 않아 setCheck하는 로직을
		//actionUpState에서 actionClickState로 이동
		//1. 모바일기기(안드로이드 ios)에서 두손가락으로 버튼 클릭시
		//2. ios 13 이상에서 버튼의 바깥영역이지만 아주 가까운 부분 클릭시 클릭이벤트만 발생된다.
		thisObj.actionClickState();
		
		acomp.reportEvent(evtName, null, e);
	});
	
};

AEvent.prototype._longtab = function()
{
	var thisObj = this, acomp = this.acomp, timeout = null, startX = 0, startY = 0;
	
	acomp.bindEvent(AEvent.ACTION_DOWN, function(e)
	{
		if(!acomp.isEnable || e.touches.length > 1) return;
		
		//if((new Date().getTime() - AEvent.TOUCHTIME) < afc.CLICK_DELAY) return; 
		
		thisObj.actionDownState();

		var oe = e.changedTouches[0];
		startX = oe.clientX;
		startY = oe.clientY;
		
		if(timeout) 
		{
			clearTimeout(timeout);
			timeout = null;
		}
        
        timeout = setTimeout(function()
        {
			//롱탭 이벤트 시에는 버튼의 클릭이벤트가 발생되지 않도록 하기 위해
			thisObj.isTouchValid = false;
			
        	timeout = null;
            acomp.reportEvent('longtab', null, e);
            
        }, AEvent.LONGPRESS_TIME);
	});

	acomp.bindEvent(AEvent.ACTION_MOVE, function(e) 
	{
		var oe = e.changedTouches[0];
		if(Math.abs(oe.clientX - startX) > AEvent.TOUCHLEAVE || Math.abs(oe.clientY - startY) > AEvent.TOUCHLEAVE)
		{
			if(timeout) 
			{
				clearTimeout(timeout);
				timeout = null;
			}
			thisObj.actionCancelState();
		}
	});

	acomp.bindEvent(AEvent.ACTION_UP, function(e) 
	{
        if(timeout) 
        {
        	clearTimeout(timeout);
        	timeout = null;
        }
		
		thisObj.actionUpState();
		
		//if((new Date().getTime() - AEvent.TOUCHTIME) > afc.CLICK_DELAY) AEvent.TOUCHTIME = new Date().getTime();	
		
	});
	
	acomp.bindEvent(AEvent.ACTION_CANCEL, function(e) 
	{
		thisObj.isTouchValid = false;
		
		if(timeout) 
		{
			clearTimeout(timeout);
			timeout = null;
		}
		thisObj.actionCancelState();
	});
};

AEvent.prototype._swipe = function()
{
	var scrlManager = new ScrollManager();
	//scrlManager.setOption({moveDelay:200});
	//스와이프 이벤트 감도, 값이 작을 수록 작은 스와이프에도 이벤트가 발생한다.
	scrlManager.setOption({moveDelay:100});
	
	var isDown = false, acomp = this.acomp;
	
	acomp.bindEvent(AEvent.ACTION_DOWN, function(e)
	{
		isDown = true;
		
		if(acomp.eventStop) e.stopPropagation();
		
		//asoocool
		//이 부분을 추가하면 다른 스크롤이 발생하지 않음.
		//e.preventDefault();

		scrlManager.initScroll(e.changedTouches[0].clientX);
	});
	
	//move
	acomp.bindEvent(AEvent.ACTION_MOVE, function(e)
	{
		if(!isDown) return;
		
		if(acomp.eventStop) e.stopPropagation();
		
		scrlManager.updateScroll(e.changedTouches[0].clientX, function(move)
		{
		});
	});
	
	acomp.bindEvent(AEvent.ACTION_UP, function(e)
	{
		if(!isDown) return;
		isDown = false;
		
		if(acomp.eventStop) e.stopPropagation();
		
		scrlManager.scrollCheck(e.changedTouches[0].clientX, function(move)
		{
			var evtObj = 
			{
				direction: 'left',//next
				distance: this.totDis
			};
			
			if(this.totDis<0) 
				evtObj.direction = 'right';
		
			acomp.reportEvent('swipe', evtObj, e);
			return false;
		});
	});
};


AEvent.prototype._actionenter = function()
{
	var thisObj = this;
	this.acomp.element.addEventListener('mouseenter', function(e)
	{
		thisObj.actionEnterState();
		thisObj.acomp.reportEvent('actionenter', null, e);
	});
};

AEvent.prototype._actionleave = function()
{
	var thisObj = this;
	this.acomp.element.addEventListener('mouseleave', function(e)
	{
		thisObj.actionLeaveState();
		thisObj.acomp.reportEvent('actionleave', null, e);
	});
};

AEvent.prototype._keydown = function()
{
	this.bindKeyDown = true;
	if(!this.acomp.isDev()) theApp.addKeyEventListener('keydown', this);
};

AEvent.prototype._keyup = function()
{
	this.bindKeyUp = true;
	if(!this.acomp.isDev()) theApp.addKeyEventListener('keyup', this);
};


AEvent.prototype._load = function()
{
	var thisObj = this;
	
	this.acomp.element.addEventListener('load', function(e)
	{
		thisObj.acomp.reportEvent('load', this.src, e);	
	});
};

AEvent.prototype.onKeyDown = function(e)
{
	let focusComp = AComponent.getFocusComp()
	if(focusComp && this.acomp.element.contains(focusComp.element))
	{
		this.acomp.reportEvent('keydown', null, e)
	}

	//if(this.acomp===AComponent.getFocusComp())
	//	this.acomp.reportEvent('keydown', null, e);
};

AEvent.prototype.onKeyUp = function(e)
{
	let focusComp = AComponent.getFocusComp()
	if(focusComp && this.acomp.element.contains(focusComp.element))
	{
		this.acomp.reportEvent('keyup', null, e)
	}

	//if(this.acomp===AComponent.getFocusComp())
	//	this.acomp.reportEvent('keyup', null, e);
};


;
/**
 * @author asoocool
 */

class AViewEvent extends AEvent
{
	constructor(acomp)
	{
		super(acomp);
		
		this.bScrollBind = false;
	}
}
window.AViewEvent = AViewEvent;



//['click', 'dblclick', 'swipe', 'longtab', 'scroll', 'scrollleft', 'scrollright', 'scrolltop', 'scrollbottom' ]

//---------------------------------------------------------------------------------------------------
//	Component Event Functions

AViewEvent.prototype.click = function()
{
	this._click();
};

AViewEvent.prototype.dblclick = function()
{
	this._dblclick();
};

AViewEvent.prototype.swipe = function()
{
	this._swipe();
};

AViewEvent.prototype.longtab = function()
{
	this._longtab();
};

AViewEvent.prototype.scroll = function()
{
	this._scroll();
};

AViewEvent.prototype.scrollleft = function()
{
	this._scroll();
};

AViewEvent.prototype.scrollright = function()
{
	this._scroll();
};

AViewEvent.prototype.scrolltop = function()
{
	this._scroll();
};

AViewEvent.prototype.scrollbottom = function()
{
	this._scroll();
};

//---------------------------------------------------------------------------------------------------

AViewEvent.prototype._scroll = function()
{
	if(this.bScrollBind) return;
	this.bScrollBind = true;
	
	var aview = this.acomp, lastTop = aview.element.scrollTop, lastLeft = aview.element.scrollLeft;
	
	aview.element.addEventListener('scroll', function(e)
	{
		//scrollTo 함수 호출과 같이 임의로 스크롤을 발생시킨 경우 이벤트가 발생되지 않게 하려면 셋팅
		if(aview.ignoreScrollEvent)
		{
			aview.ignoreScrollEvent = false;
			return;
		}
	
		//---------------------------------
		//	가로 세로 이벤트를 구분하기 위해
				
		//horizontal
		if(lastLeft!=this.scrollLeft)
		{
			//스크롤 방향
			this.vert = false;
			
			aview.reportEvent('scroll', this, e);
			
			var rightVal = this.scrollWidth - this.clientWidth - this.scrollLeft;
		
			if(rightVal < 1) 	//안드로이드인 경우 0.398472 와 같이 소수점이 나올 수 있다.
			{
				//ios 는 overscrolling 때문에 음수값이 여러번 발생한다.
				//이미 scroll bottom 이벤트가 발생했으므로 overscrolling 에 대해서는 무시한다.
				if(afc.isIos && (this.scrollWidth-this.clientWidth-lastLeft) < 1) return;
			
				if(aview._scrollRightManage())
					aview.reportEvent('scrollright', this, e);
			}
			else if(this.scrollLeft < 1)
			{
				if(afc.isIos && lastLeft < 1) return;
				
				if(aview._scrollLeftManage())
					aview.reportEvent('scrollleft', this, e);
			}
			
			lastLeft = this.scrollLeft;
		}
		
		//vertical
		if(lastTop!=this.scrollTop)
		{
			//스크롤 방향
			this.vert = true;
		
			aview.reportEvent('scroll', this, e);
			
			var bottomVal = this.scrollHeight - this.clientHeight - this.scrollTop;
		
			if(bottomVal < 1)	
	        {
				if(afc.isIos && (this.scrollHeight-this.clientHeight-lastTop) < 1) return;
				
	        	if(aview._scrollBottomManage())
					aview.reportEvent('scrollbottom', this, e);
	        }
	        else if(this.scrollTop < 1)
	        {
				if(afc.isIos && lastTop < 1) return;
				
	        	if(aview._scrollTopManage())
					aview.reportEvent('scrolltop', this, e);
	        }
			
			lastTop = this.scrollTop;
		}
	});
};

;
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

	// 'YYYY-MM-DD HH:mm:ss' (KST)
	function datetime(dateStr)
	{
		if (!dateStr) return '—'
		var d = _toKST(dateStr)
		return d.getUTCFullYear() + '-' + _pad(d.getUTCMonth() + 1) + '-' + _pad(d.getUTCDate())
			+ ' ' + _pad(d.getUTCHours()) + ':' + _pad(d.getUTCMinutes()) + ':' + _pad(d.getUTCSeconds())
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

	return { date: date, datetime: datetime, timeAgo: timeAgo }
})()

;/**
 * SupabaseManager.js
 * Supabase 클라이언트 싱글톤 관리
 * 사용: SupabaseManager.getInstance().getClient()
 */

'use strict'

SupabaseManager = class SupabaseManager
{
    constructor()
    {
        this.client = null;
        this.SUPABASE_URL = 'https://gnwpnesdjjjoevregdmo.supabase.co';
        this.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdud3BuZXNkampqb2V2cmVnZG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4Mzc0NTYsImV4cCI6MjA5NzQxMzQ1Nn0.dDgFtamVvsY63ubxByE3s8JGC0dFwrPTbfVJZSRxIKs';
    }

    static getInstance()
    {
        if (!SupabaseManager._instance) {
            SupabaseManager._instance = new SupabaseManager();
            SupabaseManager._instance._init();
        }
        return SupabaseManager._instance;
    }

    _init()
    {
        this.client = supabase.createClient(this.SUPABASE_URL, this.SUPABASE_KEY);
        // ※ onAuthStateChange는 ErrorHandler에서 등록 — 여기서 중복 등록 금지
    }

    getClient()
    {
        return this.client;
    }

    async getUser()
    {
        const { data: { user } } = await this.client.auth.getUser();
        return user;
    }

    async signUpWithEmail(email, password, metadata)
    {
        var options = metadata ? { data: metadata } : undefined;
        const { data, error } = await this.client.auth.signUp({ email, password, options });
        return { data, error };
    }

    async uploadAvatar(userId, file)
    {
        var ext  = file.name.split('.').pop().toLowerCase();
        var path = userId + '/avatar.' + ext;

        // upsert: true → 같은 경로 파일 덮어쓰기
        const { error: uploadError } = await this.client.storage
            .from('avatars')
            .upload(path, file, { upsert: true, contentType: file.type });

        if (uploadError) return { url: null, error: uploadError };

        const { data } = this.client.storage
            .from('avatars')
            .getPublicUrl(path);

        return { url: data.publicUrl, error: null };
    }

    async signInWithEmail(email, password)
    {
        const { data, error } = await this.client.auth.signInWithPassword({ email, password });
        return { data, error };
    }

    _getRedirectUrl()
    {
        var href = window.location.href
        return href.split('#')[0].split('?')[0]
    }

    async _signInWithOAuth(provider)
    {
        if (window.location.protocol === 'file:')
            return { message: 'OAuth는 HTTP 서버 환경에서만 동작합니다.' }

        var { error } = await this.client.auth.signInWithOAuth({
            provider: provider,
            options:  { redirectTo: this._getRedirectUrl() }
        })
        return error
    }

    async signInWithGoogle() { return this._signInWithOAuth('google') }
    async signInWithKakao()  { return this._signInWithOAuth('kakao')  }

    // OAuth 로그인 후 public.users row 보장
    // 트리거가 미발동한 경우(identity link 등)를 코드에서 보완
    async ensureUserProfile(authUser)
    {
        if (!authUser) return { error: { message: '유저 정보 없음' } }

        // 이미 존재하는지 확인
        var { data: existing } = await this.client
            .from('users')
            .select('id, gender, birth_date, display_name')
            .eq('id', authUser.id)
            .single()

        if (existing) return { data: existing, created: false }

        // 없으면 메타데이터에서 추출하여 INSERT
        var meta        = authUser.user_metadata || {}
        var displayName = meta.full_name || meta.name || meta.preferred_username || authUser.email?.split('@')[0] || 'user'
        var avatarUrl   = meta.avatar_url || meta.picture || null
        var provider    = authUser.app_metadata?.provider || 'email'
        var email       = authUser.email || ''
        var username    = 'user_' + authUser.id.substr(0, 8)

        var { data, error } = await this.client
            .from('users')
            .insert({
                id:            authUser.id,
                email:         email,
                username:      username,
                display_name:  displayName,
                avatar_url:    avatarUrl,
                auth_provider: provider
            })
            .select('id, gender, birth_date, display_name')
            .single()

        return { data, error, created: true }
    }

    async signOut()
    {
        const { error } = await this.client.auth.signOut();
        return error;
    }
}

SupabaseManager._instance = null;
;/**
 * ToastManager.js
 * 토스트 알림 유틸리티
 * 사용: ToastManager.success('메시지') / ToastManager.error('메시지')
 */

ToastManager = class ToastManager
{
    static show(message, type, duration)
    {
        if (!type) type = 'info';
        if (!duration) duration = 3000;

        var container = document.querySelector('.ac-toast-container');
        if (!container)
        {
            container = document.createElement('div');
            container.className = 'ac-toast-container';
            document.body.appendChild(container);
        }

        var toast = document.createElement('div');
        toast.className = 'ac-toast ' + type;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(function()
        {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, duration);
    }

    static success(msg) { ToastManager.show(msg, 'success'); }
    static error(msg)   { ToastManager.show(msg, 'error'); }
    static info(msg)    { ToastManager.show(msg, 'info'); }
    static warning(msg) { ToastManager.show(msg, 'warning'); }
}

;
ErrorHandler = class ErrorHandler
{
	static init()
	{
		ErrorHandler._setupGlobalErrors()
		ErrorHandler._setupNetworkDetection()
		ErrorHandler._setupAuthExpiry()
	}

	// ─────────────────────────────────────────
	// 전역 JS 에러
	// ─────────────────────────────────────────

	static _setupGlobalErrors()
	{
		// 동기 런타임 에러
		window.onerror = function(message, source, lineno, colno, error)
		{
			// SpiderGen 프레임워크 내부 에러만 무시
			if (source && source.indexOf('/afc/') !== -1) return false

			console.error('[GlobalError]', message, 'at', source, lineno + ':' + colno)
			return false
		}

		// 비동기 Promise 에러
		window.onunhandledrejection = function(e)
		{
			var reason = e.reason
			var msg    = reason instanceof Error ? reason.message : String(reason)

			// Supabase 인증 만료는 _setupAuthExpiry에서 처리
			if (msg && msg.indexOf('JWT') !== -1) return
			if (msg && msg.indexOf('token') !== -1) return

			console.error('[UnhandledPromise]', reason)
		}
	}

	// ─────────────────────────────────────────
	// 네트워크 감지
	// ─────────────────────────────────────────

	static _setupNetworkDetection()
	{
		window.addEventListener('offline', function()
		{
			ToastManager.warning('네트워크 연결이 끊겼습니다')
			ErrorHandler._showNetworkBanner()
		})

		window.addEventListener('online', function()
		{
			ToastManager.success('네트워크가 복구되었습니다')
			ErrorHandler._hideNetworkBanner()
		})
	}

	static _showNetworkBanner()
	{
		ErrorHandler._hideNetworkBanner()

		var banner = document.createElement('div')
		banner.id  = 'ac-network-banner'
		banner.style.cssText =
			'position:fixed;top:0;left:0;right:0;z-index:9999;' +
			'background:#FF6584;color:#fff;text-align:center;' +
			'padding:8px 16px;font-size:0.875rem;font-family:var(--font-body, sans-serif);' +
			'font-weight:600;letter-spacing:0.02em;'
		banner.textContent = '⚠️ 오프라인 상태입니다 — 인터넷 연결을 확인해주세요'
		document.body.appendChild(banner)
	}

	static _hideNetworkBanner()
	{
		var existing = document.getElementById('ac-network-banner')
		if (existing) existing.remove()
	}

	// ─────────────────────────────────────────
	// 세션 만료
	// ─────────────────────────────────────────

	static _setupAuthExpiry()
	{
		var sb = SupabaseManager.getInstance()

		sb.getClient().auth.onAuthStateChange(function(event, session)
		{
			if (event === 'TOKEN_REFRESHED') return

			// 세션이 만료되어 로그아웃 처리된 경우
			if (event === 'SIGNED_OUT' && ErrorHandler._wasSignedIn)
			{
				ErrorHandler._wasSignedIn = false
				ToastManager.warning('세션이 만료되었습니다. 다시 로그인해주세요')

				try
				{
					theApp.mainContainer.open('Source/Auth/AuthView.lay')
				}
				catch (e)
				{
					console.warn('[ErrorHandler] 화면 전환 실패:', e)
				}
				return
			}

			if (event === 'SIGNED_IN') ErrorHandler._wasSignedIn = true
		})
	}

	// ─────────────────────────────────────────
	// Supabase 에러 메시지 한국어 변환
	// ─────────────────────────────────────────

	static parseSupabaseError(error)
	{
		if (!error) return '알 수 없는 오류가 발생했습니다'

		var msg = (error.message || '').toLowerCase()
		var code = error.code || ''

		if (msg.indexOf('invalid login credentials') !== -1)
			return '이메일 또는 비밀번호가 올바르지 않습니다'

		if (msg.indexOf('email not confirmed') !== -1)
			return '이메일 인증이 필요합니다. 받은 편지함을 확인해주세요'

		if (msg.indexOf('user already registered') !== -1 || code === '23505')
			return '이미 가입된 이메일입니다'

		if (msg.indexOf('password') !== -1 && msg.indexOf('6') !== -1)
			return '비밀번호는 6자 이상이어야 합니다'

		if (msg.indexOf('rate limit') !== -1 || msg.indexOf('too many requests') !== -1)
			return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요'

		if (msg.indexOf('network') !== -1 || msg.indexOf('fetch') !== -1)
			return '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요'

		if (msg.indexOf('jwt expired') !== -1 || msg.indexOf('token is expired') !== -1)
			return '로그인이 만료되었습니다. 다시 로그인해주세요'

		if (msg.indexOf('permission denied') !== -1 || msg.indexOf('rls') !== -1)
			return '접근 권한이 없습니다'

		if (msg.indexOf('not found') !== -1)
			return '데이터를 찾을 수 없습니다'

		if (msg.indexOf('duplicate') !== -1)
			return '이미 존재하는 데이터입니다'

		// 원본 메시지 반환 (번역 없을 때)
		return error.message || '오류가 발생했습니다'
	}
}

ErrorHandler._wasSignedIn = false

;NavBar = class NavBar
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
		var initial = (user.email || 'U')[0].toUpperCase()
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

;
FilterBar = class FilterBar
{
	constructor(container, callbacks)
	{
		// callbacks: { onChange }
		this.el       = container
		this.callbacks = callbacks || {}
		this.aiTools  = []
		this.state    = {
			toolId: null,
			sort:   'latest',
			price:  'all',
			type:   'all'
		}
	}

	// ─────────────────────────────────────────
	// 렌더
	// ─────────────────────────────────────────

	render(aiTools)
	{
		this.aiTools = aiTools || []
		this.el.innerHTML = this._html()
		this._bindEvents()
	}

	_html()
	{
		var tabsHTML = '<button class="fb-tool-tab active" data-tool="">전체</button>'
		this.aiTools.forEach(function(t)
		{
			tabsHTML += '<button class="fb-tool-tab" data-tool="' + t.id + '">' + t.name + '</button>'
		})

		return '<div class="fb-tool-bar">' +
				'<div class="fb-tool-tabs" id="fb-tool-tabs">' + tabsHTML + '</div>' +
				'<div class="fb-sort">' +
					'<select class="fb-sort-select" id="fb-sort">' +
						'<option value="latest">최신순</option>' +
						'<option value="popular">인기순</option>' +
						'<option value="price_asc">낮은 가격순</option>' +
						'<option value="price_desc">높은 가격순</option>' +
					'</select>' +
				'</div>' +
			'</div>' +
			'<div class="fb-chip-bar">' +
				'<div class="fb-chip-group">' +
					'<span class="fb-chip-label">가격</span>' +
					'<div class="fb-chips" id="fb-price-chips">' +
						'<button class="fb-chip active" data-price="all">전체</button>' +
						'<button class="fb-chip" data-price="free">무료</button>' +
						'<button class="fb-chip" data-price="paid">유료</button>' +
					'</div>' +
				'</div>' +
				'<div class="fb-chip-group">' +
					'<span class="fb-chip-label">타입</span>' +
					'<div class="fb-chips" id="fb-type-chips">' +
						'<button class="fb-chip active" data-type="all">전체</button>' +
						'<button class="fb-chip" data-type="text">텍스트</button>' +
						'<button class="fb-chip" data-type="image">이미지</button>' +
					'</div>' +
				'</div>' +
				'<button class="fb-reset" id="fb-reset">필터 초기화</button>' +
			'</div>'
	}


	// ─────────────────────────────────────────
	// 이벤트
	// ─────────────────────────────────────────

	_bindEvents()
	{
		var self = this
		var el   = this.el

		// AI 도구 탭
		el.querySelector('#fb-tool-tabs').addEventListener('click', function(e)
		{
			var tab = e.target.closest('.fb-tool-tab')
			if (!tab) return
			el.querySelectorAll('.fb-tool-tab').forEach(function(t) { t.classList.remove('active') })
			tab.classList.add('active')
			self.state.toolId = tab.getAttribute('data-tool') || null
			self._onChange()
		})

		// 정렬
		el.querySelector('#fb-sort').addEventListener('change', function()
		{
			self.state.sort = this.value
			self._onChange()
		})

		// 가격 칩
		el.querySelector('#fb-price-chips').addEventListener('click', function(e)
		{
			var chip = e.target.closest('.fb-chip')
			if (!chip) return
			el.querySelectorAll('#fb-price-chips .fb-chip').forEach(function(c) { c.classList.remove('active') })
			chip.classList.add('active')
			self.state.price = chip.getAttribute('data-price')
			self._onChange()
		})

		// 타입 칩
		el.querySelector('#fb-type-chips').addEventListener('click', function(e)
		{
			var chip = e.target.closest('.fb-chip')
			if (!chip) return
			el.querySelectorAll('#fb-type-chips .fb-chip').forEach(function(c) { c.classList.remove('active') })
			chip.classList.add('active')
			self.state.type = chip.getAttribute('data-type')
			self._onChange()
		})

		// 초기화
		el.querySelector('#fb-reset').addEventListener('click', function()
		{
			self.reset()
		})
	}

	_onChange()
	{
		if (this.callbacks.onChange) this.callbacks.onChange()
	}

	// ─────────────────────────────────────────
	// 상태
	// ─────────────────────────────────────────

	getState() { return { toolId: this.state.toolId, sort: this.state.sort, price: this.state.price, type: this.state.type } }

	reset()
	{
		var el = this.el
		this.state = { toolId: null, sort: 'latest', price: 'all', type: 'all' }

		el.querySelectorAll('.fb-tool-tab').forEach(function(t) { t.classList.remove('active') })
		var allTab = el.querySelector('.fb-tool-tab[data-tool=""]')
		if (allTab) allTab.classList.add('active')

		el.querySelectorAll('#fb-price-chips .fb-chip').forEach(function(c) { c.classList.remove('active') })
		var priceAll = el.querySelector('[data-price="all"]')
		if (priceAll) priceAll.classList.add('active')

		el.querySelectorAll('#fb-type-chips .fb-chip').forEach(function(c) { c.classList.remove('active') })
		var typeAll = el.querySelector('[data-type="all"]')
		if (typeAll) typeAll.classList.add('active')

		el.querySelector('#fb-sort').value = 'latest'

		this._onChange()
	}
}

;
PromptGrid = class PromptGrid
{
	constructor(container, callbacks)
	{
		this.el        = container
		this.callbacks = callbacks || {}
	}

	// ─────────────────────────────────────────
	// 렌더
	// ─────────────────────────────────────────

	renderLoading()
	{
		this.el.innerHTML = '<div class="pg-loading"><div class="ac-spinner"></div></div>'
	}

	renderError()
	{
		this.el.innerHTML =
			'<div class="pg-empty">' +
				'<div class="pg-empty-icon">⚠️</div>' +
				'<div class="pg-empty-text">데이터를 불러오지 못했습니다</div>' +
			'</div>'
	}

	renderCards(prompts, keyword)
	{
		if (!prompts.length)
		{
			var msg = keyword
				? '"' + keyword + '" 검색 결과가 없습니다'
				: '등록된 프롬프트가 없습니다'
			this.el.innerHTML =
				'<div class="pg-empty">' +
					'<div class="pg-empty-icon">🔍</div>' +
					'<div class="pg-empty-text">' + msg + '</div>' +
				'</div>'
			return
		}

		var self   = this
		var header = ''
		if (keyword)
			header = '<div class="pg-result-header"><strong>"' + keyword + '"</strong> 검색 결과 ' + prompts.length + '개</div>'

		this.el.innerHTML = header + '<div class="pg-grid">' +
			prompts.map(function(p) { return self._cardHTML(p) }).join('') +
		'</div>'

		this.el.querySelectorAll('.ac-prompt-card').forEach(function(card)
		{
			card.addEventListener('click', function()
			{
				if (self.callbacks.onCardClick) self.callbacks.onCardClick(card.getAttribute('data-id'))
			})
		})
	}

	_cardHTML(p)
	{
		var isImage   = p.prompt_type === 'image'
		var toolName  = p.ai_tools ? p.ai_tools.name : ''
		var toolBadge = toolName ? '<span class="ac-badge ac-badge-accent">' + toolName + '</span>' : ''
		var typeBadge = '<span class="ac-badge ac-badge-dim">' + (isImage ? '이미지' : '텍스트') + '</span>'
		var isFree    = Number(p.price) === 0
		var price     = isFree
			? '<span class="ac-prompt-card-price free">무료</span>'
			: '<span class="ac-prompt-card-price">' + Number(p.price).toLocaleString() + '원</span>'
		var author    = p.users ? '@' + p.users.username : ''

		var thumb = p.result_image
			? '<div class="' + (isImage ? 'pg-thumb-image' : 'pg-thumb-text') + '" style="padding:0;overflow:hidden;">' +
				'<img src="' + p.result_image + '" style="width:100%;height:100%;object-fit:cover;" alt="result" loading="lazy">' +
			  '</div>'
			: '<div class="' + (isImage ? 'pg-thumb-image' : 'pg-thumb-text') + '">' +
				(isImage ? '🎨' : '✍️') +
			  '</div>'

		return '<div class="ac-prompt-card" data-id="' + p.id + '">' +
			thumb +
			'<div class="ac-prompt-card-body">' +
				'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' + toolBadge + typeBadge + '</div>' +
				'<div class="ac-prompt-card-title">' + p.title + '</div>' +
				'<div class="ac-prompt-card-desc">' + (p.description || '') + '</div>' +
				'<div class="ac-prompt-card-footer">' +
					price +
					'<span class="ac-caption" style="display:flex;align-items:center;gap:6px">' +
						'<span>♥ ' + (p.like_count || 0) + '</span>' +
						'<span>' + author + '</span>' +
					'</span>' +
				'</div>' +
			'</div>' +
		'</div>'
	}
}

;NotificationPanel = class NotificationPanel
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
				'<button id="notif-close" style="background:rgba(255,255,255,0.08);border:none;' +
					'border-radius:50%;width:30px;height:30px;cursor:pointer;color:#A0A0C0;font-size:0.9rem;">✕</button>' +
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
		var result = await this.sb.getClient()
			.from('notifications')
			.select('id', { count: 'exact', head: true })
			.eq('is_read', false)
		return result.count || 0
	}

	// -----------------------------------------
	// 알림 로드
	// -----------------------------------------

	async _loadNotifications()
	{
		var result = await this.sb.getClient()
			.from('notifications')
			.select('id, type, title, body, prompt_id, is_read, created_at')
			.order('created_at', { ascending: false })
			.limit(50)

		var listEl = document.getElementById('notif-list')
		if (!listEl) return

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
					' style="padding:14px 20px;cursor:pointer;border-bottom:1px solid #1E1E32;transition:background 150ms ease;' +
					(isUnread ? 'background:rgba(108,99,255,0.06);' : '') + '">' +
					'<div style="display:flex;gap:12px;align-items:flex-start;">' +
						'<div style="width:36px;height:36px;border-radius:50%;background:' + self._typeColor(n.type) + ';' +
							'display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">' +
							icon +
						'</div>' +
						'<div style="flex:1;min-width:0;">' +
							'<div class="notif-title-text" style="font-size:0.875rem;font-weight:' + (isUnread ? '600' : '400') + ';color:' + (isUnread ? '#F0F0FF' : '#B0B0D0') + ';line-height:1.4;margin-bottom:4px;">' +
								n.title +
							'</div>' +
							(n.body ? '<div style="font-size:0.775rem;color:#6B6B8A;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">' + n.body + '</div>' : '') +
							'<div style="font-size:0.725rem;color:#4A4A6A;margin-top:6px;">' + timeText + '</div>' +
						'</div>' +
						'<div class="notif-dot" style="' + (isUnread ? '' : 'display:none;') + 'width:7px;height:7px;border-radius:50%;background:#6C63FF;flex-shrink:0;margin-top:5px;"></div>' +
					'</div>' +
				'</div>'
		})

		listEl.innerHTML = html

		listEl.querySelectorAll('.notif-item').forEach(function(item)
		{
			item.addEventListener('click', function() { self._onItemClick(item) })
			item.addEventListener('mouseenter', function()
			{
				item.style.background = 'rgba(108,99,255,0.1)'
			})
			item.addEventListener('mouseleave', function()
			{
				item.style.background = item.getAttribute('data-read') === '0'
					? 'rgba(108,99,255,0.06)'
					: ''
			})
		})
	}

	// -----------------------------------------
	// 아이템 클릭 (개별 읽음 처리)
	// -----------------------------------------

	_onItemClick(item)
	{
		var type     = item.getAttribute('data-type')
		var promptId = item.getAttribute('data-prompt')
		var body     = decodeURIComponent(item.getAttribute('data-body') || '')
		var isUnread = item.getAttribute('data-read') === '0'

		if (isUnread)
		{
			var notifId = item.getAttribute('data-id')
			this._markOneRead(notifId)

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
					(body || '사유가 기록되지 않았습니다.') +
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
		await this.sb.getClient()
			.from('notifications')
			.update({ is_read: true })
			.eq('id', notifId)
	}

	_typeIcon(type)
	{
		var map = {
			prompt_approved:    '✅',
			prompt_rejected:    '❌',
			prompt_liked:       '❤️',
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
			purchase_completed: 'rgba(255,200,50,0.2)',
			system:             'rgba(100,180,255,0.2)'
		}
		return map[type] || 'rgba(108,99,255,0.15)'
	}
}

;
PromptService = class PromptService
{
	constructor(sb)
	{
		this.sb = sb
	}

	// -----------------------------------------
	// 프롬프트 목록 조회 (MainView용)
	// -----------------------------------------

	async list(filters)
	{
		var { toolId, price, type, sort, keyword, limit } = filters || {}

		var query = this.sb.getClient()
			.from('prompts')
			.select('id, title, description, price, prompt_type, like_count, view_count, result_image, users!user_id(username), ai_tools(name)')
			.eq('status', 'published')

		if (toolId)           query = query.eq('ai_tool_id', toolId)
		if (price === 'free') query = query.eq('price', '0')
		else if (price === 'paid') query = query.neq('price', '0')
		if (type && type !== 'all') query = query.eq('prompt_type', type)
		if (keyword) query = query.or('title.ilike.%' + keyword + '%,description.ilike.%' + keyword + '%')

		if (sort === 'popular')        query = query.order('like_count',  { ascending: false })
		else if (sort === 'price_asc') query = query.order('price',      { ascending: true  })
		else if (sort === 'price_desc') query = query.order('price',     { ascending: false })
		else                           query = query.order('created_at', { ascending: false })

		return query.limit(limit || 30)
	}

	// -----------------------------------------
	// AI 도구 목록
	// -----------------------------------------

	async getAITools()
	{
		return this.sb.getClient().from('ai_tools').select('id, name').order('name')
	}

	// -----------------------------------------
	// 프롬프트 상세
	// -----------------------------------------

	async getDetail(promptId)
	{
		return this.sb.getClient()
			.from('prompts')
			.select('id, title, description, prompt_content, prompt_type, price, difficulty, like_count, save_count, view_count, created_at, result_image, users!user_id(id, username), ai_tools(name), categories(name)')
			.eq('id', promptId)
			.single()
	}

	// -----------------------------------------
	// 사용자 상태 (좋아요, 저장, 구매 여부)
	// -----------------------------------------

	async getUserStatus(promptId, userId, price)
	{
		var sb    = this.sb.getClient()
		var isFree = Number(price) === 0

		var queries = [
			sb.from('prompt_likes').select('id').eq('prompt_id', promptId).eq('user_id', userId).maybeSingle(),
			sb.from('prompt_saves').select('id').eq('prompt_id', promptId).eq('user_id', userId).maybeSingle()
		]

		if (!isFree)
			queries.push(sb.from('orders').select('id').eq('prompt_id', promptId).eq('buyer_id', userId).eq('status', 'completed').maybeSingle())

		var results = await Promise.all(queries)

		return {
			isLiked:     !!(results[0].data),
			isSaved:     !!(results[1].data),
			isPurchased: isFree ? true : !!(results[2] && results[2].data)
		}
	}

	// -----------------------------------------
	// 좋아요 / 저장 토글
	// -----------------------------------------

	async toggleLike(promptId)
	{
		return this.sb.getClient().rpc('toggle_like', { p_prompt_id: promptId })
	}

	async toggleSave(promptId)
	{
		return this.sb.getClient().rpc('toggle_save', { p_prompt_id: promptId })
	}

	// -----------------------------------------
	// 조회수 증가
	// -----------------------------------------

	incrementView(promptId)
	{
		this.sb.getClient().rpc('increment_view', { p_prompt_id: promptId })
	}

	// -----------------------------------------
	// 구매
	// -----------------------------------------

	async purchase(promptId, buyerId, amount)
	{
		return this.sb.getClient()
			.from('orders')
			.insert({
				buyer_id:  buyerId,
				prompt_id: promptId,
				amount:    Number(amount),
				status:    'completed'
			})
	}

	// -----------------------------------------
	// 프롬프트 등록
	// -----------------------------------------

	async create(data)
	{
		return this.sb.getClient().from('prompts').insert(data).select('id').single()
	}

	async updateResultImage(promptId, imageUrl)
	{
		return this.sb.getClient()
			.from('prompts')
			.update({ result_image: imageUrl })
			.eq('id', promptId)
	}

	async uploadResultImage(promptId, file)
	{
		var ext  = file.name.split('.').pop().toLowerCase() || 'jpg'
		var path = promptId + '/' + Date.now() + '.' + ext
		var upload = await this.sb.getClient().storage.from('prompt-results').upload(path, file, { upsert: true })
		if (upload.error) return { error: upload.error, url: null }
		var url = this.sb.getClient().storage.from('prompt-results').getPublicUrl(path).data.publicUrl
		return { error: null, url }
	}

	// -----------------------------------------
	// 관리자: 프롬프트 목록
	// -----------------------------------------

	async adminList(status, page, pageSize)
	{
		var from = page * pageSize
		var to   = from + pageSize - 1

		return this.sb.getClient()
			.from('prompts')
			.select(
				'id, title, description, prompt_content, price, prompt_type, status, ' +
				'rejection_reason, created_at, result_image, ' +
				'users!user_id(id, display_name, email, username), ai_tools(name)',
				{ count: 'exact' }
			)
			.eq('status', status)
			.order('created_at', { ascending: false })
			.range(from, to)
	}

	// -----------------------------------------
	// 관리자: 승인 / 반려
	// -----------------------------------------

	async approve(promptId, reviewerId)
	{
		return this.sb.getClient()
			.from('prompts')
			.update({
				status:           'published',
				rejection_reason: null,
				reviewed_at:      new Date().toISOString(),
				reviewed_by:      reviewerId
			})
			.eq('id', promptId)
	}

	async reject(promptId, reviewerId, reason)
	{
		return this.sb.getClient()
			.from('prompts')
			.update({
				status:           'rejected',
				rejection_reason: reason,
				reviewed_at:      new Date().toISOString(),
				reviewed_by:      reviewerId
			})
			.eq('id', promptId)
	}

	// -----------------------------------------
	// 알림 전송
	// -----------------------------------------

	async sendNotification(promptId, type, reason)
	{
		var ref = await this.sb.getClient()
			.from('prompts')
			.select('user_id, title')
			.eq('id', promptId)
			.single()

		var prompt = ref.data
		if (!prompt) return

		var isApproved = type === 'prompt_approved'
		var title      = isApproved ? '프롬프트가 승인되었습니다' : '프롬프트가 반려되었습니다'
		var body       = isApproved
			? '등록하신 "' + prompt.title + '" 프롬프트가 검수를 통과하여 게시되었습니다.'
			: '등록하신 "' + prompt.title + '" 프롬프트가 반려되었습니다.\n사유: ' + (reason || '')

		return this.sb.getClient()
			.from('notifications')
			.insert({
				user_id:   prompt.user_id,
				type:      type,
				title:     title,
				body:      body,
				prompt_id: promptId
			})
	}

	// -----------------------------------------
	// 카테고리 목록
	// -----------------------------------------

	async getCategories()
	{
		return this.sb.getClient().from('categories').select('id, name').order('name')
	}
}

;UserService = class UserService
{
	constructor(sb)
	{
		this.sb = sb
	}

	// -----------------------------------------
	// 프로필 조회
	// -----------------------------------------

	async getProfile(userId)
	{
		return this.sb.getClient()
			.from('users')
			.select('id, display_name, username, email, role, gender, birth_date, created_at, bio, avatar_url')
			.eq('id', userId)
			.single()
	}

	// -----------------------------------------
	// 프로필 수정
	// -----------------------------------------

	async updateProfile(userId, data)
	{
		return this.sb.getClient()
			.from('users')
			.update(data)
			.eq('id', userId)
	}

	// -----------------------------------------
	// 관리자 권한 확인
	// -----------------------------------------

	async getAdminRole(userId)
	{
		return this.sb.getClient()
			.from('users')
			.select('role, display_name')
			.eq('id', userId)
			.single()
	}

	// -----------------------------------------
	// 관리자 목록
	// -----------------------------------------

	async getAdmins()
	{
		return this.sb.getClient()
			.from('users')
			.select('id, display_name, email, role, created_at')
			.in('role', ['main_admin', 'sub_admin'])
			.order('role')
	}

	// -----------------------------------------
	// 이메일로 유저 검색
	// -----------------------------------------

	async findByEmail(email)
	{
		return this.sb.getClient()
			.from('users')
			.select('id, display_name, email, role')
			.eq('email', email)
			.single()
	}

	// -----------------------------------------
	// 서브 관리자 지정 / 해제
	// -----------------------------------------

	async addSubAdmin(userId)
	{
		return this.sb.getClient()
			.from('users')
			.update({ role: 'sub_admin' })
			.eq('id', userId)
	}

	async removeSubAdmin(userId)
	{
		return this.sb.getClient()
			.from('users')
			.update({ role: 'user' })
			.eq('id', userId)
	}

	// -----------------------------------------
	// 내 프롬프트 (마이페이지)
	// -----------------------------------------

	async getUserPrompts(userId)
	{
		return this.sb.getClient()
			.from('prompts')
			.select('id, title, description, price, prompt_type, status, like_count, view_count, created_at, result_image, ai_tools(name)')
			.eq('user_id', userId)
			.neq('status', 'hidden')
			.order('created_at', { ascending: false })
	}

	// -----------------------------------------
	// 내 구매 내역 (마이페이지)
	// -----------------------------------------

	async getUserOrders(userId)
	{
		return this.sb.getClient()
			.from('orders')
			.select('id, amount, status, created_at, prompts(id, title, description, price, prompt_type, like_count, result_image, ai_tools(name))')
			.eq('buyer_id', userId)
			.eq('status', 'completed')
			.order('created_at', { ascending: false })
	}

	// -----------------------------------------
	// 저장된 프롬프트 (북마크)
	// -----------------------------------------

	async getSavedPrompts(userId)
	{
		return this.sb.getClient()
			.from('prompt_saves')
			.select('id, created_at, prompts(id, title, description, price, prompt_type, like_count, result_image, ai_tools(name))')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
	}
}

afc.scriptMap["Framework/afc/library/ARect.js"] = true;
afc.scriptMap["Framework/afc/library/AUtil.js"] = true;
afc.scriptMap["Framework/afc/library/afc.js"] = true;
afc.scriptMap["Framework/afc/library/VanillaUI.js"] = true;
afc.scriptMap["Framework/afc/library/TabKeyController.js"] = true;
afc.scriptMap["Framework/afc/library/ScrollManager.js"] = true;
afc.scriptMap["Framework/afc/library/PosUtil.js"] = true;
afc.scriptMap["Framework/afc/library/LocalizeManager.js"] = true;
afc.scriptMap["Framework/afc/component/AComponent.js"] = true;
afc.scriptMap["Framework/afc/component/ALayout.js"] = true;
afc.scriptMap["Framework/afc/component/AView.js"] = true;
afc.scriptMap["Framework/afc/component/AFloat.js"] = true;
afc.scriptMap["Framework/afc/component/AContainer.js"] = true;
afc.scriptMap["Framework/afc/component/AWindow.js"] = true;
afc.scriptMap["Framework/afc/component/APage.js"] = true;
afc.scriptMap["Framework/afc/component/AApplication.js"] = true;
afc.scriptMap["Framework/afc/component/AHTMLElement.js"] = true;
afc.scriptMap["Framework/afc/event/AEvent.js"] = true;
afc.scriptMap["Framework/afc/event/AViewEvent.js"] = true;
afc.scriptMap["Library/fmt.js"] = true;
afc.scriptMap["Library/SupabaseManager.js"] = true;
afc.scriptMap["Library/ToastManager.js"] = true;
afc.scriptMap["Library/ErrorHandler.js"] = true;
afc.scriptMap["Library/Main/NavBar.js"] = true;
afc.scriptMap["Library/Main/FilterBar.js"] = true;
afc.scriptMap["Library/Main/PromptGrid.js"] = true;
afc.scriptMap["Library/Main/NotificationPanel.js"] = true;
afc.scriptMap["Library/Services/PromptService.js"] = true;
afc.scriptMap["Library/Services/UserService.js"] = true;
