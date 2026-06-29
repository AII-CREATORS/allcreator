


function ScrollArrow()
{
	this.scrlElement = null;
	this.checkAlready = false;
	this.scrlDir = 'vertical';//horizontal
	this.topClassName = 'scrollarrow-top';
	this.bottomClassName = 'scrollarrow-bottom';
	this.leftClassName = 'scrollarrow-left';
	this.rightClassName = 'scrollarrow-right';
}

ScrollArrow.DISAPPEAR_TIME = 2000;

ScrollArrow.prototype.setArrow = function(dir, arrow1, arrow2)
{
	this.scrlDir = dir;
	
	if(arrow1) this.arrow1 = arrow1;
	else
	{
		this.arrow1 = document.createElement('span');
		if(this.scrlDir=='vertical') this.arrow1.className = this.topClassName;
		else this.arrow1.className = this.leftClassName;

		this.makeDefaultArrow(this.arrow1);
	}

	if(arrow2) this.arrow2 = arrow2;
	else
	{
		this.arrow2 = document.createElement('span');
		if(this.scrlDir=='vertical') this.arrow2.className = this.bottomClassName;
		else this.arrow2.className = this.rightClassName;

		this.makeDefaultArrow(this.arrow2);
	}

	var cssObj =
	{
		'position': 'absolute',
		'display': 'none',
	};

	Object.assign(this.arrow1.style, cssObj);
	Object.assign(this.arrow2.style, cssObj);
};

ScrollArrow.prototype.apply = function(scrlElement)
{
	this.scrlElement = scrlElement;
	
	var thisObj = this;
	
	AEvent.bindEvent(this.scrlElement, AEvent.ACTION_DOWN, function(e)
	{
		thisObj.checkAlready = false;
/*		
		if(thisObj.fadeTimer) 
		{
			clearTimeout(thisObj.fadeTimer);
			thisObj.fadeTimer = null;
		}
*/		
	});
	
	/*
	AEvent.bindEvent(this.scrlElement, AEvent.ACTION_UP, function(e)
	{
		thisObj.autoDisappear();
	});
	*/
	
	if(this.scrlDir=='vertical') this.scrollVertProc();
	else this.scrollHoriProc();
	
	//this.autoDisappear();
};


ScrollArrow.prototype.autoDisappear = function()
{
	var thisObj = this;
	
	if(this.fadeTimer) 
	{
		clearTimeout(this.fadeTimer);
	}
	
	this.fadeTimer = setTimeout(function()
	{
		_TinyDom.hide(thisObj.arrow1);
		_TinyDom.hide(thisObj.arrow2);
		thisObj.fadeTimer = null;

	}, ScrollArrow.DISAPPEAR_TIME);

};


ScrollArrow.prototype.makeDefaultArrow = function($arrow)
{
	/*
	$arrow.css(	
	{
		'width': '20px',
		'height': '20px',
		'opacity': '0.3'
	});
	*/
};

ScrollArrow.prototype.scrollVertProc = function()
{
	var parent = this.scrlElement.parentElement;

	parent.appendChild(this.arrow1);
	parent.appendChild(this.arrow2);

	Object.assign(this.arrow1.style,
	{
		'right': '5px',	'top': '5px'
	});

	Object.assign(this.arrow2.style,
	{
		'right': '5px',	'bottom': '5px'
	});
	
	var thisObj = this;
	AEvent.bindEvent(this.scrlElement, 'scroll', function(e)
	{
		if(!thisObj.checkAlready)
		{
			thisObj.checkAlready = true;
			thisObj.visibleCheckVert();
		}
		
		//if((this.offsetHeight + this.scrollTop-1) == this.scrollHeight) thisObj.onScrollSecond();
		
		if(this.scrollHeight == this.clientHeight + this.scrollTop) thisObj.onScrollSecond();
		else if(this.scrollTop == 0) thisObj.onScrollFirst();
		
		//asoocool test
		//var ratio = this.scrollTop/(this.scrollHeight-this.clientHeight);
		//thisObj.arrow1.css('top', this.clientHeight*ratio+'px');
	});
	
	setTimeout(function()
	{
		thisObj.visibleCheckVert();
	}, 100);
};

ScrollArrow.prototype.scrollHoriProc = function()
{
	var parent = this.scrlElement.parentElement;

	parent.appendChild(this.arrow1);
	parent.appendChild(this.arrow2);

	var top = ( _TinyDom.height(parent) - _TinyDom.height(this.arrow1) ) / 2;
	Object.assign(this.arrow1.style,
	{
		'left': '0px',	'top': top+'px'
	});

	Object.assign(this.arrow2.style,
	{
		'right': '0px',	'top': top+'px'
	});
	
	var thisObj = this;
	AEvent.bindEvent(this.scrlElement, 'scroll', function(e)
	{
		if(!thisObj.checkAlready)
		{
			thisObj.checkAlready = true;
			thisObj.visibleCheckHori();
		}
		
		//if((this.offsetWidth + this.scrollLeft-1) == this.scrollWidth) thisObj.onScrollSecond();
		
		if(this.scrollWidth == this.clientWidth + this.scrollLeft) thisObj.onScrollSecond();
		else if(this.scrollLeft == 0) thisObj.onScrollFirst();
	});
	
	setTimeout(function()
	{
		thisObj.visibleCheckHori();
	}, 100);
};

ScrollArrow.prototype.onScrollFirst = function()
{
	_TinyDom.hide(this.arrow1);
	_TinyDom.show(this.arrow2);
};

ScrollArrow.prototype.onScrollSecond = function()
{
	_TinyDom.show(this.arrow1);
	_TinyDom.hide(this.arrow2);
};

//--------------
//	세로 영역
ScrollArrow.prototype.isMoreScrollTop = function()
{
	return (this.scrlElement.scrollTop > 0);
};

ScrollArrow.prototype.isMoreScrollBottom = function()
{
	//return (this.scrlElement.offsetHeight + this.scrlElement.scrollTop < this.scrlElement.scrollHeight);
	return (this.scrlElement.clientHeight + this.scrlElement.scrollTop < this.scrlElement.scrollHeight);
};

ScrollArrow.prototype.visibleCheckVert = function()
{
	if(this.isMoreScrollTop())
	{
		_TinyDom.show(this.arrow1);
		this.autoDisappear();
	}
	else _TinyDom.hide(this.arrow1);

	if(this.isMoreScrollBottom())
	{
		_TinyDom.show(this.arrow2);
		this.autoDisappear();
	}
	else _TinyDom.hide(this.arrow2);
};

//--------------
//	가로 영역
ScrollArrow.prototype.isMoreScrollLeft = function()
{
	return (this.scrlElement.scrollLeft > 0);
};

ScrollArrow.prototype.isMoreScrollRight = function()
{
	//return (this.scrlElement.offsetWidth + this.scrlElement.scrollLeft < this.scrlElement.scrollWidth);
	return (this.scrlElement.clientWidth + this.scrlElement.scrollLeft < this.scrlElement.scrollWidth);
};

ScrollArrow.prototype.visibleCheckHori = function()
{
	if(this.isMoreScrollLeft())
	{
		_TinyDom.show(this.arrow1);
		this.autoDisappear();
	}
	else _TinyDom.hide(this.arrow1);

	if(this.isMoreScrollRight())
	{
		_TinyDom.show(this.arrow2);
		this.autoDisappear();
	}
	else _TinyDom.hide(this.arrow2);
};

