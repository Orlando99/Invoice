'use strict';

invoicesUnlimited.controller('ModalContactController',function(
	$scope,$uibModalInstance,contact){

	$scope.contact = contact;

	$scope.Save = function(){
		$uibModalInstance.close($scope.contact);
	}

	$scope.Cancel = function() {
		$uibModalInstance.dismiss('Close')
	}

})