'use strict';

invoicesUnlimited.factory('roleFactory',
	function(userFactory){

	var user = userFactory.entity;

	var role = {entity:[]};

	var loadRole = function() {
		if (!user.length) return;
		if (role.entity.length) return Promise.resolve(role);
		var query = new Parse.Query(Parse.Role);
		//query.equalTo('name',user[0].username);
		query.equalTo('users', user[0]);
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

	role.clearAllOnLogOut = function(){
		role.entity.length = 0;
	}

	role.addUser = function(user) {
		if (!role.entity.length) {
			return loadRole()
			.then(function(){
				role.entity[0].getUsers().add(user);
				return role.entity[0].save();
			});
		} else {
			role.entity[0].getUsers().add(user);
			return role.entity[0].save();
		}
	}

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
				error : function(error){
					console.log(error.message);
				}
			});

		});
	}

	role.createACL = function(){
		if (!role.entity.length) return;
		var newACL = new Parse.ACL();
        /*
		newACL.setRoleWriteAccess(role.entity[0],true);
		newACL.setRoleReadAccess(role.entity[0],true);
        */
        newACL.setPublicReadAccess(true);
        newACL.setPublicWriteAccess(true);
		return newACL;
	}

	return role;

});