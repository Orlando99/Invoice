'use strict';

invoicesUnlimited.factory('itemService', ['$q', 'itemFactory', function($q, itemFactory){
return {
	test : function() {
		console.log('working');
	},
	createItems : function(params) {
		if (params.items.length < 1) return Parse.Promise.as([]);

		var parseItems = [];
		var Item = Parse.Object.extend('Item');

		params.items.forEach(function(item) {
			var obj = new Item();
			obj.set('userID', params.user);
			obj.set('organization', params.organization);
			obj.setACL(params.acl);
			obj.set('title', item.title);
			obj.set('rate', String(item.rate));

			if (item.tax)
				obj.set('tax', Parse.Object.extend("Tax")
					.createWithoutData(item.tax.id));
			
			if (item.desc)
				obj.set('itemDescription', item.desc);

			if (item.expenseId)
				obj.set('expanseId', item.expenseId);

			parseItems.push(obj);
		});

		return Parse.Object.saveAll(parseItems).then(function(items) {
			items = items.map(function(item) {
				return new itemFactory(item);
			});
			return items;
		});
	}
};
}]);