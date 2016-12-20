'use strict';

invoicesUnlimited.controller('CurrencyController',['$q','$scope','$state', '$controller',
	'userFactory', 'currencyFactory', 'coreFactory',
function($q,$scope,$state,$controller, userFactory, currencyFactory, coreFactory){

if(!userFactory.entity.length) {
	console.log('User not logged in');
	$state.go('login');
	return undefined;
}

var user = undefined;
var organization = undefined;
$controller('DashboardController',{$scope:$scope,$state:$state});
$q.when(userFactory.entity[0].fetch())
.then(function(obj) {
	user = obj;
	organization = user.get("organizations")[0];
	loadCurrencies();
});
 
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

function loadCurrencies() {
	$q.when(currencyFactory.loadAll({
		organization : organization
	}))
	.then(function(currencies) {
		$scope.currencies = currencies;
		setDefaultCurrencyIndex();
		hideLoader();
        $scope.displayedCurrencies = currencies;
        
	});
}

function setDefaultCurrencyIndex() {
	var curr = user.get('currency');
	$scope.defaultCurrencyIndex =
	$scope.currencies.findIndex(function(currency) {
		return currency.entity.id == curr.id;
	});
}
$scope.prepareAddCurrency = function() {
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
}

$scope.prepareEditCurrency = function(index) {
	var currency = $scope.currencies[index].entity;
	$scope.selectedIndex = index;
	$scope.currencyObj = {
		title : currency.title,
		currencySymbol : currency.currencySymbol,
		decimalPlace : currency.decimalPlace + '',
		format : currency.format,
		exchangeRate : currency.exchangeRate
	}
	$('.edit-currency').addClass('show');
	$('#editCurrencyForm').validate({
		rules : {
			currencyCode : 'required',
			currencySymbol : 'required',
			exchangeRate : {
				number : true,
				min : 0,
			}
		}
	});
	$('#editCurrencyForm').validate().resetForm();
}

$scope.saveNewCurrency = function() {
	if(! $('#addCurrencyForm').valid()) return;

	showLoader();
	var params = $scope.currencyObj;
	params.userID = user;
	params.organization = organization;
	params.decimalPlace = Number(params.decimalPlace);
	params.exchangeRate = Number(params.exchangeRate) || undefined;

	$q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		return currencyFactory.createNewCurrency(params, role);
	})
	.then(function(currency) {
		$scope.currencies.push(currency);
		$('.new-currency').removeClass('show');
		hideLoader();
	});
}

$scope.saveEditedCurrency = function() {
	if(! $('#editCurrencyForm').valid()) return;

	showLoader();
	var currency = $scope.currencies[$scope.selectedIndex].entity;
	var params = $scope.currencyObj;
	params.decimalPlace = Number(params.decimalPlace);
	params.exchangeRate = Number(params.exchangeRate) || undefined;

	['title', 'currencySymbol', 'decimalPlace', 'format']
	.forEach(function(field) {
		currency.set(field, params[field]);
	});
	if(params.exchangeRate)
		currency.set('exchangeRate', params.exchangeRate);
	else
		currency.unset('exchangeRate');

	$q.when(currencyFactory.saveEditedCurrency(currency))
	.then(function(obj) {
		$scope.currencies[$scope.selectedIndex] = obj;
		$('.edit-currency').removeClass('show');
		hideLoader();
	});

}

$scope.setDefaultCurrency = function() {
	if(! $scope.currencies[$scope.selectedIndex].entity.exchangeRate) {
		$('.add-exchangeRate').addClass('show');
		return;
	}

	showLoader();
	var curr = $scope.currencies[$scope.selectedIndex].entity;
	user.set('currency', curr);
	$q.when(user.save())
	.then(function() {
		setDefaultCurrencyIndex();
		$('.edit-currency').removeClass('show');
		hideLoader();
	});
}

$scope.deleteCurrency = function() {
	if($scope.selectedIndex == $scope.defaultCurrencyIndex) {
		$('.cannot-delete').addClass('show');
		return;
	}

	showLoader();
	var curr = $scope.currencies.splice($scope.selectedIndex,1)[0]
	$q.when(curr.entity.destroy())
	.then(function() {
		setDefaultCurrencyIndex();
		$('.edit-currency').removeClass('show');
		hideLoader();
	});
}

$scope.deleteCurrencyClicked = function(index){
    if(index == $scope.defaultCurrencyIndex) {
		$('.cannot-delete').addClass('show');
		return;
	}
    
    $scope.selectedIndex = index;
    
    $('.delete-currency').addClass('show');
}

$scope.confirmDeleteCurrency = function(){
    if($scope.selectedIndex == $scope.defaultCurrencyIndex) {
		$('.cannot-delete').addClass('show');
		return;
	}

	showLoader();
	var curr = $scope.currencies.splice($scope.selectedIndex,1)[0]
	$q.when(curr.entity.destroy())
	.then(function() {
		setDefaultCurrencyIndex();
		$('.delete-currency').removeClass('show');
		hideLoader();
	});
}
  $scope.sortByCurencyName= function(){
    
      $scope.currencies.sort(function(a,b){
        return a.entity.title.localeCompare(b.entity.title)});
    }  
$scope.currencyChanged = function() {
	if($scope.currencyObj)
		$scope.currencyObj.currencySymbol =
			$scope.currencyObj.title.split(' ')[0];

}
  $scope.search = function()
  {
        if($scope.searchText.length)
        {   
            $scope.currencies = $scope.displayedCurrencies.filter(function(obj)
            {      
                if(!obj.entity.title)
                {
                    obj.entity.title = "";
                }
                if(!obj.entity.currencySymbol)
                {
                   obj.entity.currencySymbol = "";
                }
                if(!obj.entity.exchangeRate)
                {
                   obj.entity.exchangeRate = "";
                }
                return obj.entity.title.toLowerCase().includes($scope.searchText.toLowerCase()) || 
                obj.entity.currencySymbol.toLowerCase().includes($scope.searchText.toLowerCase()) || 
                obj.entity.exchangeRate.toString().toLowerCase().includes($scope.searchText.toLowerCase()) 
            });
        }
        else
        { 
           $scope.currencies =$scope.displayedCurrencies;
        }
   }    
}]);