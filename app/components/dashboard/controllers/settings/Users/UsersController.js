'use strict';

invoicesUnlimited.controller('UsersController',
	function($scope,$state,$uibModal,$controller,userFactory,queryService,appFields,$q){

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