'use strict';

invoicesUnlimited.factory('lateFeeFactory', ['userFactory', function(userFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var LateFee = function(parseObject) {
	if (!parseObject) return undefined;
	var lateFeeFields = ['name', 'price', 'type'];


	setObjectOperations({
		object 		: parseObject,
		fieldName	: undefined,
		parent 		: undefined,
		fields 		: lateFeeFields
	});
	this.entity = parseObject;
};

return LateFee;

}]);