
/**
Constructor
Do not call Function in Constructor.
*/
AFormAttrProp = class AFormAttrProp extends BaseProp
{
    constructor()
    {
        super()
		
	
		//this.attrPath = BaseProp.ATTR_PATH + 'AForm/';
	
	

    }
}



AFormAttrProp.prototype.init = function(context, evtListener)
{
	BaseProp.prototype.init.call(this, context, evtListener);

    // this.makeAttrItem('afc', 'AForm')
};

