'use strict';

invoicesUnlimited.factory('invoicesFactory',function(userFactory){

	var user = userFactory;
	if (!user) return undefined;

	var Invoice = function(parseObject){
		if (!parseObject) return undefined;
		setObjectOperations({
			object 		: parseObject,
			fieldName	: undefined,
			parent 		: undefined,
			fields 		: fields
		});
		this.invoiceDate = parseObject.invoiceDate.toISOString()
			.slice(0,10)
			.split("-")
			.reverse()
			.join("/");
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