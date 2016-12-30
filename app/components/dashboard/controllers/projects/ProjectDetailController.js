'use strict';

invoicesUnlimited.controller('ProjectDetailController',
	['$q', '$scope', '$state', '$sce', '$controller', 'userFactory',
		'projectService', 'coreFactory', 'projectUserFactory', 'commentFactory', 'currencyFilter', 'appFields',

function($q, $scope, $state, $sce, $controller, userFactory,
	projectService, coreFactory, projectUserFactory, commentFactory, currencyFilter, appFields) {

if(! userFactory.entity.length) {
	console.log('User not logged in');
	return undefined;
}

var user = userFactory.entity[0];
var organization = user.get("organizations")[0];
$controller('DashboardController',{$scope:$scope,$state:$state});

coreFactory.getUserRole(user)
	.then(function(role) {
		$scope.userRole = role;
	});
    
    userFactory.getField('dateFormat')
	.then(function(obj) {
		$scope.dateFormat = obj;
	});
    
    projectUserFactory.getAll()
    .then(function(users){
		$scope.users = users.map(function(el){
			setObjectOperations({
				object 		: el,
				fields 		: appFields.projectUser
			});
			return el;
		});
        //$scope.users.push(createUserOpener);
        showProjectDetail();
	});
    
    
$('#addTaskForm').validate({
	rules: {
		newTaskName : 'required'
	},
	messages: {
		newTaskName : 'Please enter task name'
	}
});
    
$('#addUserForm').validate({
	rules: {
		newUser : 'required'
	},
	messages: {
		newUser : 'Please select a user'
	}
});
    
$('#addTimesheetForm').validate({
	rules: {
		timesheetDate : 'required',
		timesheetHours : {
            required : true,
            digits : true,
            min : 0
        },
		timesheetMinutes : {
            required : true,
            digits : true,
            min : 0,
            max : 59
        },
        timesheetUser : 'required',
        timeSheetTask : 'required'
	},
	messages: {
		timesheetDate : 'Please select a date',
		timesheetHours : {
            required : "Please enter hours",
            digits : "Enter valid hours",
            min : "Please enter valid hours"
        },
		timesheetMinutes : {
            required : "Please enter minutes",
            digits : "Enter valid minutes",
            min : "Please enter valid minutes",
            max : "Minutes must be less than 60"
        },
        timesheetUser : 'Please select user',
        timeSheetTask : 'Please select task'
	}
});

function showProjectDetail() {
	var projectId = $state.params.projectId;
	if (! projectId) return;

    var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY',
		'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
	var colors = ['#0ea81c', '#c31e1e']
	var monthlyBillabel   = [0,0,0,0,0,0,0,0,0,0,0,0];
	var monthlyUnbilled  = [0,0,0,0,0,0,0,0,0,0,0,0];
    
	showLoader();
	$q.when(projectService.getProjectDetails(projectId))
	.then(function(project) {
	//	console.log(estimate);
		$scope.project = project.entity;
        $scope.customer = project.entity.get("customer");
        $scope.tasks = project.tasks;
        $scope.staff = project.users;
        $scope.actualProject = project;
        
        if($scope.staff)
            $scope.staff.forEach(function(obj){
                for(var i = 0; i < $scope.users.length; ++i){
                    if($scope.users[i].id == obj.user.id){
                        $scope.users.splice(i, 1);
                        break;
                    }
                }
            });
        
        $scope.unbilledHours = 0;
        $scope.billedHours = 0;
        $scope.billableHours = 0;
        
        var totalHours = 0;
        var totalMinutes = 0;
        
        var hours = 0;
        var minutes = 0;
        
        var billedHours = 0;
        var billedMinutes = 0;
        
        if(project.timesheets){ 
            project.timesheets.forEach(function(obj){
                var hh = obj.get('hoursSpent');
                var mm = obj.get('minutesSpent');
                
                if($scope.staff)
                    $scope.staff.forEach(function(usr){
                        if(usr.user.userName == obj.get('user').get('userName')){
                            if(usr.loggedHours){
                                usr.loggedHours += hh;
                                usr.loggedHours += parseInt(((usr.loggedMinutes + mm) / 60).toFixed(0));
                                usr.loggedMinutes = ((usr.loggedMinutes + mm) % 60);
                            }
                            else{
                                usr.loggedHours = hh + parseInt((mm / 60).toFixed(0));
                                usr.loggedMinutes = mm % 60;
                                usr.unbilledHours = 0;
                                usr.unbilledMinutes = 0;
                                usr.unbilledTime = '00:00';
                            }
                            
                            if(!obj.get('isBilled')){
                                usr.unbilledHours += hh;
                                usr.unbilledHours += parseInt(((usr.unbilledMinutes + mm) / 60).toFixed(0));
                                usr.unbilledMinutes = ((usr.unbilledMinutes + mm) % 60);

                                var tempHours = usr.unbilledHours < 10 ? '0' + usr.unbilledHours : usr.unbilledHours + '';
                                var tempMin = usr.unbilledMinutes < 10 ? '0' + usr.unbilledMinutes : usr.unbilledMinutes + '';
                                usr.unbilledTime = numberWithCommas(tempHours) + ':' + tempMin;
                            }
                            
                            var tempHours = usr.loggedHours < 10 ? '0' + usr.loggedHours : usr.loggedHours + '';
                            var tempMin = usr.loggedMinutes < 10 ? '0' + usr.loggedMinutes : usr.loggedMinutes + '';
                            usr.loggedTime = numberWithCommas(tempHours) + ':' + tempMin;

                        }
                        else if(!usr.loggedHours){
                            usr.loggedHours = 0;
                            usr.loggedMinutes = 0;
                            usr.loggedTime = "00:00";
                            usr.unbilledHours = 0;
                            usr.unbilledMinutes = 0;
                            usr.unbilledTime = '00:00';
                        }

                    });
                
                if($scope.tasks)
                    $scope.tasks.forEach(function(tsk){
                        if(!tsk.loggedHours){
                            tsk.loggedHours = 0;
                            tsk.loggedMinutes = 0;
                            tsk.billedHours = 0;
                            tsk.billedMinutes = 0;
                            tsk.unbilledHours = 0;
                            tsk.unbilledMinutes = 0;
                            tsk.loggedTime = '00:00';
                            tsk.billedTime = '00:00';
                            tsk.unbilledTime = '00:00';
                        }

                        if(tsk.entity.id == obj.get('task').id){
                            tsk.loggedHours += hh;
                            tsk.loggedHours += parseInt(((tsk.loggedMinutes + mm) / 60).toFixed(0));
                            tsk.loggedMinutes = ((tsk.loggedMinutes + mm) % 60);

                            var tempHours = tsk.loggedHours < 10 ? '0' + tsk.loggedHours : tsk.loggedHours + '';
                            var tempMin = tsk.loggedMinutes < 10 ? '0' + tsk.loggedMinutes : tsk.loggedMinutes + '';
                            tsk.loggedTime = numberWithCommas(tempHours) + ':' + tempMin;

                            if(obj.get('isBilled')){
                                tsk.billedHours += hh;
                                tsk.billedHours += parseInt(((tsk.billedMinutes + mm) / 60).toFixed(0));
                                tsk.billedMinutes = ((tsk.billedMinutes + mm) % 60);

                                tempHours = tsk.billedHours < 10 ? '0' + tsk.billedHours : tsk.billedHours + '';
                                tempMin = tsk.billedMinutes < 10 ? '0' + tsk.billedMinutes : tsk.billedMinutes + '';
                                tsk.billedTime = numberWithCommas(tempHours) + ':' + tempMin;
                            }
                            else{
                                tsk.unbilledHours += hh;
                                tsk.unbilledHours += parseInt(((tsk.unbilledMinutes + mm) / 60).toFixed(0));
                                tsk.unbilledMinutes = ((tsk.unbilledMinutes + mm) % 60);

                                tempHours = tsk.unbilledHours < 10 ? '0' + tsk.unbilledHours : tsk.unbilledHours + '';
                                tempMin = tsk.unbilledMinutes < 10 ? '0' + tsk.unbilledMinutes : tsk.unbilledMinutes + '';
                                tsk.unbilledTime = numberWithCommas(tempHours) + ':' + tempMin;
                            }

                        }   
                    });
                
                var sheetDate = obj.get('date');
                var mon = sheetDate.getMonth();
                
                monthlyBillabel[mon] += (hh + parseInt((mm/60).toFixed(0)));
                
                if(obj.get('isBilled')){
                    billedHours += hh;
                    billedMinutes += mm;
                }
                else{
                    hours += hh;
                    minutes += mm;
                    monthlyUnbilled[mon] += (hh + parseInt((mm/60).toFixed(0)));
                }
                
                
                hh += parseInt((mm/60).toFixed(0));
                mm = mm % 60;
                hh = hh < 10 ? '0' + hh : '' + hh
                mm = mm < 10 ? '0' + mm : '' + mm
                obj.time = numberWithCommas(hh) + ':' + mm;
            });
            
            if(project.timesheets.length < 1){
                if($scope.staff)
                    $scope.staff.forEach(function(usr){
                        if(!usr.loggedHours){
                            usr.loggedHours = 0;
                            usr.loggedMinutes = 0;
                            usr.loggedTime = "00:00";
                            usr.unbilledHours = 0;
                            usr.unbilledMinutes = 0;
                            usr.unbilledTime = '00:00';
                        }    
                    });

                if($scope.tasks)
                    $scope.tasks.forEach(function(tsk){
                        if(!tsk.loggedHours){
                            tsk.loggedHours = 0;
                            tsk.loggedMinutes = 0;
                            tsk.billedHours = 0;
                            tsk.billedMinutes = 0;
                            tsk.unbilledHours = 0;
                            tsk.unbilledMinutes = 0;
                            tsk.loggedTime = '00:00';
                            tsk.billedTime = '00:00';
                            tsk.unbilledTime = '00:00';
                        }  
                    });
            }
        }
        else{
            if($scope.staff)
                $scope.staff.forEach(function(usr){
                    if(!usr.loggedHours){
                        usr.loggedHours = 0;
                        usr.loggedMinutes = 0;
                        usr.loggedTime = "00:00";
                        usr.unbilledHours = 0;
                        usr.unbilledMinutes = 0;
                        usr.unbilledTime = '00:00';
                    }    
                });

            if($scope.tasks)
                $scope.tasks.forEach(function(tsk){
                    if(!tsk.loggedHours){
                        tsk.loggedHours = 0;
                        tsk.loggedMinutes = 0;
                        tsk.billedHours = 0;
                        tsk.billedMinutes = 0;
                        tsk.unbilledHours = 0;
                        tsk.unbilledMinutes = 0;
                        tsk.loggedTime = '00:00';
                        tsk.billedTime = '00:00';
                        tsk.unbilledTime = '00:00';
                    }  
                });
        }
        
        totalHours = hours + billedHours;
        totalMinutes = minutes + billedMinutes;
        
        totalHours += (totalMinutes/60);
        totalMinutes = totalMinutes % 60;
        
        totalHours = totalHours < 10 ? "0" + totalHours.toFixed(0) : totalHours.toFixed(0);
        totalMinutes = totalMinutes < 10 ? "0" + totalMinutes.toFixed(0) : totalMinutes.toFixed(0);
        //$scope.billableHours = totalHours + ":" + totalMinutes;
        $scope.billableHours = numberWithCommas(totalHours) + ":" + totalMinutes;
        
        hours += (minutes/60);
        minutes = minutes % 60;
        
        hours = hours < 10 ? "0" + hours.toFixed(0) : hours.toFixed(0);
        minutes = minutes < 10 ? "0" + minutes.toFixed(0) : minutes.toFixed(0);
        $scope.unbilledHours = numberWithCommas(hours) + ":" + minutes;
        
        billedHours += (billedMinutes/60);
        billedMinutes = billedMinutes % 60;
        
        billedHours = billedHours < 10 ? "0" + billedHours.toFixed(0) : billedHours.toFixed(0);
        billedMinutes = billedMinutes < 10 ? "0" + billedMinutes.toFixed(0) : billedMinutes.toFixed(0);
        $scope.billedHours = numberWithCommas(billedHours) + ":" + billedMinutes;
        
        $scope.timesheets = project.timesheets;
 
        if($scope.project.billingMethod != 'Based on task hours')
            $('.task').addClass('tasks-detail');
        
        drawChart(months, monthlyBillabel, monthlyUnbilled, colors);
        
        hideLoader();
	});

}
    
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
    
function drawChart(months, billable, unbilled, colors){
    
    var fiscalMonth = organization.get('fiscalYearStart');
    var count = getrotateCount(fiscalMonth);
    
    months.rotate(count);
    billable.rotate(count);
    unbilled.rotate(count);
    
    var ctx = $("#projectchart");
		var myChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: months,
				datasets: [{
                    label:"Billable Hours",
					backgroundColor: colors[0],
					data: billable
				}, {
                     label:"Unbilled Hours",
					backgroundColor: colors[1],
					data: unbilled
				}]
			},
			options: {
				responsive: false,
                tooltipTemplate: "<%if (labels){%><%=labels%>:: <%}%><%= value %>",
                tooltips: {
                    mode: 'single',
                        custom: function(tooltip) {
                            // tooltip will be false if tooltip is not visible or should be hidden
                            if (!tooltip) {
                                return;
                            }
                            
                            tooltip.title = [];
                        },
                    callbacks: {
                        label:
                        function(item,data) {
							var value = data.datasets[item.datasetIndex].data[item.index];
							var label = data.labels[item.index];
							return [item.xLabel + ': ' + numberWithCommas(parseFloat(value).toFixed(0))];
							//return [item.xLabel + ': ' + $scope.currentCurrency.currencySymbol + numberWithCommas(parseFloat(value).toFixed(2))];
							//return [item.xLabel + ': ' + value];
						}
                    }
                },
				legend: {
					display: true,
                    position : 'bottom'
				},
				scales: {
					yAxes:
                    [{
						ticks: {
							beginAtZero:true
						}
					}]

				}
			}
		});
}
    
$scope.deleteProjectClicked = function(){
    $('.confirmation-pop-up').addClass('show');
}
    
$scope.deleteProject = function(){
    //alert('deleted');
    
    var staffToDelete = [];
    var tasksToDelete = [];
    
    if($scope.staff){
        $scope.staff.forEach(function(obj){
            staffToDelete.push(obj.entity);
        });
    }
    
    if($scope.tasks){
        $scope.tasks.forEach(function(obj){
            tasksToDelete.push(obj.entity);
        });
    }
    
    var sheetsToDelete = $scope.timesheets;
    
    var promise = [];
    var p;
    
    p = $q.when(Parse.Object.destroyAll(staffToDelete))
    .then(function(){
        
    });
    
    promise.push(p);
    
    p = $q.when(Parse.Object.destroyAll(tasksToDelete))
    .then(function(){
       
    });
    
    promise.push(p);
    showLoader();
    $q.all(promise)
    .then(function(){
        $scope.project.destroy()
        .then(function(){
            hideLoader();
            $state.go('dashboard.projects.all');
        });
    });
    
}

$scope.prepareToAddTask = function(){
    $('#addTaskForm')[0].reset();
}

$scope.prepareToAddTimesheet = function(){
    $scope.timesheetDate = new Date();
}

$scope.addNewTask = function() {
    if(!$('#addTaskForm').valid())
        return;
    
    showLoader();
    
    var acl = new Parse.ACL();
    acl.setRoleWriteAccess($scope.userRole.get("name"), true);
    acl.setRoleReadAccess($scope.userRole.get("name"), true);
    
    var Task = Parse.Object.extend('Task');
    
    var obj = new Task();
    obj.set('userID', user);
    obj.set('organization', organization);
    obj.setACL(acl);
    obj.set('taskName', $scope.newTaskName);
    obj.set('taskDescription', $scope.newTaskDescription);
    obj.set('taskCost', $scope.newTaskCost);

    return obj.save().then(function(task) {
        
        var temptasks = $scope.project.get('tasks');
        if(temptasks)
            temptasks.push(task);
        else{
            temptasks = [];
            temptasks.push(task);
        }
        $scope.project.set('tasks', temptasks);
        
        $scope.project.save()
        .then(function(onj){
            $(".new-task").removeClass('show');
            hideLoader();
            window.location.reload();
        });
    });
}

$scope.addNewUser = function(){
    if(!$('#addUserForm').valid())
        return;
    
    showLoader();
    
    var acl = new Parse.ACL();
    acl.setRoleWriteAccess($scope.userRole.get("name"), true);
    acl.setRoleReadAccess($scope.userRole.get("name"), true);
    
    var params = {
			user : user,
			organization : $scope.project.get('organization'),
			acl : acl
		};
    
    createStaffUsers($scope.newUser, params);
    
    //$scope.newUser = "";
}

function createStaffUsers (users, params) {
    
    Parse.Promise.as([]);

    var parseUsers = [];
    var Staff = Parse.Object.extend('Staff');

     var obj = new Staff();
    obj.set('userID', params.user);
    obj.set('organization', params.organization);
    obj.setACL(params.acl);
    obj.set('chosenUser', users);
    obj.set('staffHours', $scope.staffHours);
    parseUsers.push(obj);

    return Parse.Object.saveAll(parseUsers).then(function(staffObjs) {
        var temp = $scope.project.get('users');
        if(temp)
            $scope.project.set('users', staffObjs.concat(temp));
        else
            $scope.project.set('users', staffObjs);
        
        $scope.project.save()
        .then(function(proj){
            $(".add-user").removeClass('show');
            hideLoader();
            $state.reload();
        });
    });
}

$scope.openDatePicker = function(n) {
	switch (n) {
		case 1: $scope.openPicker1 = true; break;
        case 2: $scope.openPicker2 = true; break;
	}
}


$scope.addToInvoice = function(){
    $scope.invoiceDate = new Date();
    $scope.dataOnInvoice = '1';
    $scope.itemName = '1';
    $('.convert-invoice').addClass('show');
}

$scope.SavetoInvoice = function(){
    var obj = {
        invoiceDueDate : $scope.invoiceDate,
        dataOnInvoice : $scope.dataOnInvoice,
        itemNameToShow : $scope.itemName,
        project : $scope.actualProject
    };
    $state.go('dashboard.sales.invoices.new', {'projectId':obj });
}
    

$scope.saveTimesheet = function(){
    if(!$("#addTimesheetForm").valid())
        return;
    
    showLoader();
    
    var acl = new Parse.ACL();
    acl.setRoleWriteAccess($scope.userRole.get("name"), true);
    acl.setRoleReadAccess($scope.userRole.get("name"), true);
    
    var params = {
			user : user,
			organization : $scope.project.get('organization'),
			acl : acl
		};
    
    var d = new Date();
    d.subtractHours($scope.timesheetHours);
    d.subtractMinutes($scope.timesheetMinutes);
    
    var newsheet = {
        user : $scope.timesheetUser.user,
        task : $scope.timesheetTask.entity,
        date : $scope.timesheetDate,
        notes : $scope.timesheetDescription,
        timeSpent : d,
        hours : $scope.timesheetHours < 10 ? '0' + $scope.timesheetHours : '' + $scope.timesheetHours,
        minutes : $scope.timesheetMinutes < 10 ? '0' + $scope.timesheetMinutes : '' + $scope.timesheetMinutes,
        hoursSpent : $scope.timesheetHours,
        minutesSpent : $scope.timesheetMinutes
    };
    
    createTimesheets (newsheet, params);
    
    $scope.timesheetUser = "";
    $scope.timesheetHours = undefined;
    $scope.timesheetMinutes = undefined;
    $scope.timesheetTask = "";
    $scope.timesheetDate = new Date();
    $scope.timesheetDescription = "";
}

function createTimesheets (timesheets, params) {
	params.timesheets = [];
	
    Parse.Promise.as([]);
    
    var parseTasks = [];
    var Timesheet = Parse.Object.extend('Timesheets');

    var obj = new Timesheet();
    obj.set('userID', params.user);
    obj.set('organization', params.organization);
    obj.setACL(params.acl);
    obj.set('user', timesheets.user);
    obj.set('task', timesheets.task);
    obj.set('date', timesheets.date);
    obj.set('notes', timesheets.notes);
    //obj.set('timeSpent', timesheets.timeSpent);
    obj.set('hoursSpent', timesheets.hoursSpent);
    obj.set('minutesSpent', timesheets.minutesSpent);

    parseTasks.push(obj);

    return Parse.Object.saveAll(parseTasks).then(function(sheets) {
        var temp = $scope.project.get('timeSheets');
        if(temp)
            $scope.project.set('timeSheets', sheets.concat(temp));
        else
            $scope.project.set('timeSheets', sheets);
        
        var temp = timesheets.task.get('taskHours') || 0;
    
        timesheets.task.set('taskHours', $scope.timesheetHours + $scope.timesheetMinutes/60 + temp);
        timesheets.task.save()
        .then(function(obj){
            $scope.project.save()
            .then(function(proj){
                $(".new-timesheet").removeClass("show");
                hideLoader();
                $state.reload();
            });
        });
        
        
    });
}
    
/*
$scope.emailReceipt = function() {
	showLoader();
	$q.when(estimateService.sendEstimateReceipt($scope.estimate.entity))
	.then(function(obj) {
		console.log('Receipt sent successfully.');
		hideLoader();
	}, function(error) {
        addNewComment('Estimate sent by email', true);
		hideLoader();
		console.log(error.message);
	});
}

$scope.deleteEstimate = function() {
	showLoader();
	var estimate = $scope.estimate.entity;
	var children = [];
	var x = undefined;

	['comments', 'estimateItems']
	.forEach(function(field) {
		x = estimate.get(field);
		if(x) children = children.concat(x);
	});

	Parse.Object.destroyAll(children)
	.then(function() {
		return estimate.destroy();
	})
	.then(function() {
		hideLoader();
		$state.go('dashboard.sales.estimates.all');
	});

}

function addNewComment(body, isAuto) {
	var obj = {
		userID : user,
		organization : organization,
		name : user.get('username'),
		date : new Date(),
		isAutomaticallyGenerated : false,
		comment : body
	}
    
    if(!user.get('isTrackUsage') && isAuto) {
        return;
    }

	var data = {};
	$q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		return commentFactory.createNewComment(obj, role);
	})
	.then(function(obj) {
		data.commentObj = obj;
		var estimate = $scope.estimate.entity;
		var prevComments = estimate.get('comments');
		if(prevComments)
			prevComments.push(obj);
		else
			prevComments = [obj];

		estimate.set('comments', prevComments);
		return estimate.save();
	})
	.then(function() {
		var comment = new commentFactory(data.commentObj);

		if($scope.comments)
			$scope.comments.push(comment);
		else
			$scope.comments = [comment];

		console.log(comment);
	});

}
    
$scope.estimatePrinted = function(){
    addNewComment('Estimate printed', true);
}

$scope.estimateCloned = function(){
    addNewComment('Estimate cloned', true);
}

$scope.addComment = function() {
	if (! $scope.newComment) {
		$('.add-comment').removeClass('show');
		return;
	}

	showLoader();
	var obj = {
		userID : user,
		organization : organization,
		name : user.get('username'),
		date : new Date(),
		isAutomaticallyGenerated : false,
		comment : $scope.newComment
	}

	var data = {};
	$q.when(coreFactory.getUserRole(user))
	.then(function(role) {
		return commentFactory.createNewComment(obj, role);
	})
	.then(function(obj) {
		data.commentObj = obj;
		var estimate = $scope.estimate.entity;
		var prevComments = estimate.get('comments');
		if(prevComments)
			prevComments.push(obj);
		else
			prevComments = [obj];

		estimate.set('comments', prevComments);
		return estimate.save();
	})
	.then(function() {
		var comment = new commentFactory(data.commentObj);

		if($scope.comments)
			$scope.comments.push(comment);
		else
			$scope.comments = [comment];

		console.log(comment);
		$('.add-comment').removeClass('show');
		hideLoader();
	});

}
*/
}]);