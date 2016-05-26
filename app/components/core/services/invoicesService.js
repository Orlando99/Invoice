'use strict';

invoicesUnlimited.factory('invoicesFactory',function(userFactory){

	var user = userFactory.authorized();
	if (!user) return undefined;

	var Invoice = function(parseObject){
		if (!parseObject) return undefined;
		setObjectOperations({
			object 		: parseObject,
			fieldName	: undefined,
			parent 		: undefined,
			fields 		: fields
		});
		this.entity = parseObject;
	};

	var fields = [
		"total",
		"status",
		"invoiceNumber",
		"invoiceDate",
		"dueDate",
		"balanceDue",
		"customer"
	];
	
	return Invoice;

});