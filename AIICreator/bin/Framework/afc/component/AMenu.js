
/**
 * @author asoocool
 */

AMenu = class AMenu extends AFloat
{
	constructor(rootMenu, menuId, iconMap)
	{
		super()
	
		this.element = null;
		this.itemInfoArr = [];
		this.selItem = null;

		this.listener = null;
		this.funcName = null;

		if(rootMenu) this.rootMenu = rootMenu;
		else this.rootMenu = this;

		this.menuId = menuId;
		this.iconMap = iconMap;
		this.overStyle = '';
	}

	
}

//window.AMenu = AMenu

AMenu.tag = '<table class="AMenu-Style"></table>';

//menu icon 중앙 정렬을 위해 span 추가
AMenu.itemFormat = '<tr><td><span></span></td><td></td><td></td><td></td></tr>';
AMenu.overStyle = 'amenu-over';

AMenu.setOverStyle = function(overStyle)
{
	AMenu.overStyle = overStyle;
}

AMenu.prototype.init = function()
{
	AFloat.prototype.init.call(this);

	let tmp = document.createElement('div');
	tmp.innerHTML = AMenu.tag;
	this.element = tmp.firstChild;
	this.frame.append(this.element);
};

//deprecated
AMenu.prototype.setIconMapUrl = function(iconMap)
{
	this.setIconMap(iconMap);
};

AMenu.prototype.setIconMap = function(iconMap)
{
	this.iconMap = iconMap;
};

//when a menu pops up, we put menuItems in a menu
//AMenu overrides popup function
AMenu.prototype.popup = function(left, top, width, height, closeCallback)
{
	this.init();
	
	for(var i=0; i<this.itemInfoArr.length; i++)
		this.addMenuItem(this.itemInfoArr[i]);

	AFloat.prototype.popup.call(this, left, top, width, height, closeCallback);
};

AMenu.prototype.popupEx = function(info, closeCallback)
{
	this.init();
	
	for(var i=0; i<this.itemInfoArr.length; i++)
		this.addMenuItem(this.itemInfoArr[i]);

	AFloat.prototype.popupEx.call(this, info, closeCallback);
};



AMenu.prototype.close = function(result)
{
	if(this.selItem && this.selItem.subMenu) this.selItem.subMenu.close();

	AFloat.prototype.close.call(this, result);
};



//if index is undefined, we put the itemInfo at the last position. 
//itemInfo = { text:'Open File...', icon:'', sub: itemInfoArr }
AMenu.prototype.insertItemInfo = function(itemInfo, index)
{
	if(index==undefined) this.itemInfoArr.push(itemInfo);
	else this.itemInfoArr.splice(index, 0, itemInfo);
};

//deleteCount default: 1
AMenu.prototype.removeItemInfoByIndex = function(index, deleteCount)
{
	this.itemInfoArr.splice(index, deleteCount||1);
};

//if func`s return value is true, item is removed
AMenu.prototype.removeItemInfoByFunc = function(func)
{
	for(var i=this.itemInfoArr.length-1; i>-1; i--)
	{
		if(func(this.itemInfoArr[i]))
		{
			this.itemInfoArr.splice(i, 1);
			break;
		}
	}
};

AMenu.prototype.setItemInfo = function(itemInfo, index)
{
	this.itemInfoArr[index] = itemInfo;
};

AMenu.prototype.setItemInfoArr = function(itemInfoArr)
{
	this.itemInfoArr = itemInfoArr.slice();
};

//내부적으로만 사용
AMenu.prototype.popupSubmenu = function(itemEle, itemInfoArr)
{
	var rect = itemEle.getBoundingClientRect();
	
	var menu = new AMenu(this.rootMenu, null, this.iconMap);
	menu.isBgCheck = false;
	menu.zIndex = this.zIndex + 10;
	menu.setItemInfoArr(itemInfoArr);
	menu.popup(rect.right, rect.top);
	menu.setOverStyle(this.overStyle);
	
	itemEle.subMenu = menu;
};

//내부적으로만 사용함
//AMenu.itemFormat = 
//<tr>
//		<td><span></span></td>	menu-icon
//		<td></td>				menu-text
//		<td></td>				menu-sub-mark
//</tr>
AMenu.prototype.addMenuItem = function(itemInfo)
{
	var tmp = document.createElement('tbody');
	tmp.innerHTML = AMenu.itemFormat;
    var item = tmp.firstChild;

	item.info = itemInfo;

	var thisObj = this;


	if(itemInfo.id=='MENU_SPLITTER')
	{
		//span 이 높이를 차지하므로 제거한다.
		//$item.find('span').remove();
		//$item.css('height','1px');

		for(const td of Array.from(item.querySelectorAll('td'))) td.remove();
		item.style.height = '0px';
		item.style.borderTop = '1px solid #595959';
	}
	else
	{
		item.addEventListener('mouseover', function(e)
		{
			if(thisObj.selItem && thisObj.selItem.subMenu) thisObj.selItem.subMenu.close();

			thisObj.selItem = item;

			item.classList.add(thisObj.overStyle||AMenu.overStyle);

			if(itemInfo.sub)
				thisObj.popupSubmenu(item, itemInfo.sub);
		});

		item.addEventListener('mouseout', function(e)
		{
			item.classList.remove(thisObj.overStyle||AMenu.overStyle);
		});

		item.addEventListener('click', function(e)
		{
			if(itemInfo.sub) return;

			thisObj.rootMenu.reportEvent(item, e);
			thisObj.rootMenu.close(item.info);
		});

		var children = item.children;

		var iconMap = itemInfo.iconMap || itemInfo.iconMapUrl || this.iconMap;

		if(iconMap && itemInfo.icon > -1)
		{
			//아이콘 셋팅, span
			var iconSpan = children[0].children[0];
			if(iconMap.match(/\./)) iconSpan.style.backgroundImage = 'url("' + iconMap + '")';
			else iconSpan.classList.add(iconMap);

			Object.assign(iconSpan.style, {
				'background-position': this.getBgPos(itemInfo.icon, this.iconType),//(-16 * itemInfo.icon) + 'px 0px',
				'background-repeat': 'no-repeat'
			});
		}

		/*if(this.iconMap && itemInfo.icon!=undefined)
		{
			//아이콘 셋팅, span
			$children.eq(0).children().css(
			{
				'background-image': 'url("' + this.iconMap + '")',
				'background-position': (-16 * itemInfo.icon) + 'px center',
				'background-repeat': 'no-repeat'
			});
		}*/

		children[1].innerHTML = itemInfo.text;

		//BKS/2017.08.21/short key
		if(itemInfo.shortKey)
		{
			children[2].innerHTML = itemInfo.shortKey;
			children[2].style.paddingLeft = '15px';
			children[2].style.textAlign = 'left';
		}

		if(itemInfo.sub) children[3].classList.add('menu-icon-sub');//text('▶');

		/*if(itemInfo.sub) $children.eq(2).text('▶');*/
	}


   	this.element.appendChild(item);

	return item;
};

AMenu.prototype.setResultListener = function(resultListener)
{
	this.resultListener = resultListener;
};

//deprecated, use setResultListener
AMenu.prototype.setSelectListener = function(listener, funcName)
{
	this.listener = listener;
	this.funcName = funcName;
};

AMenu.prototype.reportEvent = function(item, e)
{
	//if(item.info==undefined) item.info = {};
	
	//deprecated, use setResultListener
	if(this.listener) this.listener[this.funcName](this, item.info, e);
	
	//-->
	if(this.resultListener && this.resultListener.onMenuResult) 
		this.resultListener.onMenuResult(this, item.info, e);
};

AMenu.prototype.setOverStyle = function(overStyle)
{
	this.overStyle = overStyle;
};

AMenu.prototype.setIconType = function(iconType)
{
	this.iconType = iconType;
};

AMenu.prototype.getBgPos = function(icon, iconType)
{
	var bgPos = [];

	if(iconType != undefined) bgPos.push((-16 * iconType) + 'px 0px');

	if(Array.isArray(icon))
	{
		for(var i=0; i<icon.length; i++)
		{
			bgPos.push((-16 * icon[i]) + 'px 0px');
		}
	}
	else
	{
		bgPos.push((-16 * icon) + 'px 0px');
	}

	return bgPos.join(', ');
};

