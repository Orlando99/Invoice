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

	var signUpIndexExtended = {
		name : 'signup-extended',
		url : "/signup/2",
		controller : "SignUpController",
		templateUrl : "./signUp/signup-2.html"
	}

	$stateProvider
		.state(signUpIndex)
		.state(signUpIndexExtended)
		.state('dashboard', {
			url : "/home",
			controller : "",
			templateUrl : "./signup/index.html"
		});
});

//app.config(function($locationProvider) {
//  
//});