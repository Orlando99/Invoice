'use strict';

invoicesUnlimited.factory('estimateItemFactory', function(userFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return "undefined";
}

function EstimateItem (parseObject) {
	if (!parseObject) return undefined;
	
	var estimateItemFields = [
		'item', 'tax', 'quantity', 'amount',
		'discount', 'ACL'
	];

	setObjectOperations({
		object 		: parseObject,
		fieldName	: undefined,
		parent 		: undefined,
		fields 		: estimateItemFields
	});
	this.entity = parseObject;
};

return EstimateItem;
});