'use strict';

invoicesUnlimited.controller('AppPreferencesController',['$scope','$state','$controller','userFullFactory','businessFactory',
	function($scope,$state,$controller,userFullFactory,businessFactory){

	var user = userFullFactory.authorized();

	$controller('DashboardController',{$scope:$scope,$state:$state});
	
	loadColorTheme(user);

	if (user.get('colorTheme')) {
		var color = user.get('colorTheme');
		if (color) color = color.replace(/app|Color/g,"").toLowerCase();
		if (color) $('.colors li a.'+color).parent().addClass("active");
	}

	$scope.saveAppPreferences = function(){
		showLoader();
		var color = $(".colors li.active").find('a').attr('class');
		var colorToSave = "app" + color[0].toUpperCase() + color.slice(1) + "Color";
		userFullFactory.save({colorTheme:colorToSave}).then(function(){
			window.location.reload();
			hideLoader();
		});
	}
	
}]);
