'use strict';

invoicesUnlimited.controller('TaxController',['$scope', '$state', '$controller',
	'userFullFactory', 'taxFactory',
	function($scope,$state,$controller,userFullFactory,taxFactory){

	var user = userFullFactory.authorized();
	$controller('DashboardController',{$scope:$scope,$state:$state});

	getTaxes();
	loadColorTheme(user);
	initalizeModalClasses();
	initializeScopeVariables();

	function initializeScopeVariables() {
		$scope.taxId = 0;
		$scope.taxName = '';
		$scope.taxRate = '';
		$scope.isCompound = false;
	}

	function getTaxes() {
		taxFactory.getTaxes(user,function(taxContent){
			$scope.taxes = taxContent;
		});
	}
	
	$scope.print_values = function() {
		console.log("tax name: " + $scope.taxName);
		console.log("tax rate: " + $scope.taxRate);
		console.log("is compound: " + $scope.isCompound);
	}

	$scope.clearAddItemFields = function() {
		initializeScopeVariables();
	}

	$scope.saveNewTax = function() {
		// run form validation
		var params = {
			title: $scope.taxName,
			value: Number($scope.taxRate),
			compound: ($scope.isCompound ? 1 : 0),
			user: user
		};

		taxFactory.saveNewTax(params, function(response){
			console.log(response);
			$(".new-tax").removeClass("show");
			getTaxes();
		});
	}
	
	$scope.editTax = function(tax) {
		$(".edit-tax").addClass("show");
		// record selected tax attributes
		$scope.taxId = tax.id;
		$scope.taxName = tax.name;
		$scope.taxRate = tax.rate;
		$scope.isCompound = tax.isCompound;
	}

	$scope.saveEditedTax = function() {
		// run form validation
		var params = {
			taxId: $scope.taxId,
			taxName: $scope.taxName,
			taxRate: $scope.taxRate,
			isCompound: $scope.isCompound
		};
		var promise = taxFactory.saveEditedTax(params);
		$(".edit-tax").removeClass("show");

		promise.then(function(res) {
			console.log("all done");
			getTaxes();
		}, function(error) {
			console.log("from controller: " + error.message);
		});

	}
	
	$scope.deleteTax = function(tax) {
		console.log("delete Click Now");
	}

}]);
