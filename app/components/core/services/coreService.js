'use strict';

invoicesUnlimited.factory('coreFactory',function(userFactory,customerFactory){

	var user = userFactory.authorized();
	var core = {};
	if (!user) return undefined;

	core.getAllCustomers = function(){
		var query = new Parse.Query("Customer");
		query.equalTo('userID',user);
		query.include('contactPersons');
		return query.find().then(function(customers){
			var result = [];
			customers.forEach(function(elem){
				var customer = new customerFactory(elem);
				result.push(customer);
			});
			return result;
		});
	}

	return core;

});