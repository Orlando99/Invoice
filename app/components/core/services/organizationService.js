'use strict';

invoicesUnlimited.factory('organizationFactory',["userFactory",
	function(userFactory) {
	
	var user = userFactory;

	var organization = {
		entity 		: [],
		entities 	: []
	};

	var fields = [
		"creditNumber",
		"portalURL",
		"dateFormat",
		"fiscalYearStart",
		"name",
		"fieldSeparator",
		"estimateNumber",
		"invoiceNumber",
		"companyAddress",
		"language",
		"timeZone",
		"email"
	]

	var fetchObject = function(pointer,field) {
		return pointer
		.fetch()
		.then(function(object){
			setObjectOperations({
				object 		: object,
				fieldName	: field,
				parent 		: user.entity.length ? 
							  user.entity[0] : 
							  null,
				fields 		: fields});

			if (field == "entity") organization[field].pop();	
			
			organization[field].push(object);
			return organization;
		},function(error){
			console.log(error.message);
		});
	}

	var loadSelectedOrg = function() {
		var fieldName = "selectedOrganization", org_p;
		if (user.get) org_p = user.get(fieldName);
		else if (user.entity[0] && 
				 user.entity[0].get)
			org_p = user.entity[0].get(fieldName);

		if (!org_p) {
			organization.empty = true;
			return org_p;
		}

		return fetchObject(org_p,'entity');
	}

	var loadAllOrgs = function() {
		var fieldName = "organizations", org_p;
		if (user.get) org_p = user.get(fieldName);
		else if (user.entity[0] && 
				 user.entity[0].get)
			org_p = user.entity[0].get(fieldName);

		if (!org_p) {
			organization.empty = true;
			return org_p;
		}

		var promises = org_p.map(function(obj){
			return fetchObject(obj,'entities');
		});

		return Parse.Promise.when(promises);
	}

	organization.clearAllOnLogOut = function(){
		organization.entity.length = 0;
		organization.entities.length = 0;
	}

	organization.load = function(){
		if (organization.entity.length) return organization;
		return loadSelectedOrg();
	}

	organization.createNew = function(params){
		if (organization.entity.length) return;
		var ctor = Parse.Object.extend("Organization");
		var object = new ctor();
		return object.save(params,{
			success : function(obj){
				setObjectOperations({
					object 		: obj,
					fieldName	: "selectedOrganization",
					parent 		: user.entity.length ?
								  user.entity[0] :
								  null,
					fields 		: fields});
				organization.entity.push(obj);
				console.log(obj.className + ' created');
			},
			error : function(obj,error){
				console.log(error.message);
			}
		})
		.then(function(obj){
			user.entity[0].add('organizations',obj);
			return [user.save({
				selectedOrganization : obj
			}),obj];
		},errorCallback)
		.then(function(res){
			return res[1];
		},errorCallback);
	}

	organization.createNewWithoutSelect = function(params){
		if (organization.entity.length) return;
		var ctor = Parse.Object.extend("Organization");
		var object = new ctor();
		return object.save(params,{
			success : function(obj){
				setObjectOperations({
					object 		: obj,
					fields 		: fields});
				organization.entities.push(obj);
				console.log(obj.className + ' created');
			},
			error : function(obj,error){
				console.log(error.message);
			}
		})
		.then(function(obj){
			user.entity[0].add('organizations',obj);
			return [user.save(),obj];
		},errorCallback)
		.then(function(res){
			return res[1];
		},errorCallback);
	}

	return organization;

}]);