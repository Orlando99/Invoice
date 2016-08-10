'use strict';

invoicesUnlimited.factory('lateFeeService', ['lateFeeFactory', function(lateFeeFactory) {

return {
	getAllLateFees : function(params) {
		var query = new Parse.Query('LateFee');
		query.equalTo('organization', params.organization);
		query.select('name', 'price', 'type');

		return query.find()
		.then(function(objs) {
			return objs.map(function(fee) {
				return new lateFeeFactory(fee);
			});
		});
	},
	createLateFee : function(params, role) {
		var LateFee = Parse.Object.extend('LateFee');
		var lateFee = new LateFee();

		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);
		lateFee.setACL(acl);

		return lateFee.save(params)
		.then(function(fee) {
			return new lateFeeFactory(fee);
		});
	},
	updateLateFee : function(obj) {
		return obj.save()
		.then(function(fee) {
			return new lateFeeFactory(fee);
		});
	}
};

}]);