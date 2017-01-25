'use strict';

invoicesUnlimited.factory('projectService', ['projectFactory', 'itemService', 'currencyFilter',
function(projectFactory, itemService, currencyFilter){

return {
	test : function() {
		console.log("working");
	},
    checkProjectNameAvailable : function(params) {
		var projectTable = Parse.Object.extend('Projects');
		var query = new Parse.Query(projectTable);
		query.equalTo('organization', params.organization);
		query.equalTo('projectName', params.projectName);
		query.select('projectName');

		return query.first()
		.then(function(obj) {
			return obj ? false : true;
		});
	},
    listProjects : function(user) {
		var organization = getOrganization(user);
		if (! organization)	return;

		var projectTable = Parse.Object.extend("Projects");
		var query = new Parse.Query(projectTable);

		query.equalTo("organization", organization);
		query.include("customer");
        query.include('users.chosenUser');

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
        query.include('users.chosenUser');
        query.include('timeSheets.task');
        query.include('timeSheets.user');

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
        query.include('users.chosenUser');
        query.include('timeSheets.task');
        query.include('timeSheets.user');
        query.include('timesheets');

		return query.get(projectId)
		.then(function(projObj) {
			var project = new projectFactory(projObj, {
				operation : 'getProject'
			});
			return project;
		});
	},
	createNewProject : function(project, role, users, timesheets) {
		var acl = new Parse.ACL();
		//acl.setRoleWriteAccess(role.get("name"), true);
		//acl.setRoleReadAccess(role.get("name"), true);
		
        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(true);
        
		var params = {
			user : project.userID,
			organization : project.organization,
			acl : acl
		};
        
        var obj = new Parse.Object("Projects", project);
        obj.setACL(acl);
        
        return createTimesheets(timesheets, params)
        .then(function(sheetsObjs){
            obj.set("timeSheets", sheetsObjs);
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
	updateProject : function(projectObj, user, role, timesheets, staffUsers) {
		
		var acl = new Parse.ACL();
		//acl.setRoleWriteAccess(role.get("name"), true);
		//acl.setRoleReadAccess(role.get("name"), true);

        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(true);
        
		var otherData = {
			acl : acl,
			user : user,
			organization : user.get('organizations')[0],
		};

        return createTimesheets(timesheets, otherData)
        .then(function(objs){
            projectObj.entity.set("timeSheets", objs);
            return createStaffUsers(staffUsers, otherData)
            .then(function(userObjs){
                projectObj.entity.set("users", userObjs);
                return projectObj.entity.save()
                .then(function(projObj) {
                    console.log("project created successfully");
                    return projObj;
                });
            });
        });
	}
};

function createTimesheets (timesheets, params) {
	params.timesheets = [];
	
    Parse.Promise.as([]);
    var existing = [];
    var parseTasks = [];
    var Timesheet = Parse.Object.extend('Timesheets');

    timesheets.forEach(function(timesheet) {
        if(timesheet.attributes){
            existing.push(timesheet);
        } else {
            var obj = new Timesheet();
            obj.set('userID', params.user);
            obj.set('organization', params.organization);
            obj.setACL(params.acl);
            obj.set('user', timesheet.user);
            obj.set('task', timesheet.task);
            obj.set('date', timesheet.date);
            obj.set('notes', timesheet.notes);
            //obj.set('timeSpent', timesheet.timeSpent);
            obj.set('hoursSpent', timesheet.hoursSpent);
            obj.set('minutesSpent', timesheet.minutesSpent);

            parseTasks.push(obj);
        }
    });

    return Parse.Object.saveAll(parseTasks).then(function(sheets) {
        return sheets.concat(existing);
    });
}
    
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
    var existingUsers = [];
    var Staff = Parse.Object.extend('Staff');

    users.forEach(function(user) {
        if(user.entity){
            user.entity.set('chosenUser', user.user);
            user.entity.staffHours = user.staffHours;
            existingUsers.push(user.entity);
        } else {
            var obj = new Staff();
            obj.set('userID', params.user);
            obj.set('organization', params.organization);
            obj.setACL(params.acl);
            obj.set('chosenUser', user.user);
            obj.set('staffHours', user.staffHours);

            parseUsers.push(obj);
        }
    });

    return Parse.Object.saveAll(parseUsers.concat(existingUsers)).then(function(staffObjs) {
        return staffObjs;
    });
    
    /*
    return Parse.Object.saveAll(parseUsers).then(function(staffObjs) {
        return staffObjs.concat(existingUsers);
    });
    */
}
function getOrganization (user) {
	var organizationArray = user.get("organizations");
	if (!organizationArray) {
		return undefined;
	}
	else return organizationArray[0];
}

}]);
