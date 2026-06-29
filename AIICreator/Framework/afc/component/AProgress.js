               

class AProgress extends AComponent
{
	constructor()
	{
		super()
	
		this.value = 0;
		this.bar = null;
	}


}

window.AProgress = AProgress

AProgress.CONTEXT = 
{
    tag: '<div data-base="AProgress" data-class="AProgress" class="AProgress-Style"><div class="prg-bar"></div></div>',

    defStyle: 
    {
        width:'200px', height:'20px' 
    },

    events: []
};


AProgress.prototype.init = function(context, evtListener)
{
	AComponent.prototype.init.call(this, context, evtListener);

	this.bar = this.element.children[0];

    if(this.isDev()) this.setValue(30);
	else this.setValue(0);
};

AProgress.prototype.setValue = function(value)
{
	var prgWidth = this.getWidth();
	value = parseInt(prgWidth*(value/100), 10);
	
	if(value>prgWidth) value = prgWidth;
	else if(value<0) value = 0;
	
	this.bar.style.width = value + 'px';
	this.value = value;
};

AProgress.prototype.getValue = function()
{
	return this.value;
};

AProgress.prototype.setData = function(data)
{
	this.setValue(data);
};

AProgress.prototype.getData = function()
{
	return this.getValue();
};

AProgress.prototype.getQueryData = function(dataArr, keyArr, queryData)
{
	if(!keyArr) return;
	if(!dataArr || dataArr.length==0) return;
	
	var data = dataArr[0];
	data[keyArr[0]] = this.getValue();
};

AProgress.prototype.setQueryData = function(dataArr, keyArr, queryData)
{
	if(!keyArr) return;
	
	var value = dataArr[0][keyArr[0]];
	
	if(value == undefined) return;
	
	this.setValue(value);
};

AProgress.prototype._getDataStyleObj = function()
{
	var ret = AComponent.prototype._getDataStyleObj.call(this);
		
	var keyArr = ['data-style-bar'], val;
	
	for(var i=0; i<keyArr.length; i++)
	{
		val = this.getAttr(keyArr[i]);

		//attr value 에 null 이나 undefined 가 들어가지 않도록
		ret[keyArr[i]] = val ? val : '';
	}
	
	return ret;
};

// object 형식의 css class 값을 컴포넌트에 셋팅한다.
// default style 값만 셋팅한다.
AProgress.prototype._setDataStyleObj = function(styleObj)
{
	for(var p in styleObj)
	{
		if(p==afc.ATTR_STYLE) this._set_class_helper(this.element, null, styleObj, p);	//화면에 바로 적용
		else if(p == "data-style-bar") this._set_class_helper(this.element, this.element.children, styleObj, p);
		//this.setAttr(p, styleObj[p]);
	}
};