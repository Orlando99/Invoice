'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('DashboardController',['$scope','$state',function($scope,$state){

	var currentUser = Parse.User.current();

	if (!currentUser) $state.go('signup');
	
}]);
