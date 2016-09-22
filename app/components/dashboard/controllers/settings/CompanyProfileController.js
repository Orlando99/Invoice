'use strict';

invoicesUnlimited.controller('CompanyProfileController',
	['$scope','$state','$controller','userFactory','organizationFactory','businessFactory','$q',
	function($scope,$state,$controller,userFactory,organizationFactory,businessFactory,$q){

	if(! userFactory.entity.length) {
		console.log('User not logged in');
		return undefined;
	}
	var user = userFactory.entity[0];
    var organization1 = user.get("organizations")[0];

	if (!user) $state.go('login');
	else loadColorTheme(user);

	hideLoader();

	$scope.UserInfo = {
		name 		: user.get("fullName"),
		email 		: user.get("email"),
		username 	: user.get("username")
	}

	$scope.org;

	$scope.saveAppPreferences = function(){
		var color = $(".colors li.active").find('a').attr('class');
		var colorToSave = "app" + color[0].toUpperCase() + color.slice(1) + "Color";
		userFactory.save({colorTheme:colorToSave}).then(function(){
			window.location.reload();
		});
	}
    
    $scope.saveBusiness = saveNow;
    
    function saveNow(){
        if(!$scope.businessInfo){
            businessFactory.createNew({
                    businessName : $scope.bsnsInfo.businessName,
                    streetName : $scope.bsnsInfo.streetName,
                    city        : $scope.bsnsInfo.city,
                    state       : $scope.bsnsInfo.state,
                    zipCode     : $scope.bsnsInfo.zipCode,
                    organization: organization1,
                    userID      : user
                }).then(function(obj){
                user.set('businessInfo', obj);
                $q.when(user.save())
                .then(function(){
                    $state.go('dashboard.settings.company-profile');
                });
            });
        }
    }

	$controller('DashboardController',{$scope:$scope,$state:$state});
	$q.all([organizationFactory]).then(function(res){
		$scope.org = res[0];
	});
}]);
