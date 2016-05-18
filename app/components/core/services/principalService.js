'use strict';

invoicesUnlimited.factory('principalFactory',['userFactory',function(userFactory){
	
	var user = userFactory.authorized();

	if (!user) return undefined;

	var principalInfo;

	function setObjectOperations(object){
		object.destroyDeep = function(){
			return object.destory().then(function(obj){
				user.unset("principalInfo");
				return user.save();
			});
		}
	}

	if (!principalInfo) {
		var princ_p = user.get("principalInfo");
		principalInfo = princ_p.fetch().then(function(object){
			setObjectOperations(object);
			return object;
		});
	}

	return principalInfo;

}]);