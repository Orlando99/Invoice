'use strict';

invoicesUnlimited.controller('ModalContactController',function(
	$scope,$uibModalInstance,contact,customer){

	$scope.contact = contact;

	$scope.Save = function(){

		showLoader();

		$scope.contact.save().then(function(){
			customer.entity.add('contactPersons',$scope.contact.entity);
			return customer.save();
		}).then(function(customerObject){
			hideLoader();
			$uibModalInstance.close($scope.contact);
		});
	}

	$scope.Cancel = function() {
		$uibModalInstance.dismiss('Close')
	}

})