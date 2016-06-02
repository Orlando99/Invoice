'use strict';

invoicesUnlimited.factory('invoicesFactory',function(userFactory,commentFactory){

	var user = userFactory;
	if (!user) return undefined;

	var Invoice = function(parseObject){
		if (!parseObject) return undefined;
		setObjectOperations({
			object 		: parseObject,
			fieldName	: undefined,
			parent 		: undefined,
			fields 		: invoiceFields
		});
/*
		var comments = parseObject.get('comments');
		comments = comments.map(function(elem){
			return new commentFactory(elem);
		});

		this.comments = comments;
*/
		this.invoiceDate = parseObject.invoiceDate.toISOString()
			.slice(0,10)
			.split("-")
			.reverse()
			.join("/");
		this.entity = parseObject;

	};

	var invoiceFields = [
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