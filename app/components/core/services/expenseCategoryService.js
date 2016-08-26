'use strict';

invoicesUnlimited.factory('expenseCategoryService', ['expenseCategoryFactory',
function(expenseCategoryFactory){

return {
	createNewCategory : function(params, role) {
		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);

		var Category = Parse.Object.extend('Category');
		var obj = new Category();
		obj.setACL(acl);

		return obj.save(params).then(function(category) {
			return new expenseCategoryFactory(category);
		});
	},
	saveEditedCategory : function(category) {
		return category.save()
		.then(function(obj) {
			return new expenseCategoryFactory(obj);
		});
	}
};

}]);