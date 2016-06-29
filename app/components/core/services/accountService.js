'use strict';

invoicesUnlimited.factory('accountFactory',['userFactory',function(userFactory){
	
	var user = userFactory;

	var accountInfo = {entity:[]};
	var fields;

	var loadAccountInfo = function(){
		var fieldName = "accountInfo", acc_p;
		
		if (user.get) acc_p = user.get(fieldName);
		else if (user.entity[0] && user.entity[0].get)
			acc_p = user.entity[0].get(fieldName);

		if (!acc_p) {
			accountInfo.empty = true;
			return acc_p;
		}

		return acc_p
		.fetch()
		.then(function(object){
			setObjectOperations({
				object 		: object,
				fieldName	: fieldName,
				parent 		: user.entity.length ? user.entity[0] : null,
				fields 		: null
			});
			accountInfo.entity.pop();
			accountInfo.entity.push(object);
			return accountInfo;
		});
	}

	accountInfo.load = function(){
		if (accountInfo.entity.length) return accountInfo.entity[0];
		return loadAccountInfo();
	}

	accountInfo.createNew = function(params){
		if (accountInfo.entity.length) return;
		var ctr = Parse.Object.extend("AccountInfo");
		var object = new ctr();
		return object.save(params,{
			success : function(obj){
				setObjectOperations({
					object 		: obj,
					fieldName	: "accountInfo",
					parent 		: user.entity.length ? user.entity[0] : null,
					fields 		: fields});
				accountInfo.entity.push(obj);
				console.log(obj.className + ' created');
			},
			error : function(obj,error){
				console.log(error.message);
			}
		});
	}

	return accountInfo;

}]);