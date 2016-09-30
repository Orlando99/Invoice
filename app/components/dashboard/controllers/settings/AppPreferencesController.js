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

        if(fromTutorial){
            $('.tutorial').show();
        }
        else{
            $('.tutorial').hide();
        }
        
	$scope.openingScreens = ['Overview', 'Customer List',
		'Invoices List', 'Expense List', 'Estimate List', 'Credit Notes List',
		'Reports', 'Settings'];

	$scope.selectedScreen = user.entity[0].get('firstScreen');
    if(user.entity[0].get('isTrackUsage')) $scope.trackUsage = true;

	$scope.saveAppPreferences = function(){
		showLoader();
		var color = $(".colors li.active").find('a').attr('class');
		var colorToSave = "app" + color[0].toUpperCase() + color.slice(1) + "Color";
		userFactory.save({colorTheme:colorToSave, firstScreen:$scope.selectedScreen, isTrackUsage:$scope.trackUsage?1:0}).then(function(){
            hideLoader();
            if(fromTutorial){
                $state.go('dashboard.settings.taxes');
            }
            else{
                window.location.reload();
                hideLoader();
            }
		});
	}
    
    $scope.nextClicked = function(){
        $('.tutorial').hide();
    }
	
}]);
