'use strict';

invoicesUnlimited.controller('PaymentsReceivedController',
	['$scope', '$state', '$controller', '$q', 'userFactory', 'reportsService', 'reportsCommon', 'currencyFilter',
function($scope, $state, $controller, $q, userFactory, reportsService, reportsCommon, currencyFilter) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});
loadSetData();

function loadSetData() {
	$scope.dateRanges = reportsCommon.getDateRanges();
	$scope.selectedDateRange = $scope.dateRanges[1];
	$scope.fromDate = new Date();
     $scope.fromDate.setHours(0);
    $scope.fromDate.setMinutes(0);
	$scope.toDate = new Date();

	userFactory.getField('dateFormat')
	.then(function(obj) {
		$scope.dateFormat = obj;
		$scope.generateReport();
	});
}

$scope.dateRangeChanged = function() {
	reportsCommon.dateRangeChanged({
		_scope : $scope
	});
}

$scope.openDatePicker = function(n) {
	reportsCommon.openDatePicker({
		_scope : $scope,
		n : n
	});
}

$scope.generateReport = function() {
    
    var selectedDate =  $scope.toDate
    var todayDate =  new Date();
    var fromDate1 =  $scope.fromDate
    var toDate1 =  $scope.toDate
    if(selectedDate>todayDate)
    {
        ShowMessage("Select a valid Date!","error");   
        return false;
    }
    else if(fromDate1>toDate1)
    {
        ShowMessage("The from date can't be after the to date.","error");
        return false;
    }
	showLoader();
	var params = {
		fromDate : $scope.fromDate,
		toDate : $scope.toDate,
		organization : organization
	};

	$q.when(reportsService.paymentsReceived(params))
	.then(function(invoices) {

		var info = [];
		var total = 0;
		var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
		invoices.forEach(function(invoice) {
			var payments = invoice.payments;
			payments.forEach(function(payment) {
				info.push({
					displayName : invoice.customer.get("displayName"),
					date : formatDate(invoice.entity.invoiceDate, dateFormat),
					amount : currencyFilter(payment.entity.amount, '$', 2)
				});
				total += payment.entity.amount;
			});
		});
		$scope.info = info;
		$scope.totalStr = currencyFilter(total, '$', 2);
		$scope.fromDateStr = formatDate($scope.fromDate, dateFormat);
		$scope.toDateStr = formatDate($scope.toDate, dateFormat);

		hideLoader();
	});
}

}]);