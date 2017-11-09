'use strict';

invoicesUnlimited.factory('signatureFactory',["userFactory","roleFactory",
	function(userFactory,roleFactory){
	
	var user = userFactory;

	var signature = {entity:[]};
	var fields;

	var loadSignature = function(){
		var fieldName = "signatureImage", sign_p;
		
		if (user.get) sign_p = user.get(fieldName);
		else if (user.entity[0] && user.entity[0].get)
			sign_p = user.entity[0].get(fieldName);

		if (!sign_p) {
			signature.empty = true;
			return sign_p;
		}

		return sign_p
		.fetch()
		.then(function(object){
			setObjectOperations({
				object 		: object,
				fieldName	: fieldName,
				parent 		: user.entity.length ? user.entity[0] : null,
				fields 		: fields});
			signature.entity.pop();
			signature.entity.push(object);
			return signature;
		},function(error){
			console.log(error.message);
		});
	}

	signature.clearAllOnLogOut = function(){
		signature.entity.length = 0;
	}

	signature.load = function(){
		if (signature.entity.length) return signature.entity[0];
		return loadSignature();
	}

	signature.createNew = function(params){
		if (signature.entity.length) return;
		var ctr = Parse.Object.extend("Signature");
		var object = new ctr();
		object.setACL(roleFactory.createACL());
		return object.save(params,{
			success : function(obj){
				setObjectOperations({
					object 		: obj,
					fieldName	: "signatureImage",
					parent 		: user.entity.length ? user.entity[0] : null,
					fields 		: fields});
				signature.entity.push(obj);
				console.log(obj.className + ' created');
			},
			error : function(obj,error){
				console.log(error.message);
			}
		});
	}

	return signature;

}]);