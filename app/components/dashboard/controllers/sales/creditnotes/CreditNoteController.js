'use strict';

invoicesUnlimited.controller('CreditNoteController',['$scope', '$state', '$controller',
	'userFullFactory', 'creditNoteFactory',
	function($scope,$state,$controller,userFullFactory,creditNoteFactory){

	var user = userFullFactory.authorized();
	$controller('DashboardController',{$scope:$scope,$state:$state});
	loadColorTheme(user);

	var promise = creditNoteFactory.getCreditNotes(user);
	promise.then(function(creditNotes) {
		console.log(creditNotes);
		$scope.creditNotes = creditNotes;

	}, function(error) {
		console.log(error.message);
	});

}]);
