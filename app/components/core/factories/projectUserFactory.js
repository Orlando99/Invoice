'use strict';

invoicesUnlimited.factory('projectUserFactory',["userFactory","appFields",
	function(userFactory,appFields){

	var user = userFactory;
	if (!user.entity.length) return {};

	var projectUser = {
		entities : []
	}

	projectUser.clearAllOnLogOut = function() {
		if (user.entity.length) throw "User should be logged out first!";
		projectUser.entities.length = 0;
	};

	projectUser.prepareNew = function() {
		var ctor = Parse.Object.extend('ProjectUser');
		var prUser = new ctor();
		setObjectOperations({
			object : prUser,
			fields : appFields.projectUser
		});
		return prUser;
	};

	projectUser.saveNew = function(obj,props) {
		return obj.save(props ? props : null)
		.then(function(o){
			setObjectOperations({
				object : o,
				fields : appFields.projectUser
			});
			projectUser.entities.push(o);
			return o;
		},function(e){
			console.log(e.message);
		});
	};

	projectUser.createNew = function(params) {
		var prUser = projectUser.prepareNew();
		return projectUser.saveNew(prUser,params);
	};

	var loadAll = function(){
		var query = new Parse.Query('ProjectUser');
		query.equalTo('userID',user.entity[0]);
		
		var queryOrg = new Parse.Query('ProjectUser');
		queryOrg.equalTo('organization',user.entity[0].get('selectedOrganization'));
		
		var finalQuery = Parse.Query.or(query, queryOrg);
		
		return finalQuery.find()
		.then(function(res){
			projectUser.entities = res.map(function(obj){
				setObjectOperations({
					object : obj,
					fields : appFields.projectUser
				});
				return obj;
			});
			return projectUser.entities;
		},function(e){
			console.log(e.message);
		});
	};

	projectUser.getAll = function(params) {
		if ((params && params.reload) ||
			(!params && !projectUser.entities.length))
			return loadAll();
		return Parse.Promise.as(projectUser.entities);
	};
	
	projectUser.getByUsername = function(username) {
		var query = new Parse.Query('ProjectUser');
		query.equalTo('userName',username);
		
		return query.first();
	};

	return projectUser;

}]);