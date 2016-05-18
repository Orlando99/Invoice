'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('LoginController',['$scope','$state','userFullFactory',
	function($scope,$state,userFullFactory){

	$scope.username = "";
	$scope.password = "";

	if (userFullFactory.authorized()) {
		var business = userFullFactory.getBusinessInfo('promise');
		var principal = userFullFactory.getPrincipalInfo('promise');

		Parse.Promise.when([business,principal]).then(function(bus,princ){
			if (bus,princ) {
				loadColorTheme(userFullFactory.authorized());
				$state.go('dashboard');
			}
			else if (bus) $state.go('signup.principal-info');
			else $('.errorMessage').html("This account is not complete!").show();
		},function(err){
			if (err.length == 2) {
				if (err[0].code == 101 && err[1].code == 101) {
					$('.errorMessage').html("This account is not complete!").show();
					userFullFactory.logout();
				}
			}
		});
	}

	$scope.signUpAction = function(){
		$state.go('signup');
	}

	$scope.signInAction = function(){
		debugger;
		userFullFactory.login({
			username : $scope.username,
			password : $scope.password
		},function(){
			$('.errorMessage').html('').hide();
			$state.go('dashboard');
		},function(error){
			$('.errorMessage').html(error.capitilize()).show();
			$('.input-container').css({'border':'1px solid red'});
			//$('.input-container input').val('');
		});
	}

}]);
