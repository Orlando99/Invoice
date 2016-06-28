'use strict';

invoicesUnlimited.factory('estimateFactory', ['userFactory', 'estimateItemFactory',

function(userFactory, estimateItemFactory) {

var user = userFactory;
if (!user) return undefined;

function Estimate (parseObject, params) {
	if (!parseObject) return undefined;
	var estimateFields;

	if(params.operation === "listEstimates") {
		estimateFields = [
			"estimateNumber", "estimateDate",
			"totalAmount", "referenceNumber",
			"status"
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

	} else if (params.operation === "getEstimate") {
		estimateFields = [
			'customer', 'estimateDate', 'referenceNumber',
			'estimateNumber', 'status', 'adjustments',
			'discountType', 'discounts', 'shippingCharges',
			'subTotal', 'totalAmount', 'notes', 'termsConditions',
			'salesPerson'
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
			'totalAmount' ,'estimateReceipt', 'customerEmails'
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