'use strict';

invoicesUnlimited.factory('reportsService', ['$q', 'invoiceFactory',
function($q, invoiceFactory) {

return {
	salesByCustomer : function(params) {
		var Invoices = Parse.Object.extend('Invoices');
		var query = new Parse.Query(Invoices);
		query.equalTo('organization', params.organization);
		query.exists('payment');
		query.greaterThanOrEqualTo('invoiceDate', params.fromDate);
		query.lessThanOrEqualTo('invoiceDate', params.toData);
		query.select('invoiceNumber', 'customer', 'total');
		query.include('customer');

		return query.find()
		.then(function(objs) {
			var invoices = [];
			objs.forEach(function(obj) {
				invoices.push(new invoiceFactory(obj, {
					operation : 'salesByCustomerReport'
				}));
			});
			return invoices;
		});

	},
	salesByItem : function(params) {
		var Invoices = Parse.Object.extend('Invoices');
		var query = new Parse.Query(Invoices);
		query.equalTo('organization', params.organization);
		query.exists('payment');
		query.greaterThanOrEqualTo('invoiceDate', params.fromDate);
		query.lessThanOrEqualTo('invoiceDate', params.toData);
		query.select('invoiceNumber', 'invoiceItems');
		query.include('invoiceItems');

		return query.find()
		.then(function(objs) {
			var invoices = [];
			objs.forEach(function(obj) {
				invoices.push(new invoiceFactory(obj, {
					operation : 'salesByItemReport'
				}));
			});
			return invoices;
		});
	},
	customerBalance : function(params) {
		var Invoices = Parse.Object.extend('Invoices');
		var query = new Parse.Query(Invoices);
		query.equalTo('organization', params.organization);
		query.containedIn('status', ['Unpaid', 'Paid', 'Overdue']);
		query.greaterThanOrEqualTo('invoiceDate', params.fromDate);
		query.lessThanOrEqualTo('invoiceDate', params.toData);
		query.select('invoiceNumber', 'customer', 'balanceDue');
		query.include('customer');

		return query.find()
		.then(function(objs) {
			var invoices = [];
			objs.forEach(function(obj) {
				invoices.push(new invoiceFactory(obj, {
					operation : 'customerBalance'
				}));
			});
			return invoices;
		});

	},
	invoiceAging : function(params) {
		var Invoices = Parse.Object.extend('Invoices');
		var query = new Parse.Query(Invoices);
		query.equalTo('organization', params.organization);
		query.containedIn('status', ['Unpaid', 'Partial Paid', 'Overdue']);
		query.greaterThanOrEqualTo('invoiceDate', params.fromDate);
		query.lessThanOrEqualTo('invoiceDate', params.toData);
		query.select('invoiceNumber', 'customer', 'balanceDue', 'invoiceDate');
		query.include('customer');

		return query.find()
		.then(function(objs) {
			var invoices = [];
			objs.forEach(function(obj) {
				invoices.push(new invoiceFactory(obj, {
					operation : 'invoiceAging'
				}));
			});
			return invoices;
		});

	},
	paymentsReceived : function(params) {
		var Invoices = Parse.Object.extend('Invoices');
		var query = new Parse.Query(Invoices);
		query.equalTo('organization', params.organization);
		query.exists('payment');
		query.greaterThanOrEqualTo('invoiceDate', params.fromDate);
		query.lessThanOrEqualTo('invoiceDate', params.toData);
		query.select('invoiceNumber', 'invoiceDate', 'customer', 'payment');
		query.include('customer', 'payment');

		return query.find()
		.then(function(objs) {
			var invoices = [];
			objs.forEach(function(obj) {
				invoices.push(new invoiceFactory(obj, {
					operation : 'paymentsReceived'
				}));
			});
			return invoices;
		});
	},
	expenseByCategory : function(params) {
		var Expenses = Parse.Object.extend('Expanses');
		var query = new Parse.Query(Expenses);
		query.equalTo('organization', params.organization);
		query.greaterThanOrEqualTo('expanseDate', params.fromDate);
		query.lessThanOrEqualTo('expanseDate', params.toData);
		query.select('category', 'amount');

		return query.find();
	}
};

}]);