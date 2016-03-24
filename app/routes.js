'use strict';

angular.module('invoicesUnlimited')
.config(function($stateProvider, $urlRouterProvider){

	$urlRouterProvider.otherwise('/signup');

	var signUpIndex = {
		name: 'signup',
		url : "/signup",
		controller : "SignupController",
		templateUrl : "./app/signup/index.html"
	}

	var signUpVerification = {
		name : 'verification',
		url : "/signup/verification",
		controller : "VerificationController",
		templateUrl : "./app/signup/verification/signup.verification.html"
	}

	var signUpBusiness = {
		name : 'business-info',
		url : "/signup/business-info",
		controller : "BusinessInfoController",
		templateUrl : "./app/signup/business-info/business-info.html"
	}

	var signUpPrincipal = {
		name : 'principal-info',
		url : "/signup/principal-info",
		controller : "PrincipalInfoController",
		templateUrl : "./app/signup/principal-info/principal-info.html"
	}

	$stateProvider
		.state(signUpIndex)
		.state(signUpVerification)
		.state(signUpBusiness)
		.state(signUpPrincipal)
		.state('dashboard', {
			url : "/home",
			controller : "",
			templateUrl : "./app/signup/index.html"
		});
});

//app.config(function($locationProvider) {
//  
//});