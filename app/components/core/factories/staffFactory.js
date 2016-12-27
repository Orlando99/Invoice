'use strict';

invoicesUnlimited.factory('staffFactory', function(userFactory, projectUserFactory, appFields) {

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

    setObjectOperations({
        object 		: this.user,
        fields 		: appFields.projectUser
    });
			
    
	this.entity = parseObject;
};

var staffFields = [
	'staffHours'
];

return staff;

});