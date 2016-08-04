'use strict';

invoicesUnlimited.controller('CreditNoteSettingsController',['$q' ,'$scope', '$state', '$controller',
	'userFactory', 'creditNoteService',
	
function($q, $scope, $state, $controller, userFactory, creditNoteService) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}
var user = userFactory.entity[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

loadCreditNotePrefs();

$('#settingsForm').validate({
	rules: {
		prefix : 'required',
		nextNumber : {
			required : true,
			digits : true,
			min : 1
		}
	}
});

function loadCreditNotePrefs() {
	showLoader();
	$q.when(creditNoteService.getPreferences(user))
	.then(function(prefs) {
		$scope.prefs = prefs;
		console.log(prefs);

		$scope.creditAg   = (prefs.numAutoGen == 1 ? 'yes' : 'no');
		$scope.notes = prefs.notes;
		$scope.terms = prefs.terms;

		var arr = prefs.creditNumber.split('-');
		$scope.prefix = arr[0];
		$scope.nxtNumber = arr[1];

		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

$scope.save = function() {
	if (! $('#settingsForm').valid()) {
		var v = $('#settingsForm').validate();
		var offset = $(v.errorList[0].element).offset().top - 30;
		scrollToOffset(offset);
		return;	
	}

	showLoader();
	var prefs = {
		creditAg : ($scope.creditAg == 'yes' ? 1 : 0),
		notes : $scope.notes,
		terms : $scope.terms,
	}

	if($scope.creditAg == 'yes') {
		prefs.creditNumber = [$scope.prefix, $scope.nxtNumber].join('-');
	}

//	console.log(prefs);

	$q.when(creditNoteService.setPreferences(user, prefs))
	.then(function() {
		console.log('creditNote prefs updated.');
		$state.reload();
		hideLoader();

	}, function(error) {
		console.log(error.message);
		hideLoader();
	});

}

}]);