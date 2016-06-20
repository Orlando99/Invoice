'use strict';

invoicesUnlimited.factory('expenseCategoryFactory', ['userFactory', function(userFactory) {

var user = userFactory;
if (!user) return undefined;

var ExpenseCategory = function(parseObject) {
	if (!parseObject) return undefined;
	var categoryFields = [
		'color', 'name', 'notes'
	];

	setObjectOperations({
		object 		: parseObject,
		fieldName	: undefined,
		parent 		: undefined,
		fields 		: categoryFields
	});
	this.entity = parseObject;
};

return ExpenseCategory;
}]);