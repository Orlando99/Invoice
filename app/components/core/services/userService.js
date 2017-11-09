'use strict';

invoicesUnlimited.factory('userFactory',["appFields",
						  function(appFields){
	
	var currentUser = Parse.User.current() || {
		justLoggedIn : false,
		entity : []
	};

	var User = {
		entity : [],
		commonData : {}
	};

	if (Parse.User.current()) {
		var user = Parse.User.current();
		setObjectOperations({
			object 	: user,
			fields 	: appFields.user});
		User.entity.push(user);
	}
	
	function loadCommonData() {
		if(! User.entity.length)
			return Promise.reject('');

		return User.entity[0].get("organizations")[0].fetch()
		.then(function(org) {
			User.commonData.dateFormat = org.get('dateFormat');
			return Promise.resolve('');
		});
	}

	function setUserFields(){

		User.getField = function(fieldName) {
			if (! isEmpty(User.commonData)) {
				return Promise.resolve(User.commonData[fieldName]);

			} else {
				return loadCommonData().then(function() {
					return User.commonData[fieldName];
				});
			}
		}

		User.login = function(params,successCallback,errorCallback){
			if (User.entity.length &&
				User.entity[0].id) return;
			Parse.User.logIn(params.username, params.password,{
				success: function(user){
					User.justLoggedIn = true;
					setObjectOperations({
						object 		: user,
						fields 		: appFields.user});
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
				User.commonData = {};
			});
		};

		User.signup = function(params){
			var user = new Parse.User;
			return user.signUp(params,{
				success: function(user){
					setObjectOperations({
						object 		: user,
						fields 		: appFields.user});
					User.entity.pop();
					User.entity.push(user);
                    
                    var ProjectUser = Parse.Object.extend("ProjectUser");
                    var projectUser = new ProjectUser();

                    projectUser.set("userID", user);
                    projectUser.set("companyName", user.get('company'));
                    projectUser.set("status", "Activated");
                    projectUser.set("role", "Main");
                    projectUser.set("userName", user.get('username'));
                    projectUser.set("emailID", user.get('email'));
                    projectUser.set("title", user.get('fullName'));
                    projectUser.set("organization", user.get('selectedOrganization'));
                   
                    return projectUser.save(null, {
                      success: function(pUser) {
                          console.log(pUser.className + ' created');
                      },
                      error: function(pUser, error) {
                          console.log(error.message);
                      }
                    });
                    
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
}]);