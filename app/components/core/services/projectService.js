'use strict';

invoicesUnlimited.factory('projectService', ['projectFactory', 'itemService', 'currencyFilter',
function(projectFactory, itemService, currencyFilter){

return {
	test : function() {
		console.log("working");
	},
    listProjects : function(user) {
		var organization = getOrganization(user);
		if (! organization)	return;

		var projectTable = Parse.Object.extend("Projects");
		var query = new Parse.Query(projectTable);

		query.equalTo("organization", organization);
		query.include("customer");

		return query.find().then(function(projectObjs) {
			var projects = [];
			projectObjs.forEach(function(project) {
				projects.push(new projectFactory(project, {
					operation : "listProjects"
				}));
			});
			return projects;
		});

	},
    
	getProjectDetails : function(projectId) {
		var Project = Parse.Object.extend('Projects');
		var query = new Parse.Query(Project);
		query.include('customer');

		return query.get(projectId)
		.then(function(projObj) {
			var project = new projectFactory(projObj, {
				operation : 'details'
			});
			return project;
		});
	},
	getProject : function(projectId) {
		var Project = Parse.Object.extend('Projects');
		var query = new Parse.Query(Project);
		query.include('customer');

		return query.get(projectId)
		.then(function(projObj) {
			var project = new projectFactory(projObj, {
				operation : 'getProject'
			});
			return project;
		});
	},
	createNewProject : function(project, role) {
		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);
		
		var params = {
			user : project.userID,
			organization : project.organization,
			acl : acl
		};
        
        var obj = new Parse.Object("Projects", project);
        obj.setACL(acl);

        return obj.save()
        .then(function(projObj) {
            console.log("project created successfully");
            return projObj;
        });
	},
	updateProject : function(projectObj, user, role) {
		
		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);

		var otherData = {
			acl : acl,
			user : user,
			organization : user.get('organizations')[0],
		};

        return projectObj.entity.save()
		.then(function(projObj) {
			return projObj;
		});
	}
};

function createNewItems (items, params) {
	params.items = [];
	items.forEach(function (item) {
		var obj = {
			title : item.selectedItem.entity.title,
			rate : item.selectedItem.entity.rate,
			expenseId : item.selectedItem.entity.expanseId
		};
		if (item.selectedItem.tax)
			obj.tax = item.selectedItem.tax;

		params.items.push(obj);
	});

	return itemService.createItems(params)
	.then(function(newItems) {
		for (var i = 0; i < items.length; ++i) {
			items[i].selectedItem = newItems[i];
		}
		return items;
	});
}

function getOrganization (user) {
	var organizationArray = user.get("organizations");
	if (!organizationArray) {
		return undefined;
	}
	else return organizationArray[0];
}

}]);
