'use strict';

invoicesUnlimited.factory('taskFactory', function(userFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return {};
}

function task(parseObject) {
	setObjectOperations({
		object 		: parseObject,
		fields 		: taskFields
	});

	this.entity = parseObject;
};

var taskFields = [
	"taskName",
	"taskHours",
	"taskDescription",
	"billedHours",
    "taskCost",
    
];

return task;

});