'use strict';

invoicesUnlimited.controller('NewUserController',
	function($scope,$rootScope,$state,userFactory,$controller,$q){

	var user = userFactory;
	
	//$controller('DashboardController',{$scope:$scope,$state:$state});

	var User = Parse.Object.extend(Parse.User);

	$scope.saveCustomer = function(){

		$scope.newCustomer.entity.billingAddress = JSON.stringify(
			$scope.newCustomer.billingAddress);

		$scope.newCustomer.entity.shippingAddress = JSON.stringify(
			$scope.newCustomer.shippingAddress);

		var ContactPerson = Parse.Object.extend('ContactPerson');
		var contact = new contactPersonFactory(new ContactPerson());
		var cust = $scope.newCustomer;
		contact.entity.set('userID',user);
		contact.entity.set('defaultPerson',1);
		var fields = ['email','phone','mobile','lastName','firstName','salutaion'];
		for (var i in fields) {
			contact.entity[fields[i].toLowerCase()] 
			= $scope.newCustomer.entity[fields[i]];
		}
		
		contact.save().then(function() {
			$scope.newCustomer.entity.add('contactPersons',contact.entity);
			$scope.newCustomer.entity.set('organization',user.get('selectedOrganization'));
			$scope.newCustomer.save().then(function(){
			
				$scope.newCustomer = new customerFactory(new Customer());
				$scope.newCustomer.entity.set('userID',user);
				
				$scope.newCustomer.billingAddress = Object.create(address);
				$scope.newCustomer.shippingAddress = Object.create(address);

				$state.go('dashboard.customers.all');
			});
		});

	}

	$scope.cancelSaveCustomer = function(){
		$state.go('dashboard.settings.users');
	}

});