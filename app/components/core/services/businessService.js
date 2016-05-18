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

	var defineProperties = function(object){
		for(var i in fields){
			object.__defineGetter__(fields[i],(function(fieldName){
				return function(){
					return this.get(fieldName);
				}
			})(fields[i]));
			object.__defineSetter__(fields[i],(function(fieldName){
				return function(newValue){
					return this.set(fieldName, newValue);
				}
			})(fields[i]));
		}
	}

	function setObjectOperations(object){

		defineProperties(object);
		object.destroyDeep = function(){
			return object.destory().then(function(obj){
				user.unset("businessInfo");
				return user.save();
			});
		};
	}

	if (!businessInfo) {
		var princ_p = user.get("businessInfo");
		businessInfo = princ_p.fetch().then(function(object){
			setObjectOperations(object);
			return object;
		});
	}

	return businessInfo;

}]);