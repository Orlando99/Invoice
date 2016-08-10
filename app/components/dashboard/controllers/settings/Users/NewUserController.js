'use strict';

invoicesUnlimited.controller('NewUserController',
	function($scope,$state,userFactory,roleFactory,$controller,
		$q,$uibModalInstance,user,method,title,appFields){

	if (!userFactory.entity.length) {
		$uibModalInstance.dismiss('No signed in user');
		$state.go('login');
		return;
	}

	$scope.sendInvite = false;

	var errorHandler = function(er){
		if (!er) return;
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
	$scope.user.sendInvite = false;

	$scope.delete = function() {
		showLoader();
		Parse.Cloud.run('deleteUser',{
			identificator : $scope.user.id
		})
		.then(function(res){
			return user.destroy();	
		},errorHandler)
		.then(function(user){
			hideLoader();
			$uibModalInstance.dismiss({deleted : true});
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
		var errorFunc = function(er){
			console.log(er.message);
			$uibModalInstance.dismiss(er);
		};
		appFields.newCustomer.forEach(function(field){
			$scope.user.set(field,userFactory.entity[0].get(field));
		});

		var htmlBody = "Hello " + $scope.user.fullName + ",<br/><br/>"
					 + "You have been invited by " + $scope.user.company + " to use "
					 + "Invoice Unlimited as " + $scope.user.role + ".<br/>"
					 + "Please visit the <a href='http://invoicesunlimited.com/app/'>Link</a> and log in"
					 + "with your username and password listed below.<br/><br/>"
					 + "Username: " + $scope.user.username + "<br/>"
					 + "Password: " + $scope.user.password + "<br/><br/>"
					 + "Sent from Invoices Unlimited";

		debugger;

		$scope.user.save()
		.then(function(user){
			return roleFactory.addUser(user);
		},errorHandler)
		.then(function(role){
			debugger;
			if (!$scope.user.sendInvite) return Parse.Promise.as(true);
			debugger;
			return Parse.Cloud.run('sendMailgunHtml',{
				toEmail 	: $scope.user.email,
				fromEmail 	: "no-reply@invoicesunlimited.com",
				subject 	: 'Invoice Unlimited Login',
				html 		: htmlBody
			}).then(function(res) {
				return res;
			},function(e){
				return e;
			});
		},errorHandler)
		.then(function(res){
			$uibModalInstance.close($scope.user);
		},errorHandler);
	}

	$scope.closeModal = function(){
		$uibModalInstance.dismiss('Close');
	}

});