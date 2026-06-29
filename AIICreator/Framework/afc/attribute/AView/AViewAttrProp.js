
/**
Constructor
Do not call Function in Constructor.
*/
AViewAttrProp = class AViewAttrProp extends BaseProp
{
    constructor()
    {
        super()
		
	
		//this.attrPath = BaseProp.ATTR_PATH + 'AView/';
	
	

    }
}



AViewAttrProp.prototype.init = async function(context, evtListener)
{
	BaseProp.prototype.init.call(this, context, evtListener);
	
	//this.acc.insertItem('Data', this.attrPath+'Data.lay');

    //this.setAttrPath('afc', 'AView')

    await this.makeAttrItem('afc', 'AView')

};

AViewAttrProp.prototype.getUpdateValue = function(selComp, dataKey, groupName)
{
	if(groupName=='ATTR_VALUE')
	{
		if(dataKey=='data-load-url')
		{
			var url = selComp.element.getAttribute(dataKey);

			if(url) this.testLoadView(selComp.element, url);
		}
	}

	return BaseProp.prototype.getUpdateValue.call(this, selComp, dataKey, groupName);	
};

AViewAttrProp.prototype.applyValueToSelComp = function(selComp, dataKey, valGroup, value)
{
	var prevVal;
	if(valGroup=='ATTR_VALUE')
	{
		switch(dataKey)
		{
			case 'data-arrange':
			{
				prevVal = selComp.element.getAttribute(dataKey);

				if(value=='none')
				{
					for(const child of selComp.element.children) Object.assign(child.style, {position:'absolute', float:'none', margin:''});
					selComp.element.removeAttribute('data-arrange');
					selComp.element.style.padding = '';
				}

				//float left, right
				else
				{
					//무조건 아래 설정을 유지해야 함. 다른 옵션은 안됨.
					for(const child of selComp.element.children) Object.assign(child.style, {position:'relative', left:'0px', top:'0px', float:value});
					selComp.element.setAttribute(dataKey, value);
				}
			}
			return prevVal;

			case 'data-load-url':
			{
				this.testLoadView(selComp.element, value);
			}
			break;
		}
	}
	
	return BaseProp.prototype.applyValueToSelComp.call(this, selComp, dataKey, valGroup, value);
};


AViewAttrProp.prototype.testLoadView = function(ele, url)
{
	var prjView = theApp.getProjectView(),
		item = prjView.findProjectItemByTreePath(url);

	var testView = ele.querySelector('.test-view');
	if(testView) testView.remove();

	if(item)
	{
		url = prjView.getFullPath(item);

		if(url)
		{
			if(AUtil.extractExtName(url) != 'lay') return;

			var html = afc.getFileSrc(url);
			if(html)
			{
				// Button 에 Icon을 등록한 경우
				// <img src="relUrl"> -> <img src="absUrl">
				// background-image: url("relUrl") -> background-image: url("absUrl")
				if(theApp.resMap && theApp.resMap.replaceRelToAbs)
				{
					html = theApp.resMap.replaceRelToAbs('src="', '"', html);
					html = theApp.resMap.replaceRelToAbs('url(', ')', html, 2);
				}

				ele.insertAdjacentHTML('beforeend', '<div class="test-view">' + html + '</div>');

				for(const child of ele.children)
				{
					child.querySelectorAll('.RGrid-Style').forEach(el => { el.removeAttribute('id'); Object.assign(el.style, {border: '1px solid blue', textAlign: 'center'}); el.textContent = 'rMate Grid'; });
					child.querySelectorAll('.RChart-Style').forEach(el => { el.removeAttribute('id'); Object.assign(el.style, {border: '1px solid yellow', textAlign: 'center'}); el.textContent = 'rMate Chart'; });
					Object.assign(child.style, { position: 'relative', width: '100%', height: '100%' });
				}
			}
		}
	}
};








