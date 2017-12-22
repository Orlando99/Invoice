'use strict';

angular.module('clientAdminPortalApp').config(function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise('/home');

	$stateProvider
		.state('login', {
		url: "/login",
		controller: "LoginController",
		templateUrl: "templates/login.html"
	})

		.state('resellers', {
		url: "/resellers/:resellerId",
		controller: "resellersController",
		templateUrl: "templates/resellers.html"
	})

		.state('resellerstutorial',{
		url: "/resellerstutorial",
		controller: "resellerstutorialController",
		templateUrl: "templates/resellerstutorial.html"
	})
		.state('resellerprofile', {
		url: "/resellerprofile",
		controller: "resellerProfileController",
		templateUrl: "templates/resellerprofile.html"
	})

		.state('resellerSignup', {
		url: "/resellerSignup",
		controller : "ResellerSignupController",
		templateUrl: "templates/resellerSignup.html"
	})
		.state('home', {
		url: "/home",
		controller: "UserRecordController",
		templateUrl: "templates/home.html"
	});
});
