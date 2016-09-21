'use strict';

invoicesUnlimited.controller('UsersController',
	function($scope,$state,$uibModal,
			 $controller,$document,userFactory,
			 projectUserFactory,queryService,appFields,$q){

	var user = userFactory;

	if (!user.entity.length) {
		$state.go('login');
		return;
	}

	$controller('DashboardController',{$scope:$scope,$state:$state});

	$scope.users = [];

	hideLoader();

	$scope.deleteUser = function($index) {
		showLoader();
		var userObj = $scope.users[$index].get('userID');

		if (!userObj) return;

		Parse.Cloud.run('deleteUser',{
			identificator : userObj.id
		})
		.then(function(res){
			return $scope.users[$index].destroy();
		},function(e){
			console.log(e.message);
			hideLoader();
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

	$scope.editUser = function(id) {
		var modalInstance = $uibModal.open({
			animation 			: true,
			templateUrl 		: 'modal-user',
			controller 			: 'NewUserController',
			backdrop 			: true,
			appendTo 			: angular.element(document.querySelector('#view')),
			windowTemplateUrl 	: 'modal-window',
			resolve 			: {
				user : function() {
					return $scope.users[id];
				},
				method : function() {
					return 'update';
				},
				title : function() {
					return 'Edit user';
				}
			}
		});

		modalInstance.result.then(function(prUser){
			setObjectOperations({
				object 		: prUser,
				fields 		: appFields.projectUser
			});
			$scope.users[id] = prUser;
		},function(res){
			console.log('Dismiss modal');
			if (res && res.deleted) {
				$scope.users.splice(id,1);
			}
		});
	}

	$scope.createUser = function(){
		var modalInstance = $uibModal.open({
			animation 			: true,
			templateUrl 		: 'modal-user',
			controller 			: 'NewUserController',
			backdrop 			: true,
			appendTo 			: angular.element(document.querySelector('#view')),
			windowTemplateUrl 	: 'modal-window',
			resolve 			: {
				user : function() {
					var ctor = Parse.Object.extend(Parse.User);
					var obj = new ctor();
					setObjectOperations({
						object 		: obj,
						fields 		: appFields.user
					});
					return obj;
				},
				method 	: function(){
					return 'create';
				},
				title 	: function() {
					return 'Add User';
				}
			}
		});

		modalInstance.result.then(function(newUser){
			setObjectOperations({
				object 		: newUser,
				fields 		: appFields.user
			});
			var prUser = projectUserFactory
			.createNew({
				emailID 	 : newUser.email,
				role 		 : newUser.role,
				userName	 : newUser.username,
				country		 : newUser.country,
				title		 : newUser.fullName,
				organization : newUser.selectedOrganization,
				companyName  : newUser.company,
				userID 		 : userFactory.entity[0],//newUser,
				status 		 : 'Activated'
			}).then(function(res){
				$scope.$apply(function(){
					$scope.users.push(res);
				});
			},function(e){
				console.log(e.message);
			});
		},function(){
			console.log('Dismiss modal');
		});
	}

	$q.when(projectUserFactory.getAll()).then(function(users,arg2){
		$scope.users = users.map(function(el){
			setObjectOperations({
				object 		: el,
				fields 		: appFields.projectUser
			});
			return el;
		});
	});

});