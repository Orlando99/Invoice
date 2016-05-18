'use strict';

invoicesUnlimited.factory('userFactory',function(){
	
	var currentUser = Parse.User.current() || {};
	
	function setLoginUserFields(){
		currentUser.logout = function(){
			return Parse.User.logOut().then(function(){
				currentUser = {};
				setEmptyUserFields();
			});
		};
	}

	function setEmptyUserFields(){
		currentUser.login = function(params){
			return Parse.User.logIn(params.username, params.password, {
				success : function(user){
					currentUser = user;
					console.log("Logged in successfuly!");
				},
				error : function(user,error){
					console.log(error.message);
				}
			});
		}
	}

	function setCommonUserFields(){
		currentUser.authorized = function(){
			if (currentUser.id) return currentUser;
			else return undefined;
		}
	}

	function setUserFields(){
		if (currentUser.id) setLoginUserFields();
		else setEmptyUserFields();
		setCommonUserFields();
	}

	setUserFields();
	
	return currentUser;
});