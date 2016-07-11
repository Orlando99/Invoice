'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('SettingsController',['$scope','$state', '$controller', 'userFactory',
function($scope,$state,$controller, userFactory){

if(! userFactory.entity.length) {
	console.log('User not logged in');
	$state.go('login');
	return undefined;
}

var user = userFactory.entity[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

var isGoTo = {
	users : function(to){
		return to.endsWith('users');
	},
	currencies : function(to){
		return to.endsWith('currencies');
	},
	preferences : function(to){
		return to.endsWith('general-preferences');
	},
	payments : function(to){
		return to.endsWith('payments');
	},
	templates : function(to){
		return to.endsWith('invoice-templates');
	}
};

CheckUseCase();

function CheckUseCase(stateName) {
	if (! stateName)
		stateName = $state.current.name;

	if (isGoTo.users(stateName)) {
		console.log('its in users')
		showUserFields();

	} else if (isGoTo.currencies(stateName)) {
		console.log('its in currency');
	}

}

function showUserFields() {
	$scope.users = [{
		name : user.get('username'),
		email : user.get('email'),
		role : user.get('role'),
		status : 'Active',
		textClass : 'text-positive'
	}];
}

//	$scope.selectedColor;

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
/*
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
*/
}]);
