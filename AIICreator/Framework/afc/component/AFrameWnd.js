
/**
Constructor
Do not call Function in Constructor.
*/
AFrameWnd = class AFrameWnd extends AWindow
{
	constructor(containerId)
	{
		super(containerId)
	
		//TODO:edit here
		this.title = null;
		this.oldInfo = null;
		this.titleLbl = null;

		this.titleHeight = 24;
		this.statusHeight = 20;

		this.statusBar = null;
		this.calcHeight = 0;

		this.icon = 0;
	}

	async open(viewUrl, parent, title, left, top, width, height)
    {
	    await super.open(viewUrl, parent, left, top, width, height)

		if(title) this.setTitleText(title);
    }	

}

//window.AFrameWnd = AFrameWnd

//AFrameWnd.TITLE_HEIGHT = '25';


//옵션을 변경한다던가 타이틀을 만드는 등의 태그 생성 작업
AFrameWnd.prototype.init = function(context)
{
	//no overwrite 가 true 이기 때문에 
	//부모의 옵션보다 우선 하려면 init 위에 두어야 한다.
	this.setOption(
	{
		isModal: false,
		isResizable: true,
		isDraggable: true,
		dragHandle: '._frame_title_',
        isTitleBar: true,
        isStatusBar: false
		
	}, true);
	//----------------------------------------

	AWindow.prototype.init.call(this, context);

	//this.$ele.addClass('frm_border');
    _TinyDom.addClass(this.element, 'frm_border')
};


AFrameWnd.prototype.onCreate = function()
{
	AWindow.prototype.onCreate.call(this);
	
	//async 함수가 아니므로 여기에서 호출하면 안됨, container open 으로 이동
	//if(this.option.isTitleBar) this._makeTitle();
	
	if(this.option.isStatusBar) this.makeStatusBar();
};

AFrameWnd.prototype.getTitleText = function()
{
	//return this.titleLbl.getText();
	return this.titleLbl.textContent;
};

AFrameWnd.prototype.setTitleText = function(str)
{
	//this.titleLbl.setText(str);
	this.titleLbl.textContent = str
};

AFrameWnd.prototype.setTitleHtml = function(str)
{
	//this.titleLbl.setHtml(str);
	this.titleLbl.innerHTML = str;
};

AFrameWnd.prototype.showTitle = function()
{
	//$(this.title).show();
	//$(this.statusBar).show();
	//$(this.viewItem).css('height', 'calc(100% - ' + this.calcHeight+'px)');

	_TinyDom.show(this.title)
	_TinyDom.show(this.statusBar)
	this.viewItem.style.height = 'calc(100% - ' + this.calcHeight + 'px)';
};

AFrameWnd.prototype.hideTitle = function()
{
	_TinyDom.hide(this.title);
	_TinyDom.hide(this.statusBar);
	
    this.viewItem.style.height = '100%';
};

AFrameWnd.prototype._makeTitle = function() 
{
    /*
	var $title = $('<div class="_frame_title_"></div>');
	
    $title.css(
    {
        width: '100%',
        height: this.titleHeight+'px'	//AFrameWnd.TITLE_HEIGHT+'px'
    });

    this.calcHeight += this.titleHeight;
    $(this.viewItem).css('height', 'calc(100% - ' + this.calcHeight+'px)');

    this.$ele.prepend($title);
	
	this.title = $title[0];

    //return Promise
    return this._loadTitle()
    */

	const title = document.createElement('div')

    title.className = '_frame_title_'
    title.style.width = '100%'
    title.style.height = this.titleHeight+'px'

    this.calcHeight += this.titleHeight;
    this.viewItem.style.height = 'calc(100% - ' + this.calcHeight+'px)';

    this.element.prepend(title);
	
	this.title = title;

    //return Promise
    return this._loadTitle()

};

AFrameWnd.prototype._loadTitle = async function() 
{
    await afc.loadHtml(this.title, 'Framework/afc/layout/framewnd-title.html')

	//const comps = $(this.title).children().children()
    const comps = this.title.firstElementChild.children

	//image
	this.iconLbl = comps[0];
	this.changeIcon();

	//label
	this.titleLbl = comps[1];
	this.setTitleText(this.getContainerId());

	this.extraBtn = comps[2];
	this.minBtn = comps[3];
	this.maxBtn = comps[4];
	this.closeBtn = comps[5];

	//추가로 필요한 경우 사용한다.
	//$(this.extraBtn).hide();
    this.extraBtn.style.visibility = 'hidden';
		
	//min button
	this.minBtn.addEventListener('click', ()=> this._onMinBtnClick());	
	//max button
	this.maxBtn.addEventListener('click', ()=> this._onMaxBtnClick());	
	//close button
	this.closeBtn.addEventListener('click', ()=> this._onCloseBtnClick());

};

/*
//container 에서 호출함
function AFrameWnd*makeViewItem()
{
	var $item = $('<div></div>'),
		calc = 0;
		
	if(this.option.isStatusBar) calc += this.statusHeight;
	if($(this.title).is(':visible')) calc += this.titleHeight;
	
    $item.css(
    {
        width: '100%',
        height: calc?'calc(100% - ' + calc + 'px)':'100%'
    });
	
	return $item;
};
*/

AFrameWnd.prototype.makeStatusBar = function()
{
    /*
	var $status = $('<div class="_frame_status_"></div>');
	
    $status.css(
    {
        width: '100%',
        height: this.statusHeight+'px'
    });
	
    this.calcHeight += this.statusHeight;
    $(this.viewItem).css('height', 'calc(100% - ' + this.calcHeight+'px)');

	this.$ele.append($status);
	
	this.statusBar = $status[0];
    */

	const status = document.createElement('div')
    status.className = '_frame_status_'
	
    status.style.width = '100%'
    status.style.height = this.statusHeight + 'px'
	
    this.calcHeight += this.statusHeight;
    this.viewItem.style.height = 'calc(100% - ' + this.calcHeight+'px)';

	this.element.append(status);
	
	this.statusBar = status;

};


AFrameWnd.prototype.setStatusInfo = function(html)
{
	//$(this.statusBar).html(html);
    this.statusBar.innerHTML = html;
};

AFrameWnd.prototype._onMinBtnClick = function(acomp, info)
{
	this.minimize();
};

AFrameWnd.prototype._onMaxBtnClick = function(acomp, info)
{
	if(this.oldInfo) this.restore();
	else this.maximize();
};

AFrameWnd.prototype.restore = function()
{
	if(!this.oldInfo) return;

	//this.$ele.css(this.oldInfo);
    _TinyDom.css(this.element, this.oldInfo);
	this.oldInfo = null;

	this.setResizeOption('disabled', false);

	//this.$ele.addClass('frm_border');
    _TinyDom.addClass(this.element, 'frm_border')
};

AFrameWnd.prototype.minimize = function()
{
	const pos = this.getPos();
	this.oldInfo = { left:pos.left+'px', top:pos.top+'px', width:this.getWidth()+'px', height:this.getHeight()+'px' };
	
	this.setResizeOption('disabled', true);

	//this.$ele.css( { width:'150px', height:'27px' });
    _TinyDom.css(this.element, { width:'150px', height:'27px' })
		
	//this.$ele.addClass('frm_border');
    _TinyDom.addClass(this.element, 'frm_border')
};

AFrameWnd.prototype.maximize = function()
{
	const pos = this.getPos();
	this.oldInfo = { left:pos.left+'px', top:pos.top+'px', width:this.getWidth()+'px', height:this.getHeight()+'px' };

	this.setResizeOption('disabled', true);

	//this.$ele.css( { left:'0px', top:'0px', width:'100%', height:'100%' });
	//this.$ele.removeClass('frm_border');

	_TinyDom.css(this.element, { left:'0px', top:'0px', width:'100%', height:'100%' });
	_TinyDom.removeClass(this.element, 'frm_border');

};

/*
function AFrameWnd*_onCloseBtnClick(acomp, info)
{
	this.close();
	
};
*/

//프레임 타이틀의 x 버튼이 눌리면 호출된는 함수. 
//뷰의 onCloseFrame 함수를 호출하고 false 를 리턴받으면 창을 닫지 않는다.
AFrameWnd.prototype._onCloseBtnClick = function(acomp, info)
{
	//var thisObj = this;
	
	setTimeout(()=>
	{
		const view = this.getView();
		if(view && view.onCloseFrame && !view.onCloseFrame()) return;
	
		this.close();
		
	}, 0);
};

AFrameWnd.prototype.setIconMap = function(iconMap)
{
	this.iconMap = iconMap;
	this.changeIcon();
};

AFrameWnd.prototype.setIcon = function(icon)
{
	this.icon = icon;
	this.changeIcon(icon);
};

AFrameWnd.prototype.changeIcon = function(icon)
{
	if(icon) this.icon = icon;
	if(this.iconLbl)
	{
		if(this.iconMap)
		{
			if(this.iconMap.match(/\./)) this.iconLbl.style.backgroundImage = 'url("' + this.iconMap + '")'
			else this.iconLbl.classList.add(this.iconMap)
		}

		this.iconLbl.style.backgroundPosition = (-16*this.icon) + 'px 0px';
	}
};

