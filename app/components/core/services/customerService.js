'use strict';

invoicesUnlimited.factory('customerFactory',function(userFactory){

	var user = userFactory.authorized();
	if (!user) return undefined;

	function customer(parseObject){
		setObjectOperations({
			object 		: parseObject,
			fieldName	: undefined,
			parent 		: undefined,
			fields 		: fields
		});
		this.entity = parseObject;
	};

	var fields = [
		"companyName",
		"displayName",
		"phone",
		"email",
		"unusedCredits",
		"outstanding"
	];
	
	return customer;

});