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
$controller('DashboardController',{$scope:$scope,$state:$state});

var isGoTo = {
	users : function(to){
		return to.endsWith('users');
	},
	currencies : function(to){
		return to.endsWith('currencies');
	},
	preferences : function(to){
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
	}

}

function showUserFields() {
	$scope.users = [{
		name : user.get('username'),
		email : user.get('email'),
		role : user.get('role'),
		status : 'Active',
		textClass : 'text-positive'
	}];
}

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
