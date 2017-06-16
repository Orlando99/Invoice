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

$scope.dateOptions = {
	showWeeks : false
};
	
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
        $scope.sortByDate();
		hideLoader();
	});
}

$scope.sortByName= function()
    {
          $scope.info.sort(function(a,b){ 
          return a.displayName.localeCompare(b.displayName)});
    if($("#name").css('display') === "none"){
         $scope.info.sort(function(a,b){ 
          return a.displayName.localeCompare(b.displayName)});
            $('#name').css({
                'display': 'inline-table'
            });
            $('#nameUp').css({
                'display': 'none'
            });
        }
        else{
         $scope.info.sort(function(a,b){ 
          return b.displayName.localeCompare(a.displayName)});
            $('#nameUp').css({
                'display': 'inline-table'
            });
            $('#name').css({
                'display': 'none'
            });
        }

              $('#date').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
    
    $('#dateUp').css({
            'display': 'none'
        });
              $('#amountUp').css({
            'display': 'none'
        });
    }
$scope.sortByDate= function()
    {
         
    
    if($("#date").css('display') === "none"){
          $scope.info.sort(function(a,b){ 
          return a.date.localeCompare(b.date)});
            $('#date').css({
                'display': 'inline-table'
            });
            $('#dateUp').css({
                'display': 'none'
            });
        }
        else{
          $scope.info.sort(function(a,b){ 
          return b.date.localeCompare(a.date)});
            $('#dateUp').css({
                'display': 'inline-table'
            });
            $('#date').css({
                'display': 'none'
            });
        }
    
     $('#nameUp').css({
            'display': 'none'
        });
              
              $('#amountUp').css({
            'display': 'none'
        });
    
    
        $('#name').css({
            'display': 'none'
        });
              
              $('#amount').css({
            'display': 'none'
        });
    }
$scope.sortByAmount= function()
    {
          
    
    if($("#amount").css('display') === "none"){
          $scope.info.sort(function(a,b){
          return a.amount.localeCompare(b.amount)});
            $('#amount').css({
                'display': 'inline-table'
            });
            $('#amountUp').css({
                'display': 'none'
            });
        }
        else{
          $scope.info.sort(function(a,b){
          return b.amount.localeCompare(a.amount)});
            $('#amountUp').css({
                'display': 'inline-table'
            });
            $('#amount').css({
                'display': 'none'
            });
        }
    
        $('#name').css({
            'display': 'none'
        });
              $('#date').css({
            'display': 'none'
        });
    
     $('#nameUp').css({
            'display': 'none'
        });
              $('#dateUp').css({
            'display': 'none'
        });
    
    }
}]);