'use strict';

invoicesUnlimited.controller('UsersController',
	function($scope,$state,$uibModal,
			 $controller,$document,userFactory,
			 projectUserFactory,queryService,appFields,$q){

	var user = userFactory;

	$scope.users = [];

	if (!user.entity.length) {
		$state.go('login');
		return;
	}

	$controller('DashboardController',{$scope:$scope,$state:$state});

	$scope.deleteUser = function($index) {
		showLoader();
		Parse.Cloud.run('deleteUser',{
			identificator : $scope.users[$index].id
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
		},function(){
			console.log('Dismiss modal');
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
				userID 		 : newUser
			}).then(function(res){
				debugger;
				$scope.users.push(res);
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