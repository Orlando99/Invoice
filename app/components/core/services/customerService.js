'use strict';

invoicesUnlimited.factory('customerFactory',["userFactory","contactPersonFactory","appFields",
	function(userFactory,contactPersonFactory,appFields){

	var user = userFactory;
	if (!user.entity.length) return {};

	function customer(parseObject){
		setObjectOperations({
			object 		: parseObject,
			fields 		: appFields.customer
		});

		var contactPersons = parseObject.get('contactPersons');

		if (contactPersons) {
			contactPersons = 
			contactPersons.filter(function(elem){
				if (elem) return elem;
			}).map(function(elem){
				return new contactPersonFactory(elem);
			});
		}

		this.id = parseObject.get('objectId');
		this.entity = parseObject;
		this.contactPersons = contactPersons;

		this.save = function(params){
			if (arguments.length) return this.entity.save(params);
			var self = this;
			return this.entity.save().then(function(ent){
				if (!self.id) self.id = ent.id;
				return ent;
			});
		}

		this.destroy = function(){
			for (var prop in this)
				if (prop != 'entity' && 
					this.hasOwnProperty(prop)) delete this[prop];
			return this.entity.destroy();
		}
	};
	
	return customer;

}]);