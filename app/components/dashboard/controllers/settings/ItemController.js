'use strict';

invoicesUnlimited.controller('ItemController',['$scope', '$state', '$controller', '$q',
	'userFactory', 'coreFactory',
	function($scope,$state,$controller,$q,userFactory, coreFactory){

	if(! userFactory.entity.length) {
		console.log('User not logged in');
		return undefined;
	}

	var user = userFactory.entity[0];
	$controller('DashboardController',{$scope:$scope,$state:$state});
	initalizeModalClasses();

	loadItems();

	function loadItems() {
		showLoader();
		var organization = user.get("organizations")[0];
		$q.when(coreFactory.getAllItems({
			organization : organization
		}))
		.then(function(items) {
			$scope.items = items;
			hideLoader();

		}, function(error) {
			console.log(error.message);
			hideLoader();

		});
	}

//----
/*
	if (user.get('colorTheme')) {
		var color = user.get('colorTheme');
		if (color) color = color.replace(/app|Color/g,"").toLowerCase();
		if (color) $('.colors li a.'+color).parent().addClass("active");
	}

	$scope.saveAppPreferences = function(){
		var color = $(".colors li.active").find('a').attr('class');
		var colorToSave = "app" + color[0].toUpperCase() + color.slice(1) + "Color";
		userFullFactory.save({colorTheme:colorToSave}).then(function(){
			window.location.reload();
		});
	}
*/	
}]);
