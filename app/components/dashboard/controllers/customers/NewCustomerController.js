'use strict';

invoicesUnlimited.controller('NewCustomerController',
	function($scope,$rootScope,$state,userFactory,
			 contactPersonFactory,customerFactory,$controller,$q,coreFactory){

	var user = userFactory;
	
	if (!user.entity.length) {
		$state.go('login');
		return;
	}
    
    if(fromTutorial){
        $('.tutorial').show();
    }
    else{
        $('.tutorial').hide();
    }

	$scope.displayNameClicked = false;

	$('#workPhone').mask('(999) 999-9999');
	$('#mobilePhone').mask('9 (999) 999-9999',mobileOptions);

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
	hideLoader();

	var Customer = Parse.Object.extend("Customer");

	$scope.newCustomer = new customerFactory(new Customer());
	$scope.newCustomer.entity.set('userID',user.entity[0]);
	$scope.newCustomer.entity.set('status','active');

	$scope.newCustomer.billingAddress = Object.create(address);

	$scope.newCustomer.shippingAddress = Object.create(address);

	$scope.shipping = {
		setShippingTheSame  : false,
		tempShippingAddress : {}
	}

	$('#new-customer-form').validate({
		rules: {
			displayName: 'required',
			email : {
				required : false,
				email : true
			}
		}
	});

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
		// billing address may be filled after checking the same as box
		if ($scope.newCustomer && $scope.shipping.setShippingTheSame) {
			$scope.newCustomer.shippingAddress = 
				$.extend(true,{},$scope.newCustomer.billingAddress);
		}

	//	var form = document.getElementById('new-customer-form');
		if (! $('#new-customer-form').valid()) {
			var v = $('#new-customer-form').validate();
			var offset = $(v.errorList[0].element).offset().top - 30;
			scrollToOffset(offset);
			return;
		}

		showLoader();

		$scope.newCustomer.entity.billingAddress = JSON.stringify(
			$scope.newCustomer.billingAddress);

		$scope.newCustomer.entity.shippingAddress = JSON.stringify(
			$scope.newCustomer.shippingAddress);

		var ContactPerson = Parse.Object.extend('ContactPerson');
		var contact = new contactPersonFactory(new ContactPerson());
		var cust = $scope.newCustomer;
		contact.entity.set('userID',user.entity[0]);
		contact.entity.set('defaultPerson',1);
		['email','phone','mobile','lastName','firstName','salutaion']
		.forEach(function(el){
			contact.entity[el.toLowerCase()] 
			= $scope.newCustomer.entity[el];
		})
		
		contact.save()
		.then(function() {
			$scope.newCustomer.entity.add('contactPersons',contact.entity);
			$scope.newCustomer.entity.set('organization',user.entity[0].get('selectedOrganization'));
			$scope.newCustomer.save()
			.then(function(custObj){
			
				$scope.newCustomer = new customerFactory(new Customer());
				$scope.newCustomer.entity.set('userID',user.entity[0]);
				
				$scope.newCustomer.billingAddress = Object.create(address);
				$scope.newCustomer.shippingAddress = Object.create(address);
				hideLoader();

				if($state.params.backLink) {
					// clear customer in core factory,
					// or send loadAgain = true from all the
					// places where coreFactory.loadAllCustomers in used.
					coreFactory.clearAllOnLogOut();
					$state.go($state.params.backLink, {customerId:custObj.id});
				} else {
                    if(fromTutorial){
                        fromTutorial = false;
                        $state.go('dashboard');
                    }
                    else{
					$state.go('dashboard.customers.all');
                    }
				}
			});
		});
	}

	var changeDispName = function(newV,oldV) {
		if (!$scope.displayNameClicked) {
			var c = $scope.newCustomer.entity;
			if (!c.firstName && !c.lastName) {
				c.displayName = "";
				return;
			}
			c.displayName = "";
			c.displayName += c.firstName ? c.firstName : "";
			c.displayName += " ";
			c.displayName += c.lastName ? c.lastName : "";
		}
	}

	$scope.$watch("newCustomer.entity.firstName",changeDispName);

	$scope.$watch("newCustomer.entity.lastName",changeDispName);

	$scope.cancelSaveCustomer = function(){
		$state.go('dashboard.customers.all');
	}
    
    $scope.nextClicked = function(){
        $('.tutorial').hide();
    }
    
    $scope.skipTutorial = function(){
        fromTutorial = false;
        $state.go('dashboard');
    }

});