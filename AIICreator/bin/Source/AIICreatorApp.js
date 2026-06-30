
AIICreatorApp = class AIICreatorApp extends AApplication
{
	constructor()
	{
		super()

		//TODO:edit here

	}

	onReady()
	{
		super.onReady();

		// 공통 에러 핸들러 초기화 (전역 에러, 네트워크, 세션 만료)
		ErrorHandler.init()

		this.setMainContainer(new APage('main'))
		this.mainContainer.open('Source/Auth/AuthView.lay')
	}

	unitTest(unitUrl)
	{
		//TODO:edit here

		this.onReady()

		super.unitTest(unitUrl)
	}

}

