'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('SettingsController',['$scope','$state', '$controller', 'userFullFactory',
	function($scope,$state,$controller,userFullFactory){

	var user = userFullFactory.authorized();

	loadColorTheme(user);

	$scope.selectedColor;

	if (!userFullFactory.authorized()) $state.go('login');

	$controller('DashboardController',{$scope:$scope,$state:$state});
/*
	userFullFactory.loadAll(function(state){
		if (state) $state.go(state);
		else {
			$scope.$apply(function(){
				$scope.BusinessInfo.company = userFullFactory.get("BusinessInfo","businessName");
			});
		} 
	});
*/
	$scope.BusinessInfo = {
		company : userFullFactory.get("BusinessInfo","businessName")
	}

	$scope.saveAppPreferences = function(){
		var color = $(".colors li.active").find('a').attr('class');
		var colorToSave = "app" + color[0].toUpperCase() + color.slice(1) + "Color";
		userFullFactory.save({colorTheme:colorToSave}).then(function(){
			window.location.reload();
		});
	}	
}]);
