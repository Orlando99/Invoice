'use strict';

invoicesUnlimited.factory('businessFactory',['userFactory',function(userFactory){
	
	var user = userFactory;

	if (!user.id) return undefined;

	var businessInfo;

	var fields = [
		"businessName",
		"city",
		"zipCode",
		"streetName",
		"state",
		"phoneNumber"
	];
	
	if (!businessInfo) {
		var fieldName = "businessInfo";
		var bus_p = user.get(fieldName);
		businessInfo = bus_p.fetch().then(function(object){
			setObjectOperations({
				object 		: object,
				fieldName	: fieldName,
				parent 		: user,
				fields 		: fields});
			businessInfo = object;
			return object;
		});
	} else if (businessInfo.id) return businessInfo;
	
	return businessInfo;

}]);