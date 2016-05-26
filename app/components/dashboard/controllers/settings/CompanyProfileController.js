'use strict';

invoicesUnlimited.controller('CompanyProfileController',
	['$scope','$state','$controller','userFactory','organizationFactory','$q',
	function($scope,$state,$controller,userFactory,organizationFactory,$q){

	var user = userFactory.authorized();

	if (!user) $state.go('login');
	else loadColorTheme(user);

	$scope.UserInfo = {
		name 		: user.get("fullName"),
		email 		: user.get("email"),
		username 	: user.get("username")
	}

	$scope.org;

	$scope.saveAppPreferences = function(){
		var color = $(".colors li.active").find('a').attr('class');
		var colorToSave = "app" + color[0].toUpperCase() + color.slice(1) + "Color";
		userFactory.save({colorTheme:colorToSave}).then(function(){
			window.location.reload();
		});
	}

	$controller('DashboardController',{$scope:$scope,$state:$state});
	$q.all([organizationFactory]).then(function(res){
		$scope.org = res[0];
	});
}]);