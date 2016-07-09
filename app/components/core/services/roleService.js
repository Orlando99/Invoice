'use strict';

invoicesUnlimited.factory('roleFactory',
	function(userFactory){

	var user = userFactory.entity;

	var role = {entity:[]};

	var loadRole = function() {
		if (!user.length) return;
		if (role.entity.length) return role;
		var query = new Parse.Query(Parse.Role);
		query.equalTo('name',user[0].company);
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

	role.getRole = function(params) {
		var query = new Parse.Query(Parse.Role);
		query.equalTo('name',params.name);
		return query.first();
	}

	role.createNew = function(params) {
		if (role.entity.length) return;

		return role.getRole(params)
		.then(function(roleObj) {
			var roleACL = new Parse.ACL();
			roleACL.setPublicReadAccess(true);
			roleACL.setPublicWriteAccess(true);

			var object = roleObj ? 
						 roleObj : 
						 (new Parse.Role(params.name,roleACL));

			object.getUsers().add(params.userID);

			return object.save({
				success : function(obj){
					role.entity.pop();
					role.entity.push(obj);
					console.log(obj.className + ' created');
				},
				error : function(obj,error){
					console.log(error.message);
				}
			});

		});
	}

	role.createACL = function(){
		if (!role.entity.length) return;
		var newACL = new Parse.ACL();
		newACL.setRoleWriteAccess(role.entity[0],true);
		newACL.setRoleReadAccess(role.entity[0],true);
		return newACL;
	}

	return role;

});