'use strict';

angular.module('invoicesUnlimited')
.config(function($stateProvider, $urlRouterProvider){

	$urlRouterProvider.otherwise('/signup');

	$stateProvider
		.state('signup',{
			url : "/signup",
			controller : "SignUpVerificationController",
			templateUrl : "./signUp/index.html"
		})
		.state('signup.verify',{
			url : "/signup",
			controller : "SignUpVerificationController",
			templateUrl : "./../signUp/signup-2.html"
		})
		.state('dashboard', {
			url : "/home",
			controller : "",
			templateUrl : "./signup/index.html"
		});
});

//app.config(function($locationProvider) {
//  
//});