'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('DashboardController',['$scope','$state','userFactory',
	function($scope,$state,userFactory){

	if (!userFactory.authorized()) $state.go('signup');
	
}]);
