'use strict';

$(document).ready(function(){

	$.validator.addMethod(
		"ConfirmPasswordMatch",
		function(value,element){
			return value == $("input[name='newPassword']").val();
		},''
	);

	$.validator.addMethod(
		"UserNameExists",
		function(value,element){
			return !parseInt($('#username-exists').val());
		},''
	);

});

invoicesUnlimited.controller('UserProfileController',
							 ['$scope','$state','$controller','userFactory','organizationFactory','projectUserFactory','$q',
							  function($scope,$state,$controller,userFactory,organizationFactory,projectUserFactory,$q){

								  if(! userFactory.entity.length) {
									  console.log('User not logged in');
									  $state.go('login');
									  return undefined;
								  }

								  $controller('DashboardController',{$scope:$scope,$state:$state});

								  if(!$scope.userLogo){
									  var selectedorganization = userFactory.entity[0].get("selectedOrganization");
									  var query = new Parse.Query('Organization');
									  query.get(selectedorganization.id, {
										  success: function(obj) {
											  $scope.org = obj;
											  var logo = obj.get('logo');
											  if(logo){
												  $scope.userLogo = logo._url;
											  }
											  else{
												  $scope.userLogo = './assets/images/user-icon.png';
											  }
											  $scope.$apply();

										  },
										  error: function(obj, error) {
											  // The object was not retrieved successfully.
											  // error is a Parse.Error with an error code and message.
										  }
									  });
								  }

								  $("#user-info-form").validate({
									  onkeyup : function(element) {$(element).valid()},
									  onfocusout : function(element) {$(element).valid()},
									  rules: {
										  name : {
											  required : true
										  },
										  email: {
											  required : true,
											  email : true
										  },
										  username: {
											  required : true
										  }
									  },
									  messages: {
										  name: {
											  required : "Please enter name!"
										  },
										  email: {
											  required : "Please enter email!",
											  email : "Please enter valid email"
										  },
										  username: {
											  required : "Please enter username!"
										  }
									  }
								  });

								  var user = userFactory.entity[0];

								  //hideLoader();

								  projectUserFactory.getByUsername(user.get("username"))
									  .then(function(obj){
									  $scope.projectUser = obj;
								  });

								  $q.when(user.fetch()).then(function(){ 
									  $scope.UserInfo = {
										  name 		: user.get("fullName"),
										  email 		: user.get("email"),
										  username 	: user.get("username"),
										  country     : user.get("country")
									  }
									  hideLoader();
								  });

								  $scope.saveBusiness = saveNow;

								  function saveNow(){
									  if(!$('#user-info-form').valid())
										  return;
									  
									  showLoader();
									  user.set('fullName',$scope.UserInfo.name);
									  user.set( 'email',$scope.UserInfo.email);
									  user.set('username',$scope.UserInfo.username);
									  user.set('country',$scope.UserInfo.country);

									  var promises = [];

									  user.save().then(function(){
										  if($scope.projectUser){
											  $scope.projectUser.set('userName', user.get('username'));
											  $scope.projectUser.set('country', user.get('country'));
											  $scope.projectUser.set('emailID', user.get('email'));
											  $scope.projectUser.set('title', user.get('fullName'));

											  $scope.projectUser.save().then(function(){
												  hideLoader();
												  showSnackbar("Save Successful. Reloading page in 3 sec...");
												  setTimeout(function(){ window.location.reload(); }, 2000);
											  });

										  } else {
											  hideLoader();
											  showSnackbar("Save Successful. Reloading page in 3 sec...");
											  setTimeout(function(){ window.location.reload(); }, 2000);
										  }
									  }, function(error){
										  if(error.message.toLowerCase().includes('email'))
											  $scope.emailError = error.message;
										  if(error.message.toLowerCase().includes('username'))
											  $scope.usernameError = error.message;

										  if(!$scope.$$phase)
											  $scope.$apply();

										  hideLoader();
										  console.log(error.message);
										  debugger;
									  });

								  }

								  $("#changePasswordForm").validate({
									  onkeyup : function(element) {$(element).valid()},
									  onfocusout : false,
									  rules: {
										  existingPassword : {
											  required : true
										  },
										  newPassword: {
											  required : true,
											  minlength : 6
										  }, //'required',
										  confirmPassword: {
											  required : true,
											  ConfirmPasswordMatch : true
										  }
									  },
									  messages: {
										  existingPassword: {
											  required : "Please enter existing password !",
											  minlength : "Password should contain atleast 6 characters"
										  },
										  newPassword: {
											  required : "Please enter new password !",
											  minlength : "Password should contain atleast 6 characters"
										  },
										  confirmPassword: {
											  required : "Please confirm password !",
											  ConfirmPasswordMatch : "Passwords do not match!"
										  }
									  }
								  });

								  function resetPasswordForm(){
									  $scope.existingPassword = '';
									  $scope.newPassword = '';
									  $scope.confirmPassword = '';
								  }

								  $scope.showModal = function(){
									  $('#changePasswordModal').show();
								  }
								  $scope.closeModal = function(){
									  $('#changePasswordModal').hide();
									  resetPasswordForm();
								  }

								  $scope.updatePassword = function(){
									  if(!$("#changePasswordForm").valid()) return;
									  showLoader();
									  Parse.User.logIn(userFactory.entity[0].username, $scope.existingPassword,{
										  success: function(obj){
											  obj.set('password', $scope.newPassword)
											  obj.save()
												  .then(function(){
												  $('#changePasswordModal').hide();
												  resetPasswordForm();
												  hideLoader();
											  });
										  },
										  error: function(user,error){
											  console.log(error.message);
											  hideLoader();
											  ShowMessage("Incorrect Existing Password!","error");
										  }
									  });

								  }
							  }]);
