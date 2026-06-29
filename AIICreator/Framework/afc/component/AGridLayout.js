
/**
 * @author asoocool
 */

//--------------------------------------------------------------------
//	insertView 함수를 호출하여 ViewDirection 방향으로 뷰를 추가한다.
//	추가하려는 뷰의 높이가 100% 이면 남은 공간 전체를 차지한다.
//	auto 나 픽셀을 직접 지정한 경우는 원하는 높이가 된다.
//--------------------------------------------------------------------
class AGridLayout extends ALayout
{
	constructor()
	{
		super()
	
		//this.$table = null;
		//this.$body = null;
		//this.$colGroup = null;
		this.table = null;
		this.body = null;
		this.colGroup = null;
	}

    updatePosition(pWidth, pHeight)
    {
	    super.updatePosition(pWidth, pHeight)

        if(this.resizeMgrH) 
        {
            this.resizeMgrH.updateBarPos();
            this.resizeMgrV.updateBarPos();
        }
    }

	_makeResizeBar(isShowSizeInfo)
	{
        if (typeof ResizeManager == 'undefined') 
        {
            alert('Check ResizeManager.js and VanillaUI.js');
            return;
        }

        this.resizeMgrH = new ResizeManager()
        this.resizeMgrV = new ResizeManager(true)

        this.resizeMgrH.showSizeInfo(isShowSizeInfo)
        this.resizeMgrV.showSizeInfo(isShowSizeInfo)

        const scaleGetter = () =>
		{
			const layView = window.theApp_?.getLayoutView();
			return layView ? layView.layWorkView.adjCanvas.curScaleVal : 1;
		};

        this.resizeMgrH.setScaleGetter(scaleGetter)
        this.resizeMgrV.setScaleGetter(scaleGetter)

        this.resizeMgrH.setResizeCallback((inx, moveSize)=> { this.setColSize(inx, moveSize) })
        this.resizeMgrV.setResizeCallback((inx, moveSize)=> { this.setRowSize(inx, moveSize) })

        setTimeout(()=>
        {
            //this.resizeMgrH.enableResize(this.$ele, this._getNonMergeCols())
            //this.resizeMgrV.enableResize(this.$ele, this.$body.children('tr'))
            this.resizeMgrH.enableResize(this.element, this._getNonMergeCols())
            this.resizeMgrV.enableResize(this.element, this.body.children)

        }, 0)
	}

	//레이아웃의 셀이 컴포넌트로 가득 찼는지 
	checkFull()
	{
        for(const td of this._findChildTd()) 
        {
            if (td.style.display != 'none' && td.children.length == 0) 
                return false
        }

		return true
	}
	
}

window.AGridLayout = AGridLayout

AGridLayout.CONTEXT = 
{
	tag: '<div data-base="AGridLayout" data-class="AGridLayout" class="AGridLayout-Style" >' + 
			//'<table cellpadding="0" cellspacing="0" ><colgroup><col><col></colgroup>' + 	//border="1"
    		//'<tbody><tr><td></td><td></td></tr><tr><td></td><td></td></tr></tbody></table></div>',	//2 by 2
			'<table cellpadding="0" cellspacing="0" ><colgroup><col width="150px"><col></colgroup>' + 	//border="1"
    		'<tbody><tr height="150px"><td></td><td></td></tr><tr><td></td><td></td></tr></tbody></table></div>',	//2 by 2
			
			//<colgroup><col><col></colgroup>
/*
	tag: '<div data-base="AGridLayout" data-class="AGridLayout" class="AGridLayout-Style" >' + 
			'<table cellpadding="0" cellspacing="0" border="1">' + 	//border="1"
    		'<tbody></tbody></table></div>',	//2 by 2
*/
    defStyle: 
    {
        width:'300px', height:'300px'  
    },

    events: []
};

AGridLayout.prototype.init = function(context, evtListener)
{
	ALayout.prototype.init.call(this, context, evtListener);

	//this.$table = this.$ele.children(); 
	//this.$body = this.$table.children('tbody');
	//this.$colGroup = this.$table.children('colgroup');
	this.table = this.element.firstElementChild; 
	this.colGroup = this.table.children[0];
	this.body = this.table.children[1];

    this.setOption(
	{
		isEnableResize : this.getAttr('data-enable-resize'),			//헤더를 숨길지
        isShowSizeInfo : this.getAttr('data-show-sizeinfo'),			//헤더를 숨길지
	}, true);    
    
    //if(this.isDev()) this._makeResizeBar()
    
    //개발환경인 경우 두 옵션을 모두 활성화
    if(this.isDev())
    {
        this.option.isEnableResize = true
        this.option.isShowSizeInfo = true
    }

    if(this.option.isEnableResize) this._makeResizeBar(this.option.isShowSizeInfo)
	
	//if(this.isDev()) this.$ele.addClass('dev_AGridLayout-Style'); //add ukmani100
	//else this.$ele.removeClass('dev_AGridLayout-Style');

	this.initLayoutComp(evtListener);
};

AGridLayout.prototype._getNonMergeCols = function()
{
    let cnt = this.getRowCount(), cols, isMerge

    for(let i=0; i<cnt; i++)
    {
        isMerge = false

        /*
        $cols = $(this.getRow(i)).children('td')
        $cols.each(function()
        {
            if(this.style.display == 'none') 
            {
                isMerge = true
                return false
            }
        })
        */

        cols = this.getRow(i).children
        for(const ele of cols) //cols.each(function()
        {
            if(ele.style.display == 'none') 
            {
                isMerge = true
                break
            }
        }

        if(!isMerge) break;
    }

    return cols
}

// td 내에서 width 를 사용한 작업물의 하위호환을 위한 작업. 
// 전부 colgroup 내에서 width 를 설정하는 상황이 된다면 이 코드는 삭제 필요.
AGridLayout.prototype.convertColInfo = function()
{
    /*
	var $tags= $('<colgroup></colgroup>');
	
	var cols = this.getColumnCount();
	
	for(var index = 0; index < cols; ++index)
	{
		var $td = $(this.getCell(0,index));
		
		var width = $td.get(0).style.width;
		
		var $tag = $('<col>');
		
		if(width.length > 0)
			$tag.attr('width', isNaN(width)? width:width+'px');
		
		$tags.append($tag);
	}	
	
	this.$table.append($tags);
	
	this.$colGroup = this.$table.children('colgroup');	
    */
	const tags = document.createElement('colgroup');
	const cols = this.getColumnCount();
	
	for(let index=0; index<cols; ++index)
	{
		const td = this.getCell(0,index);
		const tag = document.createElement('col');
        if(td)
        {
            let width = td.style.width;
            
            if(width)
            {
                // 숫자만 있으면 px 보정
                if (!isNaN(width)) width += 'px';
                tag.setAttribute('width', width);
            }
        }
		
		tags.appendChild(tag);
	}
	
    this.table.insertBefore(tags, this.table.firstChild);

	this.colGroup = tags;
}

AGridLayout.prototype.initLayoutComp = function(evtListener)
{
	//자신 내부에 있는 컴포넌트들의 init 은 레이아웃이 담당한다.
	const container = this.getContainer()
	const rootView = this.getRootView()
	const parentView = this.getParent()

	//this._findChildTd().each(function()
    for(const td of this._findChildTd())
	{
        /*
		$item = $(this);
		
		$item.children().each(function()
		{
			acomp = AComponent.realizeContext(this, container, rootView, parentView, evtListener);
			acomp.layoutItem = $item[0];
			acomp.owner = thisObj;
			
			if(acomp.baseName != 'AView' && container && container.tabKey) container.tabKey.addCompMap(acomp, rootView.owner);
		});
        */

        for (const child of td.children)
		{
			const acomp = AComponent.realizeContext(child, container, rootView, parentView, evtListener);

			acomp.layoutItem = td;
			acomp.owner = this;

			if (acomp.baseName !== 'AView' && container?.tabKey)
				container.tabKey.addCompMap(acomp, rootView.owner);
		}
	}
};

/*
AGridLayout.prototype.createLayout = function(rowCount, colCount, rowSizeArr, colSizeArr)
{
	let strRow = '', strCol = '', strColGroup ='' , i;
	
	for(i=0; i<colCount;i++)
		strColGroup += '<col>';	
	
	//strColGroup = '<colgroup>'+strColGroup+'</colgroup>';	
		
	for(i=0; i<colCount; i++)
		strCol += '<td></td>';

	for(i=0; i<rowCount; i++)
		strRow += '<tr>' + strCol + '</tr>';
		
	//this.$body.append(strRow);
	//this.$colGroup.append(strColGroup);
	this.body.append(strRow);
	this.colGroup.append(strColGroup);
	
	this.setLayoutSize(rowSizeArr, colSizeArr);
};
*/
AGridLayout.prototype.createLayout = function(rowCount, colCount, rowSizeArr, colSizeArr)
{
    const tbodyFrag = document.createDocumentFragment();
    const colFrag = document.createDocumentFragment();

    // colgroup 생성
    for (let i = 0; i < colCount; i++) {
        colFrag.appendChild(document.createElement('col'));
    }

    // row / col 생성
    for (let r = 0; r < rowCount; r++) 
    {
        const tr = document.createElement('tr');

        for (let c = 0; c < colCount; c++) {
            tr.appendChild(document.createElement('td'));
        }

        tbodyFrag.appendChild(tr);
    }

    this.body.appendChild(tbodyFrag);
    this.colGroup.appendChild(colFrag);
	
	this.setLayoutSize(rowSizeArr, colSizeArr);
};

//width, height 파라미터를 생략하면 100% 로 셋팅된다.
AGridLayout.prototype.layComponentAt = function(acomp, row, col, width, height)
{
	this.layComponent(acomp, this.getCell(row, col), width, height);
};

//cell 파람 내부에 posEle 란 값이 셋팅되어져 있으면 
//cell 내부에서 posEle 앞에 추가된다.
AGridLayout.prototype.layComponent = function(acomp, cell, width, height)
{
    //undo redo 시 오류로 제거, 원래 사이즈대로 추가되도록
	//if(acomp.element.style.width!='auto' && width==undefined) width = '100%';
	//if(acomp.element.style.height!='auto' && height==undefined) height = '100%';
	
	//cell 이 null 이면 빈자리를 찾아 그 곳에 추가한다.
	if(!cell)
	{
        const tdArr = this._findChildTd()

		for(const td of tdArr)
		{
			if(td.style.display != 'none' && td.children.length==0)
			{
				cell = td;
				break;
			}
		}
		
		//빈 자리가 없으면 추가하지 않는다.
		if(!cell) 
		{
			//cell = tdArr[0];

            return
		}
	}

    /*
	acomp.$ele.css(
	{
		//'position': 'static',
		'position': 'relative',
		'left': '0px', 'top':'0px',
		'right': '', 'bottom':'',
		'width': width, 'height': height
	});
    */
    
	_TinyDom.css(acomp.element, 
    {
		//'position': 'static',
		'position': 'relative',
		'left': '0px', 'top':'0px',
		'right': '', 'bottom':'',
		'width': width, 'height': height
	});
	
	//posEle 값이 셋팅되어져 있으면 그 앞으로 추가
	if(cell.posEle) 
	{
		cell.posEle.before(acomp.element);
		cell.posEle = undefined;
	}
	else cell.appendChild(acomp.element);
	
	acomp.setParent(this.getParent());
	
	acomp.layoutItem = cell;
	acomp.owner = this;

    if(this.resizeMgrV) 
    {
        //this.resizeMgrH.updateBarPos();
        this.resizeMgrV.updateBarPos();
    }

};

AGridLayout.prototype.getAllLayoutComps = function()
{
    /*
	var retArr = [], $child;
	this._findChildTd().each(function()
	{
		$(this).children().each(function()
		{
			if(this.acomp) retArr.push(this.acomp);
		});
	});
	
	return retArr;
    */

	const retArr = [];
	this._findChildTd().forEach((td)=>
	{
		for(const child of td.children)//.each(function()
		{
			if(child.acomp) retArr.push(child.acomp);
		}
	});
	
	return retArr;
};

AGridLayout.prototype.eachChild = function(callback, isReverse)
{
    /*
	var $children;
	
	if(isReverse) $children = $(this._findChildTd().get().reverse());
	else $children = this._findChildTd();

	$children.each(function(inx)
	{
		var children = $(this).children(),
			child;
		for(var i=0; i<children.length; i++)
		{
			child = children[i];
			if(!child || !child.acomp) continue;
			if(callback(child.acomp, inx)==false) return false;
		}
	});
    */

    // this._findChildTd() → td 목록을 반환한다고 가정 (NodeList / Array)
    let tds = this._findChildTd();

    // NodeList 대비
    tds = Array.from(tds);

    if (isReverse) tds.reverse();

    for(let inx=0; inx<tds.length; inx++)
    {
        for(const child of tds[inx].children)
        {
            if(!child || !child.acomp) continue;

            // callback 이 false 반환하면 전체 중단
            if(callback(child.acomp, inx) === false) return;
        }
    }    
};

AGridLayout.prototype.getLayoutComp = function(row, col)
{
	//var $cell = $(this.getCell(row, col));
	//return $cell.children().get(0).acomp;
	const cell = this.getCell(row, col);
	return cell.children[0].acomp;
};

//deprecated
AGridLayout.prototype.getColGroupItems = function() 
{ 
    //return this.$colGroup.children().length; 
    return this.colGroup.children.length; 
}

AGridLayout.prototype.getColumnCount = function()
{
	//return this.$colGroup.children().length;
    return this.colGroup.children.length;
}

AGridLayout.prototype.getColGroupItem = function(col)
{
	//return this.$colGroup.children().eq(col);
    return this.colGroup.children[col];
}

AGridLayout.prototype.getCell = function(row, col)
{
    //var $row = this.$body.children().eq(row); //tr
	//return $row.children().get(col);	//td
    const rowEle = this.body.children[row]; //tr
	return rowEle.children[col];	//td
};

AGridLayout.prototype.getRow = function(row)
{
    //return this.$body.children().get(row); //tr
    return this.body.children[row]; //tr
};

AGridLayout.prototype.insertRow = function(row , isAfter)
{
    /*
	var $row = $(this.getRow(row)),
		count = $row.children().length, strCol = '';

	var height = this.getRowSize(row);

	for(var i=0; i<count; i++)
		strCol += '<td></td>';

	strCol = '<tr>' + strCol + '</tr>';

	if(isAfter) $row.after(strCol);
	else $row.before(strCol);
	
	if(height!=undefined)
		this.setRowSize(isAfter? row+1:row, height);

    if(this.resizeMgrV)
        this.resizeMgrV.updateResizeEle(this.$body.children('tr'))
    */

	let rowEle = this.getRow(row),
		count = rowEle.children.length, trEle = document.createElement('tr');

	let height = this.getRowSize(row);

	for(let i=0; i<count; i++)
		trEle.appendChild(document.createElement('td'))

	if(isAfter) rowEle.after(trEle);
	else rowEle.before(trEle);
	
	if(height!=undefined)
		this.setRowSize(isAfter? row+1:row, height);

    if(this.resizeMgrV)
        this.resizeMgrV.updateResizeEle(this.body.children)

};

AGridLayout.prototype.insertCol = function(col, isAfter)
{
	let width = this.getColSize(col);
	//var $colGroupItem = this.getColGroupItem(col);
    let colGroupItem = this.getColGroupItem(col);
	
	col++;
	
	//let $ret = this._findChildTd('td:nth-child('+col+')');
    let retArr = this._findChildTd(col);
	
	if(isAfter)
	{
		//$ret.after('<td></td>');
		//$colGroupItem.after('<col>');
		colGroupItem.after(document.createElement('col'));
        _TinyDom.group(retArr, td => td.after(document.createElement('td')) )
	} 
	else 
	{
		colGroupItem.before(document.createElement('col'));
        //ret.before(document.createElement('td')); 
        _TinyDom.group(retArr, td => td.before(document.createElement('td')) )
	}

    if(width!=undefined)
	    this.setColSize(isAfter? col: col-1, width);

    if(this.resizeMgrH)
        this.resizeMgrH.updateResizeEle(this._getNonMergeCols())
};

AGridLayout.prototype.removeRow = function(row)
{
	//var $row = $(this.getRow(row));
	//$row.remove();
	const rowEle = this.getRow(row);
	rowEle.remove();

    if(this.resizeMgrV)
        this.resizeMgrV.updateResizeEle(this.body.children)
}

// 숨겨진 cell 에 colspan 이 존재하면 안됨!!
AGridLayout.prototype.removeCol = function(col)
{
	var rowCount = this.getRowCount();
	/*
	// colspan 이거나 colspan 에 의해 가려진 cell 처리
	for(var index = 0; index < rowCount; ++index)
	{
		var $td = $(this.getCell(index, col));

		// 숨겨져있었던 cell 이면 colspan 카운트 감소
		if($td.css('display')=='none')
		{
			this.reduceColSpanCount(index,col);
			continue;
		}
			
		// colspan 인경우 colspan cell 재정의
		var colspan = $td.attr('colspan');
		if(colspan!=undefined) 
		{
			var $nextTd = $(this.getCell(index, (col*1)+1))
			
			var result = colspan -1;
			if(result <= 1) $nextTd.removeAttr('colspan');
			else $nextTd.attr('colspan', result);
			
			$nextTd.show();
		}
	}
	*/
	 
	this.getColGroupItem(col)?.remove();
	
	const removeCol = (col*1) +1;
	// 정리된후 col 삭제
	//this._findChildTd('td:nth-child('+removeCol+')').remove();	
    _TinyDom.group(this._findChildTd(removeCol), td => td.remove())

    if(this.resizeMgrH)
        this.resizeMgrH.updateResizeEle(this._getNonMergeCols())

}

AGridLayout.prototype.reduceColSpanCount = function(row, col)
{	
	const start = col-1;
	//let  end = 0;
	
	for(let index=start; index >= 0; --index)
	{
		//var $td = $(this.getCell(row,index))
        const td = this.getCell(row,index)
		const colspan = td.getAttribute('colspan');
	
		if(colspan!=undefined) 
		{
			const result = colspan - 1;

			if(result <= 1) td.removeAttribute('colspan');
			else td.setAttribute('colspan', result);
		}
	}
}

AGridLayout.prototype.setLayoutSize = function(rowSizeArr, colSizeArr)
{
	if(rowSizeArr)
	{
		for(let i=0; i<rowSizeArr.length; i++)
			this.setRowSize(i, rowSizeArr[i]);
	}
	
	if(colSizeArr)
	{
		for(let i=0; i<colSizeArr.length; i++)
			this.setColSize(i, colSizeArr[i]);
	}
};

AGridLayout.prototype.setColSize = function(col, size)
{
	if(size == null) return;	//0.5의 $.attr(key, undefined) no-op 의미 유지

	if(!isNaN(size) && size != '') size += 'px';

	this.getColGroupItem(col).setAttribute('width', size);

	//$(this.getCell(0, col)).width(size);

    if(this.resizeMgrH) this.resizeMgrH.updateBarPos()
};

AGridLayout.prototype.setRowSize = function(row, size)
{
    if(size == null) return;	//0.5의 $.attr(key, undefined) no-op 의미 유지

    if(!isNaN(size) && size != '') size += 'px';

    //$(this.getRow(row)).attr('height', size);
    this.getRow(row).setAttribute('height', size);

    if(this.resizeMgrV) this.resizeMgrV.updateBarPos()
};

AGridLayout.prototype.setLayoutPadding = function(padding)
{
	//this.$table.attr('cellpadding', padding);
	//this._findChildTd().css('padding', padding); //add ukmani100

    _TinyDom.group(this._findChildTd(), td => td.style.padding = padding)
};

//add ukmani100
AGridLayout.prototype.setCellPadding = function(row, col, padding)
{	
	//$(this.getCell(row, col)).css('padding', padding);
    this.getCell(row, col).style.padding = padding;
};

AGridLayout.prototype.setLayoutAlign = function(align)
{
	//this.$table.css('text-align', align);
    this.table.style['text-align'] = align;
};

AGridLayout.prototype.setCellAlign = function(row, col, align)
{
	//var $cell = $(this.getCell(row, col));
	//$cell.css('text-align', align);
	const cell = this.getCell(row, col);
	cell.style['text-align'] = align;
	
};

AGridLayout.prototype.setCellValign = function(row, col, align)
{
	//var $cell = $(this.getCell(row, col));
	//$cell.css('vertical-align', align);
	const cell = this.getCell(row, col);
	cell.style['vertical-align'] = align;
};

//----------------------------------------------------------------------

AGridLayout.prototype.mergeRow = function(row, col, span)
{
	//const rowEle = $(this.getRow(row));
    const rowEle = this.getRow(row);

	const start = row + 1;
	const end = start + span -1;
	
	let totalSpan = span;
	
	//const startCol = rowEle.children().eq(col);
    const startCol = rowEle.children[col];
	
	for(let index = start; index < end; ++index)
	{
		//const $currow = $(this.getRow(index));
        //var $curCol = $currow.children().eq(col);
        const currow = this.getRow(index);
		const curCol = currow.children[col];
		
		if(index == end-1)
		{
			const addSpan = curCol.getAttribute('rowspan');
			if(typeof addSpan != 'undefined')
				totalSpan += (addSpan - 1);
		}
		
        //startCol.append($curCol.children());
		startCol.append(...curCol.children);
		
		curCol.removeAttribute('rowspan');
		curCol.removeAttribute('colspan');

        //curCol.hide();
        _TinyDom.hide(curCol)
	}

    //startCol.attr('rowspan', totalSpan); //add ukmani100
    startCol.setAttribute('rowspan', totalSpan); //add ukmani100

    if(this.resizeMgrV)
        this.resizeMgrV.updateResizeEle(this.body.children)
};

AGridLayout.prototype.mergeCol = function(row, col, span)
{
	const rowEle = $(this.getRow(row));

	// colspan td 다음부터(+1) 
	const start = col+1; 
	const end = start + span-1;
	let totalSpan = span;
	
	const startCol = rowEle.children[col];
		
	for(let index = start; index < end; ++index)
	{
		const curCol = rowEle.children[index];

		// 마지막 col 에 colspan 존재하면 이를 더해야 함.
		// 중간의 colspan 은 이미 param 에 합쳐진 수치이므로 걍 attr 만 지우면 됨.		
		if(index == end -1)
		{
			const addSpan = curCol.getAttribute('colspan');
			if(typeof addSpan != 'undefined')
				totalSpan += (addSpan-1);
		}
		
		startCol.append(...curCol.children);
		
		curCol.removeAttribute('rowspan');
		curCol.removeAttribute('colspan');
		//curCol.hide();	
        _TinyDom.hide(curCol)
	}

	startCol.setAttribute('colspan', totalSpan); //add ukmani100

    if(this.resizeMgrH)
        this.resizeMgrH.updateResizeEle(this._getNonMergeCols())

};

// merge 된 cell 의 row, col 을 전부 분리.
AGridLayout.prototype.splitCell = function(row,col)
{	
	const td = this.getCell(row,col);
	
	let rowSpanCount = td.getAttribute('rowspan');
	if(rowSpanCount == undefined) rowSpanCount = 1;
		
	let colSpanCount = td.getAttribute('colspan');
	if(colSpanCount == undefined) colSpanCount = 1;
	
	//정수형으로 만들기 위해 *1
	const rStart = Number(row);
	const rEnd = rStart + Number(rowSpanCount);
		
	const cStart = Number(col);
	const cEnd = cStart + Number(colSpanCount);

	for(let rIndex = rStart; rIndex < rEnd; ++rIndex)
	{
		for(let cIndex = cStart; cIndex < cEnd; ++cIndex)
		{
            _TinyDom.show(this.getCell(rIndex,cIndex))
		}
	}
		
	td.removeAttribute('rowspan');
	td.removeAttribute('colspan');

    if(this.resizeMgrH)
    {
        this.resizeMgrH.updateResizeEle(this._getNonMergeCols())
        this.resizeMgrV.updateResizeEle(this.body.children)
    }
	
}

AGridLayout.prototype.splitRow = function(row, col)
{
	const rowEle = this.getRow(row);
	
	rowEle.children[col].removeAttribute('rowspan'); //add ukmani100

    if(this.resizeMgrV)
        this.resizeMgrV.updateResizeEle(this.body.children)
};

AGridLayout.prototype.splitCol = function(row, col)
{
	const rowEle = this.getRow(row);
	
	rowEle.children[col].removeAttribute('colspan'); //add ukmani100

    if(this.resizeMgrH)
        this.resizeMgrH.updateResizeEle(this._getNonMergeCols())
};


//----------------------------------------------------------------------
// add ukmani100
//----------------------------------------------------------------------


AGridLayout.prototype.getLayoutPadding = function()
{	
	return this.getCell(0,0).style.padding;
};


AGridLayout.prototype.getCellPadding = function(row, col)
{	
	return this.getCell(row, col)?.style.padding;
};


AGridLayout.prototype.getLayoutAlign = function()
{
	//return this.$table.get(0).style.textAlign; //this.$table.css('text-align');

    return this.table.style.textAlign; //this.$table.css('text-align');
};

AGridLayout.prototype.getCellAlign = function(row, col)
{
	return this.getCell(row, col)?.style.textAlign;
};

AGridLayout.prototype.getCellValign = function(row, col)
{
	return this.getCell(row, col)?.style.verticalAlign;	
};

AGridLayout.prototype.getColSize = function(col)
{	
	//var width = this.getColGroupItem(col).attr('width');
	//return width;

    return this.getColGroupItem(col)?.getAttribute('width');
};

AGridLayout.prototype.getRowSize = function(row)
{	
	//return $(this.getRow(row)).children().eq(0).css('height');
	//return $(this.getRow(row)).children('td')[0].style.height;

    //return $(this.getRow(row)).attr('height');
    return this.getRow(row)?.getAttribute('height');
};

//################################
//  deprecated, use getRowCount
AGridLayout.prototype.getRows = function() 
{ 
    //return  this.$body.children().length; 
    return  this.body.children.length; 
};

AGridLayout.prototype.getRowCount = function()
{
	//return  this.$body.children().length;
    return this.body.children.length;
};

AGridLayout.prototype.setRows = function(rows)
{	
	let i=0, rowsCnt = this.getRowCount(); //현재 rows
	
	if(rows < 1) rows = 1;
		
	if(rows < rowsCnt)
	{	
		for(i = rowsCnt-1 ; i > rows-1 ; i--){
		
			//$(this.getRow(i)).remove();
            this.getRow(i).remove();
		}
	}
	else if(rows > rowsCnt)
	{	
		for(i = rowsCnt-1 ; i < rows-1 ; i++){
			this.insertRow(i, true);
		}
	}
	//this.setRowsDivPercent();
};

//###################################
//  deprecated, use getColumnCount
AGridLayout.prototype.getCols = function()
{	
	//return  $(this.getRow(0)).children().length;
    return  this.getRow(0).children.length;
};

AGridLayout.prototype.setCols = function(cols)
{	
	let colsCnt = this.getColumnCount(), i = 0;
	
	if(cols < 1) cols = 1;
		
	if(cols < colsCnt)
	{
		for(i=colsCnt-1; i > cols-1; i--)
        {
            //this._findChildTd('td:nth-child('+i+')').remove();
            _TinyDom.group(this._findChildTd(i), td => td.remove())
        }
			
	}
	else if(cols > colsCnt)
	{
		for(i=colsCnt-1; i < cols-1; i++){
			this.insertCol(i, true);
		}
	}
	
	//this.setColsDivPercent();
		
};


AGridLayout.prototype.setRowsDivPercent = function()
{
	let i=0, rowsCnt = this.getRowCount(),
		divper = parseInt(100/rowsCnt, 10); //현재 rows
	
	for(i; i < rowsCnt; i++){
		this.setRowSize(i, [divper, '%'].join(''));
	}

};

AGridLayout.prototype.setColsDivPercent = function()
{
	let i=0, colsCnt = this.getColumnCount(),
		divper = parseInt(100/colsCnt, 10); //현재 rows
	
	for(i; i < colsCnt; i++){
		this.setColSize(i, [divper, '%'].join(''));
	}
	
};

AGridLayout.prototype._findChildTd = function(colInx)
{
    //return this.$body.children().children(selector);

    let nthChild = (colInx==undefined) ? 'td' : `td:nth-child(${colInx})`

    return this.body.querySelectorAll('tr > ' +  nthChild)
};


