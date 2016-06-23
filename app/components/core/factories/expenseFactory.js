'use strict';

invoicesUnlimited.factory('expenseFactory', ['userFactory', function(userFactory) {

var user = userFactory;
if (!user) return undefined;

var Expense = function(parseObject, params) {
	if (!parseObject) return undefined;
	var expenseFields;

	if (params.operation == 'listExpenses') {
		expenseFields = [
			'expanseDate', 'category', 'referenceNumber',
			'status', 'amount'
		];
		var customer = parseObject.get('customer');
		if (customer) {
			var customerFields = ['displayName'];
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
			'customer', 'tax', 'amount', 'category'
		];
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