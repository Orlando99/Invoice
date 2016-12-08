'use strict';

invoicesUnlimited.controller('CustomerBalanceController',
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

    
   /* $("#reports-ul-btn").click(function(event){
   $("#reports_ul").toggle();
   $(this).toggleClass("active");
   event.preventDefault();
});*/
    
    
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
        ShowMessage("FromDate can't be greator then ToDate!","error");   
        return false;
    }
	showLoader();
	var params = {
		fromDate : $scope.fromDate,
		toDate : $scope.toDate,
		organization : organization
	};

	$q.when(reportsService.customerBalance(params))
	.then(function(invoices) {
		var ids = [];
		var info = {};
		var totalBlanceDue = 0;
		invoices.forEach(function(invoice) {
			var customerId = invoice.customer.id;
			var subAmount = invoice.entity.balanceDue;
			if(info[customerId]){
				info[customerId].balanceDue += subAmount;
				info[customerId].count += 1;
			} else {
				info[customerId] = {
					name : invoice.customer.displayName,
					balanceDue : subAmount,
					count : 1
				};
				ids.push(customerId);
			}
			totalBlanceDue += subAmount;
		});

		ids.forEach(function(id) {
			info[id].balanceDueStr = currencyFilter(info[id].balanceDue, '$', 2);
		});

		$scope.info = info;
		$scope.ids = ids;
		$scope.totalBalanceStr = currencyFilter(totalBlanceDue, '$', 2);
		
		var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
		$scope.fromDateStr = formatDate($scope.fromDate, dateFormat);
		$scope.toDateStr = formatDate($scope.toDate, dateFormat);

		hideLoader();
	});
}
}]);
