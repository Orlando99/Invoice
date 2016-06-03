'use strict';

invoicesUnlimited.factory('customerFactory',function(userFactory,contactPersonFactory){

	var user = userFactory;
	if (!user) return undefined;

	function customer(parseObject){
		setObjectOperations({
			object 		: parseObject,
			fieldName	: undefined,
			parent 		: undefined,
			fields 		: customerFields
		});

		var contactPersons = parseObject.get('contactPersons');
		if (contactPersons)
			contactPersons = contactPersons.map(function(elem){
				var contact = new contactPersonFactory(elem);
				return contact;
			});

		this.id = parseObject.get('objectId');
		this.entity = parseObject;
		this.contactPersons = contactPersons;
		this.customerFields = customerFields;

		this.save = function(params){
			if (arguments.length) return this.entity.save(params)
			return this.entity.save();
		}

		this.destroy = function(){
			for (var prop in this)
				if (prop != 'entity' && 
					this.hasOwnProperty(prop)) delete this[prop];
			return this.entity.destroy();
		}
	};

	var customerFields = [
		"companyName",
		"displayName",
		"lastName",
		"firstName",
		"phone",
		"email",
		"unusedCredits",
		"outstanding",
		"currency",
		"paymentTerms",
		"billingAddress",
		"shippingAddress",
		"notes",
		"salutation"
	];
	
	return customer;

});