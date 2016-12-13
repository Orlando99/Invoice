'use strict';

invoicesUnlimited.controller('SalesByItemController',
	['$scope', '$state', '$controller', '$q', 'userFactory', 'reportsService',
	'reportsCommon', 'itemService', 'currencyFilter',
function($scope, $state, $controller, $q, userFactory, reportsService, reportsCommon, itemService, currencyFilter) {

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

	var promises = [];
	var p = undefined;

	p = userFactory.getField('dateFormat')
	.then(function(obj) {
		$scope.dateFormat = obj;
	});
	promises.push(p);

	p = itemService.getItemNames({
		organization : organization
	}).then(function(items) {
		$scope.items = items;
	});
	promises.push(p);

	$q.all(promises)
	.then(function() {
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
        ShowMessage("From Date can't be greater then To Date!","error");
        return false;
    }
	showLoader();
	var params = {
		fromDate : $scope.fromDate,
		toDate : $scope.toDate,
		organization : organization
	};
	$q.when(reportsService.salesByItem(params))
	.then(function(invoices) {
		calculateSalesByItem(invoices);
		hideLoader();
	});
}

function calculateSalesByItem(invoices) {
	var item_ids = [];
	var info = {};
	invoices.forEach(function(invoice) {
		var invId = invoice.entity.id;
		var items = invoice.invoiceItems;

		items.forEach(function(item) {
			var itemId = item.entity.item.id;
			var obj = info[itemId];

			if(obj) {
				obj.amount += item.entity.amount;
				if(! obj.inv_ids.find(function(id) { return id == invId; }) ){
					obj.inv_ids.push(invId);
				}

			} else {
				item_ids.push(itemId);	// save item id
				info[itemId] = {	// create new object
					amount : item.entity.amount,
					inv_ids : [invId] // list of invoice ids, this item exists in
				}
			}
		});
	});

	var total = 0;
	var totalInvoices = 0;
	item_ids.forEach(function(id) {
		info[id].amountStr = currencyFilter(info[id].amount, '$', 2);
		info[id].count = info[id].inv_ids.length + 1;
		total += info[id].amount;
		totalInvoices += info[id].count;

		info[id].name = $scope.items.find(function(item) {
			return item.id == id;
		}).get('title');
	});

	$scope.ids = item_ids;
	$scope.info = info;
	$scope.totalInvoices = totalInvoices;
	$scope.totalStr = currencyFilter(total, '$', 2);

	var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
	$scope.fromDateStr = formatDate($scope.fromDate, dateFormat);
	$scope.toDateStr = formatDate($scope.toDate, dateFormat);
}

}]);