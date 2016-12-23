'use strict';

invoicesUnlimited.controller('NewCustomerController',
	function($scope,$rootScope,$state,userFactory,
			 contactPersonFactory,customerFactory,$controller,$q,coreFactory,currencyFactory){

	var user = userFactory;
	
	if (!user.entity.length) {
		$state.go('login');
		return;
	}
    
    if(fromTutorial){
        $('.tutorial').show();
    }
    else{
        $('.tutorial').hide();
    }

	$scope.displayNameClicked = false;

	$('#workPhone').mask('(999) 999-9999');
	$('#mobilePhone').mask('9 (999) 999-9999',mobileOptions);
    
    $('.alphaNumericField').keypress(function (e) 
    {
      validateTextInputFunc(e);
    });
     
    function validateTextInputFunc(e)
    {
       if(e.which==32)
       {
            return true;  
       }
        var regex = new RegExp("[a-zA-Z0-9-]+$");
        var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
        if (regex.test(str)) {
            return true;
        }
        e.preventDefault();
        return false; 
    }
    
    //$('input[id="workPhone"]')[0].mask('(999) 999-9999');
	var def = $q.defer();

	var address = {
		"Street" 			: "",
		"Fax" 				: "",
		"City" 				: "",
		"Zip/Postal Code"	: "",
		"Country" 			: "",
		"State/Province" 	: ""
	};

	$controller('DashboardController',{$scope:$scope,$state:$state});
	hideLoader();

	var Customer = Parse.Object.extend("Customer");

	$scope.newCustomer = new customerFactory(new Customer());
	$scope.newCustomer.entity.set('userID',user.entity[0]);
	$scope.newCustomer.entity.set('status','active');

	$scope.newCustomer.billingAddress = Object.create(address);

	$scope.newCustomer.shippingAddress = Object.create(address);
    
    loadCurrencies();
    
    function loadCurrencies() {
        $q.when(currencyFactory.loadAll({
            organization : user.entity[0].get('selectedOrganization')
        }))
        .then(function(currencies) {
            $scope.currencies = currencies;
            setDefaultCurrencyIndex();
        });
    }

	$scope.shipping = {
		setShippingTheSame  : false,
		tempShippingAddress : {}
	}

	$('#new-customer-form').validate({
		rules: {
			displayName: 'required',
			email : {
				required : false,
				email : true
			}
		}
	});
    
    function setDefaultCurrencyIndex() {
        var curr = user.entity[0].get('currency');
        $scope.defaultCurrencyIndex =
        $scope.currencies.findIndex(function(currency) {
            return currency.entity.id == curr.id;
        });
        
        $scope.newCustomer.entity.currency = $scope.currencies[$scope.defaultCurrencyIndex].entity.title;
    }
    
    $scope.customerCurrencyChanged = function(){
        if($scope.newCustomer.entity.currency == "dummy")
            {
                $scope.newCustomer.entity.currency = '';
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
            $scope.newCustomer.entity.currency = currency.entity.title;
            $('.new-currency').removeClass('show');
            hideLoader();
        });
    }
    
	$scope.setShippingAddress = function(){
		if ($scope.newCustomer && !$scope.shipping.setShippingTheSame) {
			$scope.newCustomer.shippingAddress = 
				$scope.shipping.tempShippingAddress;
			return;
		}
		if ($scope.newCustomer) {
			
			$scope.shipping.tempShippingAddress = 
				$scope.newCustomer.shippingAddress;

			$scope.newCustomer.shippingAddress = 
				$.extend(true,{},$scope.newCustomer.billingAddress);

		}
	}

	$scope.saveCustomer = function(){
		// billing address may be filled after checking the same as box
		if ($scope.newCustomer && $scope.shipping.setShippingTheSame) {
			$scope.newCustomer.shippingAddress = 
				$.extend(true,{},$scope.newCustomer.billingAddress);
		}

	//	var form = document.getElementById('new-customer-form');
		if (! $('#new-customer-form').valid()) {
			var v = $('#new-customer-form').validate();
			var offset = $(v.errorList[0].element).offset().top - 30;
			scrollToOffset(offset);
			return;
		}

		showLoader();

		$scope.newCustomer.entity.billingAddress = JSON.stringify(
			$scope.newCustomer.billingAddress);

		$scope.newCustomer.entity.shippingAddress = JSON.stringify(
			$scope.newCustomer.shippingAddress);
        
        if($scope.shipping.setShippingTheSame){
            $scope.newCustomer.entity.set('isSameAddress', true);
        }
        else{
            $scope.newCustomer.entity.set('isSameAddress', false);
        }

		var ContactPerson = Parse.Object.extend('ContactPerson');
		var contact = new contactPersonFactory(new ContactPerson());
		var cust = $scope.newCustomer;
		contact.entity.set('userID',user.entity[0]);
		contact.entity.set('defaultPerson',1);
		['email','phone','mobile','lastName','firstName','salutaion']
		.forEach(function(el){
			contact.entity[el.toLowerCase()] 
			= $scope.newCustomer.entity[el];
		});
        
        if(!$scope.newCustomer.entity['firstname'])
            contact.entity['firstname'] = $scope.newCustomer.entity['displayName'];
		
		 contact.save()
		.then(function() {
			$scope.newCustomer.entity.add('contactPersons',contact.entity);
			$scope.newCustomer.entity.set('organization',user.entity[0].get('selectedOrganization'));
			$scope.newCustomer.save()
			.then(function(custObj){
			
				$scope.newCustomer = new customerFactory(new Customer());
				$scope.newCustomer.entity.set('userID',user.entity[0]);
				
				$scope.newCustomer.billingAddress = Object.create(address);
				$scope.newCustomer.shippingAddress = Object.create(address);
				hideLoader();
				if($state.params.backLink) {
					// clear customer in core factory,
					// or send loadAgain = true from all the
					// places where coreFactory.loadAllCustomers in used.
					coreFactory.clearAllOnLogOut();
                    
                    if($state.params.invoiceId){
                        $state.go($state.params.backLink, {'customerId':custObj.id, 'invoiceId' : $state.params.invoiceId});
                    }
                    else if($state.params.estimateId){
                        $state.go($state.params.backLink, {'customerId':custObj.id, 'estimateId' : $state.params.estimateId});
                    }
                    else if($state.params.creditNoteId){
                        $state.go($state.params.backLink, {'customerId':custObj.id, 'creditNoteId' : $state.params.creditNoteId});
                    }
                    else if($state.params.expenseId){
                        $state.go($state.params.backLink, {'customerId':custObj.id, 'expenseId' : $state.params.expenseId});
                    }
                    else{
					   $state.go($state.params.backLink, {customerId:custObj.id});
                    }
				} else {
                
                    if(fromTutorial){
                        fromTutorial = false;
                        $state.go('dashboard');
                    }
                    else{
					   $state.go('dashboard.customers.all');
                    }
				}
			});
		});
	}

	var changeDispName = function(newV,oldV) {
       
		if (!$scope.displayNameClicked) {
			var c = $scope.newCustomer.entity;
			if (!c.firstName && !c.lastName) {
				c.displayName = "";
				return;
			}
			c.displayName = "";
			c.displayName += c.firstName ? c.firstName : "";
			c.displayName += " ";
			c.displayName += c.lastName ? c.lastName : "";
		}
	}

	$scope.$watch("newCustomer.entity.firstName",changeDispName);
	$scope.$watch("newCustomer.entity.lastName",changeDispName);
 
	$scope.cancelSaveCustomer = function(){
		//$state.go('dashboard.customers.all');
        window.history.go(-1);
        
        
	}
    
    $scope.nextClicked = function(){
        $('.tutorial').hide();
    }
    
    $scope.skipTutorial = function(){
        fromTutorial = false;
        $state.go('dashboard');
    }
    
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