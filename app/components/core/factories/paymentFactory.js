'use strict';

invoicesUnlimited.factory('paymentFactory', ['userFactory',

function(userFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return Payment;
}

function Payment (parseObject) {
	if (!parseObject) return undefined;
	var paymentFields = ['date', 'reference', 'mode', 'amount', 'notes', 'deleted', 'lastFourDigits'];

	setObjectOperations({
		object 		: parseObject,
		fieldName	: undefined,
		parent 		: undefined,
		fields 		: paymentFields
	});
	this.entity = parseObject;
};

return Payment;

}]);