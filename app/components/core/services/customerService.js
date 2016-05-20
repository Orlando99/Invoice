'use strict';

invoicesUnlimited.factory('customerFactory',function(userFactory){

	var user = userFactory.authorized();
	if (!user) return undefined;

	var customer = {
		getAll : function(){
			var query = new Parse.Query("Customer");
			query.equalTo(userID,user);
			return query.find();
		}
	}

	return customer;

});