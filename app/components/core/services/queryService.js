'use strict';

invoicesUnlimited.service('queryService',
	function(userFactory){
	
	var user = userFactory;

	this.find = function(params) {
		var query = new Parse.Query(params.className);
		query.equalTo(params.field, params.value);
		return query.find();
	}

	this.first = function(params) {
		var query = new Parse.Query(params.className);
		query.equalTo(params.field, params.value);
		return query.first();
	}

});