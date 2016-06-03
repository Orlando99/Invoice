'use strict';

invoicesUnlimited.factory('contactPersonFactory',function(userFactory){
	var user = userFactory;
	if (!user) return undefined;

	function contactPerson(parseObject){
		setObjectOperations({
			object 		: parseObject,
			fieldName	: undefined,
			parent 		: undefined,
			fields 		: fields
		});

		this.id = parseObject.get('objectId');
		this.entity = parseObject;
		this.fieldNames = fields;

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

	var fields = [
		"email",
		"phone",
		"mobile",
		"lastname",
		"firstname",
		"salutation",
		"defaultPerson"
	];

	return contactPerson;
});