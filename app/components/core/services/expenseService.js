'use strict';

invoicesUnlimited.factory('expenseService', ['$q', 'expenseFactory',
function($q, expenseFactory) {

return {
	getExpensesForSummary : function(params) {
		var expenseTable = Parse.Object.extend('Expanses');
		var query = new Parse.Query(expenseTable);

		query.equalTo('organization', params.organization);
		query.notEqualTo('status', 'Non-Billable');
		query.include('customer');
		query.select('category', 'amount', 'customer');

		return query.find().then(function(expenseObjs) {
			var expenses = [];
			expenseObjs.forEach(function(expense) {
				expenses.push(new expenseFactory(expense, {
					operation : 'summary'
				}));
			});
			return expenses;
		});
	},
	getExpenseDetails : function(expenseId) {
		var Expense = Parse.Object.extend('Expanses');
		var query = new Parse.Query(Expense);

		return query.get(expenseId)
		.then(function(expObj) {
			var expense = new expenseFactory(expObj, {
				operation : 'details'
			});
			return expense;
		});
	},
	getExpense : function(expenseId) {
		var Expense = Parse.Object.extend('Expanses');
		var query = new Parse.Query(Expense);

		return query.get(expenseId)
		.then(function(expObj) {
			var expense = new expenseFactory(expObj, {
				operation : 'getExpense'
			});
			return expense;
		});
	},
	getCustomerExpenses : function(params) {
		var query = new Parse.Query('Expanses');
		query.equalTo('organization', params.organization);
		query.equalTo('customer', params.customer);
		// TODO: only get billable expenses
		return query.find().then(function(expenseObjs) {
			var expenses = [];
			expenseObjs.forEach(function(expense) {
				expenses.push(new expenseFactory(expense, {
					operation : 'getCustomerExpenses'
				}));
			});
			return expenses;
		});
	},
	listExpenses : function(user) {
		var organization = getOrganization(user);
		if (! organization)	return;

		var expenseTable = Parse.Object.extend('Expanses');
		var query = new Parse.Query(expenseTable);

		query.equalTo('organization', organization);
		query.include('customer');
		query.select('referenceNumber', 'expanseDate', 'category', 'amount', 'status', 'customer');

		return query.find().then(function(expenseObjs) {
			var expenses = [];
			expenseObjs.forEach(function(expense) {
				expenses.push(new expenseFactory(expense, {
					operation : 'listExpenses'
				}));
			});
			return expenses;
		});
	},
	createNewExpense : function(expense, role, files) {
		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);

		var promise = undefined;
		if(files.length) {
			var promises = [];
			files.forEach(function(file) {
				delete file.fileName;
				var parseFile = new Parse.File(file.name, file);
				promises.push(parseFile.save());
			});

			promise = $q.all(promises)
			.then(function(savedFiles) {
				console.log(savedFiles);
				return savedFiles;
			});

		} else
			promise = Parse.Promise.as(undefined);

		if (expense.tax) {
			expense.tax = Parse.Object.extend("Tax")
				.createWithoutData(expense.tax.id)
		}

		return promise.then(function(fileObj) {
			var Expense = Parse.Object.extend('Expanses');
			var obj = new Expense();
			obj.setACL(acl);
			obj.set('expenseFiles', fileObj);
			return obj.save(expense);
		});
	},
	updateExpense : function(expense, files) {
		if (expense.tax) {
			expense.tax = Parse.Object.extend("Tax")
				.createWithoutData(expense.tax.id)
		} else {
			expense.unset('tax');
		}

		var promise = undefined;
		var newFiles = undefined; // store already saved and newly created files
		if(files.length) {
			newFiles = [];
			var promises = [];
			files.forEach(function(file) {
				if(file.exist) {
					delete file.exist;
					delete file.fileName;
					newFiles.push(file);

				} else {
					var parseFile = new Parse.File(file.name, file);
					promises.push(parseFile.save());
				}
			});

			promise = $q.all(promises);

		} else
			promise = Parse.Promise.as(undefined);

		return promise.then(function(fileObjs) {
			if (fileObjs)
				newFiles = newFiles.concat(fileObjs);

			expense.set('expenseFiles', newFiles);
			return expense.save();
		});
	}
};

function getOrganization (user) {
	var organizationArray = user.get('organizations');
	if (!organizationArray) {
		return undefined;
	}
	else return organizationArray[0];
}

}]);