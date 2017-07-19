'use strict';

invoicesUnlimited.factory('reportsService', ['$q', 'invoiceFactory','creditNoteFactory',
function($q, invoiceFactory, creditNoteFactory) {

return {
	salesByCustomer : function(params) {
		var Invoices = Parse.Object.extend('Invoices');
		var query = new Parse.Query(Invoices);
		query.equalTo('organization', params.organization);
		query.exists('payment');
		query.greaterThanOrEqualTo('invoiceDate', params.fromDate);
		query.lessThanOrEqualTo('invoiceDate', params.toDate);
		//query.select('invoiceNumber', 'customer', 'total');
		query.include('customer');
		query.limit(1000);
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
		query.lessThanOrEqualTo('invoiceDate', params.toDate);
		//query.select('invoiceNumber', 'invoiceItems');
		query.include('invoiceItems');
		query.limit(1000);
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
    customerCredit : function(params) {
		var CrediteNotes = Parse.Object.extend('CreditNotes');
		var query = new Parse.Query(CrediteNotes);
		query.equalTo('organization', params.organization);
		query.notEqualTo('status', 'Closed');
		query.greaterThanOrEqualTo('creditNoteDate', params.fromDate);
		query.lessThanOrEqualTo('creditNoteDate', params.toDate);
		//query.select('invoiceNumber', 'customer', 'balanceDue');
		query.include('customer');
		query.limit(1000);
		return query.find()
		.then(function(objs) {
			var notes = [];
			objs.forEach(function(obj) {
				notes.push(new creditNoteFactory(obj, {
					operation : 'customerCredit'
				}));
			});
			return notes;
		});

	},
	customerBalance : function(params) {
		var Invoices = Parse.Object.extend('Invoices');
		var query = new Parse.Query(Invoices);
		query.equalTo('organization', params.organization);
		
        //m query.containedIn('status', ['Unpaid', 'Paid', 'Overdue']);
		
        //m query.greaterThanOrEqualTo('invoiceDate', params.fromDate);
		//m query.lessThanOrEqualTo('invoiceDate', params.toDate);
		
        //query.select('invoiceNumber', 'customer', 'balanceDue');
		query.include('customer');
		query.limit(1000);
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
		//query.containedIn('status', ['Unpaid', 'Partial Paid', 'Overdue']);
		query.notEqualTo('status', 'Paid');
		//query.greaterThanOrEqualTo('invoiceDate', params.fromDate);
		//query.lessThanOrEqualTo('invoiceDate', params.toData);
		//query.select('invoiceNumber', 'customer', 'balanceDue', 'invoiceDate');
		query.include('customer');
		query.limit(1000);
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
		query.lessThanOrEqualTo('invoiceDate', params.toDate);
		//query.select('invoiceNumber', 'invoiceDate', 'customer', 'payment');
		query.include('customer', 'payment');
		query.limit(1000);
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
		query.lessThanOrEqualTo('expanseDate', params.toDate);
		query.select('category', 'amount');
		query.limit(1000);
		return query.find();
	}
};

}]);