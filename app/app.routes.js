'use strict';

angular.module('invoicesUnlimited')
.config(function($stateProvider, $urlRouterProvider){

	var GenerateRoutes = function(args){

		var routes = {};
		routes.index = {
			name 		: args.indexName,
			url  		: '/'+args.indexName,
			controller 	: args.indexName.capitalize() + 'Controller',
			templateUrl : GetTemplate(args.indexName,args.indexTemplateUrl)
		};
		
		if (!args.childrenViews) args.childrenViews = {};

		for (var childName in args.childrenViews) 
        {

			var child = args.childrenViews[childName];
			
			routes[childName] = {
				name 		: 	args.indexName + "." + child.name,
				url  		: 	'/' + child.name,
				views 		: {}
			}

			var view = child.view ? child.view : '@';

			routes[childName].views[view] = {
				controller 	: 	child.controller ? 
							 	child.controller : 
							 	child.name.capitalize() + "Controller",
				templateUrl	: 	GetTemplate(args.indexName,child.templateUrl)
			}
		}

		return routes;
	};

	var signup = GenerateRoutes({
		indexName : 'signup',
		indexTemplateUrl : 'index.html',
		childrenViews : {
			verification : {
				name : 'verification',
				templateUrl : 'verificationView.html'
			},
			businessInfo : {
				name : 'business-info',
				templateUrl : 'businessInfoView.html',
				controller : 'BusinessInfoController'
			},
			principalInfo : {
				name : 'principal-info',
				templateUrl : 'principalInfoView.html',
				controller : 'PrincipalInfoController'
			},
			accountInfo : {
				name : 'account-info',
				templateUrl : 'accountInfoView.html',
				controller : 'AccountInfoController'
			},
			signature : {
				name : 'signature',
				templateUrl : 'signatureView.html'
			},
			confirm : {
				name : 'confirm',
				templateUrl : 'confirmView.html'
			}
		}
	});

	var signup1 = {
		index : {
			name : "signup",
			url : "/signup",
			controller : "SignupController",
			templateUrl : GetTemplate('signup','index.html')
		},
		verification : {
			name : "signup.verification",
			url : "/verification",
			views : {
				'@' : {
					controller : "VerificationController",
					templateUrl : GetTemplate('signup','verificationView.html')
				}
			}
		},
		businessInfo : {
			name : 'signup.business-info',
			url : "/business-info",
			views : {
				'@' : {
					controller : "BusinessInfoController",
					templateUrl : GetTemplate('signup','businessInfoView.html')
				}
			}
		},
		principalInfo : {
			name : 'signup.principal-info',
			url : "/principal-info",
			views : {
				'@' : {
					controller : "PrincipalInfoController",
					templateUrl : GetTemplate('signup','principalInfoView.html')
				}
			}
		},
		accountInfo : {
			name : 'signup.account-info',
			url : "/account-info",
			views : {
				'@' : {
					controller : 'AccountInfoController',
					templateUrl : GetTemplate('signup','accountInfoView.html')
				}
			}
		},
		signature : {
			name : 'signup.signature',
			url : '/signature',
			views : {
				'@' : {
					controller : 'SignatureController',
					templateUrl : GetTemplate('signup','signatureView.html')
				}
			}
		},
        accountActivated : {
			name : 'signup.accountActivated',
			url  : '/accountActivated',
			views : {
				'@' : {
					controller  : 'AccountActController',
					templateUrl : GetTemplate('signup','accountActivatedView.html')
				}
			}
		},
        merchantAccount : {
			name : 'signup.merchantAccount',
			url  : '/merchantAccount',
			views : {
				'@' : {
					controller  : 'MerchantAccountController',
					templateUrl : GetTemplate('signup','merchantAccountView.html')
				}
			}
		},
		confirm : {
			name : 'signup.confirm',
			url  : '/confirm',
			views : {
				'@' : {
					controller  : 'ConfirmController',
					templateUrl : GetTemplate('signup','confirmView.html')
				}
			}
		},
        invoiceTemplateInfo : {
			name : 'signup.invoiceTemplateInfo',
			url  : '/invoiceTemplateInfo',
			views : {
				'@' : {
					controller  : 'InvoiceTemplateInfoController',
					templateUrl : GetTemplate('signup','invoiceTemplateView.html')
				}
			}
		}
	}

    var activateAccount = {
		index : {
			name 	: 'activateAccount',
			url 	: '/activateAccount',
			controller : "AvtivateAccountController",
			templateUrl : COMPONENTS + "activateAccountView.html"
		}
	}
    
	var login = {
		index : {
			name 	: 'login',
			url 	: '/login',
			params : {
				errorMsg : null
			},
			controller : "LoginController",
			templateUrl : COMPONENTS + "login/views/loginView.html"
		},
		resetPassword : {
			name : 'resetPassword',
			url : '/resetPassword',
			controller : "LoginController",
			templateUrl : COMPONENTS + 'login/views/forgotpassView.html'
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
				params : {
					backLink : null,
                    invoiceId : null,
                    estimateId : null,
                    creditId : null,
                    expanseId : null
				},
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
						customerId : null,
                        projectId : null
					},
					views : {
						'@' : {
							controller 	 : 'CreateInvoiceController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/invoices/newinvoice.html'
						}
					}
				},
				cloneInvoice : {
					name : 'dashboard.sales.invoices.clone',
					url : '/sales/invoices/clone',
					params : {
						invoiceId : null
					},
					views : {
						'@' : {
							controller : 'CloneInvoiceController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/invoices/newinvoice.html'
						}
					}
				},
				estimateToInvoice: {
					name : 'dashboard.sales.invoices.convertEstimate',
					url : '/sales/invoices/convertEstimate',
					params : {
						estimateId : null
					},
					views : {
						'@' : {
							controller : 'EstimateToInvoiceController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/invoices/newinvoice.html'
						}
					}
				},
				details : {
					name : 'dashboard.sales.invoices.details',
					url : '/sales/invoices/:invoiceId',
					views : {
						'@' : {
							controller : 'InvoiceDetailController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/invoices/details.html'
						}
					}
				},
				edit : {
					name	: 'dashboard.sales.invoices.edit',
					url 	: '/sales/invoices/:invoiceId/edit',
                    params : {
						customerId : null
					},
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
				cloneEstimate : {
					name : 'dashboard.sales.estimates.clone',
					url : '/sales/estimates/clone',
					params : {
						estimateId : null
					},
					views : {
						'@' : {
							controller : 'CloneEstimateController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/estimates/new.estimate.html'
						}
					}
				},
				details : {
					name : 'dashboard.sales.estimates.details',
					url : '/sales/estimates/:estimateId',
					views : {
						'@' : {
							controller : 'EstimateDetailController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/estimates/details.html'
						}
					}
				},
				edit : {
					name	: 'dashboard.sales.estimates.edit',
					url 	: '/sales/estimates/:estimateId/edit',
                    params : {
						estimateId : null,
						customerId : null
					},
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
							controller 	 : 'CreateCreditNoteController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/creditnotes/new.creditnote.html'
						}
					}
				},
				details : {
					name : 'dashboard.sales.creditnotes.details',
					url : '/sales/creditnotes/:creditNoteId',
					views : {
						'@' : {
							controller : 'CreditNoteDetailController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/creditnotes/details.html'
						}
					}
				},
				edit : {
					name	: 'dashboard.sales.creditnotes.edit',
					url 	: '/sales/creditnotes/:creditNoteId/edit',
                    params : {
						creditId : null,
						customerId : null
					},
					views 	: {
						'@' : {
							controller 	 : 'CreditNoteController',
							templateUrl : COMPONENTS + 'dashboard/views/sales/creditnotes/edit.creditnote.html'
						}
					}
				}
			}
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
						controller : 'ExpenseCategoryController',
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
				params : {
					customerId : null,
                    expenseId  : null
				},
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
                params : {
					customerId : null,
                    expanseId  : null
				},
				views : {
					'@' : {
						controller : 'ExpenseController',
						templateUrl : COMPONENTS + 'dashboard/views/expenses/edit.expense.html'
					}
				}
			}

		},
        projects : {
				index: {
                    name 	 : 'dashboard.projects',
                    abstract : true,
                    url 	 : '/projects',
                    views 	 : {
                        '@'  : {
                            controller 	 : 'ProjectsController',
                            templateUrl  : COMPONENTS + 'dashboard/views/projects/projects.html'
                        }
                    }
                },
				all : {
					name : 'dashboard.projects.all',
					url : '',
					views : {
						'@' : {
							controller : 'ProjectsController',
							templateUrl : COMPONENTS + 'dashboard/views/projects/projects.html'
						}
					}
				},
				newProject : {
					name : 'dashboard.projects.new',
					url : '/new',
					params : {
						expenseId : null,
						customerId : null
					},
					views : {
						'@' : {
							controller 	 : 'CreateProjectController',
							templateUrl : COMPONENTS + 'dashboard/views/projects/new.project.html'
						}
					}
				},
                cloneProject : {
					name : 'dashboard.projects.clone',
					url : '/clone',
					params : {
						projectId : null
					},
					views : {
						'@' : {
							controller : 'CloneProjectController',
							templateUrl : COMPONENTS + 'dashboard/views/projects/clone.project.html'
						}
					}
				},
				details : {
					name : 'dashboard.projects.details',
					url : '/:projectId',
					views : {
						'@' : {
							controller : 'ProjectDetailController',
							templateUrl : COMPONENTS + 'dashboard/views/projects/details.html'
						}
					}
				},
				edit : {
					name	: 'dashboard.projects.edit',
					url 	: '/:projectId/edit',
					views 	: {
						'@' : {
							controller 	 : 'ProjectsController',
							templateUrl : COMPONENTS + 'dashboard/views/projects/edit.project.html'
						}
					}
				}
			},
		reports : {
			index : {
				name : 'dashboard.reports'
			},
			salesByCustomer : {
				name : 'dashboard.reports.salesByCustomer',
				url : '/reports/salesByCustomer',
				views : {
					'@' : {
						controller : 'SalesByCustomerController',
						templateUrl : COMPONENTS + 'dashboard/views/reports/salesbycustomer.html'
					}
				}
			},
			salesByItem : {
				name : 'dashboard.reports.salesByItem',
				url : '/reports/salesByItem',
				views : {
					'@' : {
						controller : 'SalesByItemController',
						templateUrl : COMPONENTS + 'dashboard/views/reports/salesbyitem.html'
					}
				}
			},
			customerBalance : {
				name : 'dashboard.reports.customerBalance',
				url : '/reports/customerBalance',
				views : {
					'@' : {
						controller : 'CustomerBalanceController',
						templateUrl : COMPONENTS + 'dashboard/views/reports/customerbalances.html'
					}
				}
			},
			invoiceAging : {
				name : 'dashboard.reports.invoiceAging',
				url : '/reports/invoiceAging',
				views : {
					'@' : {
						controller : 'InvoiceAgingController',
						templateUrl : COMPONENTS + 'dashboard/views/reports/invoicedetails.html'
					}
				}
			},
			paymentsReceived : {
				name : 'dashboard.reports.paymentsReceived',
				url : '/reports/paymentsReceived',
				views : {
					'@' : {
						controller : 'PaymentsReceivedController',
						templateUrl : COMPONENTS + 'dashboard/views/reports/paymentsreceived.html'
					}
				}
			},
			expenseByCategory : {
				name : 'dashboard.reports.expenseByCategory',
				url : '/reports/expenseByCategory',
				views : {
					'@' : {
						controller : 'ExpenseByCategoryController',
						templateUrl : COMPONENTS + 'dashboard/views/reports/expensebycategory.html'
					}
				}
			},
		},
		settings : {
			index : {
				name	: 'dashboard.settings',
				url 	: '/settings',
				views 	: {
					'@'	: {
						controler 	: 'CompanyProfileController',
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
						controller 	: 'CurrencyController',
						templateUrl	: COMPONENTS + 'dashboard/views/settings/currencies.html'
					}
				}
			},
			Users 		: {
				name	: 'dashboard.settings.users',
				url 	: '/users',
				views 	: {
					'@'	: {
						controller 	: 'UsersController',
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
						controller 	: 'PaymentsController',
						templateUrl	: COMPONENTS + 'dashboard/views/settings/payments.html'
					}
				}
			},
			Estimates 	: {
				name	: 'dashboard.settings.estimates',
				url 	: '/estimates',
				views 	: {
					'@'	: {
						controller 	: 'EstimateSettingsController',
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
						controller 	: 'CreditNoteSettingsController',
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
        activateAccount,
		signup1,
		dashboard.customers,
        dashboard.projects,
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