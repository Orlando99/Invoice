'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('SettingsController',['$scope','$state','userFactory',
	function($scope,$state,userFactory){

	var user = userFactory.authorized();

	loadColorTheme(user);

	$scope.selectedColor;

	/*if ($state.current.name == "dashboard.settings.app-preferences") {

		if (user.get('colorTheme')) {
			var color = user.get('colorTheme');
			if (color) color = color.replace(/app|Color/g,"").toLowerCase();
			if (color) $('.colors li a.'+color).parent().addClass("active");	
		}
	}*/

	if (!userFactory.authorized()) $state.go('login');

	userFactory.loadAll(function(state){
		if (state) $state.go(state);
		else {
			$scope.$apply(function(){
				$scope.BusinessInfo.company = userFactory.get("BusinessInfo","businessName");
			});
		} 
	});

	$scope.BusinessInfo = {
		company : userFactory.get("BusinessInfo","businessName")
	}

	$scope.saveAppPreferences = function(){
		var color = $(".colors li.active").find('a').attr('class');
		var colorToSave = "app" + color[0].toUpperCase() + color.slice(1) + "Color";
		userFactory.save({colorTheme:colorToSave}).then(function(){
			window.location.reload();
		});
	}

	/*$scope.logOut = function(){
		userFactory.logout(function(){
			$state.go('login');
		});
	};*/
	
}]);
