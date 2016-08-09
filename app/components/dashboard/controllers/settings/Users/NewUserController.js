'use strict';

invoicesUnlimited.controller('NewUserController',
	function($scope,$state,userFactory,roleFactory,$controller,
		$q,$uibModalInstance,user,method,title,appFields){

	if (!userFactory.entity.length) {
		$uibModalInstance.dismiss('No signed in user');
		$state.go('login');
		return;
	}

	var errorHandler = function(er){
		console.log(er);
		hideLoader();
		$uibModalInstance.dismiss(er.message);
	}

	$scope.user = user.get('userID') || user;
	setObjectOperations({
		object : $scope.user,
		fields : appFields.user
	});

	$scope.method = method;
	$scope.title = title;
	$scope.user.password = '';

	$scope.delete = function() {
		showLoader();
		Parse.Cloud.run('deleteUser',{
			identificator : $scope.user.id
		})
		.then(function(res){
			$scope.$apply(function() {
				$scope.users.splice($index,1);
			});
			hideLoader();
		},errorHandler);
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
			var ptr = Parse.User.createWithoutData(id);
			return queryService.ext.first({
				className  	: 'ProjectUser',
				field 		: 'userID',
				value 		: ptr,
				methods 	: [{name:'include',param:'userID'}]
			});
		},errorHandler)
		.then(function(user){
			return user.save({
				role 		: $scope.user.role,
				userName 	: $scope.user.username,
				title 		: $scope.user.fullName,
				emailID 	: $scope.user.email
			});
		},errorHandler)
		.then(function(user){
			$uibModalInstance.close(user);
		},errorHandler);
	}

	$scope.save = function(){
		var form = document.querySelector('.modal-content form');
		if (!form.checkValidity()) return;

		$scope.user.set('password',$scope.user.password);
		$scope.user.set('colorTheme','appBlueColor');
		$scope.user.set('isTrackUsage',1);
		$scope.user.set('getInvoiceNotification',1);
		$scope.user.set('subscription',false);
		debugger;
		var errorFunc = function(er){
			console.log(er.message);
			$uibModalInstance.dismiss(er);
		};
		appFields.newCustomer.forEach(function(field){
			$scope.user.set(field,userFactory.entity[0].get(field));
		});
		$scope.user.save()
		.then(function(user){
			return roleFactory.addUser(user);
		},errorFunc)
		.then(function(role){
			$uibModalInstance.close($scope.user);
		},errorFunc);
	}

	$scope.closeModal = function(){
		$uibModalInstance.dismiss('Close');
	}

});