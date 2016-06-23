'use strict';

invoicesUnlimited.controller('InvoiceSettingsController',['$scope', '$state', '$controller',
	'userFullFactory', 'invoiceService',
	function($scope,$state,$controller,userFullFactory,invoiceService){

	var user = userFullFactory.authorized();
	$controller('DashboardController',{$scope:$scope,$state:$state});
	loadColorTheme(user);

	loadInvoicePrefs();

	function loadInvoicePrefs() {
		var promise = invoiceService.getPreferences(user);
		promise.then(function(prefs) {
			$scope.prefs = prefs;
			console.log(prefs);
		}, function(error) {
			console.log(error.message);
		});
	}

}]);
