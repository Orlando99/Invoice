'use strict';

invoicesUnlimited.factory('invoicesFactory',["userFactory","commentFactory","paymentFactory",
						  function(userFactory,commentFactory,paymentFactory){

	var user = userFactory;
	if (!user) return undefined;

	var Invoice = function(parseObject){
		if (!parseObject) return undefined;
		setObjectOperations({
			object 		: parseObject,
			fieldName	: undefined,
			parent 		: undefined,
			fields 		: invoiceFields
		});

		var comments = parseObject.get('comments');
		if (comments) {
			comments = comments.map(function(elem){
				return new commentFactory(elem);
			});
			this.comments = comments;
		}
        
        var payments = parseObject.get("payment");
        if(payments){
            payments = payments.map(function(elem){
				return new paymentFactory(elem);
			});
            this.payments = payments;
        }

		this.invoiceDate = parseObject.invoiceDate.toISOString()
			.slice(0,10)
			.split("-")
			.reverse()
			.join("/");
		this.entity = parseObject;

	};

	var invoiceFields = [
		"total",
		"status",
		"invoiceNumber",
		"invoiceDate",
		"dueDate",
		"balanceDue",
		"customer",
        "payment"
	];
	
	return Invoice;

}]);