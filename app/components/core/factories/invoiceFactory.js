'use strict';

invoicesUnlimited.factory('invoiceFactory',function(userFactory) {

	var user = userFactory;
	if (!user) return undefined;

	function Invoice(parseObject, params) {
		if (!parseObject) return undefined;
		var invoiceFields;

		if(params.operation === "listInvoices") {
			invoiceFields = [
				"invoiceNumber",
				"invoiceDate",
				"dueDate",
				"total",
				"balanceDue",
				"status"
			];

			var customer = parseObject.get("customer");
			if (customer) {
				var customerFields = ["displayName"];
				setObjectOperations({
					object 		: customer,
					fieldName	: undefined,
					parent 		: undefined,
					fields 		: customerFields
				});
			//	this.customerFields = customerFields;
				this.customer = customer;
			}
		} else if (params.operation === "getInvoice") {
			invoiceFields = [
			];
		}

		setObjectOperations({
			object 		: parseObject,
			fieldName	: undefined,
			parent 		: undefined,
			fields 		: invoiceFields
		});

	//	this.id = parseObject.id;
		this.entity = parseObject;
	//	this.invoiceFields = invoiceFields;
	};

	return Invoice;
});