                
/**
 * @author asoocool
 * ADropBox 컴포넌트에서 사용하는 Item은 {'text':'', 'data':''} Object임
 */



class ADropBox extends AComponent
{
	constructor()
	{
		super()
	
		this.items = [];
		this.selIndex = -1;

		this.dropBoxH = ADropBox.dropBoxH;		//리스트팝업 최대 높이
		this.itemHeight = ADropBox.itemHeight;	//li 아이템 하나의 높이

		this.selectClass = 'dropbox_cellover';
		this.normalClass = 'dropbox_cell';
		this.focusClass = 'dropbox_cellfocus';

		this.textfield = null;
		this.dropBtn = null;
		this.openDir = true;	//드랍박스를 펼칠 방향 (true : 하단으로 펼침, false: 상단으로 펼침)
		this.useDropBox = true;
		this.listPopup = null;

		this.scrollArea = null;
		this.isEnableSM = false;

		this.isTabable = true;
	}

    beforeInit()
    {
        this.normalClass = this.getAttr('data-style-cell') ?? this.normalClass;
        this.selectClass = this.getAttr('data-style-cellover') ?? this.selectClass;
        this.focusClass = this.getAttr('data-style-cellfocus') ?? this.focusClass;
    }    

    _getDataStyleObj()
    {
        let ret = AComponent.prototype._getDataStyleObj.call(this);
            
        let keyArr = ['data-style-cell', 'data-style-cellover', 'data-style-cellfocus'], val;
        
        for(var i=0; i<keyArr.length; i++)
        {
            val = this.getAttr(keyArr[i]);
            ret[keyArr[i]] = val ? val : '';
        }
        
        return ret;        
    }

    _setDataStyleObj(styleObj)
    {
        for(const p in styleObj)
        {
            const value = styleObj[p]
            if(p==afc.ATTR_STYLE) this._set_class_helper(this.element, null, styleObj, p);	//바로 화면에 적용
            //attr 값만 셋팅
            else this.setAttr(p, value);
        }
    }  

	
}

window.ADropBox = ADropBox

ADropBox.CONTEXT = 
{
    tag: '<div data-base="ADropBox" data-class="ADropBox" class="ADropBox-Style">'+
            '<input type="text" class="dropbox_label" readonly="readonly"><span class="dropbox_button"></span></div>',

    defStyle: 
    {
        width:'140px', height:'22px'
    },

    //events: ['click', 'select', 'change']
	events: ['select', 'change']
};

ADropBox.inParent = false;
ADropBox.openedDropBox = null;
ADropBox.dropBoxH = 300;		//리스트팝업 최대 높이
ADropBox.itemHeight = null;		//li 아이템 하나의 높이

ADropBox.setOpenedDropBox = function(dropbox)
{
	ADropBox.openedDropBox	= dropbox;
};

ADropBox.getOpenedDropBox = function()
{
	return ADropBox.openedDropBox;
};

ADropBox.prototype.init = function(context, evtListener)
{
	AComponent.prototype.init.call(this, context, evtListener);
	
	this.textfield = this.element.children[0];
	this.dropBtn = this.element.children[1];
	
	const thisObj = this;
	
	//$(this.textfield).on('focus', function(){ AComponent.setFocusComp(thisObj); });
	//$(this.textfield).on('blur', _blurEvent);
	//this.$ele.on('blur', _blurEvent);
	this.textfield.addEventListener('focus', (e)=> { AComponent.setFocusComp(this); });
	this.textfield.addEventListener('blur', _blurEvent);
	this.element.addEventListener('blur', _blurEvent);
	
	this.setOption({
		inParent: ADropBox.inParent,
		autoWidth: true
	}, true);
	
	this.isReadOnly = this.textfield.getAttribute('readonly');
	
	function _blurEvent(e) 
	{
		// actionup 인 경우 자체이벤트에서 처리
		if(thisObj.ACTION_UP)
		{
			thisObj.ACTION_UP = false;
			return;
		}
		// keydown 이벤트를 setTimeout으로 실행하므로
		// setTimeout으로 처리하지 않으면 닫고 다시 오픈되므로 동일하게 처리
		setTimeout(function(){ thisObj.listPopupClose(); });
	}
	
	if(this.isDev())
	{
		this.addItem('JAVA');
		this.addItem('자바스크립트');
		this.addItem('파이썬');
		this.addItem('C++');
		this.addItem('루비');
		this.addItem('스위프트');
		this.addItem('C#');
		this.addItem('PHP');
		
		this.selectItem(0);
	}
	// 런타임시 JAVA 들어간 내용 제거
	else this.setEditText('');
	
	//this.openBoxManage();
};

ADropBox.prototype.openBoxManage = function()
{
	this.bindEvent(AEvent.ACTION_UP, (e)=>
	{
		//var input = this.element.firstElementChild;
		//if(input.getAttribute('readonly') && this.isEnable)

		if(this.isEnable)
		{
			this.openBox();
		}
	});
};

ADropBox.prototype.setScrollAreaId = function(areaId, scrollCallback)
{
	if(!areaId) areaId = this.getElementId() + '_scrl';
	
	this.scrollAreaId = areaId;
	this.scrollCallback = scrollCallback;
};

ADropBox.prototype.setDropBoxHeight = function(height)
{
	this.dropBoxH = height;
};

ADropBox.prototype.setItemHeight = function(height)
{
	this.itemHeight = height;
};

ADropBox.prototype.setSelectClass = function(selectClass)
{
	this.selectClass = selectClass;
};

ADropBox.prototype.clearSelectItem = function()
{
	this.selIndex = -1;
	//$(this.textfield).val('');
    this.textfield.value = '';
    
};

ADropBox.prototype.addItem = function(text, data)
{
	var item = {'text':text, 'data':data};
	this.items.push(item);
	
	return item;
};

ADropBox.prototype.setItem = function(index, text, data)
{
	this.items[index] = {'text':text, 'data':data};
};

ADropBox.prototype.getItem = function(index)
{
    return this.items[index];
};

ADropBox.prototype.getItems = function()
{
    return this.items;
};

ADropBox.prototype.setUseDropBox = function(useDropBox)
{
	this.useDropBox = useDropBox;
};


ADropBox.prototype.setItems = function(items)
{
	this.items = new Array(items.length);
	var item;
	for(var i=0; i<items.length; i++)
	{
		item = items[i];
		this.items[i] = { 'text':item[0], 'data':item[1] };
	}
};

ADropBox.prototype.setItemText = function(index, text)
{
	this.items[index].text = text;
};

ADropBox.prototype.getItemText = function(index)
{
	return this.items[index].text;
};

ADropBox.prototype.setItemData = function(index, data)
{
	this.items[index].data = data;
};

ADropBox.prototype.getItemData = function(index)
{
	return this.items[index].data;
};

ADropBox.prototype.getSelectedIndex = function()
{
    return this.selIndex;
};

ADropBox.prototype.getSelectedItem = function()
{
	return this.items[this.selIndex];
};

ADropBox.prototype.indexOfText = function(text)
{
	for(var i=0; i<this.items.length; i++)
	{
		if(this.items[i].text == text) return i;
	}
	
	return -1;
};

ADropBox.prototype.indexOfData = function(data)
{
	for(var i=0; i<this.items.length; i++)
	{
		if(this.items[i].data==data) return i;
	}
	
	return -1;
};

ADropBox.prototype.selectItem = function(index)
{
	if(index>-1)
	{
		var item = this.items[index];
		
		if(item)
		{
			this.selIndex = index;
			this.setEditText(item.text);
		}
	}
};

ADropBox.prototype.selectItemByText = function(text)
{
	this.selectItem(this.indexOfText(text));
};

ADropBox.prototype.selectItemByData = function(data)
{
	this.selectItem(this.indexOfData(data));
};

ADropBox.prototype.getSelectedItemData = function(key)
{
	var selectedItem = this.getSelectedItem();
	if(selectedItem)
	{	
		if(key) return selectedItem.data[key];
		return selectedItem.data;
	}
	else return false;
};

ADropBox.prototype.getSelectedItemText = function()
{
	var selectedItem = this.getSelectedItem();
	if(selectedItem) return selectedItem.text;
	else return;
};

ADropBox.prototype.getItemSize = function()
{
    return this.items.length;
};

ADropBox.prototype.removeItem = function(index)
{
    //this.items.splice(index, 1);
	return this.items.splice(index, 1)[0];
};

ADropBox.prototype.removeAll = function()
{
	//$(this.textfield).attr('value', '');
	//this.textfield.value = '';
	this.clearSelectItem();	//$(this.textfield).val('');
    this.items.length = 0;
};

ADropBox.prototype.setReadOnly = function(isReadOnly)
{
    if(isReadOnly)
    {
        this.setAttr('readonly', isReadOnly);
        //$(this.textfield).attr('readonly', isReadOnly);
        this.textfield.setAttribute('readonly', isReadOnly);
    } 
    else 
    {
        this.removeAttr('readonly');
        //$(this.textfield).removeAttr('readonly');
        this.textfield.removeAttribute('readonly');
    }
	
	this.isReadOnly = isReadOnly;
};

ADropBox.prototype.getEditText = function()
{
	//return $(this.textfield).val();
    return this.textfield.value;
};

ADropBox.prototype.setEditText = function(text)
{
	//$(this.textfield).val(text);
	
	this.textfield.value = text;
	this.textfield.setAttribute('value', text);

	// 검색어 저장
	this.searchTxt = text;
};

ADropBox.prototype.setDataType = function(dataType)
{
	this.textfield.type = dataType;
};

ADropBox.prototype.getDataType = function()
{
	return this.textfield.type;
};

ADropBox.prototype.setTextAlign = function(align)
{
    this.textfield.textAlign = align;
};

ADropBox.prototype.getTextAlign = function()
{
    return this.textfield.textAlign;
};

ADropBox.prototype.setOpenDirection = function(isDown)
{
    this.openDir = isDown;
};

ADropBox.prototype.enableScrollManager = function(enable)
{
	this.isEnableSM = enable;

};

ADropBox.prototype.enableScrollIndicator = function()
{
	this.scrlIndicator = new ScrollIndicator();
	
	//this.scrlIndicator.init('vertical', this.scrollArea[0]);
    this.scrlIndicator.init('vertical', this.scrollArea);
};

ADropBox.prototype.openBox = function()
{
	if(!this.useDropBox) return
    if(this.getItemSize() < 1) return
	
    const thisObj = this

	ADropBox.setOpenedDropBox(this)
	
	// 이미 팝업이 오픈되어 있는 경우
	if(this.listPopup)
	{
		// 데이터만 상태에 맞게 재가공 또는 그대로 보여준다
		this.bindData(this.scrollArea)
		return
	}
	
	// 먼저 표현할 리스트를 뽑아낸다.
	//const ulObj = this.scrollArea = $('<ul class="dropbox_list"></ul>')
	//const retVal = this.bindData(this.scrollArea)

    const ulEle = document.createElement('ul')
    ulEle.className = 'dropbox_list';

    this.scrollArea = ulEle
    const retVal = this.bindData(ulEle)

	// 표현할 리스트가 없으면 팝업 오픈하지 않는다.
	if(!retVal) return
	
	if(this.scrollAreaId)
	{
		//this.scrollArea.attr('id', this.scrollAreaId)
		//if(this.scrollCallback) this.scrollArea.on('scroll', this.scrollCallback)

		ulEle.setAttribute('id', this.scrollAreaId)
		if(this.scrollCallback) ulEle.addEventListener('scroll', this.scrollCallback)
	}

	const listDiv = document.createElement('div');
    listDiv.className = 'dropbox_back'
	listDiv.append(ulEle)

    /*
	ulEle.css(
	{
		'z-index': 1,
		'-webkit-overflow-scrolling': 'touch',
		'font-size': $(this.textfield).css('font-size'),
		'font-family': $(this.textfield).css('font-family')
	})
    */
    Object.assign(ulEle.style,
    {
		'z-index': 1,
		'-webkit-overflow-scrolling': 'touch',
		'font-size': this.textfield.style['font-size'],
		'font-family': this.textfield.style['font-family']
	})

	//listDiv.css('font-size', this.$ele.css('font-size'));
	
    //const outerH = this.$ele.outerHeight()
    const outerH = _TinyDom.outerHeight(this.element)

	// 현재 보이는 넓이와 원래 넓이로 스케일값을 구한다.
    /*
    let brect = this.getBoundRect(),
        scaleX = brect.width / this.element.offsetWidth,
        scaleY = brect.height / this.element.offsetHeight,
		borderH = (outerH - this.$ele.height())/2,
		itemHeight = this.itemHeight || outerH,//this.$ele.height();
		pos = this.$ele.offset(),
		boxHeight = Math.min(itemHeight*this.items.length, this.dropBoxH),
		maxH = $(window).height()
	
	ulEle.children().css(
	{
		height: itemHeight+'px',
		'line-height': itemHeight+'px',
        overflow: 'hidden'
	})
    */

    // 현재 보이는 넓이와 원래 넓이로 스케일값을 구한다.
    let brect = this.getBoundRect(),
        scaleX = brect.width / this.element.offsetWidth,
        scaleY = brect.height / this.element.offsetHeight,
		borderH = (outerH - _TinyDom.height(this.element))/2,
		itemHeight = this.itemHeight || outerH,
		pos = _TinyDom.offset(this.element),
		boxHeight = Math.min(itemHeight*this.items.length, this.dropBoxH),
		maxH = _TinyDom.height(window)

    for(const ele of ulEle.children)
    {
        Object.assign(ele.style, 
        {
		    height: itemHeight+'px',
		    'line-height': itemHeight+'px',
            overflow: 'hidden'
	    })
    }

	this.listPopup = new AFloat()
	this.listPopup.init()
	this.listPopup.append(listDiv)
	// IE에서 input focus 된 상태에서 스크롤영역 선택하면 blur 발생하여 닫히는 버그 수정용
	this.listPopup.frame.addEventListener(AEvent.ACTION_DOWN, function(){ thisObj.ACTION_UP = true; })

	if(this.isEnableSM && afc.isIos) this.enableScrlManagerY()

	var cntr;
	if(this.option.inParent)
	{
		cntr = this.getContainer()
		if(cntr)
		{
			cntr.enableChildren(false)
			
			// 컨테이너 안에 뜨게 되면 오프셋 위치로는 제대로 표현되지 않으므로 수정처리

			// 컨테이너 영역까지의 스케일 값을 구한다.
			const cntrRect = cntr.element.getBoundingClientRect(),
				cntrScaleX = cntrRect.width / cntr.element.offsetWidth,
				cntrScaleY = cntrRect.height/ cntr.element.offsetHeight,
				//cntrOfs = cntr.get$ele().offset()
                cntrOfs = _TinyDom.offset(cntr.getElement())
            
			// 컨테이너 영역까지의 스케일 값으로 나눠서 현재 드랍박스에 적용된 스케일 값을 구한다.
            scaleX /= cntrScaleX
            scaleY /= cntrScaleY
			
			// 컨테이너까지의 위치값을 뺴고 컨테이너 scale 적용 전의 값으로 변경한다. (화면내의 scale 은 남아있음)
			pos.left = (pos.left - cntrOfs.left) / cntrScaleX
			pos.top = (pos.top - cntrOfs.top) / cntrScaleY
			
			// 최대 높이를 컨테이너 높이로 변경한다
            maxH = cntr.getHeight()

			// 현재 보이는 넓이 높이도 컨테이너 scale 적용전으로 변경한다.
            brect.width /= cntrScaleX
            brect.height /= cntrScaleY
		}
	}

	//보더 넓이 scale 적용하여 위치가 제대로 표현될 수 있게 한다.
	borderH *= scaleY
    
    //scale 된 위치, 크기값으로 비교
	//상단으로 띄울지 하단으로 띄울지 결정
	if(pos.top + boxHeight + brect.height > maxH)
    {
		//상단에 띄움. 하단에 띄우면 윈도우 또는 부모컨테이너 영역을 넘어감
		
		//원래 높이로 상단에 띄워도 윈도우 또는 부모컨테이너 영역을 넘어감
        if(pos.top - boxHeight - (outerH - _TinyDom.height(this.element)) < 0)
        {
			//하단과 상단의 높이를 비교하여 넓은 쪽으로 띄우게 처리
			const topH = pos.top, btmH = maxH - pos.top - brect.height
			if(topH > btmH)
			{
				//상단에 띄움. 박스 높이는 조절한다.
				boxHeight = topH
				pos.top -= boxHeight
			}
			else
			{
				//하단에 띄움. 박스 높이는 조절한다.
				boxHeight = btmH - 3
				pos.top += brect.height - borderH
			}
        }
        else
        {
			//상단에 띄움
            pos.top -= boxHeight + borderH
        }
    }
	else
    {
		//하단에 띄움
        pos.top += brect.height - borderH
    }
    
    //컴포넌트 scale 값이 1이 아닌 경우 드랍박스팝업도 scale 적용
    /*
    if(scaleX != 1 || scaleY != 1) 
    {
        this.listPopup.$frame.css({
            'transform': `scale(${scaleX}, ${scaleY})`,
            'transform-origin': 'left top'
        })
    }
    */
    if(scaleX != 1 || scaleY != 1) 
    {
        this.listPopup.frame.style['transform'] = `scale(${scaleX}, ${scaleY})`
        this.listPopup.frame.style['transform-origin'] = 'left top'
    }
	
	let boxWidth = _TinyDom.outerWidth(this.element) - (borderH*2)
	
	//if(!this.isDev() && !afc.isSimulator && window.AppManager) AppManager.bringToFront(true);

    //scale 되기 전의 위치, 크기값으로 띄움
	//this.listPopup.popup(pos.left, pos.top, boxWidth, boxHeight/scaleY, function()
	this.listPopup.popup(pos.left, pos.top, this.option.autoWidth ? 'auto' : boxWidth, boxHeight/scaleY, function()
	{
		/*
		if(!thisObj.isDev() && !afc.isSimulator && window.AppManager)
		{
			var topWin = AWindow.getTopWindow();
			if(topWin)
			{
				if(topWin.useNative)
				{
					AppManager.bringToFront(false);
				}
			}
			else AppManager.bringToFront(false);
		}
		*/

		thisObj.listPopup = null
		ADropBox.setOpenedDropBox(null)
		
		setTimeout(function() 
		{
			if(cntr && cntr.isValid()) cntr.enableChildren(true)

		}, afc.DISABLE_TIME)
		
	}, cntr)

	//this.listPopup.$frame.css('min-width', boxWidth+'px')
    this.listPopup.frame.style['min-width'] = boxWidth+'px'
		
	//-----------------------------------------------
	// 좌우 스크롤이 되면 넓이를 auto로 바꿔준다.	
	//
	/*
	if(this.scrollArea[0].scrollWidth-this.scrollArea.width() >= 1 )	//ie 11 에서는 소수점이 나오는 버그 수정
	{
		this.listPopup.$frame.css('width', 'auto')
	}
	*/
	
	//AFloat 이 position 이 fixed 여서...변경함.
	//listPopup 을 윈도우로 변경하거나, AFloat 을 absolute 로 변경할 수 있도록 해야 함.
	//absolute 로 하지 않으면 화면이 스크롤되어도 listPopup 이 항상 같은 자리에 뜸.
	//this.listPopup.$frame.css('position', 'absolute')
    this.listPopup.frame.style.position = 'absolute'
	
	if(afc.isScrollIndicator) this.enableScrollIndicator()
};

ADropBox.prototype.listPopupClose = function()
{
	if(this.listPopup) this.listPopup.close();
	ADropBox.setOpenedDropBox(null);
};

ADropBox.prototype.bindData = function(ulEle)
{
    var dataArr = this.items;
	var searchTxt = this.getEditText();
	let scrollTop;
	
	// 팝업이 이미 떠있을 때 입력값이 같은 경우 리턴처리
	if(this.listPopup)
	{
        const isSameSearch = this.searchTxt == searchTxt;
        if(!this.isReadOnly && this.lastBindDataLength == dataArr.length && isSameSearch) return;
        
		//if(isSameSearch) scrollTop = ulObj.scrollTop();
        if(isSameSearch) scrollTop = ulEle.scrollTop;
		this.searchTxt = searchTxt;

		scrollTop = ulEle.scrollTop;
		//ulObj.empty();
        ulEle.replaceChildren()
	}

	this.lastBindDataLength = dataArr.length;

    let liEle, liObjStr, i
	
    for(i=0; i<dataArr.length; i++)
    {
		// 읽기 모드가 아니고 검색어가 있는 경우에만 검색처리
		if(!this.isReadOnly && searchTxt)
		{
			// 데이터의 텍스트에 검색 내용이 없는 경우 처리
			if(dataArr[i].text.toString().indexOf(searchTxt) == -1) continue;
		}

		/*
		liObjStr = '<li class="'+(i==this.selIndex?this.selectClass:this.normalClass)+'"><span>'+dataArr[i].text+'</span>';
        liObjStr += '</li>';
        
        var liObj = $(liObjStr);
        liObj[0].data = dataArr[i];
		liObj[0].index = i;
        ulEle.append(liObj);

        this.aevent._select(liObj[0]);
        */

        liEle = document.createElement('li')
        liEle.className = (i==this.selIndex?this.selectClass:this.normalClass)
        liEle.innerHTML = '<span>'+dataArr[i].text+'</span>'

        liEle.data = dataArr[i];
		liEle.index = i;
        ulEle.append(liEle);
                
        this.aevent._select(liEle);
    }
	
	if(ulEle.children.length == 0)
	{
		this.listPopupClose();
		return false;
	}
	else
	{
		const itemHeight = _TinyDom.outerHeight(this.element);

        /*
		ulEle.children().css(
		{
			height: itemHeight+'px',
			'line-height': itemHeight+'px'
		});
        */
		for(const ele of ulEle.children)
		{
            ele.style.height = itemHeight+'px'
            ele.style.lineHeight = itemHeight+'px'
		}

	}

	if(scrollTop) ulEle.scrollTop = scrollTop;
	
	return true;
	
    //ADropBoxEvent.implement(this, ulEle.children('li'));
};

ADropBox.prototype.enableScrlManagerY = function()
{
	//if(this.scrlManagerY) return;
	
	if(afc.isSimulator || afc.isAndroid) return;
	
	//ios 인 경우만 작동 하도록
	
	this.scrlManagerY = new ScrollManager();
	//this.scrollArea.css({'overflow':'auto', '-webkit-overflow-scrolling': ''});
    this.scrollArea.style.overflow = 'auto'
    this.scrollArea.style['-webkit-overflow-scrolling'] = '';
	
	this.scrollYImplement();
};

ADropBox.prototype.scrollYImplement = function()
{
	//PC인 경우 자신의 영역 mousedown 과 상관없이 mousemove 가 무조건 발생한다.
	let isDown = false;
	
	this.scrollArea.addEventListener(AEvent.ACTION_DOWN, (e)=>
	{
		isDown = true;
		
		//e.preventDefault();
		this.scrlManagerY.initScroll(e.changedTouches[0].clientY);
	});
	
	this.scrollArea.addEventListener(AEvent.ACTION_MOVE, (e)=>
	{
		if(!isDown) return;
		
		e.preventDefault();
		
		//var scrlArea = this;
		this.scrlManagerY.updateScroll(e.changedTouches[0].clientY, (move)=>
		{
			//scrlArea.scrollTop += move;
            this.scrollArea.scrollTop += move;
		});
	});
	
	this.scrollArea.addEventListener(AEvent.ACTION_UP, (e)=>
	{
		if(!isDown) return;
		isDown = false;
		
		//e.preventDefault();
		
		//var scrlArea = this;
		this.scrlManagerY.scrollCheck(e.changedTouches[0].clientY, (move)=>
		{
			//scrlArea.scrollTop += move;
            this.scrollArea.scrollTop += move;
			return true;
		});
	});
};

ADropBox.prototype._keyDownManage = function(e)
{
	var thisObj = this, tmp = [];
	//var liObj = $('.' + this.focusClass);
    let liEle = this.scrollArea.querySelector('.' + this.focusClass);

	
	var noCharKeyArr = [9, 16, 17, 18, 19, 20, 25, //TAB, Ctrl, Shift, Alt, Pause/Break, Caps, 한자(R-Ctrl)
						112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, //F1~F12
					    33, 34, 35, 36, 45,		//PageUp, PageDown, End, Home, Insert
						91, 92, 93, 145	//Window, Window, Context, Scroll Lock
					   ];	//229는 IE에서 한글입력시 넘어오는 값이라 항목에서 제외함
	
	// 문자가 입력이 되지 않는 경우 리턴처리
	if(noCharKeyArr.indexOf(e.which) > -1) return;
	
	//console.log('_keyDownManage ' + e.which);
	switch(e.which)
	{
		case 38:	//KEY_UP:
			if(!this.listPopup) this.openBox();
			else
			{
                /*
				if(liObj.get(0))
				{
					liObj.removeClass(this.focusClass);
					tmp = liObj.prev();
				}
				else
				{
					liObj = $('.' + this.selectClass);
					if(liObj.get(0)) tmp = liObj.prev();
				}
				if(!tmp[0]) tmp = this.scrollArea.children().last();
				tmp.addClass(this.focusClass);
                */
				if(liEle)
				{
					liEle.classList.remove(this.focusClass);
					tmp = liEle.previousElementSibling;
				}
				else
				{
					liEle = this.scrollArea.querySelector('.' + this.selectClass);
					if(liEle) tmp = liEle.previousElementSibling;
				}

				if(!tmp) tmp = this.scrollArea.lastElementChild;
				tmp.classList.add(this.focusClass);
			}
		break;
		
		case 40:	//KEY_DOWN:
			if(!this.listPopup) this.openBox();
			else
			{
				if(liEle)
				{
					liEle.classList.remove(this.focusClass);
					tmp = liEle.nextElementSibling;
				}
				else
				{
					liEle = this.scrollArea.querySelector('.' + this.selectClass);
					if(liEle) tmp = liEle.nextElementSibling;
				}

				if(!tmp) tmp = this.scrollArea.firstElementChild;
				tmp.classList.add(this.focusClass);
			}
		break;
		
		case 13:	//KEY_ENTER: 
			e.preventDefault();
			if(liEle)
			{
				//liObj.removeClass(this.focusClass);
				//liObj.addClass(this.selectClass);
				//this.selectItem(liObj.get(0).index);
				liEle.classList.remove(this.focusClass);
				liEle.classList.add(this.selectClass);
				this.selectItem(liEle.index);
				
				// 선택되었다는 표현을 보여주기 위해 0.1초동안 대기
				setTimeout(() =>
				{
					this.listPopupClose();
					if(!this.isReadOnly) this.textfield.focus();
					this.reportEvent('select', liEle);
				}, 100);
			}
			else
			{
				// 리스트중 선택한 정보가 없는 경우 텍스트값으로 조회
				const idx = this.indexOfText(this.getEditText());
				if(idx > -1)
				{
					this.selectItem(idx);
					this.listPopupClose();
				}
			}
		break;
		
		case 27:	//KEY_ESC: 
			this.listPopupClose();
		break;
		
		default:
			if(this.isReadOnly) return;
			this.openBox();
	}
};

ADropBox.prototype.isMoreScrollTop = function()
{
	if(this.scrollArea.scrollTop > 0) return true;
	else return false;	
};

ADropBox.prototype.isMoreScrollBottom = function()
{
	if(this.scrollArea.offsetHeight + this.scrollArea.scrollTop < this.scrollArea.scrollHeight) return true;
	else return false;	
};

ADropBox.prototype.isScroll = function()
{
    return (this.scrollArea.offsetHeight < this.scrollArea.scrollHeight);
};

// 매핑가능한 개수를 리턴한다.
ADropBox.prototype.getMappingCount = function()
{
	return ['data', 'text'];
};

ADropBox.prototype.setData = function(dataArr)
{
	//this.removeAll();
	
	for(let i=0; i<dataArr.length; i++)
		this.addItem(dataArr[i][0], dataArr[i][1]);
	//this.selectItemByData(data);
};

ADropBox.prototype.getData = function()
{
	return this.getSelectedItemData();
	/*
	var item = this.getSelectedItem();
	if(!item) return;
	return [item.data, item.text];
	*/
};

ADropBox.prototype.getQueryData = function(dataArr, keyArr, queryData)
{
	if(!keyArr) return;
	if(!dataArr || dataArr.length==0) return;
	
	var item = this.getSelectedItem();
	if(!item) return;
	if(keyArr[0]) dataArr[0][keyArr[0]] = item.data;
	if(keyArr[1]) dataArr[0][keyArr[1]] = item.text;
};

ADropBox.prototype.setQueryData = function(dataArr, keyArr, queryData)
{
	if(!keyArr || !dataArr) return;
	
	//default
	if(!this.applyType || this.applyType=='add')
	{
		for(var i=0; i<dataArr.length; i++)
			this.addItem(dataArr[i][keyArr[1]], dataArr[i][keyArr[0]]);
	}
	else if(this.applyType=='select')
	{
		//매핑한 value 값을 얻어 선택되도록 한다.
		this.selectItemByData(dataArr[0][keyArr[0]]);
	
	}
	else if(this.applyType=='remove')
	{
		let inx = this.indexOfData(dataArr[0][keyArr[0]]);
		if(inx>-1) 	this.removeItem(inx);
	}
	
};

ADropBox.prototype.updatePosition = function()
{
	this.listPopupClose();
};
