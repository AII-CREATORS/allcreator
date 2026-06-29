
class AIICreatorApp extends AApplication
{
	constructor()
	{
		super()

		//TODO:edit here

	}

	onReady()
	{
		super.onReady();

		this.setMainContainer(new APage('main'))
		this.mainContainer.open('Source/Auth/AuthView.lay')

		//TODO:edit here

	}

	unitTest(unitUrl)
	{
		//TODO:edit here

		this.onReady()

		super.unitTest(unitUrl)
	}

}

