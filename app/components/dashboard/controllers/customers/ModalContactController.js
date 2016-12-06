'use strict';

invoicesUnlimited.controller('ModalContactController',function(
	$scope,$uibModalInstance,contact,customer,title){

	$scope.contact = contact;
	$scope.title = title;
    
	$scope.Save = function(){
        $('#addContactForm').validate({
		rules: {
            firstname: 'required',
            lastname: 'required',
            mobile: {
                required: true,
                minlength: 14
            },
			email : {
				required : true,
				email : true
			}
		},
        messages: {
            firstname: 'Please enter first name',
            lastname: 'Please enter last name',
            mobile: {
                required: 'Please enter mobile number',
                minlength: 'Please enter a valid phone number'
            },
			email : {
				required : "Please enter email address",
				email : "Please enter a valid email address"
			}
        }
	});
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