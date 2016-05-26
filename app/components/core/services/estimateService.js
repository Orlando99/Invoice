'use strict';

invoicesUnlimited.factory('estimateFactory', function($q){
	return {
		test : function() {
			console.log("working");
		},
		getEstimates : function(user) {
			var organization = getOrganization(user);
			if (! organization) {
				var message = 'user: ' + user.id + ' has no Organization assigned.'
				return Parse.Promise.error(message);
			}

			// get other fields,
			var estimateTable = Parse.Object.extend("Estimates");
			var query = new Parse.Query(estimateTable);

			query.equalTo("organization", organization);
			query.limit(2);
			query.select("estimateNumber", "customer", "estimateDate",
				"totalAmount", "status", "referenceNumber");

			return query.find().then(function(estimateObjs) {
				var estimates = [];
				var customerIds = [];
				for (var i = 0; i < estimateObjs.length; ++i) {
					var estimate = {};
					estimate.estimateNum = estimateObjs[i].get("estimateNumber");
					estimate.estimateDate = estimateObjs[i].get("estimateDate");
					estimate.referenceNo = estimateObjs[i].get("referenceNumber");
					estimate.amount = estimateObjs[i].get("totalAmount");
					estimate.status = estimateObjs[i].get("status");

					// select css class for status
					switch(estimate.status) {
						case "Draft":
							estimate.statusClass = "text-color-normalize";
							break;
						case "Invoiced":
							estimate.statusClass = "text-positive";
							break;
						default:
							estimate.statusClass = "text-color-normalize";
					}

					estimates.push(estimate);

					// save customer ids to fetch display names later
					customerIds.push(estimateObjs[i].get("customer").id);
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
								estimates[i].customerName = customerObjs[j].get("displayName");
								break;
							}
						}
					}
				});

				return estimates;
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
