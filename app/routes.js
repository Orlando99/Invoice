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

	var dashboard = {
		settings : {
			index : {
				name	: 'dashboard.settings',
				url 	: '/settings',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl : './app/dashboard/settings/companyprofile.html'
					}
				}
			},
			AppPreferences : {
				name	: 'dashboard.settings.app-preferences',
				url 	: '/app-preferences',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl : './app/dashboard/settings/app-preferences.html'
					}
				}
			},
			Currencies : {
				name	: 'dashboard.settings.currencies',
				url 	: '/currencies',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: './app/dashboard/settings/currencies.html'
					}
				}
			},
			Users 		: {
				name	: 'dashboard.settings.users',
				url 	: '/users',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: './app/dashboard/settings/users.html'
					}
				}
			},
			Items 		: {
				name 	: 'dashboard.settings.items',
				url 	: '/items',
				views 	: {
					'@' : {
						controller  : 'SettingsController',
						templateUrl : './app/dashboard/settings/items.html'
					}
				}
			},
			Taxes		: {
				name	: 'dashboard.settings.taxes',
				url 	: '/taxes',
				views 	: {
					'@' : {
						controller  : 'SettingsController',
						templateUrl : './app/dashboard/settings/taxes.html'
					}
				}
			},
			Payments 	: {
				name	: 'dashboard.settings.payments',
				url 	: '/payments',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: './app/dashboard/settings/payments.html'
					}
				}
			},
			Estimates 	: {
				name	: 'dashboard.settings.estimates',
				url 	: '/estimates',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: './app/dashboard/settings/estimates.html'
					}
				}
			},
			InvoiceTemplates : {
				name	: 'dashboard.settings.invoice-templates',
				url 	: '/invoice-templates',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: './app/dashboard/settings/invoicetemplates.html'
					}
				}
			},
			CreditNotes : {
				name	: 'dashboard.settings.credit-notes',
				url 	: '/credit-notes',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: './app/dashboard/settings/creditnotes.html'
					}
				}
			},
			Invoices 	: {
				name	: 'dashboard.settings.invoices',
				url 	: '/invoices',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: './app/dashboard/settings/invoices.html'
					}
				}
			},
			GeneralPreferences : {
				name	: 'dashboard.settings.general-preferences',
				url 	: '/general-preferences',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: './app/dashboard/settings/generalpreferences.html'
					}
				}
			},
			CompanyProfile : {
				name	: 'dashboard.settings.company-profile',
				url 	: '/company-profile',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: './app/dashboard/settings/companyprofile.html'
					}
				}
			}
		},
		index : {
			name : 'dashboard',
			url : "/dashboard",
			controller : "DashboardController",
			templateUrl : "./app/dashboard/index.html"
		}
	}

	$stateProvider
		.state(loginIndex)
		.state(signUpIndex)
		.state(dashboard.index)
		.state(dashboard.settings.index)
		.state(dashboard.settings.AppPreferences)
		.state(dashboard.settings.Currencies)
		.state(dashboard.settings.Users)
		.state(dashboard.settings.Items)
		.state(dashboard.settings.Taxes)
		.state(dashboard.settings.Payments)
		.state(dashboard.settings.Estimates)
		.state(dashboard.settings.InvoiceTemplates)
		.state(dashboard.settings.CreditNotes)
		.state(dashboard.settings.Invoices)
		.state(dashboard.settings.GeneralPreferences)
		.state(dashboard.settings.CompanyProfile)
		.state(signUpVerification)
		.state(signUpBusiness)
		.state(signUpPrincipal)
		.state(signUpAccount)
		.state(signUpSignature)
		.state(signUpConfirm);

	$urlRouterProvider.otherwise('/login');

});