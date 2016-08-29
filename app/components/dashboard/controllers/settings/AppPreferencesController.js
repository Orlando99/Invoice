'use strict';

invoicesUnlimited.controller('AppPreferencesController',
	['$scope','$state','$controller','userFactory','businessFactory',
	function($scope,$state,$controller,userFactory,businessFactory){

	var user = userFactory;
	$controller('DashboardController',{$scope:$scope,$state:$state});

	if (user.entity[0].get('colorTheme')) {
		var color = user.entity[0].get('colorTheme');
		if (color) color = color.replace(/app|Color/g,"").toLowerCase();
		if (color) $('.colors li a.' + color).parent().addClass("active");
	}
	hideLoader();

	$scope.openingScreens = ['Overview', 'Customer List',
		'Invoices List', 'Expense List', 'Estimate List', 'Credit Notes List',
		'Reports', 'Settings'];

	$scope.selectedScreen = user.entity[0].get('firstScreen');

	$scope.saveAppPreferences = function(){
		showLoader();
		var color = $(".colors li.active").find('a').attr('class');
		var colorToSave = "app" + color[0].toUpperCase() + color.slice(1) + "Color";
		userFactory.save({colorTheme:colorToSave, firstScreen:$scope.selectedScreen}).then(function(){
			window.location.reload();
			hideLoader();
		});
	}
	
}]);
