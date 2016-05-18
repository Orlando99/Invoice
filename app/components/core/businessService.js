'use strict';

invoicesUnlimited.factory('businessFactory',['userFactory',function(userFactory){
	
	var user = userFactory.authorized();

	var businessInfo;

	if (user && !businessInfo) {
		var bus_p = user.get("businessInfo");
		businessLoaded = bus_p.fetch();
	}

	return businessInfo;

}]);