'use strict';

invoicesUnlimited.factory('businessFactory',
	['userFactory','$rootScope',
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
		var fieldName = "businessInfo", bus_p;
		if (user.get) bus_p = user.get(fieldName);
		else if (user.entity[0] && user.entity[0].get)
			bus_p = user.entity[0].get(fieldName);

		if (!bus_p) {
			businessInfo.empty = true;
			return bus_p;
		}

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
			console.log(error.message);
		});
	}

	businessInfo.load = function(){
		if (businessInfo.entity.length) return businessInfo;
		return loadBusinessInfo();
	}

	businessInfo.createNew = function(params){
		if (businessInfo.entity.length) return;
		var ctr = Parse.Object.extend("BusinessInfo");
		var object = new ctr();
		return object.save(params,{
			success : function(obj){
				businessInfo.entity.push(obj);
				console.log(obj.className + ' created');
			},
			error : function(obj,error){
				console.log(error.message);
			}
		});
	}

	return businessInfo;

}]);