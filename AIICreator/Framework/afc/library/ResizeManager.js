

ResizeManager = class ResizeManager
{
	constructor(isVertical)
	{
        this.isVertical = isVertical
        this.resizeBars = []
        this.isShowSizeInfo = true
	}

    setScaleGetter(getter)
    {
        this.getScale = getter
    }

    setResizeCallback(callback)
    {
        this.resizeCallback = callback
    }

    getScale()
    {
        return 1
    }

    showSizeInfo(isShow)
    {
        this.isShowSizeInfo = isShow
    }

    updateResizeEle(resizeEles)
    {
        this.resizeBars.forEach(function(ele)
        {
            ele.remove()
        })

        this.resizeBars = []
        this.resizeEles = resizeEles

        let thisObj = this, pos, idx,
            colLen = this.resizeEles.length, arr = new Array(colLen),
            endIdx = colLen - 1, scale = this.getScale()

        for(var i=0; i<this.resizeEles.length; i++)
        {
            var el = this.resizeEles[i];

            if(el.style.display == 'none') continue;		//앞에서 colspan 세팅했으므로 리턴
            //if(el.getAttribute('colspan') > 1) continue;	//colspan 처리시 리턴

            idx = i%colLen;

            //이미 해당 컬럼에 sizeBar를 생성한 경우 리턴, 또는 마지막 컬럼인 경우
            if(arr[idx] || idx == endIdx) continue;

            let sizeBar = document.createElement('div');
            sizeBar.className = 'dev-size-bar';
            Object.assign(sizeBar.style,
            {
                position: 'absolute',
                color: 'magenta',
                fontSize: '16px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                zIndex: 100,
            });

            if(thisObj.isVertical)
            {
                pos = _TinyDom.position(el).top/scale + _TinyDom.outerHeight(el)

                Object.assign(sizeBar.style,
                {
                    left: '0px',
                    top: pos + 'px',
                    width: '100%',
                    height: '4px',
                });
            }
            else
            {
                pos = _TinyDom.position(el).left/scale + _TinyDom.outerWidth(el)

                Object.assign(sizeBar.style,
                {
                    left: pos + 'px',
                    top: '0px',
                    width: '4px',
                    height: '100%',
                });
            }

            //리사이즈바가 헤더 안에서만 보이도록
            thisObj.cntr.appendChild(sizeBar);

            //생성된 리사이즈 바를 별도의 배열에 저장함
            thisObj.resizeBars[idx] = sizeBar;
            sizeBar._inx = idx;

            if(window.DragDrop) thisObj._resizeProcess2(sizeBar);
            //else thisObj._resizeProcess(sizeBar);

            arr[idx] = true;
        }
    }

    /*
    enableResize($cntr, $resizeEles)
    {
        if(!$cntr)
        {
            //console.log($cntr, $resizeEles)

            return
        }

        this.$cntr = $cntr

        this.updateResizeEle($resizeEles)
    };
    */
    enableResize(cntr, resizeEles)
    {
        if(!cntr)
        {
            //console.log(cntr, resizeEles)

            return
        }

        this.cntr = cntr

        this.updateResizeEle(resizeEles)
    }

    _showSizeBoth(sizeBar)
    {
        if(!this.isShowSizeInfo) return;

        let prevEle = this.resizeEles[sizeBar._inx],
            nextEle = this.resizeEles[sizeBar._inx+1]

        if(this.isVertical) sizeBar.innerHTML = `<br>${_TinyDom.outerHeight(prevEle)}px, ${_TinyDom.outerHeight(nextEle)}px`
        else sizeBar.innerHTML = `&nbsp;${_TinyDom.outerWidth(prevEle)}px, ${_TinyDom.outerWidth(nextEle)}px`
    }

    _showMoveSizeInfo(sizeBar, moveSize)
    {
        if(!this.isShowSizeInfo) return;

        let prevEle = this.resizeEles[sizeBar._inx]

        if(this.isVertical) sizeBar.innerHTML = `<br>${_TinyDom.outerHeight(prevEle)+moveSize}px`
        else sizeBar.innerHTML = `&nbsp;${_TinyDom.outerWidth(prevEle)+moveSize}px`
    }

    //_resizeProcess(sizeBar) - jQuery UI draggable fallback removed
    /*
    _resizeProcess(sizeBar)
    {
        //리사이즈 중인데 다른 resizebar 영역을 지나가면 enter 로 표시되는 버그
        let _isResizeStart = false, //리사이즈 시작여부
            thisObj = this, firstVal = 0, moveVal = 0

        sizeBar.draggable(
        {
            axis: thisObj.isVertical ? 'y' : 'x',
            containment: "parent",
            cursor: thisObj.isVertical ? "s-resize" : "e-resize",
            ...
        });
    }
    */

    _resizeProcess2(sizeBar)
    {
        //리사이즈 중인데 다른 resizebar 영역을 지나가면 enter 로 표시되는 버그
        let _isResizeStart = false, //리사이즈 시작여부
            thisObj = this, firstVal = 0, moveVal = 0

        sizeBar.enableDrag(
        {
            axis: thisObj.isVertical ? 'y' : 'x',
            containment: "parent",
            cursor: thisObj.isVertical ? "s-resize" : "e-resize",

            onStart: function({draggable})
            {
                _isResizeStart = true;
                const rt = draggable.helperRect()

                if(thisObj.isVertical)
                {
                    firstVal = rt.top
                }
                else
                {
                    firstVal = rt.left
                }
            },

            onStop: function({draggable})
            {
                _isResizeStart = false;

                Object.assign(sizeBar.style,
                {
                    //top: 0,//top 값이 변경되어 0으로 초기화처리
                    cursor: 'auto',
                    background: 'transparent'
                });

                thisObj._colculResizeWidth(sizeBar._inx, moveVal);

                //thisObj.updateBarPos();
            },

            onDrag: function({draggable})
            {
                const rt = draggable.helperRect()

                if(thisObj.isVertical)
                {
                    moveVal = parseInt((rt.top-firstVal)/thisObj.getScale())
                    thisObj._showMoveSizeInfo(sizeBar, moveVal)

                    // adjust new top by our zoomScale
                    let newTop = firstVal + moveVal
                    draggable.setVisualPosition(rt.left, newTop)
                }
                else
                {
                    moveVal = parseInt((rt.left-firstVal)/thisObj.getScale())
                    thisObj._showMoveSizeInfo(sizeBar, moveVal)

                    // adjust new left by our zoomScale
                    let newLeft = firstVal + moveVal
                    draggable.setVisualPosition(newLeft, rt.top)
                }

            }
        });

        sizeBar.addEventListener('mouseenter', function(e)
        {
            if(!_isResizeStart && e.which==0)
            {
                Object.assign(sizeBar.style,
                {
                    cursor: thisObj.isVertical ? "s-resize" : "e-resize",
                    background: 'gray'
                });

                thisObj._showSizeBoth(sizeBar)
            }
        });

        sizeBar.addEventListener('mouseleave', function(e)
        {
            //마우스가 클릭되지 않고 나간 경우만
            if(e.which==0)
            {
                Object.assign(sizeBar.style,
                {
                    cursor: 'auto',
                    background: 'transparent'
                });

                sizeBar.innerHTML = ''
            }
        });
    }

    //사이즈바가 이동한 만큼 컬럼의 사이즈를 변경해 준다.
    //단, 퍼센트로 지정한 경우는 비율을 계산해서 퍼센트로 셋팅해 준다.
    _colculResizeWidth(inx, moveVal)
    {
        let prevEle = this.resizeEles[inx]

        if(this.isVertical) moveVal += _TinyDom.outerHeight(prevEle)
        else moveVal += _TinyDom.outerWidth(prevEle)

        if(this.resizeCallback) this.resizeCallback(inx, moveVal);
    }

    //그리드의 사이즈가 변경된 경우등..
    //사이즈바의 위치 계산을 다시 해야될 경우 호출된다.
    updateBarPos()
    {
        if(!this.resizeEles) return

        let thisObj = this, pos, idx, isLastColumn = false,
            colLen = this.resizeEles.length, endIdx = colLen - 1, scale = this.getScale()

        for(var i=0; i<this.resizeEles.length; i++)
        {
            var el = this.resizeEles[i];

            if(el.style.display == 'none') continue;		//앞에서 colspan 세팅했으므로 리턴
            //if(el.getAttribute('colspan') > 1) continue;	//colspan 세팅시 리턴
            idx = i%colLen;
            isLastColumn = (idx == endIdx);

            if(isLastColumn) continue;

            if(thisObj.isVertical)
            {
                pos = _TinyDom.position(el).top/scale + _TinyDom.outerHeight(el)
                thisObj.resizeBars[idx].style.top = pos + 'px';
            }
            else
            {
                pos = _TinyDom.position(el).left/scale + _TinyDom.outerWidth(el)
                thisObj.resizeBars[idx].style.left = pos + 'px';
            }

            thisObj.resizeBars[idx]._inx = idx
        }

        //console.log('-----------------------------------------')
    }

}

