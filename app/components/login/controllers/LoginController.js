'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('LoginController',['$scope','$state','userFullFactory','userFactory',
	function($scope,$state,userFullFactory,userFactory){

	$scope.username = "";
	$scope.password = "";

	var user = userFactory;

	if (user.entity.length) {
		$state.go('dashboard');
		return;
	}

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
