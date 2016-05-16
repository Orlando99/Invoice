'use strict';

angular.module('invoicesUnlimited')
.config(function($stateProvider, $urlRouterProvider){

	var signup = {
		index : {
			name : "signup",
			url : "/signup",
			controller : "SignupController",
			templateUrl : COMPONENTS + "signup/views/index.html"
		},
		verification : {
			name : "signup.verification",
			url : "/verification",
			views : {
				'@' : {
					controller : "VerificationController",
					templateUrl : COMPONENTS + "signup/views/verificationView.html"
				}
			}
		},
		businessInfo : {
			name : 'signup.business-info',
			url : "/business-info",
			views : {
				'@' : {
					controller : "BusinessInfoController",
					templateUrl : COMPONENTS + "signup/businessInfoView.html"
				}
			}
		},
		principalInfo : {
			name : 'signup.principal-info',
			url : "/principal-info",
			views : {
				'@' : {
					controller : "PrincipalInfoController",
					templateUrl : COMPONENTS + "signup/principalInfoView.html"
				}
			}
		},
		accountInfo : {
			name : 'signup.account-info',
			url : "/account-info",
			views : {
				'@' : {
					controller : 'AccountInfoController',
					templateUrl : COMPONENTS + "signup/accountInfoView.html"
				}
			}
		},
		signature : {
			name : 'signup.signature',
			url : '/signature',
			views : {
				'@' : {
					controller : 'SignatureController',
					templateUrl : COMPONENTS + 'signup/signatureView.html'
				}
			}
		},
		confirm : {
			name : 'signup.confirm',
			url  : '/confirm',
			views : {
				'@' : {
					controller  : 'ConfirmController',
					templateUrl : COMPONENTS + 'signup/confirmView.html'
				}
			}
		}
	}

	var login = {
		index : {
			name 	: 'login',
			url 	: '/login',
			controller : "LoginController",
			templateUrl : COMPONENTS + "login/views/loginView.html"
		}
	}

	var dashboard = {
		settings : {
			index : {
				name	: 'dashboard.settings',
				url 	: '/settings',
				views 	: {
					'@'	: {
						controler 	: 'SettingsController',
						templateUrl : COMPONENTS + 'dashboard/views/settings/companyprofile.html'
					}
				}
			},
			AppPreferences : {
				name	: 'dashboard.settings.app-preferences',
				url 	: '/app-preferences',
				views 	: {
					'@'	: {
						controller 	: 'AppPreferencesController',
						templateUrl : COMPONENTS + 'dashboard/views/settings/app-preferences.html'
					}
				}
			},
			Currencies : {
				name	: 'dashboard.settings.currencies',
				url 	: '/currencies',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: COMPONENTS + 'dashboard/views/settings/currencies.html'
					}
				}
			},
			Users 		: {
				name	: 'dashboard.settings.users',
				url 	: '/users',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: COMPONENTS + 'dashboard/views/settings/users.html'
					}
				}
			},
			Items 		: {
				name 	: 'dashboard.settings.items',
				url 	: '/items',
				views 	: {
					'@' : {
						controller  : 'SettingsController',
						templateUrl : COMPONENTS + 'dashboard/views/settings/items.html'
					}
				}
			},
			Taxes		: {
				name	: 'dashboard.settings.taxes',
				url 	: '/taxes',
				views 	: {
					'@' : {
						controller  : 'SettingsController',
						templateUrl : COMPONENTS + 'dashboard/views/settings/taxes.html'
					}
				}
			},
			Payments 	: {
				name	: 'dashboard.settings.payments',
				url 	: '/payments',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: COMPONENTS + 'dashboard/views/settings/payments.html'
					}
				}
			},
			Estimates 	: {
				name	: 'dashboard.settings.estimates',
				url 	: '/estimates',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: COMPONENTS + 'dashboard/views/settings/estimates.html'
					}
				}
			},
			InvoiceTemplates : {
				name	: 'dashboard.settings.invoice-templates',
				url 	: '/invoice-templates',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: COMPONENTS + 'dashboard/views/settings/invoicetemplates.html'
					}
				}
			},
			CreditNotes : {
				name	: 'dashboard.settings.credit-notes',
				url 	: '/credit-notes',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: COMPONENTS + 'dashboard/views/settings/creditnotes.html'
					}
				}
			},
			Invoices 	: {
				name	: 'dashboard.settings.invoices',
				url 	: '/invoices',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: COMPONENTS + 'dashboard/views/settings/invoices.html'
					}
				}
			},
			GeneralPreferences : {
				name	: 'dashboard.settings.general-preferences',
				url 	: '/general-preferences',
				views 	: {
					'@'	: {
						controller 	: 'SettingsController',
						templateUrl	: COMPONENTS + 'dashboard/views/settings/generalpreferences.html'
					}
				}
			},
			CompanyProfile : {
				name	: 'dashboard.settings.company-profile',
				url 	: '/company-profile',
				views 	: {
					'@'	: {
						controller 	: 'CompanyProfileController',
						templateUrl	: COMPONENTS + 'dashboard/views/settings/companyprofile.html'
					}
				}
			}
		},
		index : {
			name : 'dashboard',
			url : "/dashboard",
			controller : "DashboardController",
			templateUrl : COMPONENTS + "dashboard/views/index.html"
		}
	}

	function addStatesFrom(stateLists) {
		stateLists.forEach(function(list){
			if (Array.isArray(list))
				list.forEach(function(state){ $stateProvider.state(state); });
			else
				for (var state in list) $stateProvider.state(list[state]);
		});
	}

	addStatesFrom([login,signup,dashboard.settings,[dashboard.index]])

	$urlRouterProvider.otherwise('/login');

});