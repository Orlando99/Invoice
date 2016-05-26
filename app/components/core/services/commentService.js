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

	var fields = [
		"date",
		"comment",
		"name"
	];
	
	return Comment;
});