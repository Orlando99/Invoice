'use strict';

invoicesUnlimited.factory('businessFactory',['userFactory',function(userFactory){
	
	var user = userFactory.authorized();

	if (!user) return undefined;

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
		var princ_p = user.get(fieldName);
		businessInfo = princ_p.fetch().then(function(object){
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