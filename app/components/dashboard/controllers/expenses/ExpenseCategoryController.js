'use strict';

invoicesUnlimited.controller('ExpenseCategoryController',['$q', '$scope','$state', '$controller',
	'userFactory', 'expenseService', 'coreFactory', 'expenseCategoryFactory',
function($q, $scope, $state, $controller, userFactory, expenseService, coreFactory, expenseCategoryFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get('organizations')[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

loadCategories();

function loadCategories () {
	showLoader();
	$q.when(coreFactory.getExpenseCategories({
		organization : organization
	}))
	.then(function(categories) {
		$scope.categories = categories.sort(function(a,b){
			return alphabeticalSort(a.entity.name,b.entity.name)
		});
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

}]);