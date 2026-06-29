




class ATabBarEvent extends AViewEvent
{
	constructor(acomp)
	{
		super(acomp);
	}
}
window.ATabBarEvent = ATabBarEvent;

ATabBarEvent.prototype.defaultAction = function()
{
	// 탭바 범위를 벗어난 경우 초기화
	this.acomp.element.addEventListener('mouseleave', (e)=>
	{
        if(this.isDown && this.dragTab)
        {
            this.acomp.reportEvent('moveout', this.dragTab, e);
        }

		this.dragTab = null;
		this.isDown = false;
	});
};

ATabBarEvent.prototype.itemdblclick = function()
{
};


//---------------------------------------------------------------------------------------------------
//	Component Event Functions

//---------------------------------------------------------------------------------------------------

ATabBarEvent.prototype._select = function(tabBtnView)
{
	var atabbar = this.acomp;
	
	//tab select event
	tabBtnView.bindEvent(AEvent.ACTION_DOWN, function(e)
	{
        //if(atabbar.getSelectedTab()===tabBtnView) return 
		if(atabbar.getSelectedTab()===tabBtnView) e.isSameTab = true
				
		atabbar.selectTabById(tabBtnView.tabId);
		
		atabbar.reportEvent('select', tabBtnView, e);
	});

};

ATabBarEvent.prototype._itemdblclick = function(tabBtnView)
{
	var atabbar = this.acomp;
	
	tabBtnView.element.addEventListener('dblclick', function(e)
	{
		atabbar.reportEvent('itemdblclick', tabBtnView, e);
	});
};


ATabBarEvent.prototype._move = function(tabBtnView)
{
	var atabbar = this.acomp, thisObj = this;
	
	tabBtnView.bindEvent(AEvent.ACTION_DOWN, function(e)
	{
		thisObj.dragTab = null;
		thisObj.isDown = true;
	});
	tabBtnView.bindEvent(AEvent.ACTION_UP, function(e)
	{
		thisObj.isDown = false;
	});
	
	tabBtnView.element.addEventListener('mouseenter', function(e)
	{
		//선택되어진 탭을 드래그 해서 새로운 탭위로 들어온 경우
		//마우스 왼쪽 버튼이 눌려진 상태에서 새로운 탭으로 over 가 된 경우
		if(thisObj.isDown && thisObj.dragTab)
		{
			if(tabBtnView.element.nextElementSibling==thisObj.dragTab.element)
			{
				atabbar.moveTab(thisObj.dragTab, tabBtnView, false);
				atabbar.reportEvent('move', tabBtnView, e);
			}
			else if(tabBtnView.element.previousElementSibling==thisObj.dragTab.element)
			{
				atabbar.moveTab(thisObj.dragTab, tabBtnView, true);
				atabbar.reportEvent('move', tabBtnView, e);
			}

			thisObj.dragTab = null;
		}
	});

	tabBtnView.element.addEventListener('mouseleave', function(e)
	{
		//마우스 왼쪽 버튼이 눌려진 상태에서 현재 선택되어져 있는 탭을 드래그 하며 나간 경우
		if(thisObj.isDown && tabBtnView===atabbar.getSelectedTab())
		{
			thisObj.dragTab = tabBtnView;
		}
	});
};

