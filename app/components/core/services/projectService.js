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
        query.include('tasks');

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
        query.include('tasks');

		return query.get(projectId)
		.then(function(projObj) {
			var project = new projectFactory(projObj, {
				operation : 'getProject'
			});
			return project;
		});
	},
	createNewProject : function(project, role, tasks, users) {
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
        
        
        return createTasks(tasks, params)
        .then(function(objs){
            obj.set("tasks", objs);
            
            return createStaffUsers(users, params)
            .then(function(userObjs){
                obj.set("users", userObjs);
                return obj.save()
                .then(function(projObj) {
                    console.log("project created successfully");
                    return projObj;
                });
            });
            
        });
        
        
	},
	updateProject : function(projectObj, user, role, tasks) {
		
		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);

		var otherData = {
			acl : acl,
			user : user,
			organization : user.get('organizations')[0],
		};

        return createTasks(tasks, otherData)
        .then(function(objs){
            projectObj.entity.set("tasks", objs);
            return projectObj.entity.save()
            .then(function(projObj) {
                return projObj;
            });
        });
        
	}
};

function createTasks (tasks, params) {
	params.tasks = [];
    var existingTasks = [];
	tasks.forEach(function (task) {
        if(task.entity){
                existingTasks.push(task.entity);
        }
        else{
            var obj = {
                taskName : task.taskName,
                taskDescription : task.taskDescription
            };
            params.tasks.push(obj);
        }
	});
    
    Parse.Promise.as([]);

    var parseTasks = [];
    var Task = Parse.Object.extend('Task');

    params.tasks.forEach(function(task) {
        var obj = new Task();
        obj.set('userID', params.user);
        obj.set('organization', params.organization);
        obj.setACL(params.acl);
        obj.set('taskName', task.taskName);
        obj.set('taskDescription', task.taskDescription);

        parseTasks.push(obj);
    });

    return Parse.Object.saveAll(parseTasks).then(function(tasks) {
        return tasks.concat(existingTasks);
    });
}
function createStaffUsers (users, params) {
    
    Parse.Promise.as([]);

    var parseUsers = [];
    var Staff = Parse.Object.extend('Staff');

    users.forEach(function(user) {
        var obj = new Staff();
        obj.set('userID', params.user);
        obj.set('organization', params.organization);
        obj.setACL(params.acl);
        obj.set('chosenUser', user);

        parseUsers.push(obj);
    });

    return Parse.Object.saveAll(parseUsers).then(function(staffObjs) {
        return staffObjs;
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
