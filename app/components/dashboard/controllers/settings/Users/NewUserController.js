'use strict';

invoicesUnlimited.controller('NewUserController',
	function($scope,$state,userFactory,
		$controller,$q,$uibModalInstance,user){

	if (!userFactory.entity.length) {
		$uibModalInstance.dismiss('No signed in user');
		$state.go('login');
		return;
	}

	$scope.user = user;
	$scope.password = '';

	$scope.save = function(){
		var form = document.querySelector('.modal-content form');
		if (!form.checkValidity()) return;
		$scope.user.set('password',$scope.password);
		$scope.user.set('colorTheme','appBlueColor');
		$scope.user.set('isTrackUsage',1);
		$scope.user.set('getInvoiceNotification',1);
		$scope.user.set('subscription',false);
		[
			'businessInfo',
			'principalInfo',
			'organizations',
			'signatureImage',
			'selectedOrganization',
			'currency',
			'company',
			'phonenumber',
			'country',
			'defaultTemplate'
		].forEach(function(field){
			$scope.user.set(field,userFactory.entity[0].get(field));
		});
		$scope.user.save()
		.then(function(user){
			$uibModalInstance.close(user);
		},function(er){
			$uibModalInstance.dismiss(er);
			alert(er.message);
			console.log(er.message);
		});
	}

	$scope.closeModal = function(){
		$uibModalInstance.dismiss('Close');
	}

});