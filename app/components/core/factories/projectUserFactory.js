'use strict';

invoicesUnlimited.factory('projectUserFactory',
	function(userFactory,appFields){

	var user = userFactory;
	if (!user.entity.length) return {};

	var projectUser = {
		entities : []
	}

	projectUser.prepareNew = function() {
		var ctor = Parse.Object.extend('ProjectUser');
		var prUser = new ctor();
		setObjectOperations({
			object : prUser,
			fields : appFields.projectUser
		});
		return prUser;
	}

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
	}

	projectUser.createNew = function(params) {
		var prUser = projectUser.prepareNew();
		return projectUser.saveNew(prUser,params);
	}

	var loadAll = function(){
		var query = new Parse.Query('ProjectUser');
		query.equalTo('companyName',user.entity[0].company);
		query.include('userID');
		return query.find()
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
	}

	projectUser.getAll = function(params) {
		if ((params && params.reload) ||
			(!params && !projectUser.entities.length))
			return loadAll();
		return Parse.Promise.as(projectUser.entities);
	}

	return projectUser;

});