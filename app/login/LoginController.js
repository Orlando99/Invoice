'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('LoginController',['$scope','$state','userFactory',
	function($scope,$state,userFactory){

	$scope.username = "";
	$scope.password = "";

	if (userFactory.authorized()) {
		var business = userFactory.getBusinessInfo('promise');
		var principal = userFactory.getPrincipalInfo('promise');

		Parse.Promise.when([business,principal]).then(function(bus,princ){
			debugger;
			if (bus,princ) $state.go('dashboard');
			else if (bus) $state.go('signup.principal-info');
			else $('.errorMessage').html("This account is not complete!").show();
		},function(err){
			if (err.length == 2) {
				if (err[0].code == 101 && err[1].code == 101) {
					$('.errorMessage').html("This account is not complete!").show();
					userFactory.logout();
				}
			}
		});
	}

	$scope.signUpAction = function(){
		$state.go('signup');
	}

	$scope.signInAction = function(){
		debugger;
		userFactory.login({
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
