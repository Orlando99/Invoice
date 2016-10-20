'use strict';

invoicesUnlimited.factory('projectFactory', ['userFactory',

function(userFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

function Project (parseObject, params) {
	if (!parseObject) return undefined;
	var projectFields;

	if(params.operation == "listProjects") {
		projectFields = [
			"projectName", "projectDescription",
			"billingMethod", "projectBillingAmount"
		];
		var customer = parseObject.get("customer");
		if (customer) {
            var n = customer.get("displayName");
			var customerFields = ["displayName"];
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: customerFields
			});
			this.customer = customer;
		}

	}
    /*
    else if (params.operation == "getProject") {
		estimateFields = [
			'customer', 'estimateDate', 'referenceNumber',
			'estimateNumber', 'status', 'adjustments',
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

	} else if (params.operation == 'details') {
		estimateFields = ['estimateNumber', 'estimateReceipt'];

		var comments = parseObject.get('comments');
		if (comments) {
			comments = comments.map(function(elem){
				return new commentFactory(elem);
			});
			this.comments = comments;
		}

	}
    */
	setObjectOperations({
		object 		: parseObject,
		fieldName	: undefined,
		parent 		: undefined,
		fields 		: projectFields
	});
	this.entity = parseObject;
};

return Project;
}]);