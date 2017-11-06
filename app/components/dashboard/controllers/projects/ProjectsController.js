'use strict';

invoicesUnlimited.controller('ProjectsController',[
	'$q', '$scope', '$state', '$controller',
	'userFactory', 'projectService', 'coreFactory', 'taxService', 'expenseService', 'commentFactory','taskFactory', 'currencyFilter','projectUserFactory','appFields','$uibModal',

	function($q, $scope, $state, $controller, userFactory, projectService,
			  coreFactory, taxService, expenseService, commentFactory,taskFactory, currencyFilter,projectUserFactory,appFields,$uibModal,$uibModalInstance,$document,queryService,user,method,title) {

		if(! userFactory.entity.length) {
			console.log('User not logged in');
			return undefined;
		}

		var user = userFactory.entity[0];
		var organization = user.get("organizations")[0];
		$controller('DashboardController',{$scope:$scope,$state:$state});

		$('#editProjectForm').validate({
			rules: {
				customer : 'required',
				projectName : 'required',
				billingMethod : 'required',
				projectBillingHours : 'required',
				projectBillingAmount : 'required',
				budgetType : 'required',
				projectBudgetCost : 'required',
				projectBudgetHours : 'required'
			},
			messages: {
				customer : 'Please select a customer',
				projectName : 'Please enter project name',
				billingMethod : 'Please select a billing method',
				projectBillingHours : 'Please enter Rate/Hour',
				projectBillingAmount : 'Please enter Project Cost',
				budgetType : 'Please select budget type',
				projectBudgetCost : 'Please enter amount',
				projectBudgetHours : 'Please enter hours'
			}
		});
		/*
$('#addTimesheetForm').validate({
	rules: {
		timesheetDate : 'required',
		timesheetHours : 'required',
		timesheetMinutes : 'required',
        timesheetUser : 'required',
        timeSheetTask : 'required'
	},
	messages: {
		timesheetDate : 'Please select a date',
		timesheetHours : 'Please enter hours',
		timesheetMinutes : 'Please enter minutes',
        timesheetUser : 'Please select user',
        timeSheetTask : 'Please select task'
	}
});
*/
		$('#addTimesheetForm').validate({
			rules: {
				timesheetDate : 'required',
				timesheetHours : {
					required : true,
					digits : true,
					min : 0,
					//max : 23
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
					min : "Please enter valid hours",
					//max : "Please enter valid hours"
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
		$('#editTimesheetForm').validate({
			rules: {
				editTimesheetDate : 'required',
				editTimesheetHours : 'required',
				editTimesheetMinutes : 'required',
				editTimesheetUser : 'required',
				editTimesheetTask : 'required'
			},
			messages: {
				editTimesheetDate : 'Please select a date',
				editTimesheetHours : 'Please enter hours',
				editTimesheetMinutes : 'Please enter minutes',
				editTimesheetUser : 'Please select user',
				editTimesheetTask : 'Please select task'
			}
		});

		$('#addTaskForm').validate({
			rules: {
				newTaskName : 'required'
			},
			messages: {
				newTaskName : 'Please enter task name'
			}
		});

		$('#editTaskForm').validate({
			rules: {
				editTaskName : 'required'
			},
			messages: {
				editTaskName : 'Please enter task name'
			}
		});

		$('#addUserForm').validate({
			rules: {
				newUser : 'required'
			},
			messages: {
				newTaskName : 'Please select a user'
			}
		});

		var isGoTo = {
			details : function(to){
				return to.endsWith('projects.details');	
			},
			projects : function(to){ 
				return to.endsWith('projects.all');
			},
			edit : function(to){
				return to.endsWith('projects.edit');
			},
			newProject : function(to){
				return to.endsWith('projects.new');	
			}
		};
		showLoader();
		userFactory.getField('dateFormat')
			.then(function(obj) {
			$scope.dateFormat = obj;
			CheckUseCase();
		});

		function CheckUseCase(stateName) {
			if (! stateName)
				stateName = $state.current.name;

			if (isGoTo.projects(stateName)) {
				console.log('its in list')
				listProjects();

			} else if (isGoTo.newProject(stateName)) {
				console.log('its in new');

			} else if (isGoTo.edit(stateName)) {
				console.log('its in edit');
				prepareToEditProject();

			}
		}

		function listProjects() {
			showLoader();
			$q.when(projectService.listProjects(user))
				.then(function(res) {
				//	res = res.reverse();

				$scope.projectList = [];
				$scope.displayedProject = [];

				res.forEach(function(obj){
					if(!obj.entity.projectBillingAmount)
						obj.entity.projectBillingAmount = 0;
				});
				
				if(user.get('role') == 'General Employee'){

					res.forEach(function(proj){
						var users = proj.entity.get('users');
						if(users){
							for(var i = 0; i < users.length; ++i){
								if(users[i].get('chosenUser').get('userName') == user.get('username')){
									$scope.projectList.push(proj);
									$scope.displayedProject.push(proj);
									break;
								}
							}
						}
					});


				}
				else{
					$scope.projectList = res;
					$scope.displayedProject = res;
				}
				//$scope.sortByName();

				$scope.sortByLatest();
				hideLoader();

			}, function(error) {
				hideLoader();
				console.log(error.message);
			});	
		}

		$scope.dateOptions = {
			showWeeks : false
		};

		function prepareToEditProject() {
			var projectId = $state.params.projectId;
			if (! projectId) return;

			showLoader();
			$q.when(LoadRequiredData())
				.then(function(msg) {
				return $q.when(projectService.getProject(projectId));
			})
				.then(function (project) {
				console.log(project);

				$scope.project = project;

				$scope.selectedCustomer = $scope.customers.filter(function(cust) {
					return project.entity.get('customer').id == cust.entity.id;
				})[0];
				return $q.when(customerChangedHelper());
			})
				.then(function() {
				prepareEditForm();

			}, function(error) {
				hideLoader();
				console.log(error.message);
			});
		}

		function prepareEditForm() {
			var project = $scope.project;

			$scope.projectName = project.entity.get("projectName");
			$scope.projectDescription = project.entity.get("projectDescription") || "";

			$scope.billingMethod = project.entity.get("billingMethod");

			$scope.projectBillingHours = project.entity.get("projectBillingHours") || 0;

			$scope.projectBillingAmount = project.entity.get("projectBillingAmount") || 0;

			if(project.entity.get("hasBudget")){
				$scope.hasBudget = 1;
			}
			else{
				$scope.hasBudget = 0;
			}

			$scope.budgetType = project.entity.get("budgetType");


			$scope.projectBudgetCost = project.entity.get("projectBudgetCost") || 0;

			$scope.projectBudgetHours = project.entity.get("projectBudgetHours") || 0;
			$scope.projectUsers = [];
			$scope.tasks = project.tasks;
			$scope.staffUsers = project.users;

			if($scope.staffUsers)
				for(var i = 0; i < $scope.users.length; ++i){
					for(var j = 0; j < $scope.staffUsers.length; ++j){
						if($scope.users[i].userName == $scope.staffUsers[j].user.get('userName')){
							//$scope.projectUsers.push($scope.users[i]);
							$scope.users.splice(i, 1);
						}
					}
				}

			$scope.timesheets = [];
			if(project.timesheets)
				project.timesheets.forEach(function(obj){
					var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');
					obj.date = formatDate(
						obj.attributes.date, dateFormat);
					$scope.timesheets.push(obj);

					var hh = obj.get('hoursSpent');

					var mm = obj.get('minutesSpent');

					hh = hh < 10 ? '0' + hh : '' + hh
					mm = mm < 10 ? '0' + mm : '' + mm
					obj.hours = hh;
					obj.minutes = mm;
					//obj.time = hh + ':' + mm;

					/*
            var t = obj.get('timeSpent');
                if(t){
                    var d = obj.get('date');
                    var msec = d - t;
                    var hh = Math.floor(msec / 1000 / 60 / 60);
                    msec -= hh * 1000 * 60 * 60;
                    var mm = Math.floor(msec / 1000 / 60);
                    msec -= mm * 1000 * 60;
                    hh = hh < 10 ? '0' + hh : '' + hh
                    mm = mm < 10 ? '0' + mm : '' + mm
                    obj.hours = hh;
                    obj.minutes = mm;
                    //obj.time = hh + ':' + mm;
                }
                else{
                    obj.time = "00:00";
                    obj.hours = "00";
                    obj.minutes = "00";
                }
                */
				});
			$scope.timesheetTasks = [];
			if(project.tasks)
				project.tasks.forEach(function(task){
					$scope.timesheetTasks.push(task);
				});
			$scope.timesheetTasks.push(createTaskOpener);
			$scope.timesheetDate = new Date();
			hideLoader();
		}

		$scope.editTask = function(index){
			$scope.selectedTaskIndex = index;

			$scope.editTaskName = $scope.tasks[index].entity.taskName;
			$scope.editTaskDescription = $scope.tasks[index].entity.taskDescription;
			$scope.editTaskCost = $scope.tasks[index].entity.taskCost;

			/*
    if($scope.tasks[index].entity){
        $scope.editTaskName = $scope.tasks[index].entity.taskName;
        $scope.editTaskDescription = $scope.tasks[index].entity.taskDescription;
        $scope.editTaskCost = $scope.tasks[index].entity.taskCost;
    }
    else{
        $scope.editTaskName = $scope.tasks[index].attributes.taskName;
        $scope.editTaskDescription = $scope.tasks[index].attributes.taskDescription;
        $scope.editTaskCost = $scope.tasks[index].attributes.taskCost;
    }
    */
			$(".edit-task").addClass('show');
		}

		$scope.updateTask = function(){
			if(!$('#editTaskForm').valid())
				return;
			var index = $scope.selectedTaskIndex;

			showLoader();

			$scope.tasks[index].entity.taskName = $scope.editTaskName;
			$scope.tasks[index].entity.taskDescription = $scope.editTaskDescription;
			$scope.tasks[index].entity.taskCost = $scope.editTaskCost;
			$scope.tasks[index].entity.save()
				.then(function(obj){
				$(".edit-task").removeClass('show');
				hideLoader();
			});

		}

		$scope.editTimesheet = function(index){

			$scope.selectedTimesheetIndex = index;

			$scope.selectedTimesheetList = $scope.timesheets[index];

			$scope.editTimesheetTask = new taskFactory($scope.timesheets[index].attributes.task);

			setObjectOperations({
				object 		: $scope.timesheets[index].attributes.user,
				fields 		: appFields.projectUser
			});

			$scope.staffUsers.forEach(function(obj){
				if(obj.user.userName == $scope.timesheets[index].attributes.user.userName)
					$scope.timesheetUser = obj;
			});

			//$scope.timesheetUser = $scope.timesheets[index].attributes.user;
			var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');

			$scope.editTimesheetDate = formatDate($scope.timesheets[index].date,dateFormat) ;

			$scope.editTimesheetDescription = $scope.timesheets[index].attributes.notes;
			$scope.editTimesheetHours = parseInt($scope.timesheets[index].hours);
			$scope.editTimesheetMinutes = parseInt($scope.timesheets[index].minutes);

			$('.edit-timesheet').addClass('show');  
		}   
		$scope.updateTimesheet= function()
		{
			var index = $scope.selectedTimesheetIndex ;  
			showLoader();

			$scope.timesheets[index].set("date",$scope.timesheetDate);
			$scope.timesheets[index].set("task",$scope.editTimesheetTask.entity);
			$scope.timesheets[index].set("user",$scope.timesheetUser.user);

			var d = new Date();
			d.subtractHours($scope.editTimesheetHours);
			d.subtractMinutes($scope.editTimesheetMinutes);

			//var timeSpent  =  d;

			var hours = $scope.editTimesheetHours < 10 ? '0' + $scope.editTimesheetHours : '' + $scope.editTimesheetHours;
			var minutes  =  $scope.editTimesheetMinutes < 10 ? '0' + $scope.editTimesheetMinutes : '' + $scope.editTimesheetMinutes;

			//$scope.timesheets[index].set("timeSpent",timeSpent );

			$scope.timesheets[index].set("hoursSpent",$scope.editTimesheetHours );
			$scope.timesheets[index].set("minutesSpent",$scope.editTimesheetMinutes );

			$scope.timesheets[index].hours = hours ;
			$scope.timesheets[index].minutes = minutes;

			///

			$scope.timesheets[index].set("notes",$scope.timesheetDescription);

			$scope.timesheets[index].save()
				.then(function(obj){
				$(".edit-timesheet").removeClass('show');
				hideLoader();
			});

			//hideLoader();
		}
		//
		$scope.addTimesheet = function(){
			$(".new-timesheet").addClass('show');
		}
		$scope.saveTimesheet = function(){
			if(!$("#addTimesheetForm").valid())
				return;

			var dateFormat = $scope.dateFormat.toUpperCase().replace(/E/g, 'd');

			var tsk = undefined;

			tsk = $scope.timesheetTask.entity;

			//var d = new Date();
			//d.subtractHours($scope.timesheetHours);
			//d.subtractMinutes($scope.timesheetMinutes);

			$scope.timesheets.push({
				user : $scope.timesheetUser.user,
				task : tsk,
				date : formatDate(
					$scope.timesheetDate, dateFormat),
				sheetDate : $scope.timesheetDate,
				notes : $scope.timesheetDescription,
				//timeSpent : d,
				hours : $scope.timesheetHours < 10 ? '0' + $scope.timesheetHours : '' + $scope.timesheetHours,
				minutes : $scope.timesheetMinutes < 10 ? '0' + $scope.timesheetMinutes : '' + $scope.timesheetMinutes,
				hoursSpent : $scope.timesheetHours,
				minutesSpent : $scope.timesheetMinutes
			});


			$scope.timesheetUser = "";
			$scope.timesheetTask = "";
			$scope.timesheetDate = new Date();
			$scope.timesheetDescription = "";
			$(".new-timesheet").removeClass("show");
		}

		$scope.removeTimesheet = function(index){
			$scope.timesheets.splice(index, 1);
		}

		$scope.removeTask = function(index){
			$scope.tasks.splice(index, 1);
			$scope.timesheetTasks.splice(index, 1);
			$scope.timesheetTask = "";
			if(!$scope.$$phase)
				$scope.$apply();
		}

		$scope.addTask = function(){
			$(".new-task").addClass('show');
			$scope.fromTimesheet = false;
		}

		$scope.taskChanged = function(){
			if($scope.timesheetTask.dummy){
				$scope.fromTimesheet = true;
				$scope.timesheetTask = ""; 
				$(".new-task").addClass("show");
			}
		}

		$scope.addNewTask = function() {
			if(!$('#addTaskForm').valid())
				return;
			showLoader();

			var acl = new Parse.ACL();
			//acl.setRoleWriteAccess($scope.userRole.get("name"), true);
			//acl.setRoleReadAccess($scope.userRole.get("name"), true);

			acl.setPublicReadAccess(true);
			acl.setPublicWriteAccess(true);

			var Task = Parse.Object.extend('Task');

			var obj = new Task();
			obj.set('userID', user);
			obj.set('organization', organization);
			obj.setACL(acl);
			obj.set('taskName', $scope.newTaskName);
			obj.set('taskDescription', $scope.newTaskDescription);
			obj.set('taskCost', $scope.newTaskCost);

			return obj.save().then(function(task) {
				task = new taskFactory(task);
				$scope.tasks.push(task);
				$scope.timesheetTasks.pop();
				$scope.timesheetTasks.push(task);
				$scope.timesheetTasks.push(createTaskOpener);
				if($scope.fromTimesheet){
					$scope.timesheetTask = task;        
				}
				$(".new-task").removeClass('show');
				$scope.newTaskName = "";
				$scope.newTaskDescription = "";
				$scope.newTaskCost = "";
				if(!$scope.$$phase)
					$scope.$apply();
				hideLoader();
			});
		}

		$scope.addNewUser = function(){
			if(!$('#addUserForm').valid())
				return;
			$scope.staffUsers.push({
				user : $scope.newUser,
				staffHours : $scope.staffHours 
			});

			$(".add-user").removeClass('show');
			//$scope.newUser = "";
		}

		$scope.prepareToEditUser = function(index){
			$scope.userIndex = index;

			$scope.editUser = $scope.staffUsers[$scope.userIndex].user;
			$scope.editStaffHours = $scope.staffUsers[$scope.userIndex].staffHours;

			$scope.editusers = [];

			angular.copy($scope.users, $scope.editusers);

			$scope.editusers.pop();
			$scope.editusers.push($scope.editUser);
			$scope.editusers.push(createUserOpener);

			$(".edit-user").addClass('show');
		}

		$scope.updateUser = function(){
			/*
    if(!$('#editUserForm').valid())
        return;
        */

			$scope.staffUsers[$scope.userIndex].user = $scope.editUser;
			$scope.staffUsers[$scope.userIndex].staffHours = $scope.editStaffHours;

			$(".edit-user").removeClass('show');
		}

		$scope.removeUser = function(index){
			$scope.users.pop();
			$scope.users.push($scope.staffUsers[index].user);
			$scope.users.push(createUserOpener);
			$scope.staffUsers.splice(index, 1);
		}

		$scope.addUser = function(){
			$(".add-user").addClass('show');
		}

		$scope.openDatePicker = function(n) {
			switch (n) {
				case 1: $scope.openPicker1 = true; break;
				case 2: $scope.openPicker2 = true; break;
					 }
		}

		function saveEditedProject() {
			var project = $scope.project.entity;
			project.set('customer', $scope.selectedCustomer.entity);
			project.set('projectName', $scope.projectName);
			project.set('projectDescription', $scope.projectDescription);
			project.set('billingMethod', $scope.billingMethod);
			project.set('projectBillingHours', $scope.projectBillingHours);
			project.set('projectBillingAmount', $scope.projectBillingAmount);
			//project.set('tasks', $scope.tasks);


			var allTasks = [];

			$scope.tasks.forEach(function(obj){
				if(obj.entity)
					allTasks.push(obj.entity);
				else
					allTasks.push(obj);
			});

			project.set('tasks', angular.copy(allTasks));

			if($scope.hasBudget == 1){
				project.set('hasBudget', true);
				project.set('budgetType', $scope.budgetType);
				project.set('projectBudgetCost', $scope.projectBudgetCost);
				project.set('projectBudgetHours', $scope.projectBudgetHours);
			}
			else{
				project.set('hasBudget', false);
			}

			return projectService.updateProject
			($scope.project, user, $scope.userRole, $scope.timesheets, $scope.staffUsers)

				.then(function(obj) {
				return obj;
			});
		}

		$scope.saveProject = function() {
			if(!$('#editProjectForm').valid())
				return;

			showLoader();

			saveEditedProject()
				.then(function(project) {
				hideLoader();
				console.log(project);
				//$state.go('dashboard.projects.all');
				$state.go('dashboard.projects.details', {projectId:project.id});

			}, function(error) {
				hideLoader();
				console.log(error.message);
			});
		}

		$scope.cancel = function() {
			$state.go('dashboard.projects.all');
		}

		function customerChangedHelper() {

		}

		function customerChanged() {
			//showLoader();
			//hideLoader();
		}
		$scope.userChanged = userChanged;

		function userChanged() {
			if($scope.newUser.dummy) {
				$scope.fromTimesheet = false;
				createUser();
				$scope.newUser = "";
				return;
			}
		}

		$scope.sortByLatest = function(){
			$scope.projectList.sort(function(a,b){
				return a.entity.createdAt>b.entity.createdAt ? -1 : a.entity.createdAt<b.entity.createdAt ? 1 : 0;
			});
		}

		$scope.sortByName = function(){

			if($("#nameD").css('display') === "none"){
				$scope.projectList.sort(function(a,b){
					return b.entity.projectName.localeCompare(a.entity.projectName);
				});
				$('#nameD').css({
					'display': 'inline-table'
				});
				$('#nameDUp').css({
					'display': 'none'
				});
			}
			else{
				$scope.projectList.sort(function(a,b){
					return a.entity.projectName.localeCompare(b.entity.projectName);
				});
				$('#nameDUp').css({
					'display': 'inline-table'
				});
				$('#nameD').css({
					'display': 'none'
				});
			}

			$('#custNameD').css({
				'display': 'none'
			});
			$('#descD').css({
				'display': 'none'
			});
			$('#billMD').css({
				'display': 'none'
			});
			$('#priceD').css({
				'display': 'none'
			});

			$('#custNameDUp').css({
				'display': 'none'
			});
			$('#descDUp').css({
				'display': 'none'
			});
			$('#billMDUp').css({
				'display': 'none'
			});
			$('#priceDUp').css({
				'display': 'none'
			});

		}
		$scope.sortByCustomer = function(){
			if($("#custNameD").css('display') === "none"){
				$scope.projectList.sort(function(a,b){
					return a.customer.displayName.localeCompare(b.customer.displayName)});
				$('#custNameD').css({
					'display': 'inline-table'
				});
				$('#custNameDUp').css({
					'display': 'none'
				});
			}
			else{
				$scope.projectList.sort(function(a,b){
					return b.customer.displayName.localeCompare(a.customer.displayName)});
				$('#custNameDUp').css({
					'display': 'inline-table'
				});
				$('#custNameD').css({
					'display': 'none'
				});
			}


			$('#nameD').css({
				'display': 'none'
			});

			$('#descD').css({
				'display': 'none'
			});
			$('#billMD').css({
				'display': 'none'
			});
			$('#priceD').css({
				'display': 'none'
			});


			$('#nameDUp').css({
				'display': 'none'
			});

			$('#descDUp').css({
				'display': 'none'
			});
			$('#billMDUp').css({
				'display': 'none'
			});
			$('#priceDUp').css({
				'display': 'none'
			});

		}  
		$scope.timesheetUserChanged = function(){
			if($scope.timesheetUser.dummy) {
				$scope.fromTimesheet = true;
				createUser();
				$scope.newUser = "";
				return;
			}
		}
		$scope.sortByDesc = function(){
			if($("#descD").css('display') === "none"){
				$scope.projectList.sort(function(a,b){
					if(!a.entity.projectDescription)
						a.entity.projectDescription = "";
					if(!b.entity.projectDescription)
						b.entity.projectDescription = "";
					return b.entity.projectDescription.localeCompare(a.entity.projectDescription);
				});
				$('#descD').css({
					'display': 'inline-table'
				});
				$('#descDUp').css({
					'display': 'none'
				});
			}
			else{
				$scope.projectList.sort(function(a,b){
					if(!a.entity.projectDescription)
						a.entity.projectDescription = "";
					if(!b.entity.projectDescription)
						b.entity.projectDescription = "";
					return a.entity.projectDescription.localeCompare(b.entity.projectDescription);
				});
				$('#descDUp').css({
					'display': 'inline-table'
				});
				$('#descD').css({
					'display': 'none'
				});
			}

			$('#nameDUp').css({
				'display': 'none'
			});
			$('#custNameDUp').css({
				'display': 'none'
			});

			$('#billMDUp').css({
				'display': 'none'
			});
			$('#priceDUp').css({
				'display': 'none'
			});

			$('#nameD').css({
				'display': 'none'
			});
			$('#custNameD').css({
				'display': 'none'
			});

			$('#billMD').css({
				'display': 'none'
			});
			$('#priceD').css({
				'display': 'none'
			});
		}
		$scope.sortByBilling = function(){
			if($("#billMD").css('display') === "none"){
				$scope.projectList.sort(function(a,b){
					if(!a.entity.billingMethod)
						return -1;
					if(!b.entity.billingMethod)
						return 1;
					return a.entity.billingMethod.localeCompare(b.entity.billingMethod)});
				$('#billMD').css({
					'display': 'inline-table'
				});
				$('#billMDUp').css({
					'display': 'none'
				});
			}
			else{
				$scope.projectList.sort(function(a,b){
					if(!a.entity.billingMethod)
						return -1;
					if(!b.entity.billingMethod)
						return 1;
					return b.entity.billingMethod.localeCompare(a.entity.billingMethod)});
				$('#billMDUp').css({
					'display': 'inline-table'
				});
				$('#billMD').css({
					'display': 'none'
				});
			}

			$('#nameDUp').css({
				'display': 'none'
			});
			$('#custNameDUp').css({
				'display': 'none'
			});
			$('#descDUp').css({
				'display': 'none'
			});

			$('#priceDUp').css({
				'display': 'none'
			});

			$('#nameD').css({
				'display': 'none'
			});
			$('#custNameD').css({
				'display': 'none'
			});
			$('#descD').css({
				'display': 'none'
			});

			$('#priceD').css({
				'display': 'none'
			});
		}
		$scope.sortByAmount = function(){
			if($("#priceD").css('display') === "none"){
				$scope.projectList.sort(function(a,b){
					if(!a.entity.projectBillingAmount)
						a.entity.projectBillingAmount = 0;
					
					if(!b.entity.projectBillingAmount)
						b.entity.projectBillingAmount = 0;
					
					return a.entity.projectBillingAmount - b.entity.projectBillingAmount;
				});
				$('#priceD').css({
					'display': 'inline-table'
				});
				$('#priceDUp').css({
					'display': 'none'
				});
			}
			else{
				$scope.projectList.sort(function(a,b){
					if(!a.entity.projectBillingAmount)
						a.entity.projectBillingAmount = 0;
					
					if(!b.entity.projectBillingAmount)
						b.entity.projectBillingAmount = 0;
					
					return b.entity.projectBillingAmount - a.entity.projectBillingAmount;
				});
				$('#priceDUp').css({
					'display': 'inline-table'
				});
				$('#priceD').css({
					'display': 'none'
				});
			}


			$('#nameDUp').css({
				'display': 'none'
			});
			$('#custNameDUp').css({
				'display': 'none'
			});
			$('#descDUp').css({
				'display': 'none'
			});
			$('#billMDUp').css({
				'display': 'none'
			});

			$('#nameD').css({
				'display': 'none'
			});
			$('#custNameD').css({
				'display': 'none'
			});
			$('#descD').css({
				'display': 'none'
			});
			$('#billMD').css({
				'display': 'none'
			});

		}


		$scope.customerChanged = customerChanged;
		function createUser(){
			var modalInstance = $uibModal.open({
				animation 			: true,
				templateUrl 		: 'modal-user',
				controller 			: 'NewUserController',
				backdrop 			: true,
				appendTo 			: angular.element(document.querySelector('#view')),
				windowTemplateUrl 	: 'modal-window',
				resolve 			: {
					user : function() {
						var ctor = Parse.Object.extend(Parse.User);
						var obj = new ctor();
						setObjectOperations({
							object 		: obj,
							fields 		: appFields.user
						});
						return obj;
					},
					method 	: function(){
						return 'create';
					},
					title 	: function() {
						return 'Add User';
					}
				}
			});

			modalInstance.result.then(function(newUser){
				setObjectOperations({
					object 		: newUser,
					fields 		: appFields.user
				});
				var prUser = projectUserFactory
				.createNew({
					emailID 	 : newUser.email,
					role 		 : newUser.role,
					userName	 : newUser.username,
					country		 : newUser.country,
					title		 : newUser.fullName,
					organization : newUser.selectedOrganization,
					companyName  : newUser.company,
					userID 		 : userFactory.entity[0],//newUser,
					status 		 : 'Activated'
				}).then(function(res){
					$scope.$apply(function(){
						$scope.users.pop();
						$scope.users.push(res);
						$scope.users.push(createUserOpener);
						if($scope.fromTimesheet){
							$scope.timesheetUser = res;
						}
						else{
							$scope.newUser = res;
						}
						$scope.fromTimesheet = false;
					});
				},function(e){
					console.log(e.message);
				});
			},function(){
				console.log('Dismiss modal');
			});
		}    
		function LoadRequiredData() {
			var promises = [];
			var p = null;

			p = $q.when(coreFactory.getAllCustomers())
				.then(function(res) {
				$scope.customers = res.sort(function(a,b){
					return alphabeticalSort(a.entity.displayName,b.entity.displayName)
				});

				$scope.customers.forEach(function(obj){
					if(obj.entity.salutation)
						obj.fullName = obj.entity.salutation + " " + obj.entity.displayName;
					else
						obj.fullName = obj.entity.displayName;
				});

				//	$scope.selectedCustomer = $scope.customers[0];
			});
			promises.push(p);

			p = $q.when(projectUserFactory.getAll()).then(function(users,arg2){
				$scope.users = users.map(function(el){
					setObjectOperations({
						object 		: el,
						fields 		: appFields.projectUser
					});
					return el;
				});
				$scope.users.push(createUserOpener);
			});

			promises.push(p);

			p = $q.when(coreFactory.getUserRole(user))
				.then(function(role) {
				$scope.userRole = role;
			});
			promises.push(p);

			return $q.all(promises);
		}

		$scope.search = function()
		{
			if($scope.searchText.length)
			{   
				$scope.projectList = $scope.displayedProject.filter(function(obj)
																	{      
					if(!obj.entity.projectName)
					{
						obj.entity.projectName = ""; 
					}
					if(!obj.customer.displayName)
					{
						obj.customer.displayName = ""; 
					}
					if(!obj.entity.projectDescription)
					{
						obj.entity.projectDescription = ""; 
					}
					if(!obj.entity.billingMethod)
					{
						obj.entity.billingMethod = ""; 
					}
					if(!obj.entity.projectBillingAmount)
					{
						obj.entity.projectBillingAmount = ""; 
					}

					return obj.entity.projectName.toLowerCase().includes($scope.searchText.toLowerCase()) || 
						obj.customer.displayName.toLowerCase().includes($scope.searchText.toLowerCase()) || 
						obj.entity.projectDescription.toLowerCase().includes($scope.searchText.toLowerCase()) || 
						obj.entity.billingMethod.toLowerCase().includes($scope.searchText.toLowerCase())|| obj.entity.projectBillingAmount.toString().toLowerCase().includes($scope.searchText.toLowerCase()); 
				});
			}
			else
			{ 
				$scope.projectList =$scope.displayedProject;
			}
		}
	}]);