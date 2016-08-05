'use strict';

invoicesUnlimited.factory('contactPersonFactory',function(userFactory){
	var user = userFactory;
	if (!user.entity.length) return {};

	function contactPerson(parseObject){
		setObjectOperations({
			object 		: parseObject,
			fields 		: fields
		});

		this.id = parseObject.get('objectId');
		this.entity = parseObject;
		this.fieldNames = fields;

		this.save = function(){
			return this.entity.save();
		}

		this.destroy = function(customer){
			if (!customer) return this.entity.destroy();
			customer.entity.remove('contactPersons',this.entity);
			var self = this;
			return customer.save().then(function(val){
				return self.entity.destroy();
			},function(err){
				debugger;
			});
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