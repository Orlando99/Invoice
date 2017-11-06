'use strict';

invoicesUnlimited.factory('creditNoteFactory', ['userFactory', 'creditNoteItemFactory', 'commentFactory','paymentFactory',

function(userFactory, creditNoteItemFactory, commentFactory, paymentFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return "undefined";
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
			var customerFields = ["displayName", "salutation"];
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
			'remainingCredits' ,'creditReceipt', 'customerEmails', 'emailReceipt'
		];
		var customer = parseObject.get("customer");
		if (customer) {
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: ["displayName", "salutation"]
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
		creditNoteFields = ['creditNumber', 'creditReceipt', 'remainingCredits'];

        var payments = parseObject.get('refunds');
		if (payments) {
			payments = payments.map(function(elem){
				return new paymentFactory(elem);
			});
			this.payments = payments;
		}
        
		var comments = parseObject.get('comments');
		if (comments) {
			comments = comments.map(function(elem){
				return new commentFactory(elem);
			});
			this.comments = comments;
		}

	} else if (params.operation == 'apply2Invoice') {
		creditNoteFields = ['remainingCredits', 'creditsUsed', 'creditNumber'];
	}
    else if (params.operation == 'customerCredit') {
		creditNoteFields = ['creditNumber', 'remainingCredits'];
		var customer = parseObject.get('customer');
		if (customer) {
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: ['displayName', 'salutation']
			});
			this.customer = customer;
		}

	} else if(params == "customerBalance"){
		creditNoteFields = ['remainingCredits', 'creditsUsed', 'creditNumber'];
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
