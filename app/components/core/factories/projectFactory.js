'use strict';

invoicesUnlimited.factory('projectFactory', ['userFactory', 'taskFactory', 'staffFactory',

function(userFactory, taskFactory, staffFactory) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return "undefined";
}

function Project (parseObject, params) {
	if (!parseObject) return undefined;
	var projectFields;

	if(params.operation == "listProjects") {
		projectFields = [
			"projectName", "projectDescription",
			"billingMethod", "projectBillingAmount"
		];
		var customer = parseObject.get("customer");
		if (customer) {
            var n = customer.get("displayName");
			var customerFields = ["displayName", "salutation"];
			setObjectOperations({
				object 		: customer,
				fieldName	: undefined,
				parent 		: undefined,
				fields 		: customerFields
			});
			this.customer = customer;
		}

	}
    
    else if (params.operation == "getProject") {
		projectFields = [
			'customer', 'projectName', 'projectDescription',
			'billingMethod', 'projectBillingAmount', 'hasBudget',
			'budgetType', 'projectBudgetHours', 'projectBudgetCost'
		];
		var tasks = parseObject.get('tasks');
		if (tasks) {
			tasks = tasks.map(function(elem){
				var task = new taskFactory(elem);
				return task;
			});
			this.tasks = tasks;
		}
        
        var users = parseObject.get('users');
        if (users) {
			users = users.map(function(elem){
				var usr = new staffFactory(elem);
				return usr;
			});
			this.users = users;
		}
        /*
        if(users)
        {
            this.users = users;
        }
        */
        var timesheets = parseObject.get('timeSheets');
        if(timesheets){
            this.timesheets = timesheets;
        }

	} else if (params.operation == 'details') {
		projectFields = ['customer', 'projectName', 'projectDescription',
			'billingMethod', 'projectBillingAmount', 'hasBudget',
			'budgetType', 'projectBudgetHours', 'projectBudgetCost' ];

		var tasks = parseObject.get('tasks');
		if (tasks) {
			tasks = tasks.map(function(elem){
				var task = new taskFactory(elem);
				return task;
			});
			this.tasks = tasks;
		}
        var users = parseObject.get('users');
        if (users) {
			users = users.map(function(elem){
				var user = new staffFactory(elem);
				return user;
			});
			this.users = users;
		}
        
        var timesheets = parseObject.get('timeSheets');
        if(timesheets){
            this.timesheets = timesheets;
        }

	}
    
	setObjectOperations({
		object 		: parseObject,
		fieldName	: undefined,
		parent 		: undefined,
		fields 		: projectFields
	});
	this.entity = parseObject;
};

return Project;
}]);