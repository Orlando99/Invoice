'use strict';

invoicesUnlimited.factory('organizationFactory',['userFullFactory',
	function(userFactory){
	
	var user = userFactory;

	var org;
	var fields;
	var complexFields = {
			'logo' : 'File'
		};

	if (!org) {
		var fieldName = "selectedOrganization";
		var org_p = user.get(fieldName);
		org = org_p.fetch().then(function(object){
			setObjectOperations({
				object 		: object,
				fieldName	: fieldName,
				parent 		: user,
				fields 		: fields,
				xFields 	: complexFields
			});
			return object;
		});
	}

	return org;

}]);