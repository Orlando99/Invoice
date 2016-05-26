'use strict';

invoicesUnlimited.controller('CreateInvoiceController',['$scope', '$state', '$controller',
	'userFullFactory', 'invoiceFactory',
	function($scope,$state,$controller,userFullFactory,invoiceFactory){

	var user = userFullFactory.authorized();
	$controller('DashboardController',{$scope:$scope,$state:$state});
	loadColorTheme(user);

	prepareToCreateInvoice();

	function prepareToCreateInvoice() {
		console.log("came here");

		loadCustomers();
		/*
		var promise = invoiceFactory.getPreferences(user);
		promise.then(function(prefs) {
			// do pref related things here.

		}, function(error) {
			console.log(error.message);
		});
	*/

	}

	$scope.printSelected = function() {
		console.log($scope.selectedCustomer);
	}

	function loadInvoicePrefs() {
		var promise = invoiceFactory.getPreferences(user);
		promise.then(function(prefs) {
			$scope.prefs = prefs;
			console.log(prefs);
		}, function(error) {
			console.log(error.message);
		});
	}

	// should load from customers service
	function loadCustomers() {
		showLoader();
		var customerTable = Parse.Object.extend("Customer");
		var query = new Parse.Query(customerTable);

		query.containedIn("objectId", ["jycwm97JIE", "VCb5lcsqTD"]);
		query.select("displayName");
		var promise = query.find().then(function(custmrObjs) {
			var custmrs = [];
			for (var i = 0; i < custmrObjs.length; ++i) {
				custmrs.push({
					name: custmrObjs[i].get("displayName")
				});
			}
			return custmrs;
		});

		promise.then(function(custmrs) {
			$scope.customers = custmrs;	
    	//	$scope.selectedCustomer = custmrs[0].name;
		//	console.log($scope.customers);

		hideLoader();

		}, function(error) {
			console.log(error.message);
			hideLoader();
		});
	}

}]);
