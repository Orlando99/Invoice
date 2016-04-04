'use strict';

angular.module('invoicesUnlimited')
.config(function($stateProvider, $urlRouterProvider){

	var signUpIndex = {
		name : "signup",
		url : "/signup",
		controller : "SignupController",
		templateUrl : "./app/signup/index.html"
	};

	var signUpVerification = {
		name : "signup.verification",
		url : "/verification",
		views : {
			'@' : {
				controller : "VerificationController",
				templateUrl : "./app/signup/verification/signup.verification.html"
			}
		}
	};

	var signUpBusiness = {
		name : 'signup.business-info',
		url : "/business-info",
		views : {
			'@' : {
				controller : "BusinessInfoController",
				templateUrl : "./app/signup/business-info/business-info.html"
			}
		}
	};

	var signUpPrincipal = {
		name : 'signup.principal-info',
		url : "/principal-info",
		views : {
			'@' : {
				controller : "PrincipalInfoController",
				templateUrl : "./app/signup/principal-info/principal-info.html"
			}
		}
	};

	var signUpAccount = {
		name : 'signup.account-info',
		url : "/account-info",
		views : {
			'@' : {
				controller : 'AccountInfoController',
				templateUrl : "./app/signup/account-info/account-info.html"
			}
		}
	};

	var signUpSignature = {
		name : 'signup.signature',
		url : '/signature',
		views : {
			'@' : {
				controller : 'SignatureController',
				templateUrl : './app/signup/signature/signature.html'
			}
		}
	};

	var signUpConfirm = {
		name : 'signup.confirm',
		url  : '/confirm',
		views : {
			'@' : {
				controller  : 'ConfirmController',
				templateUrl : './app/signup/confirm/confirm.html'
			}
		}
	};

	var loginIndex = {
		name 	: 'login',
		url 	: '/login',
		controller : "LoginController",
		templateUrl : "./app/login/login.html"
	}

	var dashboardIndex = {
		name : 'dashboard',
		url : "/dashboard",
		controller : "DashboardController",
		templateUrl : "./app/dashboard/index.html"
	};

	$stateProvider
		.state(loginIndex)
		.state(signUpIndex)
		.state(dashboardIndex)
		.state(signUpVerification)
		.state(signUpBusiness)
		.state(signUpPrincipal)
		.state(signUpAccount)
		.state(signUpSignature)
		.state(signUpConfirm);

	$urlRouterProvider.otherwise('/login');

});