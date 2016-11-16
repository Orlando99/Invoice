'use strict';

invoicesUnlimited.controller('CompanyProfileController',
	['$scope','$state','$controller','userFactory','organizationFactory','businessFactory','$q',
	function($scope,$state,$controller,userFactory,organizationFactory,businessFactory,$q){

	if(! userFactory.entity.length) {
		console.log('User not logged in');
		return undefined;
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
                        $scope.tempLogo = logo._url;
                      }
                      else{
                          $scope.userLogo = './assets/images/user-icon.png';
                          $scope.tempLogo = undefined;
                      }

                  },
                  error: function(obj, error) {
                    // The object was not retrieved successfully.
                    // error is a Parse.Error with an error code and message.
                  }
            });
        }
        else{
            $scope.tempLogo = logo._url;
        }
	var user = userFactory.entity[0];
    var organization1 = user.get("organizations")[0];

	if (!user) $state.go('login');
	else loadColorTheme(user);

        $controller('DashboardController',{$scope:$scope,$state:$state});
        
	hideLoader();

	$scope.UserInfo = {
		name 		: user.get("fullName"),
		email 		: user.get("email"),
		username 	: user.get("username")
	}

	$scope.removeLogo = function(){
        
        $scope.isDeleteLogo = true;
        $scope.tempLogo = undefined;
        $scope.$apply();
    }

	$scope.saveAppPreferences = function(){
		var color = $(".colors li.active").find('a').attr('class');
		var colorToSave = "app" + color[0].toUpperCase() + color.slice(1) + "Color";
		userFactory.save({colorTheme:colorToSave}).then(function(){
			window.location.reload();
		});
	}
    
    $scope.addNewLogo = function(obj){
        
        var n = obj.files[0].name;
        
        if(!(n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg'))){
            $('#file-error').show();
            return;
        }
        
        var reader = new FileReader();
            
            reader.onload = function (e) {
                $scope.tempLogo = e.target.result;
                $scope.$apply();
            }
            
            reader.readAsDataURL(obj.files[0]);
        $scope.newLogo = obj.files[0];
        //$scope.tempLogo = obj.files[0];
        
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
                    //$state.go('dashboard.settings.company-profile');
                });
            });
        }
        
        if($scope.newLogo){
            showLoader();
            var parseFile = new Parse.File($scope.newLogo.name, $scope.newLogo);
            parseFile.save()
            .then(function(obj){
                $scope.org.set('logo', obj);
                $scope.org.save()
                .then(function(obj){
                    hideLoader();
                     window.location.reload();
                });
            });
        }
        else if($scope.isDeleteLogo){
            $scope.org.unset('logo');
            $scope.org.save()
            .then(function(obj){
                window.location.reload();
            });
        }
        else{
            window.location.reload();
        }
    }

	/*
	$q.all([organizationFactory]).then(function(res){
		$scope.org = res[0];
	});
    */
}]);
