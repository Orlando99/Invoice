'use strict';

invoicesUnlimited.factory('accountFactory',['userFactory',function(userFactory){
	
	var user = userFactory.authorized();

	if (!user) return undefined;

	var accountInfo;

	if (!accountInfo) {
		var fieldName = "accountInfo";
		var acc_p = user.get(fieldName);
		accountInfo = acc_p.fetch().then(function(object){
			setObjectOperations({
				object 		: object,
				fieldName	: fieldName,
				parent 		: user,
				fields 		: null
			});
			return object;
		});
	}

	return accountInfo;

}]);