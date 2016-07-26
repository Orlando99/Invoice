'use strict';

invoicesUnlimited.factory('creditNoteFactory', ['userFactory', 'creditNoteItemFactory', 'commentFactory',

function(userFactory, creditNoteItemFactory, commentFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

function CreditNote (parseObject, params) {
	if (!parseObject) return undefined;
	var creditNoteFields;

	if(params.operation == "listCreditNotes") {
		creditNoteFields = [
			"creditNumber", "creditNoteDate", "reference",
			"total", "remainingCredits", "status"
		];
		var customer = parseObject.get("customer");
		if (customer) {
			var customerFields = ["displayName"];
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: customerFields
			});
			this.customer = customer;
		}

	} else if (params.operation === "getCreditNote") {
		creditNoteFields = [
			'customer', 'creditNoteDate', 'creditNumber', 'status',
			'subTotal', 'total', 'notes', 'terms', 'reference'
		];
		var creditItems = parseObject.get('creditNoteItems');
		if (creditItems) {
			creditItems = creditItems.map(function(elem){
				var item = new creditNoteItemFactory(elem);
				return item;
			});
			this.creditItems = creditItems;
		}

	} else if(params.operation == 'sendReceipt') {
		creditNoteFields = [
			'remainingCredits' ,'creditReceipt', 'customerEmails'
		];
		var customer = parseObject.get("customer");
		if (customer) {
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: ["displayName"]
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
		creditNoteFields = ['creditNumber', 'creditReceipt'];

		var comments = parseObject.get('comments');
		if (comments) {
			comments = comments.map(function(elem){
				return new commentFactory(elem);
			});
			this.comments = comments;
		}

	} else if (params.operation == 'apply2Invoice') {
		creditNoteFields = ['remainingCredits', 'creditsUsed'];
	}

	setObjectOperations({
		object 		: parseObject,
		fieldName	: undefined,
		parent 		: undefined,
		fields 		: creditNoteFields
	});
	this.entity = parseObject;

};

return CreditNote;

}]);
