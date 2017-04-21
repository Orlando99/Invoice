'use strict';

invoicesUnlimited.factory('taxService', function($q){
	return {
		getTaxes : function(user, callback){
			showLoader();
			var organization = getOrganization(user);
			if (! organization){
				hideLoader();
				callback([]);
				return;
			}

			var taxData = new Parse.Query("Tax");
			var taxDfr = $q.defer();
			taxData.equalTo("organization", organization);
			taxData.find().then(function(results){
				taxDfr.resolve(results);
		   	}, function(error){
				taxDfr.reject(results);
		   	});
			taxDfr.promise
				.then(function(results){
					var taxes = [];
					for (var i = 0; i < results.length; ++i){
						 var obj = results[i];
						 taxes.push({
							id: obj.id,
							name: obj.get("title") +
								(obj.get("type") == 2 ? ' (Tax Group)' : ''),
							rate: obj.get("value"),
							type: obj.get("type"),
							isCompound: Boolean(obj.get("compound")),
							compound: obj.get("compound"),
                             entity: obj
						 });
					}
					hideLoader();
					callback(taxes);
				})
				.catch(function(error){
					hideLoader();
					callback([]);
				});
		},
        saveNewGroupTax : function(params, callback) {
			// find organization of current user
			var organization = getOrganization(params.user);
			if (! organization)	return;

			// set key,values to insert
			params.userID = params.user;
			delete params.user;
			params.organization = organization;
			params.type = 2;	// 1 = tax, 2 = tax group

			var acl = new Parse.ACL();
			//acl.setRoleWriteAccess(role.get("name"), true);
			//acl.setRoleReadAccess(role.get("name"), true);

			acl.setPublicReadAccess(true);
			acl.setPublicWriteAccess(true);

			var Tax = Parse.Object.extend("Tax");
			var tax = new Tax();
			tax.setACL(acl);
			tax.save(params,{
				success: function(object){
					callback(object);
					//callback("New Tax created with objectId: " + object.id);
				},
				error: function(object, error){
					callback("Failed to create new Tax, error code:" + error.message);
				}
			});
		},
		saveNewTax : function(params, callback) {
			// find organization of current user
			var organization = getOrganization(params.user);
			if (! organization)	return;

			// set key,values to insert
			params.userID = params.user;
			delete params.user;
			params.organization = organization;
			params.type = 1;	// 1 = tax, 2 = tax group

			var acl = new Parse.ACL();
			//acl.setRoleWriteAccess(role.get("name"), true);
			//acl.setRoleReadAccess(role.get("name"), true);

			acl.setPublicReadAccess(true);
			acl.setPublicWriteAccess(true);

			var Tax = Parse.Object.extend("Tax");
			var tax = new Tax();
			tax.setACL(acl);
			tax.save(params,{
				success: function(object){
					callback(object);
					//callback("New Tax created with objectId: " + object.id);
				},
				error: function(object, error){
					callback("Failed to create new Tax, error code:" + error.message);
				}
			});
		},
		saveEditedTax : function (params) {
			var taxTable = Parse.Object.extend("Tax");
			var query = new Parse.Query(taxTable);
			
			return query.get(params.taxId).then(function(taxObj) {
				var oldTaxRate = taxObj.get("value");
				var rateDiff = Number(params.taxRate) - oldTaxRate;
				return saveEditedTaxGetSuccess(taxObj, params)
					.then(function(){
						return updateTaxGroupValue(rateDiff, taxObj, taxTable);
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

	function saveEditedTaxGetSuccess(taxObj, params) {
		taxObj.set("title", params.taxName);
		taxObj.set("value", Number(params.taxRate));
		taxObj.set("compound", (params.isCompound ? 1 : 0));

		return taxObj.save().then(function(taxObj){
			console.log("taxId: " + taxObj.id + " updated.");
		});
	}

	function updateTaxGroupValue(rateDiff, taxObj, taxTable) {
		var queryGroup = new Parse.Query(taxTable);
		queryGroup.equalTo("type", 2);

		return queryGroup.find().then(function(grps){
			for (var i = 0; i < grps.length; ++i) {
				var taxList = grps[i].get("associatedTaxes");
				for (var j = 0; j < taxList.length; ++j) {
					if (taxList[j].id == taxObj.id) {
						var prev = grps[i].get("value");
						grps[i].set("value", (prev + rateDiff));
						grps[i].save().then(function(x){
							console.log("Tax Group: " + x.id + " updated.");
						});
						break;
					}
				}
			}
		});

	}

});