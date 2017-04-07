'use strict';

invoicesUnlimited.factory('expenseFactory', ['userFactory', function(userFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return Expense;
}

function Expense (parseObject, params) {
	if (!parseObject) return undefined;
	var expenseFields;

	if (params.operation == 'listExpenses') {
		expenseFields = [
			'expanseDate', 'category', 'referenceNumber',
			'status', 'amount'
		];
		var customer = parseObject.get('customer');
		if (customer) {
			var customerFields = ['displayName', 'salutation'];
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: customerFields
			});
			this.customer = customer;
		}
	} else if (params.operation == 'getExpense') {
		expenseFields = [
			'customer', 'tax', 'amount',
			'referenceNumber', 'category', 'expanseDate',
			'notes', 'expenseFiles', 'billable',
			'status', 'currency'
		];
	} else if (params.operation == 'getCustomerExpenses') {
		expenseFields = [
			'customer', 'tax', 'amount', 'category', 'expanseDate'
		];
	} else if (params.operation == 'details') {
		expenseFields = [
			'category', 'expanseDate', 'amount',
			'referenceNumber', 'notes', 'expenseFiles',
			'status', 'currency'
		];
		var customer = parseObject.get('customer');
		if (customer) {
			var customerFields = ['displayName', 'salutation'];
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: customerFields
			});
			this.customer = customer;
		}

		var attachments = parseObject.get('expenseFiles');
		if (attachments) {
			this.attachments = attachments;
		}
	} else if (params.operation == 'summary') {
		expenseFields = ['category', 'amount', 'expanseDate'];
		var customer = parseObject.get('customer');
		if (customer) {
			var customerFields = ['displayName', 'salutation'];
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: customerFields
			});
			this.customer = customer;
		}
	}

	setObjectOperations({
		object 		: parseObject,
		fieldName	: undefined,
		parent 		: undefined,
		fields 		: expenseFields
	});
	this.entity = parseObject;
};

return Expense;
}]);