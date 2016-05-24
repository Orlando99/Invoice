'use strict';

invoicesUnlimited.factory('itemFactory',function($q){
	return {
		getItems : function(user,callback){
			showLoader();
			var orgArr = user.get("organizations");
			if (!orgArr)
				console.log('user: ' + user.id +
					' is not associated with any Organization');
		//	var orgId = orgArr[0].id;
			var itemData = new Parse.Query("Item");
			var itemDfr = $q.defer();
			itemData.equalTo("organization", orgArr[0]);
			itemData.notEqualTo("isDeleted", 1);
			itemData.find().then(function(results){
				itemDfr.resolve(results);
		   	}, function(error){
				itemDfr.reject(results);
		   	});
			itemDfr.promise
				.then(function(results){
					var items = [];
					for (var i = 0; i < results.length; ++i){
					 var obj = results[i];
					 items.push({
					  name: obj.get("title"),
					  desc: obj.get("itemDescription"),
					  rate: obj.get("rate")
					 });
					}
					hideLoader();
					callback(items);
				})
				.catch(function(error){
					hideLoader();
					callback([]);
				});
		}
	};
});