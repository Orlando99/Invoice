'use strict';

invoicesUnlimited.controller('UsersController',
	function($scope,$state,$uibModal,$controller,$document,userFactory,queryService,appFields,$q){

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
				}
			}
		});

		modalInstance.result.then(function(user){
			setObjectOperations({
				object 		: user,
				fields 		: appFields.user
			});
			$scope.users.push(user);
		},function(){
			console.log('Dismiss modal');
		})
	}

	$q.when(query).then(function(users,arg2){

		users.forEach(function(el){
			setObjectOperations({
				object 		: el,
				fields 		: appFields.user
			});
			el.status = 'Active';
		});
		$scope.users = users;
	})

});