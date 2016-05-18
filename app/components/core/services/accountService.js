'use strict';

invoicesUnlimited.factory('accountFactory',['userFactory',function(userFactory){
	
	var user = userFactory.authorized();

	if (!user) return undefined;

	var accountInfo;

	function setObjectOperations(object){
		object.destroyDeep = function(){
			return object.destory().then(function(obj){
				user.unset("accountInfo");
				return user.save();
			});
		}
	}

	if (!accountInfo) {
		var princ_p = user.get("accountInfo");
		accountInfo = princ_p.fetch().then(function(object){
			setObjectOperations(object);
			return object;
		});
	}

	return accountInfo;

}]);