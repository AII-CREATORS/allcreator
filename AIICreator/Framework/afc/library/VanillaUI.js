/*
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