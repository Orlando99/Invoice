'use strict';

invoicesUnlimited.factory('currencyFactory',["userFactory","roleFactory", "currencyFactoryService",
	function(userFactory,roleFactory, currencyFactoryService){
	
	var user = userFactory;

	var currency = {entity:[]};

	var fields = [
		"currencySymbol",
		"decimalPlace",
		"format",
		"title"
	];
	
	var loadCurrency = function(){
		var fieldName = "currency", cur_p;
		if (user.get) cur_p = user.get(fieldName);
		else if (user.entity[0] && user.entity[0].get)
			cur_p = user.entity[0].get(fieldName);

		if (!cur_p) {
			currency.empty = true;
			return cur_p;
		}

		return cur_p
		.fetch()
		.then(function(object){
			setObjectOperations({
				object 		: object,
				fieldName	: fieldName,
				parent 		: user.entity.length ? user.entity[0] : null,
				fields 		: fields});
			currency.entity.pop();
			currency.entity.push(object);
			return currency;
		},function(error){
			console.log(error.message);
		});
	}

	currency.clearAllOnLogOut = function(){
		currency.entity.length = 0;
	}

	currency.load = function(){
		if (currency.entity.length) return currency;
		return loadCurrency();
	}

	// for signup
	currency.createNew = function(params){
		if (currency.entity.length) return;
		var ctr = Parse.Object.extend("Currency");
		var object = new ctr();
		object.setACL(roleFactory.createACL());
		return object.save(params,{
			success : function(obj){
				setObjectOperations({
					object 		: obj,
					fieldName	: "currency",
					parent 		: user.entity.length ? user.entity[0] : null,
					fields 		: fields});
				currency.entity.push(obj);
				console.log(obj.className + ' created');
			},
			error : function(obj,error){
				console.log(error.message);
			}
		})
		.then(function(obj){
			return [user.save({
				currency : obj
			}),obj];
		},errorCallback)
		.then(function(res){
			return res[1];
		},function(err){
			debugger;
		});
	}

	currency.loadAll = function(params){
		var Currency = Parse.Object.extend('Currency');
		var query = new Parse.Query(Currency);
		query.equalTo('organization', params.organization);

		return query.find()
		.then(function(objs) {
			var currencies = [];
			objs.forEach(function(obj) {
				currencies.push(new currencyFactoryService(obj));
			});
			return currencies;
		});

	}
	
	currency.loadAllOfCurrentUser = function(){
		var Currency = Parse.Object.extend('Currency');
		var query = new Parse.Query(Currency);
		query.equalTo('organization', userFactory.entity[0].get("selectedOrganization"));

		return query.find()
		.then(function(objs) {
			var currencies = [];
			objs.forEach(function(obj) {
				currencies.push(new currencyFactoryService(obj));
			});
			return currencies;
		});
	}

	currency.createNewCurrency = function(params, role) {
		var acl = new Parse.ACL();
		//acl.setRoleWriteAccess(role.get("name"), true);
		//acl.setRoleReadAccess(role.get("name"), true);
        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(true);
		var ctr = Parse.Object.extend("Currency");
		var object = new ctr();
		object.setACL(acl);
		return object.save(params)
		.then(function(obj) {
			return new currencyFactoryService(obj);
		});
	}

	currency.saveEditedCurrency = function(obj) {
		return obj.save()
		.then(function(newObj) {
			return new currencyFactoryService(newObj);
		});
	}

	return currency;

}]);