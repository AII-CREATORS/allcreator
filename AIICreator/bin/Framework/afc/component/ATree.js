
afc.import('Framework/afc/library/DnDManager.js');

/**
 * $root 는 <ul> 이다. 다른 하위 아이템은 <li>
 * 루트도 <li>가 되도록 구조 변경하기
 */

class ATree extends AComponent
{
	constructor()
	{
		super()
	
		this.treeRoot = null;
		this.historyManager = null;
		this.undoStack = null;
		this.redoStack = null;
		this.selectedItems = [];
		this.clickedItem = null;
		this.lastSelectedItem = null;
		this.iconMap = null;
		this.upSelect = false;
		//this.dropTimer = null;

		this.selectStyle = 'tree-select'; 	//아이템 선택 ClassName
		//this.selectStyle = 'tree_-select'; 	//아이템 선택 ClassName
		this.overStyle = 'tree-over'; 		//드래그 오버 ClassName
		this.afterStyle = 'tree-after';		//롱 오버  ClassName
	}

	
}

window.ATree = ATree


ATree.CONTEXT = 
{
    tag: '<div data-base="ATree" data-class="ATree" class="ATree-Style" data-draggable="true">' +
    		'<ul style="margin:0px; padding:0px;">' + 
    			'<li style="list-style-type:none; margin:2px 0px 2px 15px;" class="tree-item">Item</li>' +
    		'</ul></div>',
    
    defStyle: 
    {
        width:'200px', height:'300px'
    },
    
    events: ['select', 'dblclick', 'drop', 'itemMouseOver', 'itemMouseOut']
};



//Expand type
ATree.EXPAND_ALL = 1;
ATree.EXPAND_CHILD = 2;
ATree.EXPAND_COLLAPSE = 3;


ATree.ulFormat = '<ul style="margin:0px; padding:0px;"></ul>';
ATree.liFormat = '<li style="list-style-type:none; margin:2px 0px 2px 15px;" class="tree-item"></li>';


ATree.prototype.init = function(context, evtListener)
{
	AComponent.prototype.init.call(this, context, evtListener);
	
    this.setOption(
    {
        isSingleSelect: this.getAttr('data-single-select'),		//ctrl 키를 누르고 선택해도 하나만 선택된다. 
        isFullSelect: this.getAttr('data-full-select'),			//아이템 선택시 선택표시가 라인 전체로 표시된다.
        isDraggable: this.getAttr('data-draggable'),			//트리 드래그 가능 여부
        useHistory: this.getAttr('data-use-history'),			//히스토리 사용여부(undo, redo)
        dragIcon: './Source/img/drag.png',						//드래그 아이콘
		isMaintainOrder: this.getAttr('data-maintain-order'),	//선택시 순서 유지 여부
		
    }, true);

	if(this.option.useHistory) this.startUseHistory();

	this.element.replaceChildren();
	
	this.dnd_scope = '_dnd_'+new Date().getTime();
	
	//this.initTree('./img/tree_item.png');
	//this.initTree('./theme/img/tree_item.png');
	
	this.initTree();
	
	this.actionToFocusComp();
	
    if(this.option.isDraggable) 
    {
        this.dndMgr = new DnDManager();
        this.dndMgr.setDropOption({applyChild: false, hoverClass: this.overStyle});
    }
};

ATree.prototype.initTree = function(iconMap)
{
	if(iconMap)
	{
		if(typeof(iconMap) == 'string')
		{
			if(iconMap.match(/\./))
			{
				this.changeIcon = this._changeIconByUrl;
				this.iconMap = 'url("' + iconMap + '")';
			}
			else
			{
				this.changeIcon = this._changeIconByCss;
				this.iconMap = iconMap;
			}
		}
		else
		{
			this.iconMap = [];
			this.changeIcon = this._changeIconByUrl;
			
			//보통 0번째에 해당하는 아이콘이 메인이므로 역순으로 아이콘을 배치한다.
// 			for(var i=0; i<iconMap.length; i++)
			for(var i=iconMap.length-1; i>-1; i--)
			{
				this.iconMap.push('url("' + iconMap[i] + '")');
			}
			this.iconMap = this.iconMap.join(', ');
		}
	}
	
    this.treeRoot = document.createElement('ul');
    this.treeRoot.setAttribute('style', 'margin:0px; padding:0px;');
    this.treeRoot.style.whiteSpace = 'nowrap';

    this.element.appendChild(this.treeRoot);
};

/*
ATree.prototype.setOption = function(option)
{
    for(var p in option)
    { 
        if(option[p]!=undefined)
            this.option[p] = option[p];
    }
};
*/

//----------------------------------------------------------
//	* delegate functions *
//	function itemExpandManage(isExpand, item);
//----------------------------------------------------------

ATree.prototype.setDelegator = function(delegator)
{
	this.delegator = delegator;
};

//히스토리 사용을 시작함
ATree.prototype.startUseHistory = function()
{
	this.option.useHistory = true; 
	this.historyManager = new HistoryManager();
	this.undoStack = AUtil.makeStack(this.element);
	this.redoStack = AUtil.makeStack(this.element);
};

ATree.prototype.getRootItem = function()
{
	return this.treeRoot;
};

ATree.prototype.getSelectedItems = function()
{
    return this.selectedItems;
};

ATree.prototype._getLabelItem = function(upperItem)
{
	if(this.option.isFullSelect) return upperItem
    else return upperItem.querySelector(':scope > label')
};

ATree.prototype.getSelectedParent = function(mItem)
{
    return this._getLabelItem(mItem.pItem).classList.contains(this.selectStyle);
};

ATree.prototype.setItem = function(item, itemInfo)//itemInfo -> name, data, icon, action
{
	for(var p in itemInfo)
	{
		if(p=='pItem' || p=='pos' || p=='action') continue;
		else if(p=='name') item.querySelector(':scope > label').textContent = itemInfo.name;
		else if(p=='icon') this.changeIcon(item, itemInfo.icon, itemInfo.iconType);

    	item[p] = itemInfo[p];
	}
};

//mItems 의 아이템들을 pItem 으로 이동시킨다. 자식 아이템이 있을 경우 같이 이동한다.
//TODO: 자신과 자신의 자식이 동시에 선택되어져 있는 경우는 오류가 발생...차후 제거하는 조직 추가해 주기
ATree.prototype.moveItem = function(dropItem, mItems, isInsertAfter)
{
	if(!isInsertAfter) this._insertHelper(dropItem, true);

	var curAfterDom = dropItem;
	var delChecks = [];
	for(var i=0,len=mItems.length; i<len; i++)
	{
		//히스토리에서 쓰임
		var preAfterDom = mItems[i].nextElementSibling;
		var preParent = mItems[i].parentElement;
		var dropParent = dropItem;
		delChecks.push(mItems[i].pItem);

		//부모가 이동하면 자식도 자동으로 이동하므로 부모가 선택되어 있으면 통과시킴
	    if(this._getLabelItem(mItems[i].pItem).classList.contains(this.selectStyle)) continue;

	    if(isInsertAfter)
	    {
	    	dropParent = dropItem.pItem;
	    	//동일한 형제 밑으로 들어갈 경우 배열의 뒤에있는 element부터 추가
	    	curAfterDom.after(mItems[i]);
	    	curAfterDom = mItems[i];
	    }
	    else
	    {
	    	dropItem.querySelector(':scope > ul').appendChild(mItems[i]);
	    }

   		//히스토리 사용시
	    if(this.option.useHistory)
	    {
	    	/*this.historyManager.reg(
		    	new ActionInfo('move', mItems[i], {treeParent: $(dropParent).children('ul'), next: $(mItems[i]).next('li')[0]}, {treeParent: preParent, next: preAfterDom}),
		    	(i != 0));*/

			this.historyManager.reg({
				targets: mItems[i],
				undoData: {treeParent: preParent, nextDom: preAfterDom},
				redoData: {treeParent: dropParent.querySelector(':scope > ul'), nextDom: mItems[i].nextElementSibling},
				isMerge: (i != 0)
			},
			function(undoObj)
			{
				var targets = undoObj.targets;
				var undoData = undoObj.undoData;

				if(undoData.nextDom) undoData.nextDom.before(targets);
				else undoData.treeParent.appendChild(targets);

			}, function(redoObj)
			{
				var targets = redoObj.targets;
				var redoData = redoObj.redoData;

				if(redoData.nextDom) redoData.nextDom.before(targets);
				else redoData.treeParent.appendChild(targets);
			});
	    }
	    mItems[i].pItem = dropParent;
	}
	
	var thisObj = this;
	setTimeout(function()
	{
		for(var i=0,len=delChecks.length; i<len; i++)
			thisObj._deleteHelper(delChecks[i]);
	},1);
};


ATree.prototype.insertItem = function(pItem, pos, name, data, icon, isExpand, mergeHistory)
{
	return this.insertItemObj({'pItem': pItem, 'pos': pos, 'name': name, 'data': data, 'icon':icon}, isExpand, mergeHistory);

};

ATree.prototype.setItemComment = function(item, comment)
{
	var labels = item.querySelectorAll(':scope > label');
	var commentEle = labels[1];
	if(comment)
	{
		if(commentEle)
		{
			commentEle.innerHTML = "["+comment+"]";
			commentEle.title = "["+comment+"]";
		}
		else
		{
			var commentLabel = document.createElement('label');
			commentLabel.title = comment;
			commentLabel.style.padding = '3px';
			commentLabel.textContent = '['+comment+']';
			labels[0].after(commentLabel);
		}
	}
	else if(commentEle) commentEle.remove();
	
	item.comment = comment;
};

// return tree item 
// item has pItem(parent item), pos, name, comment, data, icon
//mergeHistory 각각 다른타겟의 액션을 한 history로 묶고 싶을때, true일경우 현재  offset 히스토리 정보에 추가로 등록
ATree.prototype.insertItemObj = function(itemInfo, isExpand, mergeHistory)//itemInfo -> pItem(parent item), pos, name, data, icon, action, isGroup
{
    let item = document.createElement('li');
    item.style.cssText = 'list-style-type:none; margin:2px 0px 2px 15px;';
    item.className = 'tree-item';
    let fullrowDiv = null;

	if(this.option.isFullSelect)
	{
        fullrowDiv = document.createElement('div');
        fullrowDiv.className = 'tree-fullrow';
		item.appendChild(fullrowDiv);
	}


    //열기, 접기용 +, - 버튼 공간을 만들어둔다.
    //최초는 보이지 않는 상태이다.
    var expBtn = document.createElement('span');
    expBtn.className = 'tree-expand';
    //var lheight = $.browser.msie ? '10px' : '8px';

    var lheight = '8px';

	/*
    expBtn.css(
    {
    	marginRight : '3px',
		lineHeight: lheight,
        display: 'inline-block', width: '7px', height: '7px',
        cursor: 'default', visibility: 'hidden',
		padding:0
    });
	*/

    item.appendChild(expBtn);

    //아이템 아이콘 셋팅
    if(this.iconMap && itemInfo.icon!=undefined)
    {
		var iconEle = document.createElement('span');
		item.iconEle = iconEle;
		this.changeIcon(item, itemInfo.icon, itemInfo.iconType);
        item.appendChild(iconEle);
    }

    //if($.browser.msie) item.append('<label style="padding:3px 3px 1px 3px;">' + itemInfo.name + '</label>');
    //else
    //{
    	/*
    	var appendedItem = $('<label style="padding:3px;"></label>');
    	appendedItem.text(itemInfo.name);
    	item.append(appendedItem);
    	*/
    	var nameLabel = document.createElement('label');
    	nameLabel.style.padding = '3px';
    	nameLabel.textContent = itemInfo.name;
    	item.appendChild(nameLabel);
		item.lastChild.ownerComp = this;
		item.lastChild.onmouseover = function(e)
		{
			if(this.ownerComp) this.ownerComp.reportEvent('itemMouseOver', this, e);
		};

		item.lastChild.onmouseout = function(e)
		{
			if(this.ownerComp) this.ownerComp.reportEvent('itemMouseOut', this, e);
		};


		this.setItemComment(item, itemInfo.comment);
    //}

    if(itemInfo.pItem)
    {
    	var subTree = this._insertHelper(itemInfo.pItem, isExpand);

    	if(itemInfo.pos == undefined) subTree.appendChild(item);
    	else
    	{
    		var target = subTree.children[itemInfo.pos];
    		if(target) target.before(item);
    		else subTree.appendChild(item);
    	}
    }

    //루트 바로 밑의 아이템은 좌측 여백을 조정한다.
    else
    {
    	item.style.marginLeft = '5px';
    	this.treeRoot.appendChild(item);
    }

    //히스토리 사용시
    if(this.option.useHistory)
	{
		var info = {
			targets: item,
			undoData: {},
			redoData: {treeParent: item.parentElement},//{treeParent: item.parentElement, next: item.nextElementSibling}
			isMerge: mergeHistory,
		};
		this.historyManager.reg(info,
		function(undoObj)
		{
			var targets = undoObj.targets;
			var undoData = undoObj.undoData;

			this.redoStack.appendChild(targets);
		},
		function(redoObj)
		{
			var targets = redoObj.targets;
			var redoData = redoObj.redoData;

			redoData.treeParent.appendChild(targets);
		});
		/*
		this.historyManager.reg(
			new ActionInfo('append', item, {treeParent: item.parentElement, next: item.nextElementSibling}, null),
			mergeHistory);*/
	}

    //this._itemClickManage(item);

    for(var key in itemInfo)
		item[key] = itemInfo[key];

	this.aevent._select(item);
	this.aevent._dblclick(item);

    //드래그가 가능할때 드래그 시키기
    if(this.option.isDraggable)
    {
    	var cssLabel;
    	//맨 상위 루스는 드래그 안시킴
    	if(itemInfo.pItem)
    	{
			this._itemDragManage(item);
		}

		if(itemInfo.isDrop)
		{
			//this._itemDropManage(fullrowEle || this._getLabelItem(item)[0]);

            if(this.option.isFullSelect) this._itemDropManage(fullrowDiv);
            else this._itemDropManage(item.querySelector(':scope > label'));
		}
    }

    return item;
};


//트리 undo 히스토리 처리부분
ATree.prototype.undoTree = function()
{
	/*
	if(this.historyManager.getCurrentOffset() < 0) return;
	var historyDataArr = this.historyManager.getPosHistory(this.historyManager.getCurrentOffset());
	for(var i=historyDataArr.length-1; i>=0; i--)
	{
		var historyData = historyDataArr[i];
		switch(historyData.chgAct)
		{
			case 'append':
			{
				this.redoStack.append(historyData.chgTarget);
			}
			break;
			case 'remove':
			{
				if(historyData.oriVal.next)
				{
					$(historyData.chgTarget).insertBefore(historyData.oriVal.next);
				} 
				else historyData.oriVal.treeParent.append(historyData.chgTarget);
			}
			break;
			case 'move':
			{
				if(historyData.oriVal.next) $(historyData.chgTarget).insertBefore(historyData.oriVal.next);
				else historyData.oriVal.treeParent.append(historyData.chgTarget);
			}
			break;
			case 'text':
			{
				$(historyData.chgTarget).text(historyData.oriVal);
			}
			break;
			default:
			{
				
			}
			break;
		}		
	}
	this.historyManager.undo();	
	*/
	if(this.historyManager.getCurrentOffset() < 0) return;
	
	var historyDataArr = this.historyManager.getPosHistory(this.historyManager.getCurrentOffset());
	var history = null;
	for(var i=historyDataArr.length-1; i>=0; i--)
	{
		history = historyDataArr[i];
		history.undo.call(this, history.info);
	}
	
	this.historyManager.undo();
};

//트리 redo 히스토리 처리부분
ATree.prototype.redoTree = function()
{/*
	if(!this.historyManager.redo()) return; 
	var historyDataArr = this.historyManager.getPosHistory(this.historyManager.getCurrentOffset());
	for(var i=0; i<historyDataArr.length; i++)
	{
		var historyData = historyDataArr[i];
		switch(historyData.chgAct)
		{
			case 'append':
			{
				historyData.chgVal.treeParent.append(historyData.chgTarget);
			}
			break;
			case 'remove':
			{
				this.undoStack.append(historyData.chgTarget);
			}
			break;
			case 'move':
			{
				if(historyData.chgVal.next) $(historyData.chgTarget).insertBefore(historyData.chgVal.next);
				else historyData.chgVal.treeParent.append(historyData.chgTarget);
			}
			break;
			case 'text':
			{
				$(historyData.chgTarget).text(historyData.chgVal);
			}
			break;
			default:
			{
			}
			break;
		}
	}
	*/
	
	if(!this.historyManager.redo()) return;
	
	var historyDataArr = this.historyManager.getPosHistory(this.historyManager.getCurrentOffset());
	var history = null;
	for(var i=0; i<historyDataArr.length; i++)
	{
		history = historyDataArr[i];
		history.redo.call(this, history.info);
	}
};


// Removes the specified item from the control.
ATree.prototype.deleteItem = function(item, mergeHistory)
{
	if(!item) return;
	//this.clearSelected();
	
    //부모 아이템 백업
    var pItem = item.pItem;
    
	if(this.option.useHistory)
	{
		var info = {
			targets: item,
			undoData: {treeParent: item.parentElement, nextDom: item.nextElementSibling},
			redoData: {},
			isMerge: mergeHistory,
		};
		this.historyManager.reg(info,
		function(undoObj)
		{
			var targets = undoObj.targets;
			var undoData = undoObj.undoData;

			if(undoData.nextDom)
			{
				undoData.nextDom.before(targets);
			}
			else undoData.treeParent.appendChild(targets);
		},
		function(redoObj)
		{
			var targets = redoObj.targets;
			var redoData = redoObj.redoData;

			this.undoStack.appendChild(targets);
		});

		this.undoStack.appendChild(item);

		/*
		this.historyManager.reg(
    		new ActionInfo('remove', item, null, {treeParent: item.parentElement, next: item.nextElementSibling} ),
    		mergeHistory);
		*/

	}
    else
    {
    	//아이템 삭제
    	item.remove();
    	//부모아이템이 존재하는 경우
    	if(pItem) this._deleteHelper(pItem);	
    }
    
};


//아이템 리네임
ATree.prototype.rename = function(item, name)
{
	if(this.option.useHistory)
	{
		this.historyManager.reg({
			targets: item,
			undoData: item.name,
			redoData: name,
			isMerge: true
		},
		function(undoObj)
		{
			var targets = undoObj.targets;
			var undoData = undoObj.undoData;

			targets.textContent = undoData;
		},
		function(redoObj)
		{
			var targets = redoObj.targets;
			var redoData = redoObj.redoData;

			targets.textContent = redoData;
		});
		/*
		this.historyManager.reg(
    	new ActionInfo('text', item, name, item.name),
    	true);*/
	}

	item.name = name;
	item.querySelector(':scope > label').textContent = name;
};

ATree.prototype._insertHelper = function(pItem, isExpand)
{
	var subTree = pItem.querySelector(':scope > ul');
	//li 하위의 ul --> <li><ul></ul></li>

	//처음 하위로 추가되는 경우
	if (!subTree)
	{
		subTree = document.createElement('ul');
		subTree.setAttribute('style', 'margin:0px; padding:0px;');
		pItem.appendChild(subTree);
		this._expandEnable(pItem, subTree, isExpand);
	}

	return subTree;
};

ATree.prototype._deleteHelper = function(pItem)
{
	var subTree = pItem.querySelector(':scope > ul');
	//li 하위의 ul --> <li><ul></ul></li>

	//더이상 하위 노드가 없는 경우
	if(subTree && subTree.children.length == 0)
	{
		subTree.remove();
		this._expandDisable(pItem);
	}
};


// Removes all items from the control.
ATree.prototype.deleteAllItems = function()
{
    this.selectedItems.length = 0;
	this.treeRoot.replaceChildren();
};

//트리의 모든 선택된 아이템을 선택 해제상태로 변경한다.
ATree.prototype.clearSelected = function()
{
    //선택되어져 있던 아이템들의 배경을 원상복귀 한다.
    for(var j = 0; j < this.selectedItems.length; j++) 
    {
    	this._getLabelItem(this.selectedItems[j]).classList.remove(this.selectStyle);
    }
    
    //선택 목록에서 모두 제거
    this.selectedItems.length = 0;
};


//가장 마지막에 클릭한 아이템을 리턴
ATree.prototype.getClickedItem = function()
{
	return this.clickedItem;
};

//바로 위 아이템을 선택
ATree.prototype.selectPrevItem = function()
{
	if(this.clickedItem)
	{
		var prevItem = AUtil.findPrevByTagName(this.clickedItem, 'li');
		if(prevItem)
		{
			this.lastSelectedItem = prevItem;
			this.selectItem(prevItem);
			this.scrollToItem(prevItem);
		}	
	}
};

//바로 아래 아이템을 선택
ATree.prototype.selectNextItem = function()
{
	if(this.clickedItem)
	{
		var nextItem = AUtil.findNextByTagName(this.clickedItem, 'li');
		if(nextItem)
		{
			this.lastSelectedItem = nextItem;
			this.selectItem(nextItem);
			this.scrollToItem(nextItem);
		}	
	}
};

//아이템이 현재 선택되어 있는지를 체크하고 선택되어 있으면 포지션을 리턴한다.
ATree.prototype.getSelectedIndex = function(item)
{
	for(var i=0; i<this.selectedItems.length; i++)
		if(this.selectedItems[i] === item)	return i; 
	
	return -1;
};

//해당 아이템을 디셀렉트 시킨다.
ATree.prototype.deselectItem = function(item)
{
	var thisObj = this;
	var desIndex = this.getSelectedIndex(item);
	
	if(desIndex<0) return false;
	
	this._getLabelItem(item).classList.remove(this.selectStyle);
	/*
	$(item).children('label').css(
    {
        'background-color' : thisObj.option.bgColor,
    	'color' : thisObj.option.textColor
    });
    */
    this.selectedItems.splice(desIndex, 1);
    
    return true;
};

ATree.prototype.expandItem = function(item, isExpand)
{
    var btn = item.querySelector(':scope > .tree-expand');
	var subTree = item.querySelector(':scope > ul');

	if(!subTree) return;

	var _expanded = !_TinyDom.isHidden(subTree);

	if(isExpand===_expanded) return;

	if(isExpand)
	{
		btn.classList.add('expanded'); //btn.text('-');
        _TinyDom.show(subTree);
    }
    else
    {
    	btn.classList.remove('expanded'); //btn.text('+');
		_TinyDom.hide(subTree);
    }
	
	if(this.delegator) this.delegator.itemExpandManage(isExpand, item);

	/*	
	switch(type)
	{
		case ATree.EXPAND_ALL:
		break;
		
		case ATree.EXPAND_CHILD:
		break;
		
		case ATree.EXPAND_COLLAPSE:
		break;
	}
	*/
};

//data로 item 을 찾는다.
//바로 자식 아이템에서만 찾는다.
ATree.prototype.findChildItemByData = function(data, pItem, compare)
{
    var ret = null;

	if(compare)
	{
		for(const el of this.getChildItems(pItem))
		{
			if(compare(el.data, data))
			{
				ret = el;
				break;
			}
		}
	}

	else
	{
		for(const el of this.getChildItems(pItem))
		{
			if(el.data == data)
			{
				ret = el;
				break;
			}
		}
	}

    return ret;
};

//name 으로 item 을 찾는다.
//바로 자식 아이템에서만 찾는다.
ATree.prototype.findChildItemByName = function(name, pItem)
{
    var ret = null;

    for(const el of this.getChildItems(pItem))
    {
        if (el.name == name)
        {
            ret = el;
            break;
        }
    }

    return ret;
};


//data로 item 을 찾는다.
//pItem 밑으로 모든 아이템에서 찾는다.
ATree.prototype.findItemByData = function(data, pItem, compare)
{
    var ret = null, start = pItem ? pItem : this.treeRoot;

	if(compare)
	{
		for(const el of start.querySelectorAll('li'))
		{
			if(compare(el.data, data))
			{
				ret = el;
				break;
			}
		}
	}

	else
	{
		for(const el of start.querySelectorAll('li'))
		{
			if(el.data == data)
			{
				ret = el;
				break;
			}
		}
	}

    return ret;
};

//name 으로 item 을 찾는다.
//pItem 밑으로 모든 아이템에서 찾는다.
ATree.prototype.findItemByName = function(name, pItem)
{
    var ret = null, start = pItem ? pItem : this.treeRoot;

    for(const el of start.querySelectorAll('li'))
    {
        if (el.name == name)
        {
            ret = el;
            break;
        }
    }

    return ret;
};

/*
ATree.prototype.getChildItems = function(pItem)
{
    var ret = new Array();
    var start = pItem ? $(pItem) : this.$root;

    start.children('ul').children('li').each(function()
	//start.children().each(function()
    {
    	ret.push(this);
    });
    return ret;
};
*/


//asoocool
//2017년 6월 13일 새롭게 수정한 버전
// $root 는 <ul> 이다.... 루트도 <li>가 되도록 구조 변경하기
//다른 하위 아이템은 <li>
ATree.prototype.getChildItems = function(pItem)
{
	if(pItem)
	{
		var ul = pItem.querySelector(':scope > ul');
		return ul ? ul.querySelectorAll(':scope > li') : [];
	}
	else return this.treeRoot.querySelectorAll(':scope > li');
};

ATree.prototype.getFirstChildItem = function(pItem)
{
	var items = this.getChildItems(pItem);
	return items[0];
};

ATree.prototype.getLastChildItem = function(pItem)
{
	var items = this.getChildItems(pItem);
	return items[items.length - 1];
};

ATree.prototype.isMovePossible = function(moveItem, pItem)
{
    var ret = true;

    for(const el of this.getChildItems(pItem))
    {
		if ((el.name == moveItem.name) && (moveItem.pItem !== pItem))
        {
            ret = false;
            break;
        }
    }

    return ret;
};

ATree.prototype.findItemsByNameLike = function(name, pItem)
{
    var ret = [];
    var start = pItem ? pItem : this.treeRoot;

	name = name.toLowerCase();

    for(const el of start.querySelectorAll('li'))
    {
		//BKS/20171213
        //if (el.name.toUpperCase().indexOf(name.toUpperCase())>-1)
		if(el.textContent.toUpperCase().indexOf(name.toUpperCase())>-1)
		{
			ret.push(el);
		}
		/*
		if(el.name)
		{
			if(el.name.toLowerCase().indexOf(name)>-1)
			{
				ret.push(el);
			}
		}*/
    }

    return ret;
};

//getParent함수명변경 - JH
ATree.prototype.getParentItem = function(item)
{
	if(item) return item.pItem;
};

ATree.prototype.getChildren = function(pItem, callback)
{
    var items = this.getChildItems(pItem);
    for(let i = 0; i < items.length; i++)
    {
        if(callback.call(items[i], i, items[i]) === false) break;
    }
};

ATree.prototype._expandEnable = function(expItem, subTree, isExpand)
{
    //접기,펴기 버튼 활성화
    var btn = expItem.querySelector(':scope > .tree-expand'), thisObj = this;

    btn.style.visibility = 'visible';

    if(isExpand)
	{
		btn.classList.add('expanded'); //btn.text('-');
	}
    else
    {
        btn.classList.remove('expanded'); //btn.text('+');
        _TinyDom.hide(subTree);
    }

    //접기,펴기 버튼 클릭 처리
	btn.addEventListener('click', function()
    {
		var _isExpand = _TinyDom.isHidden(subTree);

        if (_isExpand)
        {
            btn.classList.add('expanded'); //$(this).text('-');
            _TinyDom.show(subTree);
        }
        else
        {
            btn.classList.remove('expanded'); //$(this).text('+');
            _TinyDom.hide(subTree);
        }

		if(thisObj.delegator) thisObj.delegator.itemExpandManage(_isExpand, expItem);
    });
};

ATree.prototype._expandDisable = function(expItem)
{
    //접기,펴기 버튼 비활성화
    var btn = expItem.querySelector(':scope > .tree-expand');
    if(btn)
    {
        var newBtn = btn.cloneNode(true);
        btn.replaceWith(newBtn);
        newBtn.style.visibility = 'hidden';
    }
};

	
//item 으로 트리를 선택한다. li
ATree.prototype.selectItem = function(item, isMulti, e)
{
	let thisObj = this, items = [item];
	
	this.clickedItem = item;
	
	if(this.option.isSingleSelect || !isMulti )
	{
		this.clearSelected();
	} 
	
	if(e && e.shiftKey && !this.option.isSingleSelect)
	{
		//루트 아이템이 포함되어 있으면 시프트 선택 안되도록 막기
		if(this.isExistRoot() || !item.pItem) return;
		
		//this._getLabelItem(item).addClass(this.selectStyle);
		items = this._getRangeItems(this.lastSelectedItem, item);
	}
	else
	{
		//this._getLabelItem(item).addClass(this.selectStyle);
		this.lastSelectedItem = item;
	}
	
	items.forEach(item => {
		if(this.getSelectedIndex(item) < 0) {
			this._getLabelItem(item).classList.add(this.selectStyle);
			this.selectedItems.push(item);
		}
	});

	if(!this.option.isMaintainOrder) {
		this.selectedItems = [];
		for(const el of this.element.querySelectorAll('.'+this.selectStyle)) {
			//하나의 아이템에 선택 클래스를 추가하는 label이 2개라서
			//selectedItems에 같은 내용이 2개 생겨 svn에서 제외메뉴 처리가 되어 수정
			let node = this.option.isFullSelect ? el : el.parentNode

			if(this.getSelectedIndex(node) < 0)
				this.selectedItems.push(node);
		}
	}
};

ATree.prototype.isExistRoot = function()
{
	for(var i = 0; i<this.selectedItems.length; i++)
	{
		if(!this.selectedItems[i].pItem) return true;
	}
	return false;
};

ATree.prototype._getRangeItems = function(stndItem, lastItem)
{
	//같은 item을 선택했을시 리턴시킴 
	if((this.clickedItem === this.lastSelectedItem) || (stndItem === lastItem)) return [lastItem];
	
	let retArr;
	let totLab = Array.from(this.treeRoot.getElementsByTagName('li'));
    let idxArr = [totLab.indexOf(stndItem), totLab.indexOf(lastItem)];
    let isReverse = false;
    if(idxArr[0] > idxArr[1]) {
        idxArr = [ idxArr[1], idxArr[0] ];
        isReverse = true;
    }

    retArr = totLab.splice(idxArr[0], idxArr[1]-idxArr[0]+1);
    if(isReverse) retArr.reverse();

	return retArr;
};

//clkObj is li
//기본적으로 mousedown 시  바로 선택
//ctrl, shift 키가 눌려졌을 경우는 mouseup 시 선택
//선택되어져 있는 아이템을 다시 선택하는 경우는 mouseup 시 선택 
ATree.prototype._itemClickManage = function(clkEle)
{
    var thisObj = this;

    clkEle.addEventListener('mousedown', function(e)
    {

		AComponent.setFocusComp(thisObj);

    	//mouse left button
    	if(e.which==1)
        {
			//if(e.ctrlKey && thisObj.getSelectedIndex(clkEle)>-1)

            //컨트롤키가 눌려있거나 이미 선택되어 있는 아이템을 마우스 다운한 경우
            //마우스 업에서 처리한다
            if(thisObj.getSelectedIndex(clkEle)>-1)
        	{
                thisObj.upSelect = true;
        	}
        	else
        	{
        		thisObj.selectItem(clkEle, e.ctrlKey, e);
				thisObj.reportEvent('select', clkEle, e);
        	}

            //return false;
			e.stopPropagation();
    	}
    });

    //contextMenu plug-in 사용을 위해 따로 분리 bind('contextmenu')
    clkEle.addEventListener('mouseup', function(e)
    {
    	//mouse left button
    	if(e.which==1)
    	{
			if(thisObj.upSelect)
    		{
				thisObj.upSelect = false;

                if(e.ctrlKey) thisObj.deselectItem(clkEle);
                else thisObj.selectItem(clkEle, false, e);

                thisObj.reportEvent('select', clkEle, e);
    		}
    	}

        //mouse right button
        else if(e.which==3)
        {
   			if(thisObj.getSelectedIndex(clkEle)<0)
   				thisObj.selectItem(clkEle, e.ctrlKey, e);

  			thisObj.reportEvent('select', clkEle, e);

       		//return false;
			e.stopPropagation();
        }
    });

};

ATree.prototype._itemDragManage = function(dragEle)
{
	/*
	var thisObj = this;
	
	$(dragEle).draggable(
	{
		scope: thisObj.dnd_scope,
		helper: function(e)
		{
			var temp = $('<div></div>');
			temp.css(
			{
				color:'white',
				'height': '8px',
				'width': '20px',
				'height': '20px',
				'background': '100% 100% no-repeat url('+thisObj.option.dragIcon+')',
				'border-radius': '5px',
				'text-align': 'center',
				'opacity': '0.9'
			});
			temp.text(thisObj.selectedItems.length);
			return temp;
		},
		
		cursorAt: { left:0, top:10 },
		
		start: function(e)
		{
			thisObj.upSelect = false;
		},
		
		stop: function(e)
		{
			window.clearTimeout(thisObj.dropTimer);
    	}
	});
	*/
	
	this.dndMgr.regDrag(dragEle, this);

};

ATree.prototype.onDragStart = function(dndMgr, event)
{
    this.upSelect = false;
};

ATree.prototype.onDragEnd = function(dndMgr, event)
{
    
};

ATree.prototype._itemDropManage = function(dropEle)
{
	/*
	var $dropEle = $(dropEle);
	var dropItem = $dropEle.children('label'), thisObj = this;
	
	dropItem.css('display', 'inline-block');
	dropItem.droppable(
	{
		scope: thisObj.dnd_scope,
		over: function(e, ui)
		{
			thisObj.dropTimer = window.setTimeout(function()
			{
				//if(dropEle.icon == Define.ITEM_FOLDER || dropEle.isGroup)
				if(dropEle.isGroup)
				{
					dropItem.removeClass(thisObj.overStyle);
					dropEle.isAfter = true;
					
					$dropEle.addClass(thisObj.afterStyle);	
				}

			}, 1500);
	      			
			$(this).addClass(thisObj.overStyle);
		},
		
	    out: function(e, ui)
	    {
	    	window.clearTimeout(thisObj.dropTimer);
			
	    	$dropEle.removeClass(thisObj.afterStyle);
	    	$(this).removeClass(thisObj.overStyle);
			
			dropEle.isAfter = false;
	  	},
	
	  	drop: function(e, ui)
	  	{ 
	  		window.clearTimeout(thisObj.dropTimer);
			
			$dropEle.removeClass(thisObj.afterStyle);
	  		$(this).removeClass(thisObj.overStyle);
			
	  		//드롭하는 대상이 선택되어 있거나, 부모가 선택되어 있으면 이동시키지 않음
	  		if($(this).hasClass(thisObj.selectStyle) || $($(this).parent()[0].pItem).children('label').hasClass(thisObj.selectStyle)) return;
	  		
			thisObj.reportEvent('drop', {dropItem: dropEle, dragItems: thisObj.selectedItems}, e);
			
	       	//if(thisObj.mListeners.dropListener) thisObj.mListeners.dropListener({dropItem: dropEle, dragItems: thisObj.selectedItems});
        	//else thisObj.moveItem(dropEle, thisObj.selectedItems, ((dropEle.icon > Define.ITEM_FOLDER) || dropEle.isAfter));
			
			dropEle.isAfter = false;
	  	}
	});
	*/
	
	this.dndMgr.regDrop(dropEle, this);
};

ATree.prototype.onDragEnter = function(dndManager, event)
{
    //var dropEle = event.target;

};

ATree.prototype.onDragLeave = function(dndManager, event)
{
    //var dropEle = event.target;

    //var $dropItem = $(dropEle).children('label');
};

ATree.prototype.onElementDrop = function(dndManager, event, dragElement)
{
    var dropEle = event.target;

    //여기서 dropEle 는 children('label') 이다.
    var parent = dropEle.parentElement;

    //드롭하는 대상이 선택되어 있거나, 부모가 선택되어 있으면 이동시키지 않음
    if(dropEle.classList.contains(this.selectStyle) || dropEle.closest('li.' + this.selectStyle)) return;

    this.reportEvent('drop', {dropItem: parent, dragItems: this.selectedItems}, event);
    
};


ATree.prototype._keyDownManage = function(e)
{
	var selItem = this.getClickedItem();
	switch(e.which)
	{
		case afc.KEY_UP:
			e.preventDefault();
			this.selectPrevItem();
		break;
		
		case afc.KEY_LEFT:
			e.preventDefault();
			var selUl = selItem ? selItem.querySelector(':scope > ul') : null;
			if(selUl && !_TinyDom.isHidden(selUl))
			{
				this.expandItem(selItem, false);
				this.scrollToItem(selItem);
			}
			else if(selItem.pItem)
			{
				this.selectItem(selItem.pItem);
				this.scrollToItem(selItem.pItem);
			}
		break;
		
		case afc.KEY_DOWN: 
			e.preventDefault();
			this.selectNextItem();
		break;
		
		case afc.KEY_RIGHT: 
			e.preventDefault();
			this.expandItem(selItem, true);
			this.scrollToItem(selItem);
		break;
	}
};


ATree.prototype.scrollToItem = function(item)
{
	/*
	var height = this.$ele.height();
	var top = this.$ele.offset().top;
	
	//아이템이 트리보다 위
	if($(item).offset().top < top)
	{
		//현재 스크롤top - ( 트리top - 아이템top + 10 )
		this.$ele.scrollTop(this.$ele.scrollTop() - (top - $(item).offset().top + 10));
	}
	//아이템이 트리보다 아래
	else if($(item).offset().top > top+height-30)
	{
		//현재 스크롤top + ( 아이템top - ( 트리top + 트리height ) + 30 )
		this.$ele.scrollTop(this.$ele.scrollTop()+($(item).offset().top-(top+height)+30));
	}
	*/
	item.scrollIntoView({block: "center", inline: "nearest"})
};

ATree.prototype.changeIcon = function(item, icon, iconType)
{
	this._changeIconByUrl(item, icon, iconType);
};

ATree.prototype._changeIconByCss = function(item, icon, iconType)
{
	var iconEle = item.iconEle;
	iconEle.classList.add(this.iconMap);
	Object.assign(iconEle.style,
	{
		'vertical-align': 'middle',
		'margin-right': '2px',
		display: 'inline-block', width: '16px', height: '16px',
		'background-position': this._getBgPos(icon, iconType),//(-16 * icon) + 'px 0px',
		'background-size': 'auto'
	});

	item.icon = icon;
    item.iconType = iconType;
};

ATree.prototype._changeIconByUrl = function(item, icon, iconType)
{
	var iconEle = item.iconEle;
	Object.assign(iconEle.style,
	{
		'vertical-align': 'middle',
		'margin-right': '2px',
		display: 'inline-block', width: '16px', height: '16px',
		'background-image': this.iconMap,
		'background-position': this._getBgPos(icon, iconType),//(-16 * icon) + 'px 0px',
		'background-size': 'auto'
	});

	item.icon = icon;
    item.iconType = iconType;
};

ATree.prototype._getBgPos = function(icon, iconType)
{
    /*
	var bgPos = [];

	if(typeof(icon) == 'object')
	{
		//보통 0번째에 해당하는 아이콘이 메인이므로 역순으로 아이콘을 배치한다.
// 		for(var i=0; i<icon.length; i++)
		for(var i=icon.length-1; i>-1; i--)
		{
			bgPos.push((-16 * icon[i]) + 'px 0px');
		}
	}
	else
	{
		bgPos.push((-16 * icon) + 'px 0px');
	}

	return bgPos.join(', ');
    */

    let bgPos = [];

	if(iconType != undefined) bgPos.push((-16 * iconType) + 'px 0px');

	if(typeof(icon) == 'object')
	{
		for(let i=0; i<icon.length; i++)
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

ATree.prototype.isExpand = function(item)
{
	return Boolean(item.querySelector(':scope > .expanded'));
}