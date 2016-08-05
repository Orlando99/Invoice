'use strict';

invoicesUnlimited.controller('ModalContactController',function(
	$scope,$uibModalInstance,contact,customer,title){

	$scope.contact = contact;
	$scope.title = title;

	$scope.Save = function(){

		showLoader();
		$scope.contact.save().then(function(obj){
			function idExist(el) {	return el.entity.id == $scope.contact.entity.id; }
			if (!customer.contactPersons.some(idExist)) {
				customer.entity.add('contactPersons',$scope.contact.entity);
				return customer.save();
			}
			return;
		},function(er){
			debugger;
		}).then(function(customerObject){
			hideLoader();
			$uibModalInstance.close($scope.contact);
		});
	}

	$scope.Cancel = function() {
		$uibModalInstance.dismiss('Close')
	}

	$scope.maskPhones = function() {
		$('.workPhone').mask('(000) 000-0000');
		$('.mobilePhone').mask('0 (000) 000-0000',mobileOptions);
	}

})