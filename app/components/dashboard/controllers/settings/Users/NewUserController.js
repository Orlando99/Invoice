'use strict';

invoicesUnlimited.controller('NewUserController',
	function($scope,$state,userFactory,roleFactory,$controller,
		$q,$uibModalInstance,user,method,title,appFields,queryService){

	if (!userFactory.entity.length) {
		$uibModalInstance.dismiss('No signed in user');
		$state.go('login');
		return;
	}

	var errorHandler = function(er){
		if (!er) return;
		console.log(er);
		hideLoader();
		$uibModalInstance.dismiss(er.message);
	}

	$scope.user = user;
	$scope.user.status = user.status;
    $scope.mustInvite = user.mustInvite;
    
    
    
    $scope.oldUserName = user.username;
	setObjectOperations({
		object : $scope.user,
		fields : appFields.user
	});

	$scope.method = method;
	$scope.title = title;
	$scope.user.password = '';
	$scope.user.sendInvite = false;

    if($scope.mustInvite)
        $scope.user.sendInvite = true;
    
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
			//var ptr = Parse.User.createWithoutData(id);
			return queryService.ext.find({
				className  	: 'ProjectUser',
				field 		: 'userName',
				value 		: $scope.oldUserName,
				methods 	: [{name:'include',param:'userID'}]
			});
		},errorHandler)
		.then(function(res){
			if (!res.length) return Parse.Promise.as(false);
			return res[0].save({
				role 		: $scope.user.role,
				userName 	: $scope.user.username,
				title 		: $scope.user.fullName,
				emailID 	: $scope.user.email,
				status 		: $scope.user.status
			});
		},errorHandler)
		.then(function(user){
			hideLoader();
			$uibModalInstance.close(user);
		},errorHandler);
	}

	var prevEmail = '';
	$scope.save = function(){
		if (prevEmail != $scope.user.email) {
			prevEmail = $scope.user.email;
			$('input[id="newUserId"]')[0].setCustomValidity('');
		}

		var form = document.querySelector('.modal-content form');
		if (!form.checkValidity()) return;

		showLoader();
		$scope.user.set('password',$scope.user.password);
		$scope.user.set('colorTheme','appBlueColor');
		$scope.user.set('isTrackUsage',1);
		$scope.user.set('getInvoiceNotification',1);
		$scope.user.set('subscription',false);
        $scope.user.set('tutorial',1);

		appFields.newCustomer
		.forEach(function(field){
			$scope.user.set(field,userFactory.entity[0].get(field));
		});

		var htmlBody = "Hello " + $scope.user.fullName + ",<br/><br/>"
					 + "You have been invited by " + $scope.user.company + " to use "
					 + "Invoice Unlimited as " + $scope.user.role + ".<br/>"
					 + "Please visit the <a href='http://invoicesunlimited.net/app/'>Link</a> and log in "
					 + "with your username and password listed below.<br/><br/>"
					 + "Username: " + $scope.user.username + "<br/>"
					 + "Password: " + $scope.user.password + "<br/><br/>"
					 + "Sent from Invoices Unlimited";

		$scope.user.save()
		.then(function(user){
			return roleFactory.addUser(user);
		},function(error) {
			if(error.code == 203) {
				// email already taken
				var elem = $('input[id="newUserId"]')[0];
				elem.setCustomValidity(error.message);
				$('button[id="newUserSubmit"]').click();
			}
			hideLoader();
		})
		.then(function(role){
			if (!$scope.user.sendInvite) return Parse.Promise.as(true);
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
			hideLoader();
			$uibModalInstance.close($scope.user);
		},errorHandler);
	}

	$scope.closeModal = function(){
		$uibModalInstance.dismiss('Close');
	}

});