'use strict';

invoicesUnlimited.factory('staffFactory', function(userFactory, projectUserFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return {};
}

function staff(parseObject) {
	setObjectOperations({
		object 		: parseObject,
		fields 		: staffFields
	});
    
    this.user = parseObject.get('chosenUser');

	this.entity = parseObject;
};

var staffFields = [
	
];

return staff;

});