
/**
Constructor
Do not call Function in Constructor.
*/
ADropBoxAttrProp = class ADropBoxAttrProp extends BaseProp
{
    constructor()
    {
        super()
		
	
		//this.attrPath = BaseProp.ATTR_PATH + 'ADropBox/';
	
	

    }
}



ADropBoxAttrProp.prototype.init = function(context, evtListener)
{
	BaseProp.prototype.init.call(this, context, evtListener);

    // this.setAttrPath('afc', 'ADropBox')
	
	// this.acc.insertItem('Data', this.attrPath+'Data.lay');

    this.makeAttrItem('afc', 'ADropBox')
};


ADropBoxAttrProp.prototype.getUpdateValue = function(selComp, dataKey, groupName)
{
	//단일 선택인 경우만 값을 읽어와 셋팅한다. 다중 선택인 경우는 값을 클리어 해준다.
	if(this.selCompArr.length==1)
	{
		if(groupName=='ATTR_VALUE')
		{
			if(dataKey=='placeholder' || dataKey =='readonly')
			{
				return selComp.textfield.getAttribute(dataKey);
			}
		}
		else if(groupName=='CSS_VALUE')
		{
			if(dataKey=='text-align')
			{
				//return _TinyDom.css(selComp.textfield, dataKey);
				return $(selComp.textfield).css(dataKey);
			}
		}
	}

	return BaseProp.prototype.getUpdateValue.call(this, selComp, dataKey, groupName);	
};

ADropBoxAttrProp.prototype.applyValueToSelComp = function(selComp, dataKey, valGroup, value)
{
	var prevVal;
	var txtField = selComp.textfield;

	if(valGroup=='ATTR_VALUE')
	{
		if(dataKey=='placeholder' || dataKey=='readonly')
		{

			prevVal = txtField.getAttribute(dataKey);

			if(value) txtField.setAttribute(dataKey, value);
			else txtField.removeAttribute(dataKey);

			return prevVal;
		}

	}

	else if(valGroup=='CSS_VALUE')
	{
		if(dataKey=='text-align')
		{
			//prevVal = _TinyDom.css(txtField, dataKey);
			prevVal = $(txtField).css(dataKey);
			txtField.style.textAlign = value;
			return prevVal;
		}
	}

	
	return BaseProp.prototype.applyValueToSelComp.call(this, selComp, dataKey, valGroup, value);
};


