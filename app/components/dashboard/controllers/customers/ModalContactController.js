'use strict';

invoicesUnlimited.controller('ModalContactController',function(
	$scope,$uibModalInstance,contact,customer,title){

	$scope.contact = contact;
	$scope.title = title;

    $("#addContactForm").validate({
		rules: {
			firstname 		: 'required',
			lastname	: 'required'
		},
		messages: {
			firstname 	: 'Please specify your estimated montly credit card sales!',
			lastname 		: 'Please specify your bank name!'
			
		}
	});
    
	$scope.Save = function(){
        var a = $('#addContactForm');
        if(! $('#addContactForm').valid()) 
            return;
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
    
    $('.workPhone').mask('(000) 000-0000');
		$('.mobilePhone').mask('0 (000) 000-0000',mobileOptions);
    
	$scope.maskPhones = function() {
		$('.workPhone').mask('(000) 000-0000');
		$('.mobilePhone').mask('0 (000) 000-0000',mobileOptions);
	}

})