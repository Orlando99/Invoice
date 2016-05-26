'use strict';

invoicesUnlimited.controller('InvoiceController',['$scope', '$state', '$controller',
	'userFullFactory', 'invoiceFactory',
	function($scope,$state,$controller,userFullFactory,invoiceFactory){

	var user = userFullFactory.authorized();
	$controller('DashboardController',{$scope:$scope,$state:$state});
	loadColorTheme(user);

	var promise = invoiceFactory.getInvoices(user);
	promise.then(function(invoices) {
		console.log(invoices);

	}, function(error) {
		console.log(error.message);
	});

}]);
