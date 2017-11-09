'use strict';

invoicesUnlimited.factory('preferencesFactory',["userFactory","roleFactory",
	function(userFactory,roleFactory) {
	
	var user = userFactory;

	var preferences = {
		entity 		: []
	};

	var fields = [
		"invoiceShippingCharges",
		"creditNotes",
		"invoiceThanksNotes",
		"creditTerms",
		"invoiceDiscount",
		"invoiceNotes",
		"estimateNotes",
		"invoiceTerms",
		"estimateTerms",
		"invoiceAdjustments",
		"invoiceSalesPerson",
		"invoiceAg",
		"estimateAg",
		"creditAg"
	]

	var loadPreferences = function(){
		
		if (!userFactory.entity.length) return;

		var query = new Parse.Query("Preferencies");
		query.equalTo('userID',userFactory.entity[0]);

		return query.
		first()
		.then(function(object){
			setObjectOperations({
				object 		: object,
				fields 		: fields});
			preferences.entity.pop();
			preferences.entity.push(object);
			return preferences;
		},function(error){
			console.log(error.message);
		});
	}

	preferences.clearAllOnLogOut = function(){
		preferences.entity.length = 0;
	}

	preferences.load = function(){
		if (preferences.entity.length) return preferences;
		return loadPreferences();
	}

	preferences.createNew = function(params){
		if (preferences.entity.length) return;
		var ctr = Parse.Object.extend("Preferencies");
		var object = new ctr();
		object.setACL(roleFactory.createACL());
		return object.save(params,{
			success : function(obj){
				setObjectOperations({
					object 		: obj,
					fields 		: fields});
				preferences.entity.push(obj);
				console.log(obj.className + ' created');
			},
			error : function(obj,error){
				console.log(error.message);
			}
		});
	}

	return preferences;

}]);