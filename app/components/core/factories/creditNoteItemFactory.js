'use strict';

invoicesUnlimited.factory('creditNoteItemFactory', ["userFactory",
						  function(userFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return "undefined";
}

function CreditNoteItem (parseObject) {
	if (!parseObject) return undefined;
	
	var creditNoteItemFields = [
		'item', 'tax', 'quantity', 'amount', 'ACL'
	];

	setObjectOperations({
		object 		: parseObject,
		fieldName	: undefined,
		parent 		: undefined,
		fields 		: creditNoteItemFields
	});
	this.entity = parseObject;
};

return CreditNoteItem;
}]);