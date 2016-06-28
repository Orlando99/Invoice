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
		
		User.login = function(params,successCallback,errorCallback){
			if (User.entity.length &&
				User.entity[0].id) return;
			Parse.User.logIn(params.username, params.password,{
				success: function(user){
					User.justLoggedIn = true;
					User.entity.push(user);
					console.log("Logged in successfuly!");
					successCallback();
				},
				error: function(user,error){
					console.log(error.message);
					errorCallback(error);
				}
			});
		};

		User.logout = function(){
			return Parse.User.logOut().then(function(){
				if (currentUser.entity) currentUser.entity.pop();
				if (currentUser.justLoggedIn) currentUser.justLoggedIn = false;
				User.entity.pop();
			});
		};

		User.signup = function(params){
			var user = new Parse.User;
			return user.signUp(params,{
				success: function(user){
					User.entity.pop();
					User.entity.push(user);
				},
				error : function(user,error){
					console.log(error.message);
				}
			});
		}
	}

	setUserFields();
	
	return User;
});