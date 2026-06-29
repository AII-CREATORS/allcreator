

afc.import("Framework/afc/component/AMenu.js");


class AMenuBarEvent extends AViewEvent
{
	constructor(acomp)
	{
		super(acomp);
	}
}
window.AMenuBarEvent = AMenuBarEvent;


//---------------------------------------------------------------------------------------------------
//	Component Event Functions
/*
AMenuBarEvent.prototype.select = function()
{
	this._select();
};
*/
//---------------------------------------------------------------------------------------------------

AMenuBarEvent.prototype._select = function(btnEle, menuItem)
{
	var thisObj = this;

	AEvent.bindEvent(btnEle, AEvent.ACTION_DOWN, function(e)
	{
		var pos = btnEle.getBoundingClientRect();

		var menu = new AMenu();
		menu.setItemInfoArr(menuItem);
		menu.setSelectListener(thisObj, 'onMenuSelect');

		menu.popup(pos.left, pos.top+_TinyDom.height(btnEle));
	});

	btnEle.addEventListener('mouseenter', function()
	{
		btnEle.style.color = '#000000';
		btnEle.style.backgroundColor = '#F0F0F0';
	});
	btnEle.addEventListener('mouseleave', function()
	{
		btnEle.style.color = '#FFFFFF';
		btnEle.style.backgroundColor = '#3A3A3A';
	});
};

AMenuBarEvent.prototype.onMenuSelect = function(menu, info, e)
{
	//if(info.id) this.acomp.reportEvent('select', info, e);
	
	this.acomp.reportEvent('select', info, e);
};

                    

