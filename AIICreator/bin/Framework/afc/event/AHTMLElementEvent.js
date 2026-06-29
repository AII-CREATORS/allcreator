
/**
 * 
 */

AHTMLElementEvent = class AHTMLElementEvent extends AEvent
{
	constructor(acomp)
	{
		super(acomp)
	}
//---------------------------------------------------------------------------------------------------
//	Component Event Functions
//	events: ['click']

//	AHTMLElement.CONTEXT.events 변수에 추가적으로 명시한 이벤트는 interface 함수를 정의해야 합니다.
//	이 interface 함수는 AHTMLElement 객체에 click 이벤트를 등록한 경우 
//	객체가 초기화(init) 될 때 한번만 호출됩니다.
    click()
    {
        //	실제 구현은 AEvent 의 _click 함수에 구현 되어져 있습니다.
        //	click 이벤트 구현을 변경 하려면 아래와 같이 _click 함수를 재구현 하십시요.
        
        this._click()
    }

//---------------------------------------------------------------------------------------------------

    _click()
    {
        //	this.acomp 는 AHTMLElement 객체입니다.
        var acomp = this.acomp

        acomp.element.addEventListener('click', function(e)
        {
            acomp.reportEvent('click', acomp.getText(), e)
        });
    }
}



