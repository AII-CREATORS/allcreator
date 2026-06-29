/**
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
