'use strict';

invoicesUnlimited.factory('userFactory',function(){
	
	var currentUser = Parse.User.current() || {
		justLoggedIn : false,
		entity : []
	};

	var fields = [
		'EPNrestrictKey',
		'merchantID',
		'colorTheme',
		'role',
		'username',
		'country',
		'phonenumber',
		'EPNusername',
		'fullName',
		'firstScreen',
		'email',
		'company'
	];

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
					setObjectOperations({
						object 		: user,
						fields 		: fields});
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
					setObjectOperations({
						object 		: user,
						fields 		: fields});
					User.entity.pop();
					User.entity.push(user);
					console.log(user.className + ' created');
				},
				error : function(user,error){
					console.log(error.message);
				}
			});
		};

		User.save = function(params){
			if (!User.entity.length) {
				console.log('Unable to save user. The user is undefined');
				return;
			}
			if (params === undefined) params = null;
			return User.entity[0].save(params);
		}
	}

	setUserFields();
	
	return User;
});