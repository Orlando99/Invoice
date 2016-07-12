'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('SettingsController',['$q','$scope','$state', '$controller',
	'userFactory', 'coreFactory',
function($q,$scope,$state,$controller, userFactory, coreFactory){

if(! userFactory.entity.length) {
	console.log('User not logged in');
	$state.go('login');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

var isGoTo = {
	users : function(to){
		return to.endsWith('users');
	},
	currencies : function(to){
		return to.endsWith('currencies');
	},
	general : function(to){
		return to.endsWith('general-preferences');
	},
	payments : function(to){
		return to.endsWith('payments');
	},
	templates : function(to){
		return to.endsWith('invoice-templates');
	}
};

CheckUseCase();

function CheckUseCase(stateName) {
	if (! stateName)
		stateName = $state.current.name;

	if (isGoTo.users(stateName)) {
		console.log('its in users')
		showUserFields();

	} else if (isGoTo.currencies(stateName)) {
		console.log('its in currency');

	} else if (isGoTo.templates(stateName)) {
		console.log('select invoice template');
		loadInvoiceTemplates();

	} else if (isGoTo.general(stateName)) {
		console.log('in general preferences')
		loadGeneralSettings();
	}

}

//------ Users Settings ------
function showUserFields() {
	$scope.users = [{
		name : user.get('username'),
		email : user.get('email'),
		role : user.get('role'),
		status : 'Active',
		textClass : 'text-positive'
	}];
}

//------ General Preferences Settings ------
function loadGeneralSettings() {
	showLoader();
	$scope.timeZones = {
		timeZones : ['( PDT ) America/Los_Angeles ( Pacific Standard Time )',
			'( GMT 5:00 ) Asia/Karachi ( Pakistan Standard Time )'],
		selectedTimeZone : ''
	};

	$scope.months = {
		months : ['January', 'February', 'March', 'April',
			'May', 'June', 'July', 'August', 'September',
			'October', 'November', 'December'],
		selectedMonth : ''
	};

	$scope.dateFormats = {
		formats : ['dd/MM/yy', 'MM/dd/yy', 'yy/MM/dd',
			'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy/MM/dd',
			'dd MMM yyyy', 'EEE, MMMM dd, yyyy',
			'EEEE, MMMM dd, yyyy', 'MMM dd, yyyy',
			'MMMM dd, yyyy', 'yyyy MM dd'],
		selectedFormat : ''
	};

	$scope.fieldSeparators = {
		separators : ['/', '.', ',', '-'],
		selectedSeparator : ''
	};

	$q.when(coreFactory.getGeneralPrefs(user))
	.then(function(prefs) {
		var timeZone = prefs.get('timeZone');
		var month = prefs.get('fiscalYearStart');
		var format = prefs.get('dateFormat');
		var separator = prefs.get('fieldSeparator');

		$scope.timeZones.selectedTimeZone =
		$scope.timeZones.timeZones.filter(function(z) {
			return z == timeZone;
		})[0];

		$scope.months.selectedMonth =
		$scope.months.months.filter(function(m) {
			return m == month;
		})[0];

		$scope.dateFormats.selectedFormat =
		$scope.dateFormats.formats.filter(function(f) {
			return f == format;
		})[0];

		$scope.fieldSeparators.selectedSeparator =
		$scope.fieldSeparators.separators.filter(function(s) {
			return s == separator;
		})[0];

		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

$scope.setDefaultPrefs = function() {
	showLoader();
	organization.set('timeZone', $scope.timeZones.selectedTimeZone);
	organization.set('fiscalYearStart', $scope.months.selectedMonth);
	organization.set('dateFormat', $scope.dateFormats.selectedFormat);
	organization.set('fieldSeparator', $scope.fieldSeparators.selectedSeparator);

	organization.save().then(function() {
		hideLoader();
		console.log('general preferences are saved.')

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

//------ Invoice Template Settings ------
function loadInvoiceTemplates() {
	$q.when(coreFactory.getInvoiceTemplates())
	.then(function(templateObjs) {
		var defaultTemplate = user.get('defaultTemplate');
		
		var templates = [];
		templateObjs.forEach(function(t) {
			var obj = {
				entity : t,
				name : t.get('name'),
				url : t.get('templatePreview').url()
			}
			if (!defaultTemplate && obj.name == 'Template 1')
				obj.isDefault = true;
			else
				obj.isDefault = (defaultTemplate.id == t.id ? true : false);

			templates.push(obj);

		});
		$scope.templates = templates;

	}, function(error) {
		console.log(error.message);
	});
}

$scope.setDefaultTemplate = function(index) {
	showLoader();
	$scope.templates.forEach(function(t) {
		t.isDefault = false;
	});
	$scope.templates[index].isDefault = true;

	user.set('defaultTemplate', $scope.templates[index].entity);
	user.save().then(function() {
		hideLoader();
		console.log('default template selected');

	}, function(error) {
		hideLoader();
		console.log(error,message);
	});
}

//	$scope.selectedColor;

/*
	userFullFactory.loadAll(function(state){
		if (state) $state.go(state);
		else {
			$scope.$apply(function(){
				$scope.BusinessInfo.company = userFullFactory.get("BusinessInfo","businessName");
			});
		} 
	});
*/
/*
	$scope.BusinessInfo = {
		company : userFullFactory.get("BusinessInfo","businessName")
	}

	$scope.saveAppPreferences = function(){
		var color = $(".colors li.active").find('a').attr('class');
		var colorToSave = "app" + color[0].toUpperCase() + color.slice(1) + "Color";
		userFullFactory.save({colorTheme:colorToSave}).then(function(){
			window.location.reload();
		});
	}
*/
}]);
