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

	var query = queryService.find({
		className 	: 'User',
		field 		: 'company',
		value 		: user.entity[0].company
	});


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

		modalInstance.result.then(function(user){
			setObjectOperations({
				object 		: user,
				fields 		: appFields.user
			});
			$scope.users[id] = user;
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

		modalInstance.result.then(function(user){
			setObjectOperations({
				object 		: user,
				fields 		: appFields.user
			});
			var prUser = projectUserFactory
			.createNew({
				emailID 	 : user.email,
				role 		 : user.role,
				userName	 : user.username,
				country		 : user.country,
				title		 : user.fullName,
				organization : user.selectedOrganization,
				companyName  : user.company,
				userID 		 : user
			}).then(function(res){
				$scope.users = res;
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