'use strict';

invoicesUnlimited.factory('invoiceFactory', function($q){
	return {
		test : function() {
			console.log("working");
		},
		getPreferences : function(user) {
			var organization = getOrganization(user);
			if (! organization)	return;

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
		}

	};

	function getOrganization (user) {
		var organizationArray = user.get("organizations");
		if (!organizationArray) {
			var message = 'user: ' + user.id + ' has no Organization assigned.'
			console.log(message);
			return undefined;
		}
		else return organizationArray[0];
	}

});
