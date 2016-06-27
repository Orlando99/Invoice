'use strict';

invoicesUnlimited.factory('businessFactory',['userFactory','$rootScope',
	function(userFactory,$rootScope){
	
	var user = userFactory;

	var businessInfo = {entity:[]};

	var fields = [
		"businessName",
		"city",
		"zipCode",
		"streetName",
		"state",
		"phoneNumber"
	];
	
	var loadBusinessInfo = function(){
		var fieldName = "businessInfo";
		var bus_p = user.get ? 
					user.get(fieldName) : 
					user.entity[0].get(fieldName);

		if (!bus_p) businessInfo.empty = true;

		return bus_p
		.fetch()
		.then(function(object){
			setObjectOperations({
				object 		: object,
				fieldName	: fieldName,
				parent 		: user,
				fields 		: fields});
			businessInfo.entity.pop();
			businessInfo.entity.push(object);
			return businessInfo;
		},function(error){
			debugger;
		});
	}

	businessInfo.load = function(){
		return loadBusinessInfo();
	}

	return businessInfo;

}]);