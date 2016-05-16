'use strict';

invoicesUnlimited.controller('CompanyProfileController',['$scope','$state','userFactory',
	function($scope,$state,userFactory){

	var user = userFactory.authorized();

	if (!user) $state.go('login');
	else loadColorTheme(user);

	userFactory.loadAll(function(state){
		if (state) $state.go(state);
		else {
			$scope.$apply(function(){
				$scope.BusinessInfo.company = userFactory.get("BusinessInfo","businessName");
				$scope.BusinessInfo.street = userFactory.get("BusinessInfo","streetName");
				$scope.BusinessInfo.city = userFactory.get("BusinessInfo","city");
				$scope.BusinessInfo.state = userFactory.get("BusinessInfo","state");
				$scope.BusinessInfo.zipCode = userFactory.get("BusinessInfo","zipCode");
			});
		} 
	});

	//debugger;

	$scope.UserInfo = {
		name 		: user.get("fullName"),
		email 		: user.get("email"),
		username 	: user.get("username")
	}

	$scope.BusinessInfo = {
		company : userFactory.get("BusinessInfo","businessName"),
		street	: userFactory.get("BusinessInfo","streetName"),
		city	: userFactory.get("BusinessInfo","city"),
		state	: userFactory.get("BusinessInfo","state"),
		zipCode : userFactory.get("BusinessInfo","zipCode")
	}

	$scope.saveAppPreferences = function(){
		var color = $(".colors li.active").find('a').attr('class');
		var colorToSave = "app" + color[0].toUpperCase() + color.slice(1) + "Color";
		userFactory.save({colorTheme:colorToSave}).then(function(){
			window.location.reload();
		});
	}	
}]);
