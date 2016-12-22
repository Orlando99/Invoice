'use strict';

$(document).ready(function(){

	$.validator.addMethod(
		"ConfirmPasswordMatch",
		function(value,element){
			return value == $("input[name='newPassword']").val();
		},''
	);

	$.validator.addMethod(
		"UserNameExists",
		function(value,element){
			return !parseInt($('#username-exists').val());
		},''
	);

});

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
                  $scope.$apply();

              },
              error: function(obj, error) {
                // The object was not retrieved successfully.
                // error is a Parse.Error with an error code and message.
              }
        });
    }
    else{
        $scope.tempLogo = $scope.userLogo;
    }
	var user = userFactory.entity[0];
    var organization1 = user.get("organizations")[0];

	if (!user) $state.go('login');
	else loadColorTheme(user);

        $controller('DashboardController',{$scope:$scope,$state:$state});
        
	hideLoader();

        
   $q.when(user.fetch()).then(function()
   { 

        $scope.UserInfo = {
            name 		: user.get("fullName"),
            email 		: user.get("email"),
            username 	: user.get("username")
        }
    });
        
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
        if(!(n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.PNG') || n.endsWith('.JPG') || n.endsWith('.JPEG'))){
            ShowMessage("Invalid file format!","error");
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
            showLoader();
        user.set('fullName',$scope.UserInfo.name);
        user.set( 'email',$scope.UserInfo.email);
        user.set('username',$scope.UserInfo.username);
         
         /*
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
        */
         
         var promises = [];
         
         promises.push(user.save());
         
         if($scope.newLogo){
            
            var parseFile = new Parse.File($scope.newLogo.name, $scope.newLogo);
             
             promises.push(parseFile.save()
                .then(function(obj){
                    $scope.org.set('logo', obj);
                    $scope.org.save()
                    .then(function(obj){
                        var logo = obj.get('logo');
                        $scope.userLogo = logo._url;
                        $scope.tempLogo = logo._url;
                        return Promise.Resolve('');
                    });
            }));
            
        }
        else if($scope.isDeleteLogo){
            $scope.org.unset('logo');
            promises.push($scope.org.save());
        }
         
         $q.all(promises)
         .then(function(){
             hideLoader();
             showSnackbar("Save Successful");
             window.location.reload();
         });
         
         /*
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
                $scope.userLogo = undefined;
                window.location.reload();
            });
        }
        else{
            window.location.reload();
        }
         */
    }
    $("#changePasswordForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules: {
			existingPassword : {
				required : true
			},
			newPassword: {
				required : true,
				minlength : 6
			}, //'required',
			confirmPassword: {
				required : true,
				ConfirmPasswordMatch : true
			}
		},
		messages: {
			existingPassword: {
				required : "Please enter existing password !",
				minlength : "Password should contain atleast 6 characters"
			},
			newPassword: {
				required : "Please enter new password !",
				minlength : "Password should contain atleast 6 characters"
			},
			confirmPassword: {
				required : "Please confirm password !",
				ConfirmPasswordMatch : "Passwords do not match!"
			}
		}
	});
    
    function resetPasswordForm(){
        $scope.existingPassword = '';
        $scope.newPassword = '';
        $scope.confirmPassword = '';
    }
    
    $scope.showModal = function(){
        $('#changePasswordModal').show();
    }
    $scope.closeModal = function(){
        $('#changePasswordModal').hide();
        resetPasswordForm();
    }
    
    $scope.updatePassword = function(){
        if(!$("#changePasswordForm").valid()) return;
        showLoader();
        Parse.User.logIn(userFactory.entity[0].username, $scope.existingPassword,{
				success: function(obj){
					obj.set('password', $scope.newPassword)
                    obj.save()
                    .then(function(){
                        $('#changePasswordModal').hide();
                        resetPasswordForm();
                        hideLoader();
                    });
				},
				error: function(user,error){
					console.log(error.message);
                    hideLoader();
					ShowMessage("Incorrect Existing Password!","error");
				}
			});
        
    }

	/*
	$q.all([organizationFactory]).then(function(res){
		$scope.org = res[0];
	});
    */
}]);
