'use strict';

invoicesUnlimited.controller('InvoiceController',['$scope', '$state', '$controller',
	'userFullFactory', 'invoiceFactory',
	function($scope,$state,$controller,userFullFactory,invoiceFactory){

	var user = userFullFactory.authorized();
	$controller('DashboardController',{$scope:$scope,$state:$state});
	loadColorTheme(user);

	showLoader();
	var promise = invoiceFactory.getInvoices(user);
	promise.then(function(invoices) {
	//	console.log(invoices);
		$scope.invoices = invoices;
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	})
	.then(function() {
		var invoiceId = "VW6Zf9urYA";
		invoiceFactory.createInvoiceReceipt(user, invoiceId)
		.then(function() {

		}, function(error) {
			console.log(error.message);
		});
	});

}]);
