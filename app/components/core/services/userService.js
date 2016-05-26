'use strict';

invoicesUnlimited.factory('userFactory',function(){
	
	var currentUser = Parse.User.current() || {};
	
	function setUserFields(){
		
		currentUser.login = function(params){
			if (currentUser.id) return;
			return Parse.User.logIn(params.username, params.password, {
				success : function(user){
					currentUser = user;
					console.log("Logged in successfuly!");
				},
				error : function(user,error){
					console.log(error.message);
				}
			});
		};

		currentUser.logout = function(){
			return Parse.User.logOut().then(function(){
				currentUser = {};
				setUserFields();
			});
		};
	}

	setUserFields();
	
	return currentUser;
});