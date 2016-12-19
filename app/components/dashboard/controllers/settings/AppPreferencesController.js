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
        
    if(!$scope.userLogo){
        var selectedorganization = userFactory.entity[0].get("selectedOrganization");
        var query = new Parse.Query('Organization');
        query.get(selectedorganization.id, {
              success: function(obj) {
                  $scope.org = obj;
                  var logo = obj.get('logo');
                  if(logo){
                    $scope.userLogo = logo._url;
                  }
                  else{
                      $scope.userLogo = './assets/images/user-icon.png';
                  }
                  $scope.$apply();

              },
              error: function(obj, error) {
                // The object was not retrieved successfully.
                // error is a Parse.Error with an error code and message.
              }
        });
    }
	hideLoader();

        if(fromTutorial){
            $('.tutorial').show();
        }
        else{
            $('.tutorial').hide();
        }
        
	$scope.openingScreens = ['Dashboard', 'Customer List',
		'Invoices List', 'Expense List', 'Estimate List', 'Credit Notes List',
		'Reports', 'Settings'];

	$scope.selectedScreen = user.entity[0].get('firstScreen');
    if(user.entity[0].get('isTrackUsage')) $scope.trackUsage = true;

	$scope.showConfirmationPopUp = function(){
         $('.confirmation-pop-up').addClass('show');
	}
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
                showSnackbar("Preferences Saved Successfully")
                window.location.reload();
                hideLoader();
            }
		});
    }
    $scope.nextClicked = function(){
        $('.tutorial').hide();
    }
	
}]);
