'use strict';

$(document).ready(function(){
	$(document).on('click','.menu',function(){
		var self = $(this).children('.submenu')[0];
		$('.menu .submenu')
		.toArray()
		.filter(function(menu){
			return (menu != self)
					&& ($(menu).hasClass('showsub'));
		})
		.forEach(function(menu){
			$(menu).removeClass('showsub');
		});

		$(this).children('.submenu').toggleClass('showsub');
        
	})
});

invoicesUnlimited.controller('CustomersController',
	function($scope,$rootScope,$state,$uibModal,userFactory,
			 contactPersonFactory, customerFactory, coreFactory, expenseService, 
			 invoicesFactory ,$controller,$q, appFields, currencyFilter, currencyFactory){

	var customerId = parseInt($state.params.customerId);
	var user = userFactory;
	var organization = user.entity[0].get("organizations")[0];
	
	if (!user.entity.length) {
		$state.go('login');
		return;
	}
    
    userFactory.getField('dateFormat')
.then(function(obj) {
	$scope.dateFormat = obj;
});
    
	$('.tutorial').hide();
	var def = $q.defer();
	$controller('DashboardController',{$scope:$scope,$state:$state});
    
    $scope.nextClicked = function(){
        $('.tutorial').hide();
    }
    
    $scope.skipTutorial = function(){
        fromTutorial = false;
        $state.go('dashboard');
    }
    
    $('#edit-customer-form').validate({
		rules: {
			displayName: 'required',
			email : {
				required : false,
				email : true
			}
		}
	});

	$scope.selectedCustomer;
	$scope.selectedCustomerId;
	$scope.customers = [];
	$scope.comments = [];
	$scope.shipping = {
		setShippingTheSame  : false,
		tempShippingAddress : {}
	}

	var formBillingAddress = function(obj){
		var result = "";
		
		var addIfExist = function(w) { return w ? w : "";}

		result += addIfExist(obj.Street) + "\n"
		+ addIfExist(obj.City) + "\n"
		+ addIfExist(obj["State\/Province"]) + "\n"
        + addIfExist(obj["Zip\/Postal Code"]) + "\n"
        + addIfExist(obj.Country);
        return result;
	}

	var isCustomerIdValid = function(id){
		if (isNaN(id)) return false;
		if (id >= 0 && id < $scope.customers.length) return true;
		else return false;
	}

	var doSelectCustomerIfValidId = function(id){
		if (isCustomerIdValid(id)) {
			selectCustomer($scope.customers[id]);
			$scope.selectedCustomerId = id;
		}
		else $state.go('dashboard.customers.all');
	}

	var doCreateEditObject = function(){
		$scope.selectedCustomerEdit = 
			$.extend(true,{},$scope.selectedCustomer.entity);

		$scope.billingAddressEdit = 
			$.extend(true,{},$scope.selectedCustomer.billingAddressJSON);

		$scope.shippingAddressEdit = 
			$.extend(true,{},$scope.selectedCustomer.shippingAddressJSON);
	}

    $scope.NewExpense = function(){
        $state.go('dashboard.expenses.new', {customerId:$scope.selectedCustomer.entity.id});
    }
    
    $scope.NewInvoice = function(){
        $state.go('dashboard.sales.invoices.new', {customerId:$scope.selectedCustomer.entity.id});
    }
    
    $scope.NewCreditNote = function(){
        $state.go('dashboard.sales.creditnotes.new', {customerId:$scope.selectedCustomer.entity.id});
    }
    
    $scope.NewEstimate = function(){
        $state.go('dashboard.sales.estimates.new', {customerId:$scope.selectedCustomer.entity.id});
    }
    
	var selectCustomer = function(item){
		$scope.selectedCustomer = item;
        var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
        $scope.selectedCustomer.invoices.forEach(function(obj){
            obj.invoiceDate = formatDate(obj.entity.invoiceDate, dateFormat);
        });
        
        $scope.selectedCustomer.comments.forEach(function(obj){
            obj.date = formatDate(obj.entity.date, dateFormat);
        });
        
		var obj = $scope.selectedCustomer.entity;
		if (!obj.billingAddress) return;
		
		var billingAddress = JSON.parse(obj.billingAddress);
		var shippingAddress = {};
		if (obj.shippingAddress)
			shippingAddress = JSON.parse(obj.shippingAddress);

	    $scope.selectedCustomer.billingAddress = formBillingAddress(billingAddress);
	    $scope.selectedCustomer.billingAddressJSON = billingAddress;
	    $scope.selectedCustomer.shippingAddressJSON = shippingAddress;
        
        drawBarChart();
        
	}

    loadCurrencies();
    
    function loadCurrencies() {
        $q.when(currencyFactory.loadAll({
            organization : user.entity[0].get('selectedOrganization')
        }))
        .then(function(currencies) {
            $scope.currencies = currencies;
        });
    }
    
    $scope.customerCurrencyChanged = function(){
        if($scope.selectedCustomerEdit.currency == "dummy")
            {
                $scope.selectedCustomerEdit.currency = '';
                prepareAddCurrency();
            }
    }
    
    function prepareAddCurrency() {
        $scope.currencyObj = {
            title : undefined,
            currencySymbol : undefined,
            decimalPlace : '0',
            format : '###,###,###',
            exchangeRate : undefined
        }
        $('#addCurrencyForm').validate({
            rules : {
                currencyCode : 'required',
                currencySymbol : 'required',
                exchangeRate : {
                    number : true,
                    min : 0,
                    required: true
                }
            }
        });
        $('#addCurrencyForm').validate().resetForm();
        $('.new-currency').addClass('show');
    }
    
    $scope.currencyChanged = function() {
        if($scope.currencyObj)
            $scope.currencyObj.currencySymbol =
                $scope.currencyObj.title.split(' ')[0];
    }

    $scope.saveNewCurrency = function() {
        if(! $('#addCurrencyForm').valid()) return;

        showLoader();
        var params = $scope.currencyObj;
        params.userID = user.entity[0];
        params.organization = user.entity[0].get('selectedOrganization');
        params.decimalPlace = Number(params.decimalPlace);
        params.exchangeRate = Number(params.exchangeRate) || undefined;

        $q.when(coreFactory.getUserRole(user.entity[0]))
        .then(function(role) {
            return currencyFactory.createNewCurrency(params, role);
        }, function(error){
            console.log(error);
        })
        .then(function(currency) {
            $scope.currencies.push(currency);
            $scope.selectedCustomerEdit.currency = currency.entity.title;
            $('.new-currency').removeClass('show');
            hideLoader();
        });
    }
    
	function drawBarChart() {
		var promises = [];
		promises.push ( $q.when(expenseService.getCustomerExpenses({
			organization : organization,
			customer : $scope.selectedCustomer.entity
		})) );
		promises.push( $q.when(organization.fetch()) );

		$q.all(promises).then(function(results) {
			$scope.selectedCustomer.expenses = results[0];
			var org = results[1];
			var fiscalMonth = org.get('fiscalYearStart');
			var count = getrotateCount(fiscalMonth);
			var invTotal = 0;
			var expTotal = 0;
			var monthlyIncome  = [0,0,0,0,0,0,0,0,0,0,0,0];
			var monthlyExpense  = [0,0,0,0,0,0,0,0,0,0,0,0];
			var colors = ['#0ea81c', '#c31e1e'];
			var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY',
				'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

			$scope.selectedCustomer.invoices
			.forEach(function(inv) {
				var index = inv.entity.invoiceDate.getMonth();
				monthlyIncome[index] += inv.entity.total;
				invTotal += inv.entity.total;
			});

			$scope.selectedCustomer.expenses
			.forEach(function(exp) {
				var index = exp.entity.expanseDate.getMonth();
				monthlyExpense[index] += exp.entity.amount;
				expTotal += exp.entity.amount;
			});

			months.rotate(count);
			monthlyIncome.rotate(count);
			monthlyExpense.rotate(count);
			$scope.totalIncome =  currencyFilter(invTotal, '$', 2);
			$scope.totalExpense = currencyFilter(expTotal, '$', 2);

			var ctx = $("#barchart");
			var myChart = new Chart(ctx, {
				type: 'bar',
				data: {
					labels: months,
					datasets: [{
						backgroundColor: colors[0],
						data: monthlyIncome
					}, {
						backgroundColor: colors[1],
						data: monthlyExpense
					}]
				},
				options: {
					responsive: false,
					legend: {
						display: false
					},
					scales: {
						xAxes: [{
							gridLines: {
								display : false
							}
						}],
						yAxes: [{
							gridLines: {
								display : false
							},
							ticks: {
								beginAtZero:true
							}
						}]
					}
				}
			});
		});

	}

	var isGoTo = {
		details : function(to){
			return to.endsWith('details');	
		},
		customers : function(to){ 
			return to.endsWith('customers');
		},
		edit : function(to){
			return to.endsWith('edit');
		},
		newCustomer : function(to){
			return to.endsWith('new');	
		}
	}

	$scope.setShippingAddress = function(){
		if ($scope.selectedCustomer && !$scope.shipping.setShippingTheSame) {
			$scope.shippingAddressEdit = 
				$scope.shipping.tempShippingAddress;
			return;
		}
		if ($scope.selectedCustomer) {
			$scope.shipping.tempShippingAddress = 
				$scope.shippingAddressEdit;

			$scope.shippingAddressEdit = 
				$.extend(true,{},$scope.billingAddressEdit);
		}
	}

	$scope.saveSelectedCustomer = function(){
		// billing address may be filled after checking the same as box
		if ($scope.selectedCustomer && $scope.shipping.setShippingTheSame) {
			$scope.shippingAddressEdit = 
				$.extend(true,{},$scope.billingAddressEdit);
		}
        
        if (! $('#edit-customer-form').valid()) {
			var v = $('#edit-customer-form').validate();
			var offset = $(v.errorList[0].element).offset().top - 30;
			scrollToOffset(offset);
			return;
		}

		var selected = $scope.selectedCustomer;

		selected.billingAddressJSON = $scope.billingAddressEdit;
		selected.shippingAddressJSON = $scope.shippingAddressEdit;

		$scope.selectedCustomerEdit.billingAddress = 
			JSON.stringify(selected.billingAddressJSON);

		$scope.selectedCustomerEdit.shippingAddress = 
			JSON.stringify(selected.shippingAddressJSON);

		for (var property in $scope.selectedCustomerEdit) {
			if (appFields.customer.some(function(el){
				return property == el;
			}))
	  		selected.entity[property] = 
	  			$scope.selectedCustomerEdit[property];
		}

		selected.save().then(function(){
			selected.billingAddress = formBillingAddress(selected.entity.billingAddress);
			$scope.selectedCustomerEdit = null;
			$scope.billingAddressEdit = null;
			$scope.shippingAddressEdit = null;
			$state.go('dashboard.customers.details',{customerId:$scope.selectedCustomerId});
		});
	};

	$scope.deleteSelectedCustomer = function(){
		if ($scope.selectedCustomer.invoices &&
			$scope.selectedCustomer.invoices.length) {
			ShowMessage("Customers with invoices involved cannot be deleted!","error");
			return;
		}
		showLoader();
        
        $scope.selectedCustomer.entity.set('isDeleted', 1);
        
		$q.when($scope.selectedCustomer.entity.save()).then(function(){
                $scope.selectedCustomer = null;
                $scope.customers
                .splice($scope.selectedCustomerId,1);
                $scope.selectedCustomerId = null;
                hideLoader();
                $state.go('dashboard.customers.all');
		});
	}

	$scope.changeStatus = function(status) {
		showLoader();
		$scope.selectedCustomer.entity.set('status',status);
		$scope.selectedCustomer.entity.save()
		.then(function(cust){
			hideLoader();
		},function(er){
			console.log(er.message);
		});
	}

	$scope.cancelSaveSelectedCustomer = function(){
		$scope.selectedCustomerEdit = null;
		$state.go('dashboard.customers.details',{customerId:$scope.selectedCustomerId});
	}

	var isGoToDetailsWithInvalidCustomerId = function(to,id){
		return to.endsWith('details') && (!isCustomerIdValid(id));
	}

	function LoadCustomers(loadAgain) {
		//showLoader();
		$q.when(coreFactory.getAllCustomers(loadAgain)).then(function(res){
			$scope.customers = res.sort(function(a,b){
				return alphabeticalSort(a.entity.displayName,b.entity.displayName);
			});
			return $q.when(coreFactory.getAllInvoices({
				method 	: 'containedIn',
				name 	: 'customer',
				val1 	: res.map(function(el){
					return el.entity;
				})
			}));

		}).then(function(invoices){
			
			var customersNum = $scope.customers.length;

			$scope.customers.forEach(function(cust){
				cust.invoices = invoices.filter(function(inv){
					return inv.entity.get('customer').id == cust.entity.id;
				});
				cust.comments = 
				cust.invoices.reduce(function(res,cur){
					return res.concat(cur.comments);
				},[]);
			});

			if (isGoTo.details($state.current.name)) {
				doSelectCustomerIfValidId(customerId);
			}
			else if (isGoTo.edit($state.current.name)) {
				doSelectCustomerIfValidId(customerId);
				doCreateEditObject();
			}
			hideLoader();

		});
	};

	$scope.deleteContact = function(index){
		showLoader();
		$scope.selectedCustomer.contactPersons[index]
		.destroy($scope.selectedCustomer)
		.then(function(res){
			$scope.selectedCustomer.contactPersons.splice(index,1);
			$scope.$apply();
			hideLoader();
		},function(err){
			console.log(err.message);
		});
	}

	$scope.editContact = function(contactPerson,index){

		var selectedContact = contactPerson;

		$scope.selectedCustomer.contactPersons[index] = angular.copy(selectedContact);

		var modalInstance = $uibModal.open({
			animation 		: true,
			templateUrl 	: 'modal-contact',
			controller 		: 'ModalContactController',
			windowClass 	: 'modalWindow fade in',
			backdropClass 	: 'popup-modal show fade in',
			backdrop 		: true,
			resolve 		: {
				title 	: function() {
					return 'Edit Contact Person';
				},
				contact : function() {
					return selectedContact;
				},
				customer : function() {
					return $scope.selectedCustomer;
				}
			}
		});

		modalInstance.result.then(function(contact){
			$scope.selectedCustomer.contactPersons[index] = contact;
		},function() {
			console.log('dismiss modal');
		});
	}

	function autoFormatTelephoneNumbers () {
		/*
		$('#workPhone').mask('0 (000) 000-0000',{
			onKeyPress : function(cep,e,field,options){
				var masks = ['0 (000) 000-0000','(000) 000-0000'];
				var cond = cep.replace("(","");
				var mask = (!cep.length||cep[0] == "1") ? masks[0] : masks[1];
				$('#workPhone').mask(mask,options);
			}
		});*/
		var obj = {
			translation:  {
				'Z': {pattern: /[1]/, optional: true},
				'Y': {pattern: /[0-02-9]/}
			}
		}
		$('#workPhone').mask('Z (Y00) 000-0000', obj);
		$('#mobilePhone').mask('Z (Y00) 000-0000', obj);
		$('#billFax').mask('Z (Y00) 000-0000', obj);
		$('#shipFax').mask('Z (Y00) 000-0000', obj);

	}

    $("#addContactForm").validate({
		rules: {
			firstname 		: 'required',
			lastname	: 'required'
		},
		messages: {
			firstname 	: 'Please specify your estimated montly credit card sales!',
			lastname 		: 'Please specify your bank name!'
			
		}
	});
    
	$scope.createContact = function(){
		var modalInstance = $uibModal.open({
			animation 		: true,
			templateUrl 	: 'modal-contact',
			controller 		: 'ModalContactController',
			backdropClass 	: 'popup-modal show fade in',
			windowClass 	: 'modalWindow fade in',
			backdrop 		: true,
			resolve 		: {
				title 	: function() {
					return 'Add Contact Person';
				},
				contact : function() {
					console.log('Resolve Contact');
					var ContactPerson = Parse.Object.extend('ContactPerson');
					var contactObject = new contactPersonFactory(new ContactPerson());
					contactObject.entity.set('userID',user.entity[0]);
					return contactObject;
				},
				customer : function() {
					return $scope.selectedCustomer;
				}
			}
		});

		modalInstance.result.then(function(contact){
			$scope.selectedCustomer.contactPersons.push(contact);

		},function() {
			console.log('dismiss modal');
		});
	}

	$rootScope.$on('$viewContentLoaded',
		function(event){
			if (isGoTo.edit($state.current.name) || isGoTo.newCustomer($state.current.name)) {
				autoFormatTelephoneNumbers();
			}
		});

	var stateChangeEvent = $rootScope.$on('$stateChangeStart',
	function(event,toState,toParams,fromState,fromParams,options){
	//	console.log('here');
		if (isGoTo.customers(toState.name) ||
			isGoTo.newCustomer(toState.name)) {
			$scope.selectedCustomer = null;
			$scope.selectedCustomerId = null;
		}
		else if (isGoTo.details(toState.name)) {
			if (isNaN(parseInt(toParams.customerId)) && 
				fromState.name.endsWith('new')) {
				event.preventDefault();
				return;
			}
			doSelectCustomerIfValidId(parseInt(toParams.customerId));
		}
		else if (isGoTo.edit(toState.name)) {
			doSelectCustomerIfValidId(parseInt(toParams.customerId));
			doCreateEditObject();

		} else if (fromState.name.endsWith('new')) {
			LoadCustomers(true);
		} else if (!toState.name.includes('customers')) {
		//	console.log('destroy else');
			stateChangeEvent();
			stateChangeEvent = null;
		}
	});

	LoadCustomers();
    
    $scope.availableCurrencies = ['ADP - Andorran Peseta',
'AED - United Arab Emirates Dirham',
'AFN - Afghan Afghani',
'ALL - Albanian Lek',
'AMD - Armenian Dram',
'ANG - Netherlands Antillean Guilder',
'AOA - Angolan Kwanza',
'ARA - Argentine Austral',
'ARS - Argentine Peso',
'ATS - Austrian Schilling',
'AUD - Australian Dollar',
'AWG - Aruban Florin',
'AZN - Azerbaijani Manat',
'BAM - Bosnia-Herzegovina Convertible Mark',
'BBD - Barbadian Dollar',
'BDT - Bangladeshi Taka',
'BEC - Belgian Franc (convertible)',
'BEF - Belgian Franc',
'BEL - Belgian Franc (financial)',
'BGL - Bulgarian Hard Lev',
'BGM - Bulgarian Socialist Lev',
'BGN - Bulgarian Lev',
'BHD - Bahraini Dinar',
'BIF - Burundian Franc',
'BMD - Bermudan Dollar',
'BND - Brunei Dollar',
'BOB - Bolivian Boliviano',
'BOP - Bolivian Peso',
'BOV - Bolivian Mvdol',
'BRL - Brazilian Real',
'BSD - Bahamian Dollar',
'BTN - Bhutanese Ngultrum',
'BUK - Burmese Kyat',
'BWP - Botswanan Pula',
'BYR - Belarusian Ruble',
'BZD - Belize Dollar',
'CAD - Canadian Dollar',
'CDF - Congolese Franc',
'CHE - WIR Euro',
'CHF - Swiss Franc',
'CHW - WIR Franc',
'CLE - Chilean Escudo',
'CLF - Chilean Unit of Account (UF)',
'CLP - Chilean Peso',
'CNX - Chinese People’s Bank Dollar',
'CNY - Chinese Yuan',
'COP - Colombian Peso',
'COU - Colombian Real Value Unit',
'CRC - Costa Rican Colón',
'CSK - Czechoslovak Hard Koruna',
'CUC - Cuban Convertible Peso',
'CUP - Cuban Peso',
'CVE - Cape Verdean Escudo',
'CYP - Cypriot Pound',
'CZK - Czech Republic Koruna',
'DDM - East German Mark',
'DEM - German Mark',
'DJF - Djiboutian Franc',
'DKK - Danish Krone',
'DOP - Dominican Peso',
'DZD - Algerian Dinar',
'ECS - Ecuadorian Sucre',
'ECV - Ecuadorian Unit of Constant Value',
'EEK - Estonian Kroon',
'EGP - Egyptian Pound',
'ERN - Eritrean Nakfa',
'ESA - Spanish Peseta (A account)',
'ESB - Spanish Peseta (convertible account)',
'ESP - Spanish Peseta',
'ETB - Ethiopian Birr',
'EUR - Euro',
'FIM - Finnish Markka',
'FJD - Fijian Dollar',
'FKP - Falkland Islands Pound',
'FRF - French Franc',
'GBP - British Pound',
'GEK - Georgian Kupon Larit',
'GEL - Georgian Lari',
'GHS - Ghanaian Cedi',
'GIP - Gibraltar Pound',
'GMD - Gambian Dalasi',
'GNF - Guinean Franc',
'GNS - Guinean Syli',
'GQE - Equatorial Guinean Ekwele',
'GRD - Greek Drachma',
'GTQ - Guatemalan Quetzal',
'GWE - Portuguese Guinea Escudo',
'GWP - Guinea-Bissau Peso',
'GYD - Guyanaese Dollar',
'HKD - Hong Kong Dollar',
'HNL - Honduran Lempira',
'HRD - Croatian Dinar',
'HRK - Croatian Kuna',
'HTG - Haitian Gourde',
'HUF - Hungarian Forint',
'IDR - Indonesian Rupiah',
'IEP - Irish Pound',
'ILP - Israeli Pound',
'ILS - Israeli New Sheqel',
'INR - Indian Rupee',
'IQD - Iraqi Dinar',
'IRR - Iranian Rial',
'ISK - Icelandic Króna',
'ITL - Italian Lira',
'JMD - Jamaican Dollar',
'JOD - Jordanian Dinar',
'JPY - Japanese Yen',
'KES - Kenyan Shilling',
'KGS - Kyrgystani Som',
'KHR - Cambodian Riel',
'KMF - Comorian Franc',
'KPW - North Korean Won',
'KRW - South Korean Won',
'KWD - Kuwaiti Dinar',
'KYD - Cayman Islands Dollar',
'KZT - Kazakhstani Tenge',
'LAK - Laotian Kip',
'LBP - Lebanese Pound',
'LKR - Sri Lankan Rupee',
'LRD - Liberian Dollar',
'LSL - Lesotho Loti',
'LTL - Lithuanian Litas',
'LTT - Lithuanian Talonas',
'LUC - Luxembourgian Convertible Franc',
'LUF - Luxembourgian Franc',
'LUL - Luxembourg Financial Franc',
'LVL - Latvian Lats',
'LVR - Latvian Ruble',
'LYD - Libyan Dinar',
'MAD - Moroccan Dirham',
'MAF - Moroccan Franc',
'MCF - Monegasque Franc',
'MDC - Moldovan Cupon',
'MDL - Moldovan Leu',
'MGA - Malagasy Ariary',
'MGF - Malagasy Franc',
'MKD - Macedonian Denar',
'MLF - Malian Franc',
'MMK - Myanmar Kyat',
'MNT - Mongolian Tugrik',
'MOP - Macanese Pataca',
'MRO - Mauritanian Ouguiya',
'MTL - Maltese Lira',
'MTP - Maltese Pound',
'MUR - Mauritian Rupee',
'MVR - Maldivian Rufiyaa',
'MWK - Malawian Kwacha',
'MXN - Mexican Peso',
'MXV - Mexican Investment Unit',
'MYR - Malaysian Ringgit',
'MZE - Mozambican Escudo',
'MZN - Mozambican Metical',
'NAD - Namibian Dollar',
'NGN - Nigerian Naira',
'NIO - Nicaraguan Córdoba',
'NLG - Dutch Guilder',
'NOK - Norwegian Krone',
'NPR - Nepalese Rupee',
'NZD - New Zealand Dollar',
'OMR - Omani Rial',
'PAB - Panamanian Balboa',
'PEI - Peruvian Inti',
'PEN - Peruvian Nuevo Sol',
'PGK - Papua New Guinean Kina',
'PHP - Philippine Peso',
'PKR - Pakistani Rupee',
'PLN - Polish Zloty',
'PTE - Portuguese Escudo',
'PYG - Paraguayan Guarani',
'QAR - Qatari Rial',
'RHD - Rhodesian Dollar',
'RON - Romanian Leu',
'RSD - Serbian Dinar',
'RUB - Russian Ruble',
'RWF - Rwandan Franc',
'SAR - Saudi Riyal',
'SBD - Solomon Islands Dollar',
'SCR - Seychellois Rupee',
'SDG - Sudanese Pound',
'SEK - Swedish Krona',
'SGD - Singapore Dollar',
'SHP - St. Helena Pound',
'SIT - Slovenian Tolar',
'SKK - Slovak Koruna',
'SLL - Sierra Leonean Leone',
'SOS - Somali Shilling',
'SRD - Surinamese Dollar',
'SRG - Surinamese Guilder',
'SSP - South Sudanese Pound',
'STD - São Tomé & Príncipe Dobra',
'SUR - Soviet Rouble',
'SVC - Salvadoran Colón',
'SYP - Syrian Pound',
'SZL - Swazi Lilangeni',
'THB - Thai Baht',
'TJR - Tajikistani Ruble',
'TJS - Tajikistani Somoni',
'TMT - Turkmenistani Manat',
'TND - Tunisian Dinar',
'TOP - Tongan Paʻanga',
'TPE - Timorese Escudo',
'TRY - Turkish Lira',
'TTD - Trinidad & Tobago Dollar',
'TWD - New Taiwan Dollar',
'TZS - Tanzanian Shilling',
'UAH - Ukrainian Hryvnia',
'UAK - Ukrainian Karbovanets',
'UGX - Ugandan Shilling',
'USD - US Dollar',
'USN - US Dollar (Next day)',
'USS - US Dollar (Same day)',
'UYI - Uruguayan Peso (Indexed Units)',
'UYU - Uruguayan Peso',
'UZS - Uzbekistani Som',
'VEF - Venezuelan Bolívar',
'VND - Vietnamese Dong',
'VUV - Vanuatu Vatu',
'WST - Samoan Tala',
'XAF - Central African CFA Franc',
'XAG - Silver',
'XAU - Gold',
'XBA - European Composite Unit',
'XBB - European Monetary Unit',
'XBC - European Unit of Account (XBC)',
'XBD - European Unit of Account (XBD)',
'XCD - East Caribbean Dollar',
'XDR - Special Drawing Rights',
'XEU - European Currency Unit',
'XFO - French Gold Franc',
'XFU - French UIC-Franc',
'XOF - West African CFA Franc',
'XPD - Palladium',
'XPF - CFP Franc',
'XPT - Platinum',
'XRE - RINET Funds',
'XSU - Sucre',
'XTS - Testing Currency Code',
'XUA - ADB Unit of Account',
'XXX - Unknown Currency',
'YDD - Yemeni Dinar',
'YER - Yemeni Rial',
'ZAL - South African Rand (financial)',
'ZAR - South African Rand',
'ZMW - Zambian Kwacha'];
});