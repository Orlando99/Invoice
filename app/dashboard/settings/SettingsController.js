'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('SettingsController',['$scope','$state','userFactory',
	function($scope,$state,userFactory){

	if ($state.current.name == "dashboard.settings.app-preferences") {
		if (typeof(Storage) !== "undefined") {
		  	localStorage.removeItem('selectedAppColor');
		  	var color = localStorage.getItem('applicationColor');
		  	if (color && color != 'blue' && color != 'undefined') {
		  	  	$('#appStyle').attr('href','./dist/css/main.' + color + '.css');
		  	}
		  	if (color) $('.colors li a.'+color).parent().addClass("active");
		} else {
		  	alert("No local storage");
		}
	}

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

	$scope.logOut = function(){
		userFactory.logout(function(){
			$state.go('login');
		});
	};
	
}]);
