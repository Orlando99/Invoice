'use strict';

invoicesUnlimited.controller('AppPreferencesController',['$scope','$state','$controller','userFactory','businessFactory',
	function($scope,$state,$controller,userFactory,businessFactory){

	var user = userFactory.authorized();

	$scope.businessInfo;

	if (!businessFactory.id) {
		businessFactory.then(function(busObj){
			$scope.businessInfo = busObj;
		});
	}

	loadColorTheme(user);

	if (user.get('colorTheme')) {
		var color = user.get('colorTheme');
		if (color) color = color.replace(/app|Color/g,"").toLowerCase();
		if (color) $('.colors li a.'+color).parent().addClass("active");
	}

	$scope.saveAppPreferences = function(){
		var color = $(".colors li.active").find('a').attr('class');
		var colorToSave = "app" + color[0].toUpperCase() + color.slice(1) + "Color";
		userFactory.save({colorTheme:colorToSave}).then(function(){
			window.location.reload();
		});
	}
	
}]);
