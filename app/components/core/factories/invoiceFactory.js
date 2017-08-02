'use strict';

invoicesUnlimited.factory('invoiceFactory',function(userFactory, invoiceItemFactory, commentFactory,
	paymentFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return Invoice;
}

function Invoice(parseObject, params) {
	if (!parseObject) return undefined;
	var invoiceFields;

	if(params.operation === "listInvoices") {
		invoiceFields = [
			"invoiceNumber", "invoiceDate",
			"dueDate", "total", "balanceDue",
			"status", "poNumber"
		];
		var customer = parseObject.get("customer");
		if (customer) {
			var customerFields = ["displayName", "salutation"];
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
			'customer', 'invoiceDate', 'dueDate',
			'invoiceNumber', 'status', 'invoiceFiles',
			'invoiceInfo', 'adjustments', 'discountType',
			'discounts', 'shippingCharges', 'balanceDue',
			'subTotal', 'total', 'notes', 'terms', 'poNumber',
			'salesPerson', 'lateFee', 'customFields', 'paymentTerms'
		];
		var invoiceItems = parseObject.get('invoiceItems');
		if (invoiceItems) {
			invoiceItems = invoiceItems.map(function(elem){
				var item = new invoiceItemFactory(elem);
				return item;
			});
			this.invoiceItems = invoiceItems;
		}

	} else if (params.operation == 'sendReceipt') {
		invoiceFields = [
			'balanceDue' ,'invoiceReceipt', 'customerEmails'
		];
		var customer = parseObject.get("customer");
		if (customer) {
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: ["displayName", "salutation"]
			});
			this.customer = customer;
		}
		var orgObj = parseObject.get("organization");
		if(orgObj) {
			setObjectOperations({
				object 		: orgObj,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: ["name"]
			});
			this.organization = orgObj;
		}
	} else if (params.operation == 'details') {
		invoiceFields = ['invoiceNumber', 'invoiceReceipt',
			'invoiceInfo', 'balanceDue', 'creditApplied'];

		var comments = parseObject.get('comments');
		if (comments) {
			comments = comments.map(function(elem){
				return new commentFactory(elem);
			});
			this.comments = comments;
		}

		var payments = parseObject.get('payment');
		if (payments) {
			payments = payments.map(function(elem){
				return new paymentFactory(elem);
			});
			this.payments = payments;
		}

		var attachments = parseObject.get('invoiceFiles');
		if (attachments) {
			this.attachments = attachments;
		}


	} else if (params.operation == 'summary') {
		invoiceFields = ['invoiceDate', 'dueDate', 'status',
			'balanceDue', 'lateFee', 'total'];

	} else if (params.operation == 'salesByCustomerReport') {
		invoiceFields = ['invoiceNumber', 'total'];
		var customer = parseObject.get('customer');
		if (customer) {
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: ['displayName', 'salutation']
			});
			this.customer = customer;
		}

	} else if (params.operation == 'salesByItemReport') {
		invoiceFields = ['invoiceNumber'];
		var invoiceItems = parseObject.get('invoiceItems');
		if (invoiceItems) {
			invoiceItems = invoiceItems.map(function(elem){
				var item = new invoiceItemFactory(elem);
				return item;
			});
			this.invoiceItems = invoiceItems;
		}

	} else if (params.operation == 'customerBalance') {
		invoiceFields = ['invoiceNumber', 'balanceDue'];
		var customer = parseObject.get('customer');
		if (customer) {
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: ['displayName', 'salutation']
			});
			this.customer = customer;
		}

	} else if (params.operation == 'invoiceAging') {
		invoiceFields = ['invoiceNumber', 'balanceDue', 'invoiceDate', "lateFee"];
		var customer = parseObject.get('customer');
		if (customer) {
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: ['displayName', 'salutation']
			});
			this.customer = customer;
		}

	} else if (params.operation == 'paymentsReceived') {
		invoiceFields = ['invoiceNumber', 'invoiceDate'];
		var customer = parseObject.get('customer');
		if (customer) {
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: ['displayName', 'salutation']
			});
			this.customer = customer;
		}

		var payments = parseObject.get('payment');
		if (payments) {
			payments = payments.map(function(elem){
				return new paymentFactory(elem);
			});
			this.payments = payments;
		}

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