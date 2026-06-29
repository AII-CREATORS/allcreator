/**
 * @author asoocool
 */

//-------------------------------------------------------------------
//	컴포넌트나 컨테이너를 셋팅하지 않는다.
//	순수하게 div 태그로만 분리시켜 놓는 기능
//	이후에 호출한 곳에서 태그에 컨테이너나 뷰를 셋팅하여 확장한다.
//-------------------------------------------------------------------
function ASplitter(listener, barSize)
{
	this.splitDir = 'column';
	this.targetEle = null;
	//this.$target = null;

	this.listener = listener;

	this.defSplitSize = 200;

	if(barSize==undefined || barSize==null) this.barSize = ASplitter.BAR_SIZE;
	else this.barSize = barSize;

	//스플릿 컨테이너의 position 을 static 으로 셋팅할 지
	//createSplit 호출 시 sizeArr 사이즈 정보 배열을 넘기면 absolute 로 설정되고
	//-1 을 넘기면 static 으로 설정된다.
	this.isStatic = false;

	this.isSizeToRatio = false;

	this.option = {};
}

ASplitter.FRAME_TAG = '<div></div>';
//ASplitter.FRAME_TAG = '<div style="border:1px solid cyan;"></div>';
ASplitter.BAR_SIZE = 5;
ASplitter.BAR_COLOR = '#bbb';



ASplitter.prototype.setOption = function(option, noOverwrite)
{
	AUtil.optionHelper(this, option, noOverwrite);
};

ASplitter.prototype.setDefSplitSize = function(defSplitSize)
{
	this.defSplitSize = defSplitSize;
};

ASplitter.prototype.enableSizeToRatio = function(enable)
{
    this.isSizeToRatio = enable;
};

//targetEle : AContainer, AView
//row : 좌우로 분리, column : 상하로 분리
ASplitter.prototype.createSplit = function(targetEle, count, sizeArr, splitDir)
{
	this.targetEle = targetEle;

	//this.$target = $(targetEle);
    //기존 버전과의 호환을 위해
    //if(typeof jQuery != 'undefined') this.$target = $(targetEle);

	if(!count || count<1) count = 1;

	if(splitDir) this.splitDir = splitDir;

	//target Size
	var trgSize, i, frmEle, barCount = count - 1, size;


	//if(this.splitDir=='row') trgSize = this.$target.width();
	//else trgSize = this.$target.height();

	if(this.splitDir=='row') trgSize = _TinyDom.width(this.targetEle);
	else trgSize = _TinyDom.height(this.targetEle);


	//-----------------------------------------------
	//sizeArr을 지정하지 않으면 자동계산 빈 배열만 만들어 둔다.

	if(!sizeArr) sizeArr = new Array(count).fill(-1);

	//sizeArr == -1 <-- 이렇게 비교하면 sizeArr 이 [-1] 인 경우도 equal 도 판단함
	else if(sizeArr === -1)
	{
		this.isStatic = true;
		this.barSize = 0;
	}

	/*
	if(!this.isStatic)
	{
		for(i=0; i<count; i++)
		{
			size = sizeArr[i];

			//sizeArr 을 지정 안 한 경우 또는 -1 인 경우는 자동 계산(auto)
			if(size==undefined || size<0)
			{
				sizeArr[i] = undefined;	//자동 계산임을 구별하기 위해 일관된 값으로 변경
			}

			//비율 지정(0.2,0.5, 0.9 ...)인 경우 계산
			//else if(size<1) sizeArr[i] = trgSize*size;
		}
	}
	*/


	//-----------------------------------------------

	var isSplitBar, totCount = count + barCount;

	//프레임 삽입
	for(i=0; i<totCount; i++)
	{
		//-------------------------------
		//	split bar, 1,3,5 ...
		//-------------------------------
		isSplitBar = (i%2!=0);

		frmEle = document.createElement('div');

		if(!this.isStatic)
		{
			if(isSplitBar) this._eventProcess(frmEle);
			else frmEle.curSize = sizeArr[i/2];
		}

		this._insert_helper(isSplitBar, frmEle, -1, true);
	}

	this.updateSize();
};

//inx 가 음수(-1) 인 경우는 마지막 인덱스를 의미한다.
//splitSize 가 음수이면 자동 계산된다.
ASplitter.prototype.insertSplit = function(inx, splitSize, isAfter)
{
	var i, frmEle, isSplitBar, retVal;

	isAfter = isAfter ? 1 : 0;

	//프레임 삽입
	for(i=0; i<2; i++)
	{
		//inx : 음수, isAfter : true->[스플릿바/프레임], false->[프레임/스플릿바]
		//inx : 양수, isAfter : true->[프레임/스플릿바], false->[스플릿바/프레임]
		isSplitBar = inx<0 ? i!=isAfter : i==isAfter;

		frmEle = document.createElement('div');

		if(!this.isStatic)
		{
			//split bar
			if(isSplitBar) this._eventProcess(frmEle);
			else frmEle.curSize = (splitSize==undefined) ? -1 : splitSize;
		}

		if(!isSplitBar) retVal = frmEle;

		this._insert_helper(isSplitBar, frmEle, inx*2, isAfter);
	}

	this.updateSize();

	//마지막 추가된 실제 프레임 엘리먼트 리턴
	return retVal;
};

ASplitter.prototype.prependSplit = function(splitSize)
{
	return this.insertSplit(0, splitSize, false);
};

ASplitter.prototype.appendSplit = function(splitSize)
{
	return this.insertSplit(-1, splitSize, true);
};

ASplitter.prototype.removeSplit = function(inx, beforeRemove)
{
	var removeFrm, barFrm, children = this.targetEle.children;

	if(inx<0) removeFrm = children[children.length-1];
	else removeFrm = children[inx*2];

	if(inx==0) barFrm = removeFrm.nextElementSibling;
	else barFrm = removeFrm.previousElementSibling;

	if(beforeRemove) beforeRemove(removeFrm);

	removeFrm.remove();
	barFrm.remove();

	this.updateSize(true);
};

//--------------------------------------------------------------------------------------------------------
//	asoocoo test
/*
ASplitter.prototype.hideSplit = function(inx)
{
	var $removeFrm, $barFrm;

	if(inx<0) $removeFrm = this.$target.children().last();
	else $removeFrm = this.$target.children().eq(inx*2);

	if(inx==0) $barFrm = $removeFrm.next();
	else $barFrm = $removeFrm.prev();

	$removeFrm.hide();
	$barFrm.hide();

	this.setSplitSize(inx, 0);
};
*/

ASplitter.prototype.enableSplitBar = function(inx, enable)
{
	var bar = this.targetEle.children[inx*2+1];

	bar.moveDisable = !enable;

    if(window.DragDrop) enable ? bar._draggable.enable() : bar._draggable.disable();
	//else $(bar).draggable('option', 'disabled', !enable);
};

ASplitter.prototype.setSplitSize = function(inx, splitSize)
{
	var frmEle = this.getSplit(inx);

	frmEle.curSize = splitSize;

	this.updateSize();
};


ASplitter.prototype.getSplitSize = function(inx)
{
	var frmEle = this.getSplit(inx);

	if(this.splitDir=='row') return _TinyDom.width(frmEle);
	else return _TinyDom.height(frmEle);
};

ASplitter.prototype.getSplitDir = function()
{
	return this.splitDir;
};

//-----------------------------------------------------------------------------------------------------------



ASplitter.prototype.getSplit = function(inx)
{
	var children = this.targetEle.children;
	if(inx<0) return children[children.length-1];
	else return children[inx*2];
};

ASplitter.prototype.getSplitBar = function(inx)
{
	var children = this.targetEle.children;
	if(inx<0) return children[children.length-1];
	else return children[inx*2+1];
};

ASplitter.prototype.getSplitCount = function()
{
	return parseInt((this.targetEle.children.length+1)/2);
};

ASplitter.prototype.getBarCount = function()
{
	return (this.getSplitCount()-1);
};

ASplitter.prototype.removeAllSplit = function()
{
	while(this.targetEle.firstChild) this.targetEle.removeChild(this.targetEle.firstChild);
};

ASplitter.prototype.sizeToRatio = function()
{
	var trgSize, i, curSize, splitEle = this.targetEle.children,
        count = splitEle.length,
        isRow = (this.splitDir=='row');

	if(isRow) trgSize = _TinyDom.width(this.targetEle);
    else trgSize = _TinyDom.height(this.targetEle);

	for(i=0; i<count; i+=2)
	{
        if(isRow) curSize = _TinyDom.width(splitEle[i])/trgSize;
        else curSize = _TinyDom.height(splitEle[i])/trgSize;

        splitEle[i].curSize = curSize;
	}
};

//현재 셋팅되어져 있는 사이즈 정보를 분할된 모든 프레임에 다시 적용한다.
ASplitter.prototype.updateSize = function(isRemove)
{
	if(this.isStatic) return;

	var trgSize, sumColSize = 0, autoCount = 0, autoSize = 0, i, curSize,
		splitEle = this.targetEle.children, barCount, isBarHide,
		count = splitEle.length;

	if(this.splitDir=='row') trgSize = _TinyDom.width(this.targetEle);
	else trgSize = _TinyDom.height(this.targetEle);


	//프레임이 삭제되어 업데이트 하는 경우 첫번째 프레임을 오토 사이즈로 지정한다.
	//asoocool test
	//if(isRemove && count>0) splitEle[0].curSize = undefined;

	//-----------------------------------------------

	barCount = this.getBarCount();

	for(i=0; i<count; i+=2)
	{
		curSize = splitEle[i].curSize;

		//size 가 음수인 경우는 자동 계산(auto)
		if(curSize<0)
		{
			isBarHide = false;
			autoCount++;
		}

		else
		{
			//0.5, 0.1 ... 비율
			if(curSize<=1) curSize *= trgSize;

			isBarHide = (curSize==0);

			//splitFrame 사이즈가 0 이면 하나의 barSize 공간이 숨겨지므로
			if(isBarHide) barCount--;

			sumColSize += curSize;
		}

		//console.log(i + ':' + count);

		//마지막이 아니면 다음 스플릇바를 숨긴다.
		if(i < count-1) splitEle[i+1].hideBar = isBarHide;

		//마지막 프레임이면 바로 이전 스플릿바를 숨기고
		else if(count>1) splitEle[i-1].hideBar = isBarHide;
	}

	if(autoCount>0)
		autoSize = parseInt( (trgSize - this.barSize*barCount - sumColSize)/autoCount );

	var frmEle, offset = 0, addSize = 0, isSplitBar;

	for(i=0; i<count; i++)
	{
		//-------------------------------
		//	split bar, 1,3,5 ...
		//-------------------------------
		isSplitBar = (i%2!=0);

		frmEle = splitEle[i];

		if(isSplitBar)
		{
			//스플릿 프레임의 사이즈가 0 보다 큰 경우만 스플릿바가 보여지도록

			if(frmEle.hideBar) addSize = 0;
			else addSize = this.barSize;

			frmEle.curPos = offset;
		}
		else
		{
			curSize = frmEle.curSize;

            //음수인 경우 autoSize 셋팅
            if(curSize<0)
            {
                addSize = autoSize;
            }
            else
            {
                if(curSize<=1) curSize *= trgSize;

                addSize = curSize;
            }
		}

		if(this.splitDir=='row')
		{
			Object.assign(frmEle.style,
			{
				'left': offset+'px',
				'width': addSize+'px',
			});
		}
		else
		{
			Object.assign(frmEle.style,
			{
				'top': offset+'px',
				'height': addSize+'px'
			});
		}

		offset += addSize;

		if(!isSplitBar && this.listener) this.listener.onSplitChanged(frmEle);
	}
};

//inx : 스플릿바를 포함한 전체 개수를 기준으로 한 index
//inx 가 0보다 작으면 마지막 원소이다.
ASplitter.prototype._insert_helper = function(isSplitBar, frmEle, inx, isAfter)
{
	if(!this.isStatic)
	{
		if(this.splitDir=='row')
		{
			Object.assign(frmEle.style,
			{
				'position': 'absolute',
				'top': '0px',
				'height': '100%'
			});
		}
		else
		{
			Object.assign(frmEle.style,
			{
				'position': 'absolute',
				'left': '0px',
				'width': '100%',
			});
		}

		//add split bar
		if(isSplitBar)
		{
			Object.assign(frmEle.style,
			{
				'background-color': ASplitter.BAR_COLOR,
				'z-index': 1
			});
		}
		else
		{
			frmEle.style.zIndex = 0;
		}
	}


	//----------------------------------------------
	var children = this.targetEle.children;
	var posEle = null;

	if(inx<0) posEle = children.length > 0 ? children[children.length-1] : null;
	else posEle = children.length > inx ? children[inx] : null;

	if(posEle)
	{
		if(isAfter) posEle.after(frmEle);
		else posEle.before(frmEle);
	}
	else this.targetEle.appendChild(frmEle);
};

ASplitter.prototype._eventProcess = function(splitBar)
{
	var thisObj = this;

	if(this.splitDir=='row')
	{
        if(window.DragDrop)
        {
            splitBar.enableDrag(
            {
                axis: 'x',
                containment: "parent",
                cursor: "e-resize",
                helper: "clone",
                //areaEle: this.targetEle,

                onStop: function( { draggable } )
                {
                    const { left } = draggable.helperRect(); // page 기준
                    const parent = thisObj.targetEle.getBoundingClientRect();

					//pageX to offsetX
                    thisObj._moveSplitBar(draggable.el, left-parent.left);
                },

                onDrag: function( { draggable } )
                {
                    if(thisObj.option.isAutoFolding)
                    {
                        return thisObj._autoFoldingManage(splitBar, draggable, 'left', 'width', 250);
                    }
                }
            });

        }
        //else
        //{
        //    $splitBar.draggable(
        //    {
        //        axis: 'x',
        //        containment: "parent",
        //        cursor: "e-resize",
        //        helper: "clone",
        //        areaEle: this.targetEle,
        //
        //        stop: function( event, ui )
        //        {
        //            thisObj._moveSplitBar(this, ui.position.left);
        //        },
        //
        //        drag: function( event, ui )
        //        {
        //            if(thisObj.option.isAutoFolding)
        //                return thisObj._autoFoldingManage(splitBar, ui, 'left', 'width', 250);
        //        }
        //    });
        //}

		splitBar.addEventListener('mouseenter', function()
		{
			if(!this.moveDisable) this.style.cursor = 'e-resize';
		});
	}
	else
	{
        if(window.DragDrop)
        {
            splitBar.enableDrag(
            {
                axis: 'y',
                containment: "parent",
                cursor: "s-resize",
                helper: 'clone',
                //areaEle: this.targetEle,

                onStop: function( {draggable} )
                {
                    //thisObj._moveSplitBar(this, ui.position.top);

                    const { top } = draggable.helperRect(); // page 기준
                    const parent = thisObj.targetEle.getBoundingClientRect();

                    thisObj._moveSplitBar(draggable.el, top-parent.top);
                },

                onDrag: function( {draggable} )
                {
                    if(thisObj.option.isAutoFolding)
                    {
                        return thisObj._autoFoldingManage(splitBar, draggable, 'top', 'height', 250);
                    }
                }
            });

        }
        //else
        //{
        //    $splitBar.draggable(
        //    {
        //        axis: 'y',
        //        containment: "parent",
        //        cursor: "s-resize",
        //        helper: "clone",
        //        areaEle: this.targetEle,
        //
        //        stop: function( event, ui )
        //        {
        //            //console.log(ui.position.top)
        //            thisObj._moveSplitBar(this, ui.position.top);
        //        },
        //
        //        drag: function( event, ui )
        //        {
        //            if(thisObj.option.isAutoFolding)
        //                return thisObj._autoFoldingManage(splitBar, ui, 'top', 'height', 250);
        //        }
        //    });
        //
        //}

		splitBar.addEventListener('mouseenter', function()
		{
			if(!this.moveDisable) this.style.cursor = 's-resize';
		});
	}
};

ASplitter.prototype._autoFoldingManage = function(bar, ui, posKey, sizeKey, openSize)
{
    if(window.DragDrop) return this._autoFoldingManage2(bar, ui, posKey, sizeKey, openSize)
    //else return this._autoFoldingManage1(bar, ui, posKey, sizeKey, openSize)
};

//ASplitter.prototype._autoFoldingManage1 = function(bar, ui, posKey, sizeKey, openSize)
//{
//	//0 이나 1 로 하게 되면 비율로 인식하게 된다.
//	var min = 2, max = _TinyDom[sizeKey](this.targetEle) - this.barSize - 2;
//
//	//자동 펼침
//	if(ui.position[posKey] > min && ui.position[posKey]< min+70)
//	{
//		if(ui.position[posKey] > min+50)
//		{
//			ui.position[posKey] = openSize;
//			bar.classList.remove('splitter_bar_folding');
//			return false;
//		}
//	}
//	//자동 숨김
//	else if(ui.position[posKey] < 150)
//	{
//		ui.position[posKey] = min;
//		bar.classList.add('splitter_bar_folding');
//		return false;
//	}
//
//	//오른쪽 자동 펼침
//	else if(ui.position[posKey] < max && ui.position[posKey] > max-70)
//	{
//		if(ui.position[posKey] < max-50)
//		{
//			ui.position[posKey] = max - openSize;
//			bar.classList.remove('splitter_bar_folding');
//			return false;
//		}
//	}
//
//	//오른쪽 자동 숨김
//	else if(ui.position[posKey] > max-150)
//	{
//		ui.position[posKey] = max;
//		bar.classList.add('splitter_bar_folding');
//		return false;
//	}
//};

//차후 return false 인 경우, 드래그 중단하고 el 포지션으로 셋팅하기 ==> _autoFoldingManage1 처럼
ASplitter.prototype._autoFoldingManage2 = function(bar, draggable, posKey, sizeKey, openSize)
{
	//0 이나 1 로 하게 되면 비율로 인식하게 된다.
	var min = 2, max = _TinyDom[sizeKey](this.targetEle) - this.barSize - 2;

    const ui = { position: draggable.helperRect() }
    const prt = draggable.el.offsetParent.getBoundingClientRect()

    //pageX to offsetX
    ui.position[posKey] -= prt[posKey];

	//자동 펼침
	if(ui.position[posKey] > min && ui.position[posKey]< min+70)
	{
		if(ui.position[posKey] > min+50)
		{
			ui.position[posKey] = openSize;

            draggable.setVisualPosition(ui.position.left, ui.position.top)
			bar.classList.remove('splitter_bar_folding');
			return false;
		}
	}
	//자동 숨김
	else if(ui.position[posKey] < 150)
	{
		ui.position[posKey] = min;

        draggable.setVisualPosition(ui.position.left, ui.position.top)
		bar.classList.add('splitter_bar_folding');
		return false;
	}

	//오른쪽 자동 펼침
	else if(ui.position[posKey] < max && ui.position[posKey] > max-70)
	{
		if(ui.position[posKey] < max-50)
		{
			ui.position[posKey] = max - openSize;

            draggable.setVisualPosition(ui.position.left, ui.position.top)
			bar.classList.remove('splitter_bar_folding');
			return false;
		}
	}

	//오른쪽 자동 숨김
	else if(ui.position[posKey] > max-150)
	{
		ui.position[posKey] = max;

        draggable.setVisualPosition(ui.position.left, ui.position.top)
		bar.classList.add('splitter_bar_folding');
		return false;
	}
};

ASplitter.prototype._moveSplitBar = function(splitBar, newPos)
{
	var moveSize = newPos - splitBar.curPos, prevSize, nextSize,
		prev = splitBar.previousElementSibling,
		next = splitBar.nextElementSibling;

	if(this.splitDir=='row')
	{
		prevSize = _TinyDom.width(prev) + moveSize;
		prev.style.width = prevSize+'px';

		splitBar.style.left = newPos+'px';

		nextSize = _TinyDom.width(next) - moveSize;
		Object.assign(next.style,
		{
			left: (newPos+this.barSize)+'px',
			width: nextSize+'px'
		});
	}
	else
	{
		prevSize = _TinyDom.height(prev) + moveSize;
		prev.style.height = prevSize+'px';

		splitBar.style.top = newPos+'px';

		nextSize = _TinyDom.height(next) - moveSize;
		Object.assign(next.style,
		{
			top: (newPos+this.barSize)+'px',
			height: nextSize+'px'
		});
	}

	splitBar.curPos = newPos;

	if(prev.curSize>1) prev.curSize = prevSize;
	if(next.curSize>1) next.curSize = nextSize;

	if(this.isSizeToRatio) this.sizeToRatio();

	//리사이즈 이벤트 통보
	if(this.listener)
	{
		this.listener.onSplitChanged(prev);
		this.listener.onSplitChanged(next);
	}
};

ASplitter.prototype.changeDirection = function(setFunc, getFunc)
{
	if(!this.targetEle) return;

	var dir = this.splitDir== 'row'?'column':'row',
		cnt = this.getSplitCount(),
		sizeArr = [], split, autoCnt = 0, tmp;

	for(var i=0; i<cnt; i++)
	{
		split = this.getSplit(i);
		if(split.curSize == -1) autoCnt++;
	}

	var beforeSize = _TinyDom.width(this.targetEle);
	var afterSize = _TinyDom.height(this.targetEle);
	var size = split.offsetLeft + split.offsetWidth;

	if(dir=='row')
	{
		tmp = beforeSize;
		beforeSize = afterSize;
		afterSize = tmp;

		size = split.offsetTop + split.offsetHeight;
	}

	if(beforeSize < size) size += autoCnt * size/cnt;
	beforeSize = Math.max(beforeSize, size);

	var view = new AView(), splitView, splitIdxArr = [];
	view.init();

	for(var i=0; i<cnt; i++)
	{
		split = this.getSplit(i);
		if(split.curSize == -1) sizeArr.push(-1);
		else sizeArr.push(split.curSize/beforeSize*afterSize);

		splitView = getFunc.call(this.listener, i);
		if(splitView)
		{
			view.addComponent(splitView);
			splitIdxArr.push(i);
		}
	}

	this.removeAllSplit();
	this.createSplit(this.targetEle, cnt, sizeArr, dir);

	var children = view.getChildren();
	for(var i=0; i<children.length; i++)
	{
		setFunc.call(this.listener, splitIdxArr[i], children[i]);
	}
};
