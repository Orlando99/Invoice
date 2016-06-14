'use strict';

invoicesUnlimited.factory('invoiceItemFactory', function(userFactory) {

var user = userFactory;
if (!user) return undefined;

function InvoiceItem (parseObject) {
	if (!parseObject) return undefined;
	
	var invoiceItemFields = [
		'item', 'tax', 'quantity', 'amount',
		'discount', 'ACL'
	];

	setObjectOperations({
		object 		: parseObject,
		fieldName	: undefined,
		parent 		: undefined,
		fields 		: invoiceItemFields
	});
	this.entity = parseObject;
};

return InvoiceItem;
});