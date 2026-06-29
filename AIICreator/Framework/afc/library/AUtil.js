var AUtil = 
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

