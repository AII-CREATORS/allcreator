
/**
 * @author asoocool
 */

class ASelectBoxEvent extends AEvent
{
	constructor(acomp)
	{
		super(acomp);
	}
}
window.ASelectBoxEvent = ASelectBoxEvent;


ASelectBoxEvent.prototype.defaultAction = function()
{
	const thisObj = this;
	//상위로 이벤트를 전달할 필요가 없다.
    this.acomp.bindEvent(AEvent.ACTION_DOWN, function(e)
    {
		AComponent.setFocusComp(thisObj.acomp);
    	e.stopPropagation();
    });

	this._focus();
	this._blur();

};


//---------------------------------------------------------------------------------------------------
//	Component Event Functions


ASelectBoxEvent.prototype.change = function()
{
	this._change();
};

//---------------------------------------------------------------------------------------------------



ASelectBoxEvent.prototype._change = function()
{
	var aselectbox = this.acomp;
	
	//aselectbox.$ele.bind('change', function(e) 
	AEvent.bindEvent(aselectbox.element, 'change', function(e) 
	{
		//aselectbox.reportEvent('change', aselectbox.$ele.val());
		aselectbox.reportEvent('change', this.value);
	});
		
};

ASelectBoxEvent.prototype._focus = function()
{
	//this.acomp.$ele.focus((e) =>
    this.acomp.element.addEventListener('focus', (e) =>
	{
		AComponent.setFocusComp(this.acomp);

        this.acomp.changeState('data-style-focus')
		this.acomp.reportEvent('focus', e);
	});	
};

ASelectBoxEvent.prototype._blur = function()
{
	//this.acomp.$ele.blur((e) =>
    this.acomp.element.addEventListener('blur', (e) =>
	{
        this.acomp.changeState(null, 'data-style-focus')
		this.acomp.reportEvent('blur', e);
	});
	
};