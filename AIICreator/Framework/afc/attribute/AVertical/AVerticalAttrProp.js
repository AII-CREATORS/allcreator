

AVerticalAttrProp = class AVerticalAttrProp extends BaseProp
{
	constructor()
	{
		super();
	}

    init(context, evtListener)
    {
        super.init(context, evtListener);

        this.makeAttrItem('afc', 'AVertical')
    }

}
