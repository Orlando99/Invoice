'use strict';

invoicesUnlimited.factory('principalFactory',
	['userFactory',
	function(userFactory){
	
	var user = userFactory;

	var principalInfo = {entity:[]};
	var fields;

	var loadPrincipalInfo = function() {
		var fieldName = "principalInfo", princ_p;
		
		if (user.get) princ_p = user.get(fieldName);
		else if (user.entity[0] && user.entity[0].get)
			princ_p = user.entity[0].get(fieldName);

		if (!princ_p) {
			principalInfo.empty = true;
			return princ_p;
		}
		
		return princ_p
		.fetch()
		.then(function(object){
			setObjectOperations({
				object 		: object,
				fieldName	: fieldName,
				parent 		: user.entity.length ? user.entity[0] : null,
				fields 		: null
			});
			principalInfo.entity.pop();
			principalInfo.entity.push(object);
			return principalInfo;
		},function(error){
			console.log(error.message);
		});
	}

	principalInfo.load = function(){
		if (principalInfo.entity.length) return principalInfo.entity[0];
		return loadPrincipalInfo();
	}

	principalInfo.createNew = function(params){
		if (principalInfo.entity.length) return;
		var ctr = Parse.Object.extend("PrincipalInfo");
		var object = new ctr();
		return object.save(params,{
			success : function(obj){
				setObjectOperations({
					object 		: obj,
					fieldName	: "principalInfo",
					parent 		: user.entity.length ? user.entity[0] : null,
					fields 		: fields});
				principalInfo.entity.push(obj);
				console.log(obj.className + ' created');
			},
			error : function(obj,error){
				console.log(error.message);
			}
		});
	}

	return principalInfo;

}]);