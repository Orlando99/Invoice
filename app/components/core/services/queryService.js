'use strict';

invoicesUnlimited.service('queryService',
	function(userFactory){
	
	var user = userFactory;

	this.find = function(params) {
		var query;
		if (arguments.length > 1) {
			var arg = arguments;
			query = new Parse.Query(arg[0]);
			query.equalTo(arg[1], arg[2]);
			
			query.limit(1000);
			
			return query.find();
		}
		query = new Parse.Query(params.className);
		query.equalTo(params.field, params.value);
		
		query.limit(1000);
		
		return query.find();
	}

	this.ext = {};

	this.ext.find = function(params) {
		var query;
		if (arguments.length > 1) {
			var arg = arguments;
			query = new Parse.Query(arg[0]);
			query.equalTo(arg[1], arg[2]);
			arg[3].forEach(function(method){
				query[method.name](method.param);	
			});
			
			query.limit(1000);
			
			return query.find();
		}
		query = new Parse.Query(params.className);
		query.equalTo(params.field, params.value);
		params.methods.forEach(function(method){
			query[method.name](method.param);	
		});
		
		query.limit(1000);
		
		return query.find();	
	}

	this.first = function(params) {
		var query = new Parse.Query(params.className);
		query.equalTo(params.field, params.value);
		return query.first();
	}

});