'use strict';

invoicesUnlimited.factory('expenseCategoryFactory', ['userFactory', function(userFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

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