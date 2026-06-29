
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

