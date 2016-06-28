'use strict';

invoicesUnlimited.factory('estimateItemFactory', function(userFactory) {

var user = userFactory;
if (!user) return undefined;

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