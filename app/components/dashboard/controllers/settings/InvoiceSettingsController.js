'use strict';

invoicesUnlimited.controller('InvoiceSettingsController',['$scope', '$state', '$controller',
	'userFullFactory', 'invoiceFactory',
	function($scope,$state,$controller,userFullFactory,invoiceFactory){

	var user = userFullFactory.authorized();
	$controller('DashboardController',{$scope:$scope,$state:$state});
	loadColorTheme(user);

	loadInvoicePrefs();

	function loadInvoicePrefs() {
		var promise = invoiceFactory.getPreferences(user);
		promise.then(function(prefs) {
			$scope.prefs = prefs;
			console.log(prefs);
		}, function(error) {
			console.log(error.message);
		});
	}

}]);
