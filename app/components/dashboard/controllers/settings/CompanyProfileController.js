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
        
    $("#businessInfoForm").validate({
		onkeyup : function(element) {$(element).valid()},
		onfocusout : false,
		rules: {
			businessName : {
				required : true
			},
            streetName : {
				required : true
			},
            city : {
				required : true
			},
            state : {
				required : true
			},
			zipCode: {
				required : true,
				minlength : 5,
                digits : true
			},
            country : {
				required : true
			},
            phone : {
				required : true
			}
		},
		messages: {
			businessName : {
				required : "Please enter business name"
			},
            streetName : {
				required : "Please enter street name"
			},
            city : {
				required : "Please enter city"
			},
            state : {
				required : "Please enter state"
			},
			zipCode: {
				required : "Please enter zip code",
				minlength : "Please enter valid zip code",
                digits : "Please enter valid zip code"
			},
            country : {
				required : "Please enter country"
			},
            phone : {
				required : "Please enter phone"
			}
		}
	});
		
	$("#phoneForm").validate({
		onkeyup : function(element) {$(element).valid()},
		onfocusout : false,
		rules: {
			phoneNumber : {
				required : true
			}
		},
		messages: {
			phoneNumber : {
				required : "Please enter Phone Number"
			}
		}
	});
		
	//$('#phoneNumber').mask('(999) 999-9999');
	$('.phone').mask('(999) 999-9999');
        
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
        
    if(!user.get('EPNusername') || !user.get('EPNrestrictKey') || !user.get('merchantID')){
        $scope.enableBusinessInfo = true;
    }
    else{
        $scope.enableBusinessInfo = false;
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
    
    function getFileExtension(filename){
        return '.' + filename.split('.').pop();
    }
    
    $scope.saveBusiness = saveNow;
        
     function saveNow(){
         
         if($scope.enableBusinessInfo){
             if(!$("#businessInfoForm").valid()) return;
         } else {
			 if(!$("#phoneForm").valid())
				 return;
		 }
         
            showLoader();
         
         var promises = [];
         
         //if($scope.enableBusinessInfo)
            promises.push($scope.businessInfo.save());
         
         if($scope.newLogo){
            
            var parseFile = new Parse.File("logo" + getFileExtension($scope.newLogo.name), $scope.newLogo);
             
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
             showSnackbar("Save Successful. Reloading page in 3 sec...");
             setTimeout(function(){ window.location.reload(); }, 2000);
             //window.location.reload();
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
                    showSnackbar("Save Successful");
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
}]);
