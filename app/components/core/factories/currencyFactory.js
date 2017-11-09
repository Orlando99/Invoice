'use strict';

invoicesUnlimited.factory('currencyFactoryService', ["userFactory",
						  function(userFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return {};
}

function Currency(parseObject) {
	setObjectOperations({
		object 		: parseObject,
		fields 		: fields
	});
	this.entity = parseObject;
};

var fields = [
	"currencySymbol",
	"decimalPlace",
	"format",
	"title",
	"exchangeRate"
];

return Currency;

}]);