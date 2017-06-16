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
        $scope.sortByName();
		hideLoader();
	});
}

$scope.sortByName= function()
    {
        
    if($("#name").css('display') === "none"){
         $scope.categories.sort(function(a,b){ 
          return a.localeCompare(b)});
            $('#name').css({
                'display': 'inline-table'
            });
            $('#nameUp').css({
                'display': 'none'
            });
        }
        else{
         $scope.categories.sort(function(a,b){ 
          return b.localeCompare(a)});
            $('#nameUp').css({
                'display': 'inline-table'
            });
            $('#name').css({
                'display': 'none'
            });
        }
    
              $('#count').css({
            'display': 'none'
        });
              $('#amount').css({
            'display': 'none'
        });
    
    $('#countUp').css({
            'display': 'none'
        });
              $('#amountUp').css({
            'display': 'none'
        });
    }
$scope.sortByCount= function()
    {
          
    
    if($("#count").css('display') === "none"){
        $scope.categories.sort(function(a,b){ 
          return  $scope.info[b].count - $scope.info[a].count});
            $('#count').css({
                'display': 'inline-table'
            });
            $('#countUp').css({
                'display': 'none'
            });
        }
        else{
         $scope.categories.sort(function(a,b){ 
          return  $scope.info[a].count - $scope.info[b].count});
            $('#countUp').css({
                'display': 'inline-table'
            });
            $('#count').css({
                'display': 'none'
            });
        }
    
    
        $('#name').css({
            'display': 'none'
        });
             
              $('#amount').css({
            'display': 'none'
        });
    
    $('#nameUp').css({
            'display': 'none'
        });
             
              $('#amountUp').css({
            'display': 'none'
        });
    }
$scope.sortByAmount= function()
    {
          
    
    if($("#amount").css('display') === "none"){
       $scope.categories.sort(function(a,b){
          return  $scope.info[b].amount - $scope.info[a].amount});
            $('#amount').css({
                'display': 'inline-table'
            });
            $('#amountUp').css({
                'display': 'none'
            });
        }
        else{
         $scope.categories.sort(function(a,b){
          return  $scope.info[a].amount - $scope.info[b].amount});
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
              $('#count').css({
            'display': 'none'
        });
    
     $('#nameUp').css({
            'display': 'none'
        });
              $('#countUp').css({
            'display': 'none'
        });
             
    }



}]);