'use strict';

invoicesUnlimited.factory('roleFactory',
	function(businessFactory){

	var business = businessFactory;

	var role = {entity:[]};

	var loadRole = function() {
		if (!business.entity.length) return;
		if (role.entity.length) return role;
		var name = business.entity[0].businessName;
		var query = new Parse.Query(Parse.Role);
		query.equalTo('name',name);
		return query.first().then(
			function(roleObj){
				role.entity.pop();
				role.entity.push(roleObj);
				return role;
			},
			function(error){
				console.log(error.message);
				return error;
			}
		);
	};

	role.load = function() {
		//if (role.entity.length) return role;
		return loadRole();
	};

	role.createNew = function(params) {
		if (role.entity.length) return;
		var roleACL = new Parse.ACL();
		roleACL.setPublicReadAccess(true);
		roleACL.setPublicWriteAccess(true);

		var object = new Parse.Role(params.name,roleACL);
		object.getUsers().add(params.user);
debugger;
		return object.save({
			success : function(obj){
				role.entity.push(obj);
				console.log(obj.className);
			},
			error : function(obj,error){
				console.log(error.message);
			}
		});
	}

	return role;

});