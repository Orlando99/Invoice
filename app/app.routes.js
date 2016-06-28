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
		customers : {
			index : {
				name 	 : 'dashboard.customers',
				abstract : true,
				url 	 : '/customers',
				views 	 : {
					'@'  : {
						controller 	 : 'CustomersController',
						templateUrl  : COMPONENTS + 'dashboard/views/customers/index.html'
					}
				}
			},
			all  : {
				name 	: 'dashboard.customers.all',
				url 	: '',
				views 	: {
					'customersView' : {
						templateUrl	: COMPONENTS + 'dashboard/views/customers/customers.html'
					}
				}
			},
			details : {
				name	: 'dashboard.customers.details',
				url 	: '/:customerId',
				views 		: {
					'customersView' : {
						templateUrl : COMPONENTS + 'dashboard/views/customers/details.html'
					}
				}
			},
			newCust	: {
				name	: 'dashboard.customers.new',
				url 	: '/new',
				views 		: {
					'customersView' : {
						controller : 'NewCustomerController',
						templateUrl : COMPONENTS + 'dashboard/views/customers/newcustomer.html'
					}
				}
			},
			edit 	: {
				name 	: 'dashboard.customers.edit',
				url 	: '/:customerId/edit',
				views 	: {
					'customersView' : {
						templateUrl : COMPONENTS + 'dashboard/views/customers/editcustomer.html'
					}
				}
			}
		},
		sales : {
			index : {
				name : 'dashboard.sales'
			},
			invoices : {
				index : {
					name 	 : 'dashboard.sales.invoices'//,
				//	abstract : true,
				//	url 	 : '/sales/invoices',
				//	views 	 : {
				//		'@'  : {
				//			controller : 'InvoiceController',
				//			templateUrl  : COMPONENTS + 'dashboard/views/sales/invoices/index.html'
				//		}
				//	}
				},
				all  : {
					name 	: 'dashboard.sales.invoices.all',
					url 	: '/sales/invoices',
					views 	: {
						'@' : {
							controller 	 : 'InvoiceController',
							templateUrl	: COMPONENTS + 'dashboard/views/sales/invoices/invoices.html'
						}
					}
				},
				newInvoice : {
					name : 'dashboard.sales.invoices.new',
					url : '/sales/invoices/new',
					params : {
						expenseId : null,
						customerId : null
					},
					views : {
						'@' : {
							controller 	 : 'CreateInvoiceController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/invoices/newinvoice.html'
						}
					}
				},
				details : {
					name : 'dashboard.sales.invoices.details',
					url : '/sales/invoices/:invoiceId',
					views : {
						'@' : {
							controller : 'InvoiceController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/invoices/details.html'
						}
					}
				},
				edit : {
					name	: 'dashboard.sales.invoices.edit',
					url 	: '/sales/invoices/:invoiceId/edit',
					views 	: {
						'@' : {
							controller 	 : 'InvoiceController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/invoices/editinvoice.html'
						}
					}
				}
			},
			estimates : {
				index: {
					name : 'dashboard.sales.estimates'
				},
				all : {
					name : 'dashboard.sales.estimates.all',
					url : '/sales/estimates',
					views : {
						'@' : {
							controller : 'EstimateController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/estimates/estimates.html'
						}
					}
				},
				newEstimate : {
					name : 'dashboard.sales.estimates.new',
					url : '/sales/estimates/new',
					params : {
						expenseId : null,
						customerId : null
					},
					views : {
						'@' : {
							controller 	 : 'CreateEstimateController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/estimates/new.estimate.html'
						}
					}
				},
				edit : {
					name	: 'dashboard.sales.estimates.edit',
					url 	: '/sales/estimates/:estimateId/edit',
					views 	: {
						'@' : {
							controller 	 : 'EstimateController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/estimates/edit.estimate.html'
						}
					}
				}
			},
			creditnotes : {
				index : {
					name : 'dashboard.sales.creditnotes'
				},
				all : {
					name : 'dashboard.sales.creditnotes.all',
					url : '/sales/creditnotes',
					views : {
						'@' : {
							controller : 'CreditNoteController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/creditnotes/creditnotes.html'
						}
					}
				},
				newCreditNote : {
					name : 'dashboard.sales.creditnotes.new',
					url : '/sales/creditnotes/new',
					params : {
						expenseId : null,
						customerId : null
					},
					views : {
						'@' : {
							controller 	 : 'CreditNoteController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/creditnotes/new.creditnote.html'
						}
					}
				},
				edit : {
					name	: 'dashboard.sales.creditnotes.edit',
					url 	: '/sales/creditnotes/:creditNoteId/edit',
					views 	: {
						'@' : {
							controller 	 : 'CreditNoteController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/creditnotes/edit.creditnote.html'
						}
					}
				}
			}

/*
			index : {
				name 	: 'dashboard.sales',
				url 	: '/sales',
				views 	: {
					'@' : {
						controller  : 'InvoiceController',
						templateUrl : COMPONENTS + 'dashboard/views/sales/sales.html'
					}
				}
			},
			Estimates 	: {
				name	: 'dashboard.sales.estimates',
				url 	: '/estimates',
				views 	: {
					'@'	: {
						controller 	: 'EstimateController',
						templateUrl	: COMPONENTS + 'dashboard/views/sales/estimates/estimates.html'
					}
				}
			},
			Invoices 	: {
				name	: 'dashboard.sales.invoices',
				url 	: '/invoices',
				views 	: {
					'@'	: {
						controller 	: 'InvoiceController',
						templateUrl	: COMPONENTS + 'dashboard/views/sales/invoices/invoices.html'
					}
				}
			},
			NewInvoice	: {
				name	: 'dashboard.sales.new-invoice',
				url 	: '/new-invoice',
				views 	: {
					'@' : {
						controller : 'CreateInvoiceController',
						templateUrl : COMPONENTS + 'dashboard/views/sales/invoices/new.invoice.html'
					}
				}
			},
			CreditNotes : {
				name	: 'dashboard.sales.credit-notes',
				url 	: '/credit-notes',
				views 	: {
					'@' : {
						controller 	: 'CreditNotesController',
						templateUrl	: COMPONENTS + 'dashboard/views/sales/creditnotes/creditnotes.html'
					}
				}
			}
*/
		},
		expenses : {
			index : {
				name : 'dashboard.expenses'
			},
			category : {
				name : 'dashboard.expenses.category',
				url : '/expenses/category',
				views : {
					'@' : {
						controller : 'ExpenseController',
						templateUrl : COMPONENTS + 'dashboard/views/expenses/category/category.html'
					}
				}

			},
			all : {
				name : 'dashboard.expenses.all',
				url : '/expenses',
				views : {
					'@' : {
						controller : 'ExpenseController',
						templateUrl : COMPONENTS + 'dashboard/views/expenses/expenses.html'
					}
				}
			},
			newExpense : {
				name : 'dashboard.expenses.new',
				url : '/expenses/new',
				views : {
					'@' : {
						controller : 'ExpenseController',
						templateUrl : COMPONENTS + 'dashboard/views/expenses/record.expense.html'
					}
				}
			},
			details : {
				name : 'dashboard.expenses.details',
				url : '/expenses/:expenseId',
				views : {
					'@' : {
						controller : 'ExpenseController',
						templateUrl : COMPONENTS + 'dashboard/views/expenses/details.html'
					}
				}
			},
			edit : {
				name : 'dashboard.expenses.edit',
				url : '/expenses/:expenseId/edit',
				views : {
					'@' : {
						controller : 'ExpenseController',
						templateUrl : COMPONENTS + 'dashboard/views/expenses/edit.expense.html'
					}
				}
			}

		},
		reports : {
			index : {
				name 	 : 'dashboard.reports',
				url 	 : '/reports',
				views 	: {
					'@' : {
						controller : 'SettingsController',
						templateUrl	: COMPONENTS + 'dashboard/views/reports/invoicedetails.html'
					}
				}
			}
		},
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
						controller  : 'ItemController',
						templateUrl : COMPONENTS + 'dashboard/views/settings/items.html'
					}
				}
			},
			Taxes		: {
				name	: 'dashboard.settings.taxes',
				url 	: '/taxes',
				views 	: {
					'@' : {
						controller  : 'TaxController',
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
						controller 	: 'InvoiceSettingsController',
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

	addStatesFrom([
		login,
		signup,
		dashboard.customers,
		[dashboard.sales.index],
		dashboard.sales.invoices,
		dashboard.sales.estimates,
		dashboard.sales.creditnotes,
		dashboard.expenses,
		dashboard.reports,
		dashboard.settings,
		[dashboard.index]
	]);

	$urlRouterProvider.otherwise('/login');

});