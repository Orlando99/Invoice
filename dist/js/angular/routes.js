'use strict';

angular.module('invoicesUnlimited')
.config(function($stateProvider, $urlRouterProvider){

	$urlRouterProvider.otherwise('/signup');

	var signUpIndex = {
		name: 'signup',
		url : "/signup",
		controller : "SignUpController",
		templateUrl : "./signUp/index.html"
	}

	var signUpVerification = {
		name : 'verification',
		url : "/signup/verification",
		controller : "SignUpController",
		templateUrl : "./signUp/verification.html"
	}

	$stateProvider
		.state(signUpIndex)
		.state(signUpVerification)
		.state('dashboard', {
			url : "/home",
			controller : "",
			templateUrl : "./signup/index.html"
		});
});

//app.config(function($locationProvider) {
//  
//});