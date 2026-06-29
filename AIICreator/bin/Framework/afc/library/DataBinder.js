
DataBinder = class DataBinder
{
	constructor()
	{
		this.modelArr = [];
	}

	getModel(bindings)
	{
		const map = Object.create(null);

		for(const key in bindings)
			map[key] = bindings[key];

		const model = new Proxy({},
		{
			get(target, prop)
			{
				if(typeof prop === 'symbol')
					return target[prop];

				if(Object.prototype.hasOwnProperty.call(map, prop))
					return map[prop].getData();

				return target[prop];
			},

			set(target, prop, value)
			{
				if(Object.prototype.hasOwnProperty.call(map, prop))
				{
					map[prop].setData(value);
					return true;
				}

				target[prop] = value;
				return true;
			}
		});

		this.modelArr.push(model);
		return model;
	}

	releaseModel(model)
	{
		const idx = this.modelArr.indexOf(model);
		if(idx > -1) this.modelArr.splice(idx, 1);
	}

	broadcastSet(key, value)
	{
		this.modelArr.forEach(model => {
			model[key] = value;
		});
	}

	broadcastGet(key)
	{
		return this.modelArr.map(model => model[key]);
	}
}
