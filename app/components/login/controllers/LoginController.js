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

	if ($state.params.errorMsg) {
		showError($state.params.errorMsg);
		hideLoader();
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

			var firstScreen = user.entity[0].get('firstScreen');
			switch(firstScreen) {
			case 'Overview': 		  $state.go('dashboard'); break;
			case 'Customer List': 	  $state.go('dashboard.customers.all'); break;
			case 'Invoices List': 	  $state.go('dashboard.sales.invoices.all'); break;
			case 'Expense List': 	  $state.go('dashboard.expenses.all'); break;
			case 'Estimate List': 	  $state.go('dashboard.sales.estimates.all'); break;
			case 'Credit Notes List': $state.go('dashboard.sales.creditnotes.all'); break;
			case 'Reports': 		  $state.go('dashboard.reports'); break;
			case 'Settings': 		  $state.go('dashboard.settings.company-profile'); break;
			default: 				  $state.go('dashboard'); break;
			}
		},function(error){
			hideLoader();
			$('.errorMessage').html(error.message.capitilize()).show();
			$('.input-container').css({'border':'1px solid red'});
			//$('.input-container input').val('');
		});
	}

	$scope.sendPasswordResetLink = function() {
		if(! $scope.email) {
			showError('Please enter email address.');
			return;
		}

		showLoader();
		Parse.User.requestPasswordReset($scope.email)
		.then(function() {
			showSuccess('Reset Password Link sent to specified email.');
			hideLoader();
		}, function(error) {
			showError(error.message);
			hideLoader();
		});
	}

	function showError(msg) {
		$('.successMessage').html('').hide();
		$('.errorMessage').html(msg).show();
		$('.input-container').css({'border':'1px solid red'});
	}

	function showSuccess(msg) {
		$('.errorMessage').html('').hide();
		$('.successMessage').html(msg).show();
		$('.input-container').css({'border':''});
	}

}]);
