'use strict';

invoicesUnlimited.factory('userFactory',function(){
	
	var currentUser = Parse.User.current() || {
		justLoggedIn : false,
		entity : []
	};

	var User = {
		entity : []
	};

	if (Parse.User.current()) 
		User.entity.push(Parse.User.current());
	
	function setUserFields(){
		
		currentUser.login = function(params,successCallback,errorCallback){
			/*if (currentUser.id || 
				(currentUser.entity[0] && 
				 currentUser.entity[0].id) ||
				 (User.entity.length &&
				 	User.entity[0].id)) return;*/
			//currentUser.entity = [];
			if (User.entity.length &&
				User.entity[0].id) return;
			Parse.User.logIn(params.username, params.password,{
				success: function(user){
					//currentUser.justLoggedIn = true;
					User.justLoggedIn = true;
					User.entity.push(user);
					//currentUser.entity.push(user);
					console.log("Logged in successfuly!");
					successCallback();
				},
				error: function(user,error){
					console.log(error.message);
					errorCallback(error);
				}
			});
		};

		currentUser.logout = function(){
			return Parse.User.logOut().then(function(){
				if (currentUser.entity) currentUser.entity.pop();
				if (currentUser.justLoggedIn) currentUser.justLoggedIn = false;
				User.entity.pop();
			});
		};

		User.login = currentUser.login;
		User.logout = currentUser.logout;
	}

	setUserFields();
	
	return User;
});