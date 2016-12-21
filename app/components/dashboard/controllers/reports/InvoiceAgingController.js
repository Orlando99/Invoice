'use strict';

invoicesUnlimited.controller('InvoiceAgingController',
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
    //var fromDate1 =  $scope.fromDate
    var toDate1 =  $scope.toDate
       /*
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
        */
	showLoader();
	var params = {
		//fromDate : $scope.fromDate,
		toDate : $scope.toDate,
		organization : organization
	};

	$q.when(reportsService.invoiceAging(params))
	.then(function(invoices) {
		var ids = [];
		var info = {};
        var invoices1 = {};
        
		var totalBlanceDue = 0;
		var totalOverDueDays = 0;
		var oneDay = 86400000; // in milliseconds
		var d2 = $scope.toDate.getTime();
        var i=0;
        
		invoices.forEach(function(invoice) 
        {
            var customerId = invoice.customer.id;
			var subAmount = invoice.entity.balanceDue;
			var subAmount = invoice.entity.balanceDue;
			if(info[customerId]){
				info[customerId].balanceDue += subAmount;
				info[customerId].count += 1;
			} else {
				info[customerId] = {
					name : invoice.customer.displayName,
					balanceDue : subAmount,
					count : 1,
					overDueDays : 0
				};
				ids.push(customerId);
			}
			var d1 = invoice.entity.invoiceDate.getTime();
			var d = Math.round( Math.ceil( Math.abs(d2 - d1) / oneDay ));
                    
			info[customerId].overDueDays += d-1;
			totalOverDueDays += d-1;
			totalBlanceDue += subAmount;
        //   console.log("i="+i  +"Amount:"+subAmount);
            invoices[i].overDueDays1 = d-1; 
            i++;
		});

		ids.forEach(function(id) {
			info[id].balanceDueStr = currencyFilter(info[id].balanceDue, '$', 2);
		});
        $scope.invoices1 = invoices;
		$scope.info = info;
		$scope.ids = ids;
		$scope.totalOverDueDays = totalOverDueDays;
		$scope.totalBalanceStr = currencyFilter(totalBlanceDue, '$', 2);
		
		var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
		//$scope.fromDateStr = formatDate($scope.fromDate, dateFormat);
		$scope.toDateStr = formatDate($scope.toDate, dateFormat);

		hideLoader();
	});
}

$scope.sortByName= function()
    {
          $scope.ids.sort(function(a,b){ 
          return $scope.info[a].name.localeCompare($scope.info[b].name)});
        $('#name').css({
            'display': 'inline-table'
        });
              $('#days').css({
            'display': 'none'
        });
              $('#balance').css({
            'display': 'none'
        });
    }
$scope.sortByDays= function()
    {
          $scope.ids.sort(function(a,b){ 
          return  $scope.info[b].overDueDays - $scope.info[a].overDueDays});
        $('#name').css({
            'display': 'none'
        });
              $('#days').css({
            'display': 'inline-table'
        });
              $('#balance').css({
            'display': 'none'
        });
    }
$scope.sortByBalance= function()
    {
          $scope.ids.sort(function(a,b){ 
          return  $scope.info[b].balanceDue - $scope.info[a].balanceDue});
        $('#name').css({
            'display': 'none'
        });
              $('#days').css({
            'display': 'none'
        });
              $('#balance').css({
            'display': 'inline-table'
        });
    }

}]);