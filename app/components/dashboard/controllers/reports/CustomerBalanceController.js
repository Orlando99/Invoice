'use strict';

invoicesUnlimited.controller('CustomerBalanceController',
	['$scope', '$state', '$controller', '$q', 'userFactory', 'reportsService', 'reportsCommon', 'currencyFilter','creditNoteService',
function($scope, $state, $controller, $q, userFactory, reportsService, reportsCommon, currencyFilter,creditNoteService) {

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
    
    var selectedDate =  $scope.toDate;
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

    var promises = [];
	promises.push(reportsService.customerBalance(params));
    promises.push(reportsService.customerCredit(params));
    
    $q.all(promises)
	.then(function(results) {
        var invoices = results[0];
        var credits = results[1];
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
					count : 1,
                    availableCredit : 0
				};
				ids.push(customerId);
			}
			totalBlanceDue += subAmount;
		});
        
        var totalCredit = 0;
        
        credits.forEach(function(credit) {
			var customerId = credit.customer.id;
			var subAmount = credit.entity.remainingCredits;
			if(info[customerId]){
				info[customerId].availableCredit += subAmount;
				//info[customerId].count += 1;
			} else {
				info[customerId] = {
					name : invoice.customer.displayName,
					availableCredit : subAmount,
					count : 1
				};
				ids.push(customerId);
			}
			totalCredit += subAmount;
		});

		ids.forEach(function(id) {
			info[id].balanceDueStr = currencyFilter(info[id].balanceDue, '$', 2);
            info[id].availableCreditStr = currencyFilter(info[id].availableCredit, '$', 2);
		});

		$scope.info = info;
		$scope.ids = ids;
		$scope.totalBalanceStr = currencyFilter(totalBlanceDue, '$', 2);
		$scope.totalCreditStr = currencyFilter(totalCredit, '$', 2);
        
		var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
		$scope.fromDateStr = formatDate($scope.fromDate, dateFormat);
		$scope.toDateStr = formatDate($scope.toDate, dateFormat);

		hideLoader();
	});
    
    /*
	$q.when(reportsService.customerBalance(params))
	.then(function(invoices) {
		var ids = [];
		var info = {};
		var totalBlanceDue = 0;
		invoices.forEach(function(invoice) 
        {
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
              //
                  /*  $q.when( creditNoteService.getCustomerCreditNotes( invoice.customer) )
                    .then(function(objs) 
                    {
                    $scope.creditNotes = objs;
                    var total = 0;
                    objs.forEach(function(obj) 
                    {
                        var c = obj.entity.
                        total += obj.entity.remainingCredits;
                    });
                    $scope.availableCredits = total;   
                    });
             
        //
		//});
               
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
    */
}
}]);
