'use strict';

invoicesUnlimited.factory('creditNoteFactory', function($q){
	return {
		test : function() {
			console.log("working");
		},
		getCreditNotes : function(user) {
			var organization = getOrganization(user);
			if (! organization) {
				var message = 'user: ' + user.id + ' has no Organization assigned.'
				return Parse.Promise.error(message);
			}

			// get other fields,
			var creditNotesTable = Parse.Object.extend("CreditNotes");
			var query = new Parse.Query(creditNotesTable);

			query.equalTo("organization", organization);
			query.limit(2);
			query.select("creditNumber", "customer", "creditNoteDate",
				"total", "status", "remainingCredits", "reference");

			return query.find().then(function(creditNoteObjs) {
				var creditNotes = [];
				var customerIds = [];
				for (var i = 0; i < creditNoteObjs.length; ++i) {
					var creditNote = {};
					creditNote.creditNoteNum = creditNoteObjs[i].get("creditNumber");
					creditNote.creditNoteDate = creditNoteObjs[i].get("creditNoteDate");
					creditNote.balance = creditNoteObjs[i].get("remainingCredits");
					creditNote.amount = creditNoteObjs[i].get("total");
					creditNote.referenceNo = creditNoteObjs[i].get("reference");
					creditNote.status = creditNoteObjs[i].get("status");

					// select css class for status
					switch(creditNote.status) {
						case "Open":
							creditNote.statusClass = "text-positive";
							break;
						case "Closed":
							creditNote.statusClass = "text-danger";
							break;
						default:
							creditNote.statusClass = "text-color-normalize";
					}

					creditNotes.push(creditNote);

					// save customer ids to fetch display names later
					customerIds.push(creditNoteObjs[i].get("customer").id);
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
								creditNotes[i].customerName = customerObjs[j].get("displayName");
								break;
							}
						}
					}
				});

				return creditNotes;
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
