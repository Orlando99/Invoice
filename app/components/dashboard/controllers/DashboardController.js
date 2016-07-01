'use strict';

invoicesUnlimited.controller('DashboardController',['$scope','$state','userFactory','businessFactory','$q',
	'currencyFilter',
	function($scope,$state,userFactory,businessFactory,$q, currencyFilter){

	showLoader();

	var user = userFactory;
	var business = businessFactory;
	
	if (!user.entity.length) {
		hideLoader();
		$state.go('login');
		return;
	}
	
	loadColorTheme(user);
	
	$scope.businessInfo = businessFactory.entity.length ?
						  businessFactory.entity[0] :
						  {};

	$scope.logOut = function(){
		user.logout().then(function(){
			resetColorTheme();
			$state.go('login');
		});
	};

	$q
	.all([businessFactory.load()])
	.then(function(obj){
		if (obj.length && obj[0]) {
			$scope.businessInfo = obj[0].entity[0];
			hideLoader();
		} else $scope.logOut();			
	});

	$scope.unpaidInvoiceCount = 0;
	$scope.unpaidInvoiceAmount = currencyFilter(0, '$', 2);
	$scope.totalSalesAmount = currencyFilter(0, '$', 2);
	$scope.totalReceiptAmount = currencyFilter(0, '$', 2);
	$scope.totalExpenseAmount = currencyFilter(0, '$', 2);

	$scope.expenseList = [
		{name: 'expense1', customer: 'customer1', value : currencyFilter(0,'$', 2)},
		{name: 'expense2', customer: 'customer2', value : currencyFilter(0,'$', 2)}
	];

}]);
