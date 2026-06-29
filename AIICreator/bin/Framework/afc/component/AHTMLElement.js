
/**
 *	AComponent 를 상속받아 새로운 컴포넌트를 생성하는 예
 */
 AHTMLElement = class AHTMLElement extends AComponent
{
    static CONTEXT = 
    {
        //	실제로 구현하고자 하는 컴포넌트의 태그로 변경하십시요.
        tag: '',//'<div data-base="AHTMLElement" data-class="AHTMLElement" class="AHTMLElement-Style">AHTMLElement</div>',

        //	컴포넌트를 lay 파일에 최초로 추가한 후 적용될 속성을 나열합니다.
        //	주로 컴포넌트 사이즈에 관련된 속성을 선언합니다.
        defStyle: 
        {
            width:'100px', height:'80px' 
        },
    
        //	AEvent.defEvents = ['actiondown', 'actionmove', 'actionup', 'actioncancel', 'actionenter', 'actionleave', 'keydown', 'keyup'];
        //	기본 이벤트 즉, AEvent.defEvents 에 정의된 이벤트 외에 
        //	추가적으로 발생시키고자 하는 이벤트 명을 나열합니다.
        
        events: []
    }

    constructor()
    {
        super();

        //TODO:edit here
        
        //	자신이 포함되어져 있는 프레임웍 이름을 지정합니다.
        this.frwName = 'afc'
    }

    init(context, evtListener)
    {
        super.init(context, evtListener)

        this._realizeChildren(evtListener, this.reInitComp);
    }

    addComponent(acomp, isPrepend, posComp)
    {
        if(!acomp.element) 
        {
            alert('First of all, you must call function init();');
            return;
        }
        
        if(posComp)
        {
            if(isPrepend) posComp.element.before(acomp.element);
            else posComp.element.after(acomp.element);
        }
        else
        {
            if(isPrepend) this.element.prepend(acomp.element);
            else this.element.append(acomp.element);
        }
        
        //1.0에 있던 사라진 기능
        //var arrange = this.$ele.attr('data-arrange');
        //if(arrange) acomp.$ele.css({'position':'relative', left:'0px', top:'0px', 'float':arrange});
        
        acomp.setParent(this);
    };    

    getChildCount()
    {
        return this.element.children.length;
    }

    getChildren()
    {
        let ret = [];
        for(const ele of this.element.children)
        {
            if(ele.acomp) 
                ret.push(ele.acomp);
        }
        
        return ret;        
    }

    removeFromView(onlyRelease)
    {
        this.removeChildren(onlyRelease);
        
        super.removeFromView(onlyRelease);
    }

    removeChildren(onlyRelease)
    {
        for(const ele of this.element.children)
        {
            if(ele.acomp) 
                ele.acomp.removeFromView(onlyRelease);
        }
    }

    setText(text)
    {
        this.element.textContent = text
    }

    getText(text)
    {
        return this.element.textContent
    }

    getDroppable()
    {
        return true;
    }

    eachChild(callback, isReverse)
    {
        let items;
        
        if(isReverse) items = [...this.element.children].reverse();
        else items = this.element.children;

        for(let i=0; i<items.length; i++)
        {
            if(!items[i].acomp) continue;
            if(callback(items[i].acomp, i)==false) break;
        }
    }
    
    _realizeChildren(evtListener, reInitComp)
    {
        var acomp,
            container = this.getContainer(), rootView = this.getRootView();
        
        if(reInitComp)
        {
            for(const ele of this.element.children)
            {
                if(ele.acomp) ele.acomp.init(ele.acomp.element, evtListener);
                
                //뷰를 감싸고 있는 item 인 경우
                else
                {
                    acomp = ele.children[0].acomp;
                    acomp.init(acomp.element);
                }
            }
        }
        else
        {
            for(const ele of this.element.children)
            {
                acomp = AComponent.realizeContext(ele, container, rootView, this, evtListener);
                if(acomp)
                {
                    //if(acomp.baseName != 'AView' && container && container.tabKey) container.tabKey.addCompMap(acomp, rootView.owner);
                }
            }
            
            //if(container && container.tabKey && rootView.owner) container.tabKey.saveOwnerMap(rootView.owner);
            
        }
        
    }
}

