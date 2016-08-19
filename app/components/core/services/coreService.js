'use strict';

invoicesUnlimited.factory('coreFactory',
	function(
		userFactory,
		customerFactory,
		invoicesFactory,
		itemFactory,
		expenseCategoryFactory,
		queryService){

	var user = userFactory;
	var core = {};
	if (!user) return undefined;

	//var wrapObject = function

	core.clearAllOnLogOut = function(){
		core.allCustomers = undefined;
	}

	core.getAllCustomers = function(loadAgain){
		if (core.allCustomers && !loadAgain) return core.allCustomers;
		return queryService.ext.find(
			"Customer",
			"userID",
			(user.entity.length ? user.entity[0] : {}),
			[{
				name  : 'include',
				param : 'contactPersons'
			}]
		)
		.then(function(customers){
			var result = [];
			customers.forEach(function(elem){
				var customer = new customerFactory(elem);
				result.push(customer);
			});
			core.allCustomers = result;
			return result;
		});
	}

	core.getAllInvoices = function(params){
		var query = new Parse.Query("Invoices");
		if (!params.method) query.equalTo(params.name,params.val1);
		else query[params.method](params.name,params.val1,params.val2,params.val3);
		query.include('comments');
		return query.find().then(function(res){
			var invoices = [];
			res.forEach(function(elem){
				invoices.push(new invoicesFactory(elem));
			});
			return invoices;
		});
	}

	core.getAllItems = function(params) {
		var query = new Parse.Query("Item");
		query.equalTo("organization", params.organization);
		query.notEqualTo("isDeleted", 1);
		query.include("tax");
		return query.find().then(function(res) {
			var items = [];
			res.forEach(function(elem) {
				items.push(new itemFactory(elem));
			});
			return items;
		});
	}

	core.getUserRole = function(user) {
		var query = new Parse.Query(Parse.Role);
		query.equalTo('users', user);
		return query.first().then(function(role) {
			return role;
		});
	}

	core.getExpenseCategories = function(params) {
		var query = new Parse.Query('Category');
		query.equalTo('organization', params.organization);
		query.select('color', 'name', 'notes');
		return query.find().then(function(res) {
			var categories = [];
			res.forEach(function(category) {
				categories.push(new expenseCategoryFactory(category));
			});
			return categories;
		});
	}

	core.getInvoiceTemplates = function() {
		var query = new Parse.Query('InvoiceTemplate');
		query.select('name', 'templatePreview');
		return query.find();
	}

	core.getGeneralPrefs = function(user) {
		var query = new Parse.Query('Organization');
		query.equalTo('userID', user);
		query.select('timeZone', 'fiscalYearStart',
			'dateFormat', 'fieldSeparator');
		return query.first();
	}

	return core;

});