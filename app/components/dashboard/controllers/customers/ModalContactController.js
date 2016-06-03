'use strict';

invoicesUnlimited.controller('ModalContactController',function(
	$scope,$uibModalInstance,contact,customer){

	$scope.contact = contact;

	$scope.Save = function(){

		showLoader();

		$scope.contact.save().then(function(){
			function idExist(el) {	return el.id == $scope.contact.id; }
			if (!customer.contactPersons.some(idExist)) 
				customer.entity.add('contactPersons',$scope.contact.entity);
			debugger;
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