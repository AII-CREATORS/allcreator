
AVideoAttrProp = class AVideoAttrProp extends BaseProp
{
    constructor()
    {
        super()
		
	
	
	

    }
}



AVideoAttrProp.prototype.init = function(context, evtListener)
{
	BaseProp.prototype.init.call(this, context, evtListener);

    this.makeAttrItem('afc', 'AVideo')

};







