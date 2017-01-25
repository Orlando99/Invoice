'use strict';

invoicesUnlimited.factory('commentFactory', function(userFactory){

	var user = userFactory;

	if (!user) return undefined;

	var Comment = function(parseObject){
		if (!parseObject) return undefined;
		setObjectOperations({
			object 		: parseObject,
			fieldName	: undefined,
			parent 		: undefined,
			fields 		: fields
		});
		this.date = parseObject.date.formatDate("DD/MM/YY hh:mm",true);
		this.entity = parseObject;
	};

	Comment.createNewComment = function(params, role) {
		var commentObj = Parse.Object.extend('Comments');
		var obj = new commentObj();

		var acl = new Parse.ACL();
        /*
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);
        */
        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(true);
		obj.setACL(acl);

		return obj.save(params);
	}

	var fields = [
		"date",
		"comment",
		"name"
	];
	
	return Comment;
});