'use strict';

invoicesUnlimited.factory('estimateFactory', ['userFactory', 'estimateItemFactory', 'commentFactory',

function(userFactory, estimateItemFactory, commentFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

function Estimate (parseObject, params) {
	if (!parseObject) return undefined;
	var estimateFields;

	if(params.operation == "listEstimates") {
		estimateFields = [
			"estimateNumber", "estimateDate",
			"totalAmount", "referenceNumber",
			"status"
		];
		var customer = parseObject.get("customer");
		if (customer) {
			var customerFields = ["displayName", 'salutation'];
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: customerFields
			});
			this.customer = customer;
		}

	} else if (params.operation == "getEstimate") {
		estimateFields = [
			'customer', 'estimateDate', 'referenceNumber',
			'estimateNumber', 'status', 'adjustments', 'estimateFiles',
			'discountType', 'discounts', 'shippingCharges',
			'subTotal', 'totalAmount', 'notes', 'termsConditions',
			'salesPerson', 'customFields'
		];
		var estimateItems = parseObject.get('estimateItems');
		if (estimateItems) {
			estimateItems = estimateItems.map(function(elem){
				var item = new estimateItemFactory(elem);
				return item;
			});
			this.estimateItems = estimateItems;
		}

	} else if(params.operation == 'sendReceipt') {
		estimateFields = [
			'totalAmount' ,'estimateReceipt', 'customerEmails', 'emailReceipt'
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
		estimateFields = ['estimateNumber', 'estimateReceipt'];

		var comments = parseObject.get('comments');
		if (comments) {
			comments = comments.map(function(elem){
				return new commentFactory(elem);
			});
			this.comments = comments;
		}
        
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
        
        var attachments = parseObject.get('estimateFiles');
		if (attachments) {
			this.attachments = attachments;
		}

	}

	setObjectOperations({
		object 		: parseObject,
		fieldName	: undefined,
		parent 		: undefined,
		fields 		: estimateFields
	});
	this.entity = parseObject;
};

return Estimate;
}]);