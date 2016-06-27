'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('LoginController',['$scope','$state','userFullFactory','userFactory',
	function($scope,$state,userFullFactory,userFactory){

	$scope.username = "";
	$scope.password = "";

	var user = userFactory;

	/*if (user) {

		var business = user.get('businessInfo');//userFullFactory.getBusinessInfo('promise');
		var principal = user.get('principalInfo');//userFullFactory.getPrincipalInfo('promise');

		Parse.Promise.when([
			business  ? business.fetch()  : business,
			principal ? principal.fetch() : principal])
		.then(function(bus,princ){
			if (bus,princ) {
				loadColorTheme(user);
				$state.go('dashboard');
			}
			else if (bus) $state.go('signup.principal-info');
			else $('.errorMessage').html("This account is not complete!").show();
		},function(err){
			if (err.length == 2) {
				if (err[0].code == 101 && 
					err[1].code == 101) {
					$('.errorMessage').html("This account is not complete!").show();
					//userFullFactory.logout();
					user.logout();
				}
			}
		});
	}*/

	$scope.signUpAction = function(){
		$state.go('signup');
	}

	$scope.signInAction = function(){
		showLoader();
		//userFullFactory.login({
		user.login({
			username : $scope.username,
			password : $scope.password
		},function(){
			$('.errorMessage').html('').hide();
			$state.go('dashboard');
		},function(error){
			//hideLoader();
			$('.errorMessage').html(error.message.capitilize()).show();
			$('.input-container').css({'border':'1px solid red'});
			//$('.input-container input').val('');
		});
	}

}]);
