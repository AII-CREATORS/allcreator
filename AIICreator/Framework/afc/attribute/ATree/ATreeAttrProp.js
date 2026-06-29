
/**
Constructor
Do not call Function in Constructor.
*/
ATreeAttrProp = class ATreeAttrProp extends BaseProp
{
    constructor()
    {
        super()
		
	
		//this.attrPath = BaseProp.ATTR_PATH + 'ATree/';
	
	

    }
}



ATreeAttrProp.prototype.init = function(context, evtListener)
{
	BaseProp.prototype.init.call(this, context, evtListener);

    // this.setAttrPath('afc', 'ATree')
	
	// this.acc.insertItem('Option', this.attrPath+'Option.lay');

    this.makeAttrItem('afc', 'ATree')
	
	//this.acc.insertItem('Style', this.attrPath+'Style.lay');

	//common
	//this.insertCommonAttr();
	
};
