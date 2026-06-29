
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
