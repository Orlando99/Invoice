'use strict';

invoicesUnlimited.factory('invoiceFactory', function($q){
	return {
		test : function() {
			console.log("working");
		},
		getPreferences : function(user) {
			var organization = getOrganization(user);
			if (! organization) {
				var message = 'user: ' + user.id + ' has no Organization assigned.'
				return Parse.Promise.error(message);
			}

			var prefs = {};
			var prefTable = Parse.Object.extend("Preferencies");
			var query = new Parse.Query(prefTable);
			query.equalTo("organization", organization);

			return query.first().then(function(prefObj) {
			//	var prefObj = prefObjs[0];
				prefs.discount = prefObj.get("invoiceDiscount");
				prefs.numAutoGen = prefObj.get("invoiceAg");
				prefs.shipCharges = prefObj.get("invoiceShippingCharges");
				prefs.adjustments = prefObj.get("invoiceAdjustments");
				prefs.salesPerson = prefObj.get("invoiceSalesPerson");
				prefs.thanksNote = prefObj.get("invoiceThanksNotes");
				prefs.notes = prefObj.get("invoiceNotes");
				prefs.terms = prefObj.get("invoiceTerms");

			}).then(function() {
				var orgTable = Parse.Object.extend("Organization");
				query = new Parse.Query(orgTable);
				query.select("dateFormat", "invoiceFields", "invoiceNumber");

				return query.get(organization.id).then(function(orgObj) {
					prefs.dateFormat = orgObj.get("dateFormat");
					prefs.customFields = orgObj.get("invoiceFields");
					prefs.invoiceNumber = orgObj.get("invoiceNumber");

				}).then(function() {
					return prefs;
				});

			});
		},
		getInvoices : function(user) {
			var organization = getOrganization(user);
			if (! organization)	return;

			// get other fields,
			var invoiceTable = Parse.Object.extend("Invoices");
			var query = new Parse.Query(invoiceTable);

			query.equalTo("organization", organization);
			query.limit(2);
			query.select("invoiceNumber", "customer", "invoiceDate", "dueDate",
				"total", "balanceDue", "status");

			return query.find().then(function(invoiceObjs) {
				var invoices = [];
				var customerIds = [];
				for (var i = 0; i < invoiceObjs.length; ++i) {
					var invoice = {};
					invoice.invoiceNum = invoiceObjs[i].get("invoiceNumber");
					invoice.invoiceDate = invoiceObjs[i].get("invoiceDate");
					invoice.dueDate = invoiceObjs[i].get("dueDate");
					invoice.amount = invoiceObjs[i].get("total");
					invoice.balance = invoiceObjs[i].get("balanceDue");
					invoice.status = invoiceObjs[i].get("status");

					// select css class for status
					switch(invoice.status) {
						case "Unpaid":
							invoice.statusClass = "text-color-normalize";
							break;
						case "Paid":
							invoice.statusClass = "text-positive";
							break;
						case "Overdue":
							invoice.statusClass = "text-danger";
							break;
						default:
							invoice.statusClass = "text-color-normalize";
					}

					invoices.push(invoice);

					// save customer ids to fetch display names later
					customerIds.push(invoiceObjs[i].get("customer").id);
				}
				// get customer display name
				var customerTable = Parse.Object.extend("Customer");
				var customerQuery = new Parse.Query(customerTable);
				customerQuery.containedIn("objectId", customerIds);
				customerQuery.select("displayName");
				customerQuery.find().then(function(customerObjs) {
					for (var i = 0; i < customerIds.length; ++i) {
						for (var j = 0; j < customerObjs.length; ++j) {
							if (customerIds[i] == customerObjs[j].id) {
								invoices[i].customerName = customerObjs[j].get("displayName");
								break;
							}
						}
					}
				});

				return invoices;
			});
		}

	};

	function getOrganization (user) {
		var organizationArray = user.get("organizations");
		if (!organizationArray) {
			return undefined;
		}
		else return organizationArray[0];
	}

});
