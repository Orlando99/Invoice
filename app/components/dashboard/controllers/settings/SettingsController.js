'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('SettingsController',['$q','$scope','$state', '$controller',
	'userFactory', 'coreFactory',
function($q,$scope,$state,$controller, userFactory, coreFactory){

if(!userFactory.entity.length) {
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
	//	console.log('its in users')
		showUserFields();

	} else if (isGoTo.templates(stateName)) {
	//	console.log('select invoice template');
		loadInvoiceTemplates();

	} else if (isGoTo.general(stateName)) {
	//	console.log('in general preferences')
		loadGeneralSettings();
	} else {
		hideLoader();
	}

}

//------ Users Settings ------
function showUserFields() {
	console.log('xyzz');
	$scope.users = [{
		name : user.get('username'),
		email : user.get('email'),
		role : user.get('role'),
		status : 'Active',
		textClass : 'text-positive'
	}];
	hideLoader();
}

//------ General Preferences Settings ------
    
var examples = [
    ['23','10','16'], ['10','23','16'],
    ['16','10','23'], ['23','10','2016'],
    ['10','23','2016'], ['2016','10','23'],
];
    
var fixedExamples = [
    '10 Oct 2016', 'Mon, October 23, 2016',
    'Monday, October 23, 2016', 'Oct 23, 2016',
    'October 23, 2016', '2016 10 23'
];
    
function dateFormatHelper (seperator) {
	var dateLiterals = [
		['dd','mm','yy'], ['mm','dd','yy'],
		['yy','mm','dd'], ['dd','mm','yyyy'],
		['mm','dd','yyyy'], ['yyyy','mm','dd'],
	];

	var fixedFormats = [
		'dd mmm yyyy', 'eee, mmmm dd, yyyy',
		'eeee, mmmm dd, yyyy', 'mmm dd, yyyy',
		'mmmm dd, yyyy', 'yyyy mm dd'
	];

	var finalFormats = [];
    
    for(var i = 0; i < dateLiterals.length; ++i){
        finalFormats.push({
            format: dateLiterals[i].join(seperator),
            formatExample: dateLiterals[i].join(seperator) + ' (' + examples[i].join(seperator) + ')'
        });
    }
    /*
	dateLiterals.forEach(function(literal) {
		finalFormats.push(literal.join(seperator));
	});
    */
    for(var i = 0; i < fixedFormats.length; ++i){
        finalFormats.push({
            format: fixedFormats[i],
            formatExample: fixedFormats[i] + ' (' + fixedExamples[i] + ')'
        });
    }

	//finalFormats = finalFormats.concat(fixedFormats);
	return finalFormats;
}
   
    
  /*  
function dateFormatHelper (seperator) {
	var dateLiterals = [
		['dd','MM','yy'], ['MM','dd','yy'],
		['yy','MM','dd'], ['dd','MM','yyyy'],
		['MM','dd','yyyy'], ['yyyy','MM','dd'],
	];

	var fixedFormats = [
		'dd MMM yyyy', 'EEE, MMMM dd, yyyy',
		'EEEE, MMMM dd, yyyy', 'MMM dd, yyyy',
		'MMMM dd, yyyy', 'yyyy MM dd'
	];

	var finalFormats = [];
	dateLiterals.forEach(function(literal) {
		finalFormats.push(literal.join(seperator));
	});

	finalFormats = finalFormats.concat(fixedFormats);
	return finalFormats;
}
*/
function loadGeneralSettings() {
	showLoader();
	$scope.timeZones = {
		timeZones : [
			'( PDT ) America/Los_Angeles ( Pacific Standard Time )',
			'( GMT 5:00 ) Asia/Karachi ( Pakistan Standard Time )',
			'( GMT 0:00 ) Dublin, Edinburgh, Lisbon, London ( Greenwich Mean Time )',
			'( GMT -4:00 ) Canada ( Atlantic Standard Time )',
			'( GMT -4:00 ) Santiago ( Pacific SA Standard Time )',
			'( GMT -5:00 ) US & Canada ( Eastern Standard Time )',
			'( GMT -5:00 ) Indiana (East) ( US Eastern Standard Time )',
			'( GMT -6:00 ) ( Central America Standard Time )',
			'( GMT -6:00 ) US & Canada ( Central Standard Time )',
			'( GMT -7:00 ) US & Canada ( Mountain Standard Time )',
			'( GMT -8:00 ) US & Canada ( Pacific Standard Time )',
			'( GMT -9:00 ) ( Alaskan Standard Time )',
			'( GMT -10:00 ) ( Hawaiian Standard Time )'
			],
		selectedTimeZone : ''
	};

	$scope.months = {
		months : ['January', 'February', 'March', 'April',
			'May', 'June', 'July', 'August', 'September',
			'October', 'November', 'December'],
		selectedMonth : ''
	};

	$scope.dateFormats = {
		formats : [],
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
		var format = prefs.get('dateFormat').toLowerCase();
		var separator = prefs.get('fieldSeparator');

		// ios version not saving date format,
		// so did this to make web version work
		//format = format.replace(/[.,-//]/g, separator);

		$scope.timeZones.selectedTimeZone =
		$scope.timeZones.timeZones.filter(function(z) {
			return z == timeZone;
		})[0];

		$scope.months.selectedMonth =
		$scope.months.months.filter(function(m) {
			return m == month;
		})[0];

		$scope.fieldSeparators.selectedSeparator =
		$scope.fieldSeparators.separators.filter(function(s) {
			return s == separator;
		})[0];

		$scope.dateFormats.formats = dateFormatHelper(
			$scope.fieldSeparators.selectedSeparator);

		$scope.dateFormats.selectedFormat =
		$scope.dateFormats.formats.filter(function(f) {
			return f.format == format;
		})[0];

		hideLoader();

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

$scope.dateSeperatorChanged = function() {
 	var index = $scope.dateFormats.formats.indexOf(
 		$scope.dateFormats.selectedFormat);

	$scope.dateFormats.formats = dateFormatHelper(
		$scope.fieldSeparators.selectedSeparator);

	$scope.dateFormats.selectedFormat =
		$scope.dateFormats.formats[index];

}

$scope.setDefaultPrefs = function() {
	showLoader();
    
    var dateFormat = $scope.dateFormats.selectedFormat.format.split('m').join('M');
    dateFormat = dateFormat.split('e').join('E');
    
	organization.set('timeZone', $scope.timeZones.selectedTimeZone);
	organization.set('fiscalYearStart', $scope.months.selectedMonth);
	organization.set('dateFormat', dateFormat);
	organization.set('fieldSeparator', $scope.fieldSeparators.selectedSeparator);

	organization.save().then(function() {
		userFactory.commonData = {};
		hideLoader();
        showSnackbar("Settings saved");
		console.log('general preferences are saved.')

	}, function(error) {
		hideLoader();
		console.log(error.message);
	});
}

//------ Invoice Template Settings ------
function loadInvoiceTemplates() {
	showLoader();
	$q.when(coreFactory.getInvoiceTemplates())
	.then(function(templateObjs) 
          {
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
            {     
                if(defaultTemplate) 
                {
                    obj.isDefault = (defaultTemplate.id == t.id ? true : false);        
                }
                else
                {
                  obj.isDefault = false;      
                }	
             }
			templates.push(obj);

		});
		$scope.templates = templates;
		hideLoader();

	}, function(error) {
		hideLoader();
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
        showSnackbar("Template saved");
	//	console.log('default template selected');

	}, function(error) {
		hideLoader();
		console.log(error,message);
	});
}

}]);
