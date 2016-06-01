'use strict';

invoicesUnlimited.controller('NewCustomerController',
	function($scope,$rootScope,$state,userFactory,
			 customerFactory,$controller,$q){

	var user = userFactory;
	var def = $q.defer();

	var address = {
		"Street" 			: "",
		"Fax" 				: "",
		"City" 				: "",
		"Zip/Postal Code"	: "",
		"Country" 			: "",
		"State/Province" 	: ""
	};

	$controller('DashboardController',{$scope:$scope,$state:$state});

	var Customer = Parse.Object.extend("Customer");

	$scope.newCustomer = new customerFactory(new Customer());
	$scope.newCustomer.entity.set('userID',user);

	$scope.newCustomer.billingAddress = Object.create(address);

	$scope.newCustomer.shippingAddress = Object.create(address);

	$scope.shipping = {
		setShippingTheSame  : false,
		tempShippingAddress : {}
	}

	$scope.setShippingAddress = function(){
		if ($scope.newCustomer && !$scope.shipping.setShippingTheSame) {
			$scope.newCustomer.shippingAddress = 
				$scope.shipping.tempShippingAddress;
			return;
		}
		if ($scope.newCustomer) {
			
			$scope.shipping.tempShippingAddress = 
				$scope.newCustomer.shippingAddress;

			$scope.newCustomer.shippingAddress = 
				$.extend(true,{},$scope.newCustomer.billingAddress);

		}
	}

	$scope.saveCustomer = function(){

		$scope.newCustomer.entity.billingAddress = JSON.stringify(
			$scope.newCustomer.billingAddress);

		$scope.newCustomer.entity.shippingAddress = JSON.stringify(
			$scope.newCustomer.shippingAddress);

		$scope.newCustomer.save().then(function(){
			
			$scope.newCustomer = new customerFactory(new Customer());
			$scope.newCustomer.entity.set('userID',user);
			
			$scope.newCustomer.billingAddress = Object.create(address);
			$scope.newCustomer.shippingAddress = Object.create(address);

			$state.go('dashboard.customers.all');
		});
	}

	$scope.cancelSaveCustomer = function(){
		$state.go('dashboard.customers.all');
	}

});