'use strict';

invoicesUnlimited.controller('ItemController',['$scope', '$state', '$controller', '$q',
	'userFactory', 'coreFactory', 'taxService', 'itemService',
function($scope,$state,$controller,$q,userFactory, coreFactory, taxService, itemService){

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});
initalizeModalClasses();

loadItemsAndTaxes();

function loadItemsAndTaxes() {
	showLoader();
	var p = undefined;
	var promises = [];

	p = $q.when(coreFactory.getAllItems({
		organization : organization
	}))
	.then(function(items) {
		$scope.items = items;
	});
	promises.push(p);

	p = taxService.getTaxes(user, function(taxes) {
		$scope.taxes = taxes;
	});
	promises.push(p);

	$q.all(promises).then(function() {
		hideLoader();

	}, function(error) {
		console.log(error.message);
		hideLoader();

	});

}

function initializeScopeVariables() {
	$scope.itemName = '';
	$scope.itemRate = '';
	$scope.itemDesc = '';
	$scope.itemTax = undefined;
}

$scope.clearAddItemFields = function() {
	initializeScopeVariables();
}

$scope.showItemDetail = function(index) {
	$(".edit-item").addClass("show");
	var item = $scope.items[index];

	$scope.itemIndex = index;
	$scope.itemName = item.entity.title;
	$scope.itemRate = item.entity.rate;
	$scope.itemDesc = item.entity.itemDescription;

	if (item.tax) {
		var taxes = $scope.taxes;
		for (var i = 0; i < taxes.length; ++i) {
			if (item.tax.id == taxes[i].id) {
				$scope.itemTax = taxes[i];
				break;
			}
		}
	}
}

$scope.saveNewItem = function() {
	showLoader();
	var params = {
		user : user,
		organization : organization,
		items : [{
			title : $scope.itemName,
			rate : $scope.itemRate,
			tax : $scope.itemTax,
			desc : $scope.itemDesc
		}]
	};

	$q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);

		params.acl = acl;

		return itemService.createItems(params);
	})
	.then(function(items) {
		$scope.items.push(items[0]);
		$(".new-item").removeClass("show");
		hideLoader();

	}, function(error) {
		$(".new-item").removeClass("show");
		hideLoader();
		console.log(error.message);
	});
}

$scope.saveEditedItem = function() {
	var item = $scope.items[$scope.itemIndex];
	if (! item) return;

	showLoader();
	item = item.entity;
	item.set('title', $scope.itemName);
	item.set('rate', String($scope.itemRate));
	item.set('itemDescription', $scope.itemDesc);

	if($scope.itemTax) {
		item.set('tax', Parse.Object.extend("Tax")
			.createWithoutData($scope.itemTax.id));
	} else {
		item.unset('tax');
	}

	item.save().then(function() {
		$state.reload();

	}, function(error) {
		$(".edit-item").removeClass("show");
		hideLoader();
		console.log(error.message);
	})

}

//----
/*
	if (user.get('colorTheme')) {
		var color = user.get('colorTheme');
		if (color) color = color.replace(/app|Color/g,"").toLowerCase();
		if (color) $('.colors li a.'+color).parent().addClass("active");
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
