
/**
Constructor
Do not call Function in Constructor.
*/
ASliderAttrProp = class ASliderAttrProp extends BaseProp
{
    constructor()
    {
        super()
		
	
		//TODO:edit here
		//this.attrPath = BaseProp.ATTR_PATH + 'ASlider/';
	
	

    }
}



ASliderAttrProp.prototype.init = function(context, evtListener)
{
	BaseProp.prototype.init.call(this, context, evtListener);

    // this.setAttrPath('afc', 'ASlider')

	// this.acc.insertItem('Data', this.attrPath+'Data.lay');
     this.makeAttrItem('afc', 'ASlider');

	//common
	//this.insertCommonAttr();
};
