'use strict';

invoicesUnlimited.factory('itemFactory', ["userFactory",
						  function(userFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return {};
}

function item(parseObject) {
	setObjectOperations({
		object 		: parseObject,
		fields 		: itemFields
	});

	var tax = parseObject.get("tax");
	if (tax) {
		setObjectOperations({
		object 		: tax,
		fieldName	: undefined,
		parent 		: undefined,
		fields 		: taxFields
		});
		this.tax = tax;
	}

	this.entity = parseObject;
};

var itemFields = [
	"title",
	"rate",
	"itemDescription",
	"expanseId"
];

var taxFields = [
	"objectId",
	"title",
	"type",
	"value",
	"compound"
];

return item;

}]);