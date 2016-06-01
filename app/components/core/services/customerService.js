'use strict';

invoicesUnlimited.factory('customerFactory',function(userFactory){

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
				setObjectOperations({
					object 		: elem,
					fieldName 	: undefined,
					parent 		: undefined,
					fields 		: contactPersFields
				});
				return elem;
			}); 

		this.id = parseObject.get('objectId');
		this.entity = parseObject;
		this.contactPersons = contactPersons;
		this.customerFields = customerFields;

		this.save = function(){
			return this.entity.save();
		}

		this.destroy = function(){
			for (var prop in this)
				if (prop != 'entity' && 
					this.hasOwnProperty(prop)) delete this[prop];
			return this.entity.destroy();
		}
	};

	var contactPersFields = [
		"email",
		"phone",
		"mobile",
		"lastname",
		"firstname"
	];

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