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
    
    var selectedDate =  $scope.toDate;
    var todayDate =  new Date();
  //  var fromDate1 =  $scope.fromDate
    var toDate1 =  $scope.toDate
   /*
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
    */
	showLoader();
	var params = {
		//fromDate : $scope.fromDate,
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
					name : credit.customer.displayName,
					availableCredit : subAmount,
					count : 1
				};
				ids.push(customerId);
			}
			totalCredit += subAmount;
		});

        var totalCustomerBalance = 0;
        
		ids.forEach(function(id) 
        {
            console.log("info[id].balanceDue = "+info[id].balanceDue)
            info[id].customerBalance = info[id].balanceDue - info[id].availableCredit;
            totalCustomerBalance += info[id].customerBalance;
            info[id].customerBalanceStr = currencyFilter(info[id].customerBalance, '$', 2);
			info[id].balanceDueStr = currencyFilter(info[id].balanceDue, '$', 2);
            info[id].availableCreditStr = currencyFilter(info[id].availableCredit, '$', 2);
		});

		$scope.info = info;
		$scope.ids = ids;
		$scope.totalBalanceStr = currencyFilter(totalBlanceDue, '$', 2);
		$scope.totalCreditStr = currencyFilter(totalCredit, '$', 2);
		$scope.totalCustomerBalanceStr = currencyFilter(totalCustomerBalance, '$', 2);
        
		var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
		//$scope.fromDateStr = formatDate($scope.fromDate, dateFormat);
		$scope.toDateStr = formatDate($scope.toDate, dateFormat);
        $scope.sortByName();
		hideLoader();
	});
    
    ////
    ////
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
$scope.sortByName= function()
    {
          $scope.ids.sort(function(a,b){ 
          return $scope.info[a].name.localeCompare($scope.info[b].name)});
        if($("#name").css('display') === "none"){
          $scope.ids.sort(function(a,b){ 
          return $scope.info[a].name.localeCompare($scope.info[b].name)});
    
            $('#name').css({
                'display': 'inline-table'
            });
            $('#nameUp').css({
                'display': 'none'
            });
        }
        else{
          $scope.ids.sort(function(a,b){ 
          return $scope.info[b].name.localeCompare($scope.info[a].name)});
    
            $('#nameUp').css({
                'display': 'inline-table'
            });
            $('#name').css({
                'display': 'none'
            });
        }
    
          $('#credit').css({
            'display': 'none'
        });
          $('#balance').css({
            'display': 'none'
        });
    
        $('#creditUp').css({
            'display': 'none'
        });
          $('#balanceUp').css({
            'display': 'none'
        });
    
        $('#customerbalance').css({
            'display': 'none'
        });
        $('#customerbalanceUp').css({
            'display': 'none'
        });
    
    }
$scope.sortByCredit= function()
    {
        
        if($("#credit").css('display') === "none"){
          $scope.ids.sort(function(a,b){ 
          return  $scope.info[b].availableCredit - $scope.info[a].availableCredit});
    
            $('#credit').css({
                'display': 'inline-table'
            });
            $('#creditUp').css({
                'display': 'none'
            });
        }
        else{
         $scope.ids.sort(function(a,b){ 
          return  $scope.info[a].availableCredit - $scope.info[b].availableCredit});
            $('#creditUp').css({
                'display': 'inline-table'
            });
            $('#credit').css({
                'display': 'none'
            });
        }
    
        $('#balanceUp').css({
            'display': 'none'
        });
        $('#nameUp').css({
            'display': 'none'
        });
    
              
              $('#balance').css({
            'display': 'none'
        });
        $('#name').css({
            'display': 'none'
        });
    
        $('#customerbalance').css({
            'display': 'none'
        });
        $('#customerbalanceUp').css({
            'display': 'none'
        });
    }

    $scope.sortByBalance= function()
    {
          $scope.ids.sort(function(a,b){ 
          return  $scope.info[b].balanceDue - $scope.info[a].balanceDue});
    
        if($("#balance").css('display') === "none"){
         $scope.ids.sort(function(a,b){ 
          return  $scope.info[b].balanceDue - $scope.info[a].balanceDue});
            $('#balance').css({
                'display': 'inline-table'
            });
            $('#balanceUp').css({
                'display': 'none'
            });
        }
        else{
             $scope.ids.sort(function(a,b){ 
                return  $scope.info[a].balanceDue - $scope.info[b].balanceDue
             });
            $('#balanceUp').css({
                'display': 'inline-table'
            });
            $('#balance').css({
                'display': 'none'
            });
        }
    
        $('#name').css({
            'display': 'none'
        });
        $('#credit').css({
            'display': 'none'
        });
    
        $('#nameUp').css({
            'display': 'none'
        });
        $('#creditUp').css({
            'display': 'none'
        });
        
        $('#customerbalance').css({
            'display': 'none'
        });
        $('#customerbalanceUp').css({
            'display': 'none'
        });
    
    }
    
    $scope.sortByCustomerBalance= function()
    {
          $scope.ids.sort(function(a,b){ 
          return  $scope.info[b].customerBalance - $scope.info[a].customerBalance});
    
        if($("#customerbalance").css('display') === "none"){
         $scope.ids.sort(function(a,b){ 
          return  $scope.info[b].customerBalance - $scope.info[a].customerBalance});
            $('#customerbalance').css({
                'display': 'inline-table'
            });
            $('#customerbalanceUp').css({
                'display': 'none'
            });
        }
        else{
         $scope.ids.sort(function(a,b){ 
          return  $scope.info[a].balanceDue - $scope.info[b].balanceDue});
            $('#customerbalanceUp').css({
                'display': 'inline-table'
            });
            $('#customerbalance').css({
                'display': 'none'
            });
        }
    
        $('#balance').css({
            'display': 'none'
        });
        
        $('#name').css({
            'display': 'none'
        });
        $('#credit').css({
            'display': 'none'
        });
    
        $('#nameUp').css({
            'display': 'none'
        });
        $('#creditUp').css({
            'display': 'none'
        });
        $('#balanceUp').css({
            'display': 'none'
        });
    
    }

}]);
