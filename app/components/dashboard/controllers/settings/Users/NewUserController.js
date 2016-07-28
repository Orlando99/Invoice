'use strict';

invoicesUnlimited.controller('NewUserController',
	function($scope,$state,userFactory,
		$controller,$q,$uibModalInstance,user,method,title){

	if (!userFactory.entity.length) {
		$uibModalInstance.dismiss('No signed in user');
		$state.go('login');
		return;
	}

	$scope.method = method;
	$scope.title = title;
	$scope.user = user;
	$scope.password = '';

	$scope.delete = function() {
		showLoader();
		Parse.Cloud.run('deleteUser',{
			identificator : $scope.user.id,
			user : {
				id : userFactory.entity[0].id
			}
		})
		.then(function(res){
			$scope.$apply(function() {
				$scope.users.splice($index,1);
			});
			hideLoader();
		},function(e){
			console.log(e.message);
			hideLoader();
		});
	}

	$scope.update = function(){
		var params = {}; 
		['username','fullName','email','role']
		.forEach(function(fld){
			params[fld] = $scope.user[fld];
		});
		showLoader();
		Parse.Cloud.run('UpdateUser',{
			user : {
				id 		: $scope.user.id,
				params 	: params
			}
		}).then(function(id){
			queryService.first({
				className  	: '_User',
				field 		: 'id',
				value 		: id
			}).then(function(user){
				$uibModalInstance.close(user);
			},function(er){
				console.log(er.message);
				hideLoader();
				$uibModalInstance.dismiss(er.message);
			});
		},function(er){
			console.log(er);
			hideLoader();
			$uibModalInstance.dismiss(er.message);
		});
	}

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