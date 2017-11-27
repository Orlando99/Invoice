'use strict';

String.prototype.capitilize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller
('LoginController',
 ['$scope','$state','userFullFactory','userFactory',
  function($scope,$state,userFullFactory,userFactory){

	  $scope.username = "";
	  $scope.password = "";

	  var user = userFactory;

	  if ($state.$current.name.includes('processing')) {
		  showLoader();
		  return;
	  }

	  if (user.entity.length) {
		  $state.go('dashboard');
		  return;
	  }

	  if ($state.params.errorMsg) {
		  showError($state.params.errorMsg);
		  hideLoader();
	  }

	  $scope.pageReady = function($event) {
		  $.reject({  
			  reject: {  
				  safari: true, // Apple Safari  
				  //chrome: true, // Google Chrome  
				  firefox: true, // Mozilla Firefox  
				  msie: true, // Microsoft Internet Explorer  
				  opera: true, // Opera  
				  konqueror: true, // Konqueror (Linux)  
				  unknown: true // Everything else  
			  },
			  display: ['chrome'],
			  browserInfo: { // Settings for which browsers to display  
				  chrome: {  
					  // Text below the icon  
					  text: 'Google Chrome',  
					  // URL For icon/text link  
					  url: 'http://www.google.com/chrome/',   
				  } 
			  },
			  // Pop-up Window Text
			  header: '',

			  paragraph1: 'Invoices Unlimited is optimized for Google Chrome. If you continue to use this browser you may run into some issues.',

			  paragraph2: 'Just click on the icon to get to the download page',

			  // Allow closing of window
			  close: true,

			  // Message displayed below closing link
			  closeMessage: 'By closing this window you acknowledge that your experience '+
			  'on this website may be degraded',
			  closeLink: 'Close This Window',
			  closeESC: true,  
			  // Use cookies to remmember if window was closed previously?  
			  closeCookie: true, 
			  cookieSettings: {  
				  // Path for the cookie to be saved on  
				  // Should be root domain in most cases  
				  path: '/',  
				  // Expiration Date (in seconds)  
				  // 0 (default) means it ends with the current session  
				  expires: 0  
			  }, 
			  imagePath: './assets/images/'
		  });
	  };

	  $scope.signUpAction = function(){
		  $state.go('signup');
	  }

	  $scope.signInAction = function()
	  {
		  if(! ($scope.username && $scope.password)) {
			  showError('Please provide both username and password.');
			  return;
		  }
		  showLoader();

		  var parseUser = Parse.Object.extend('User');
		  var userQuery = new Parse.Query(parseUser);
		  userQuery.equalTo('username', $scope.username);

		  userQuery.first()
			  .then(function(obj){
			  if(!obj){
				  hideLoader();
				  $('.errorMessage').html("Invalid username.").show();
				  return;
			  }

			  user.login({
				  username : $scope.username,
				  password : $scope.password
			  },function(){
				  $('.errorMessage').html('').hide();
				  var firstScreen = user.entity[0].get('firstScreen');
				  var tutorial = user.entity[0].get('tutorial');
				  var userObjectId = user.entity[0].id;
				  var projectUser = Parse.Object.extend('ProjectUser');
				  var query = new Parse.Query(projectUser);
				  query.equalTo('userName', $scope.username);
				  query.first()
					  .then(function(obj) {
					  if(obj)
					  {
						  if(obj.get("status") == "Deactivated")
						  {
							  user.logout()
								  .then(function(){
								  hideLoader();
								  $('.errorMessage').html("Your Account is not Activated!").show();
							  });
						  }
						  else
						  {      
							  if(!tutorial)
								  $state.go('signup.invoiceTemplateInfo');
							  else
							  {
								  if(user.entity[0].get('role') == 'Sales')
									  $state.go('dashboard.sales.invoices.all');
								  else {
									  switch(firstScreen) {
										  case 'Dashboard': 		$state.go('dashboard'); break;
										  case 'Customer List': 	$state.go('dashboard.customers.all'); break;
										  case 'Invoices List': 	$state.go('dashboard.sales.invoices.all'); break;
										  case 'Expense List':		$state.go('dashboard.expenses.all'); break;
										  case 'Estimate List': 	$state.go('dashboard.sales.estimates.all'); break;
										  case 'Credit Notes List': $state.go('dashboard.sales.creditnotes.all'); break;
										  case 'Reports': 		  	$state.go('dashboard.reports'); break;
										  case 'Settings': 		  	$state.go('dashboard.settings.company-profile'); break;
										  default: 				  	$state.go('dashboard'); break;
														}
								  }
							  }//end of else
						  }//end of else
					  }//eend of if 
					  else
					  {
						  hideLoader();
						  $('.errorMessage').html("Invalid username/password.").show();
					  }

				  });
			  },function(error){
				  hideLoader();
				  if(error.message.indexOf('password') >= 0)
					  $('.errorMessage').html("Invalid password.").show();
				  else
					  $('.errorMessage').html(error.message.capitilize()).show();
				  $('.input-container').css({'border':'1px solid red'});
			  });

		  }, function(error){
			  hideLoader();
			  if(error.message.indexOf('password') >= 0)
				  $('.errorMessage').html("Something went wrong. Please try again").show();
			  console.error(error.message);
		  });



	  }//end of scope.sign in

	  $scope.sendPasswordResetLink = function() {
		  if(! $scope.email) {
			  showError('Please enter email address.');
			  return;
		  }

		  showLoader();
		  Parse.User.requestPasswordReset($scope.email)
			  .then(function() {
			  showSuccess('Reset Password Link sent to specified email.');
			  hideLoader();
		  }, function(error) {
			  showError(error.message);
			  hideLoader();
		  });
	  }


	  function showError(msg) {
		  $('.successMessage').html('').hide();
		  $('.errorMessage').html(msg).show();
		  $('.input-container').css({'border':'1px solid red'});
	  }

	  function showSuccess(msg) {
		  $('.errorMessage').html('').hide();
		  $('.successMessage').html(msg).show();
		  $('.input-container').css({'border':''});
	  }
	  /*
        submitLead();
        function submitLead(){
            var data = undefined;

            data = {
                'status' : "New Lead",
                'list' : IRIS_SOURCE,
                'BusinessName' : 'Testing',
                'Email' : 'Test@email.com',
                'HomeAddress' : '09/29/1993',
                'DateOfBirthMmDdYyyy' : '01/01/1993'

            }

            $.ajax({
                method:"POST",
                type:"POST",
                url: CRM_URL,
                data: data
            })
            .then(function (result) {
                console.log("IRIS Lead Submitted");
                debugger;
                //hideLoader();
                //$state.go('signup.invoiceTemplateInfo');
            }, function(error){
                console.error("IRIS Lead Sumission failed");
                debugger;
                //hideLoader();
                //$state.go('signup.invoiceTemplateInfo');
            });
        }
        */
	  Parse.Cloud.run("hello12",{})
		  .then(function(msg){
		  console.log(msg); 
	  }, function(error){
		  console.error(error);
	  });

	  /*
        Parse.Cloud.run("sendMailgunSample", {
			toEmail: 'mianazhar2005@gmail.com',
			fromEmail: "no-reply@invoicesunlimited.com",
			subject : 'Testing',
			html : '<h1>This is test email.</h1>'
		}).then(function(msg) {
			console.log(msg);
		});
        */

  }]);
