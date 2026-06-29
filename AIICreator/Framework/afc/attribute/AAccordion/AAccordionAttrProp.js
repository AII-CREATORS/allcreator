
/**
Constructor
Do not call Function in Constructor.
*/
AAccordionAttrProp = class AAccordionAttrProp extends BaseProp
{
    constructor()
    {
        super()
		
	
		//TODO:edit here
		//this.attrPath = BaseProp.ATTR_PATH + 'AAccordion/';
	
	

    }
}



AAccordionAttrProp.prototype.init = function(context, evtListener)
{
	BaseProp.prototype.init.call(this, context, evtListener);

    //this.setAttrPath('afc', 'AAccordion')
	
	//this.acc.insertItem('Items', this.attrPath+'Items.lay');
	//this.acc.insertItem('Option', this.attrPath+'Option.lay');

    this.makeAttrItem('afc', 'AAccordion').then(()=>{
        this.itemInfoGrid = this.findCompByClass('AGrid')[0];
    })
	
};

AAccordionAttrProp.prototype.getItemId = function()
{
	//return 'i'+this.itemId++;
	
	var time = Date.now() + '';
	
	return time.substr(time.length-6, 6);
};


AAccordionAttrProp.prototype.applyValueToSelComp = function(selComp, dataKey, valGroup, value)
{
	if(valGroup=='ATTR_VALUE')
	{
	}
	else if(valGroup=='CSS_VALUE')
	{
	}
	
	return BaseProp.prototype.applyValueToSelComp.call(this, selComp, dataKey, valGroup, value);
};


AAccordionAttrProp.prototype.getUpdateValue = function(selComp, dataKey, groupName)
{
	

	return BaseProp.prototype.getUpdateValue.call(this, selComp, dataKey, groupName);	
};

AAccordionAttrProp.prototype.updateAGrid = function(dataKey, valueComp, value)
{
	var row, arr1 = [], arr2 = [], dataArr = [], tmp, key, inx,
		selComp = this.selCompArr[0];

	valueComp.removeAll();
	
	//key is attr key
	for(key in value)
	{
		tmp = value[key].split(',');	//index, title, url, itemId
		
		inx = Number(tmp[0]);
		arr1[inx] = tmp[1];		//title
		arr2[inx] = tmp[2];		//url
		dataArr[inx] = tmp[3];
	}

	for(inx in arr1)
	{
		row = valueComp.addRow([ arr1[inx], arr2[inx] ]);
		valueComp.setCellData(row, 0, dataArr[inx]);
		
		//this.applyUrlToItem(selComp, inx, arr[inx]);
	}
	
	//--------------------------------------------------

	//각 셀에 풍선말을 단다. jQuery, Array 두가지 경우 모두 처리
	let rows = valueComp.getRows();
	for(let i=0; i<rows.length; i++)
	{
		row = rows[i]
		for(const cell of row.children)
		{
			cell.setAttribute('title', cell.textContent);
		}
	}

	//각 셀에 풍선말을 단다.
	// var rows = valueComp.getRows();
	// rows.forEach(function(row)
	// {
	// 	for(const cell of row.children)
	// 	{
	// 		cell.setAttribute('title', cell.textContent);
	// 	}
	// });
	
};




AAccordionAttrProp.prototype.onAddItemBtnClick = function(comp, info, e)
{
	var wnd = this.openUrlInputDlg(comp, 'Add Item', '', ''), thisObj = this;

	wnd.setResultCallback(function(result, data)
	{
		if(result==0 && data)
		{
			//var selComp = thisObj.selCompArr[0],
			//	rowCount = thisObj.itemInfoGrid.getRowCount();
			
			
			var title = data.name, url = data.url;
				
			if(!title || !url) return;
			
			var row = thisObj.itemInfoGrid.addRow([title, url]);
			
			//자동으로 증가하는 값으로 새로 추가된 아이템의 고유아이디를 만든다.
			thisObj.itemInfoGrid.setCellData(row, 0, thisObj.getItemId());
			
			thisObj.applyGridChange();
		}
	});
	
};

AAccordionAttrProp.prototype.onEditItemBtnClick = function(comp, info, e)
{
	if(this.itemInfoGrid.getSelectedCells().length == 0) return;

	var row = this.itemInfoGrid.getSelectedCells()[0];
	var title = this.itemInfoGrid.getCellText(row, 0);
	var url = this.itemInfoGrid.getCellText(row, 1);

	var wnd = this.openUrlInputDlg(comp, 'Edit Item', title, url), 
		thisObj = this;
	
	wnd.setResultCallback(function(result, data)
	{
		if(result == 0 && data)
		{
			thisObj.itemInfoGrid.setCellText(row, 0, data.name);
			thisObj.itemInfoGrid.setCellText(row, 1, data.url);
			
			thisObj.applyGridChange();
		}
	});
};

AAccordionAttrProp.prototype.onDeleteItemBtnClick = function(comp, info, e)
{
	var selRows = this.itemInfoGrid.getSelectedCells(),
		row = selRows[0];

	if(selRows.length>0) 
	{
		var selComp = this.selCompArr[0],
			selIndex = this.itemInfoGrid.indexOfRow(row);
			
		this.itemInfoGrid.clearSelected();
		this.itemInfoGrid.removeRow(row);
		
		this.applyGridChange();
	}
};

AAccordionAttrProp.prototype.onMoveBtnClick = function(comp, info, e)
{
	if(this.itemInfoGrid.getSelectedCells().length == 0) return;
	
	var move;
	if(comp.compId =="UP") move = -1;
	else if(comp.compId =="DOWN") move = 1;
	
	var selRow = this.itemInfoGrid.getSelectedCells()[0];
	var selIndex = this.itemInfoGrid.indexOfRow(selRow);
	
	var selTitle = this.itemInfoGrid.getCellText(selRow, 0);
	var selUrl = this.itemInfoGrid.getCellText(selRow, 1);
	var selData = this.itemInfoGrid.getCellData(selRow, 0);
	
	if(selIndex+move == -1) return;
	
	var moveRow = this.itemInfoGrid.getRow(selIndex+move);
	if(!moveRow) return;
	
	var titleText = this.itemInfoGrid.getCellText(moveRow, 0);
	var urlText = this.itemInfoGrid.getCellText(moveRow, 1);
	var data = this.itemInfoGrid.getCellData(moveRow, 0);
	
	this.itemInfoGrid.setCellText(selRow, 0, titleText);
	this.itemInfoGrid.setCellText(selRow, 1, urlText);
	this.itemInfoGrid.setCellData(selRow, 0, data);
	
	this.itemInfoGrid.setCellText(moveRow, 0, selTitle);
	this.itemInfoGrid.setCellText(moveRow, 1, selUrl);
	this.itemInfoGrid.setCellData(moveRow, 0, selData);
	
	this.itemInfoGrid.selectCell(moveRow, false);
	
	this.applyGridChange();
};

AAccordionAttrProp.prototype.applyGridChange = function()
{
	var value = {}, rows = this.itemInfoGrid.getRows(), row,
		selComp = this.selCompArr[0], title, url, data, thisObj = this;

	/*
	rows.forEach(function(row, rowIndex)
	{
		title = thisObj.itemInfoGrid.getCellText(row, 0);
		url = thisObj.itemInfoGrid.getCellText(row, 1);
		data = thisObj.itemInfoGrid.getCellData(row, 0);	//고유 아이디

		value[data] = [ rowIndex, title, url, data ];

		//thisObj.applyUrlToItem(selComp, rowIndex, url);
	});
	*/
	
	for(let i=0; i<rows.length; i++)
	{
		row = rows[i]

		title = thisObj.itemInfoGrid.getCellText(row, 0);
		url = thisObj.itemInfoGrid.getCellText(row, 1);
		data = thisObj.itemInfoGrid.getCellData(row, 0);	//고유 아이디

		value[data] = [ i, title, url, data ];
	}

	this.applyValue(this.itemInfoGrid, value);
};

AAccordionAttrProp.prototype.openUrlInputDlg = function(comp, cntrTitle, itemTitle, urlText)
{
	var wnd = new AFrameWnd('UrlInputDlg'),
		ofs = comp.get$ele().offset(),
		w = 240, compH = comp.getHeight();
		
	wnd.setOption(
	{
		isModal: true,
		isFocusLostClose: true,
		modalBgOption: 'none',
	});
	
	if(ofs.left+190 > window.innerWidth) ofs.left = window.innerWidth - w - 5;
	
	//wnd.open('Source/popup/InputDlg.lay', null, ofs.left, ofs.top+compH, w, '174px');
	wnd.open('Source/popup/TabViewItemDlg.lay', null, cntrTitle, ofs.left, ofs.top+compH, w, '174px').then(()=>{
        const view = wnd.getView();
        
        view.idTxf.hide();
        view.idTxf.setText('dummy');//사용하진 않지만 입력해야 창이 닫히므로
        view.idLbl.setText('타이틀과 URL 을 입력해 주세요.');
        view.nameLbl.setText('Title :');
        view.nameTxf.setText(itemTitle);
        view.urlTxf.setText(urlText);
    });
	

	return wnd;
};