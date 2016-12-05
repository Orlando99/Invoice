'use strict';

invoicesUnlimited.controller('ExpenseByCategoryController',
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
        ShowMessage("FromDate can't be greator then ToDate!","error");   
        return false;
    }
	showLoader();
	var params = {
		fromDate : $scope.fromDate,
		toDate : $scope.toDate,
		organization : organization
	};

	$q.when(reportsService.expenseByCategory(params))
	.then(function(expenses) {
		var titles = [];
		var info = {};
		var total = 0;

		expenses.forEach(function(expense) {
			var category = expense.get('category');
			var amount = expense.get('amount');
			total += amount;

			if(info[category]) {
				info[category].amount += amount;
				info[category].count += 1;

			} else {
				titles.push(category);
				info[category] = {
					amount : amount,
					count : 1
				}
			}
		});

		titles.forEach(function(title) {
			info[title].amountStr = currencyFilter(info[title].amount, '$', 2);
		});

		$scope.categories = titles;
		$scope.info = info;

		var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
		$scope.totalStr = currencyFilter(total, '$', 2);
		$scope.fromDateStr = formatDate($scope.fromDate, dateFormat);
		$scope.toDateStr = formatDate($scope.toDate, dateFormat);

		hideLoader();
	});
}

}]);