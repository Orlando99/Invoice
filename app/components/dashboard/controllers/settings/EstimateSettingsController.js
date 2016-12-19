'use strict';

invoicesUnlimited.controller('EstimateSettingsController',['$q' ,'$scope', '$state', '$controller',
	'userFactory', 'estimateService',
	
function($q, $scope, $state, $controller, userFactory, estimateService) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}
var user = userFactory.entity[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

loadEstimatePrefs();

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

function setValidationRules() {
	$('.check-name').each(function() {
		$(this).rules ('remove');
		$(this).rules('add', {
			required : true,
			messages : {
				required : 'Please provide field name'
			}
		});
	});
}

function loadEstimatePrefs() {
	showLoader();
	$q.when(estimateService.getPreferences(user))
	.then(function(prefs) {
		$scope.prefs = prefs;
		console.log(prefs);

		$scope.estimateAg   = (prefs.numAutoGen == 1 ? 'yes' : 'no');
		$scope.notes = prefs.notes;
		$scope.terms = prefs.terms;

		var arr = prefs.estimateNumber.split('-');
		$scope.prefix = arr[0];
		$scope.nxtNumber = arr[1];
		$scope.customFields = prefs.customFields || [];

		$scope.customFields.forEach(function(field) {
			field.checked = field.isChecked == 'YES' ? true : false;
		});
		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

$scope.removeField = function(index) {
	if($scope.customFields.length > 0) {
		$scope.customFields.splice(index,1);
	}
}

$scope.addField = function() {
	$scope.customFields.push({
		name : '',
		isChecked : '',
		checked : false
	});
}

$scope.save = function() {
	setValidationRules();
	if (! $('#settingsForm').valid()) {
		var v = $('#settingsForm').validate();
		var offset = $(v.errorList[0].element).offset().top - 30;
		scrollToOffset(offset);
		return;	
	}

	showLoader();
	var prefs = {
		estimateAg : ($scope.estimateAg == 'yes' ? 1 : 0),
		notes : $scope.notes,
		terms : $scope.terms,
	}

	if($scope.estimateAg == 'yes') {
		prefs.estimateNumber = [$scope.prefix, $scope.nxtNumber].join('-');
	}

	var newFields = [];
	$scope.customFields.forEach(function(field) {
		field.isChecked = field.checked ? 'YES' : 'NO';
		delete field.checked;
		
		newFields.push({
			isChecked : field.isChecked,
			name : field.name
		});
	});
	prefs.customFields = newFields;

//	console.log(prefs);

	$q.when(estimateService.setPreferences(user, prefs))
	.then(function() {
        showSnackbar('Save Successful');
		console.log('estimate prefs updated.');
		$state.reload();
		hideLoader();

	}, function(error) {
		console.log(error.message);
		hideLoader();
	});

}

}]);