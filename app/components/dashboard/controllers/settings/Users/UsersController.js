'use strict';

invoicesUnlimited.controller('UsersController',["$scope","$state","$uibModal",
			 "$controller","$document","userFactory",
			 "projectUserFactory","queryService","appFields","$q",
	function($scope,$state,$uibModal,
			 $controller,$document,userFactory,
			 projectUserFactory,queryService,appFields,$q){

	var user = userFactory;

	if (!user.entity.length) {
		$state.go('login');
		return;
	}

	$controller('DashboardController',{$scope:$scope,$state:$state});

    if(!$scope.userLogo){
        var selectedorganization = userFactory.entity[0].get("selectedOrganization");
        var query = new Parse.Query('Organization');
        query.get(selectedorganization.id, {
              success: function(obj) {
                  $scope.org = obj;
                  var logo = obj.get('logo');
                  if(logo){
                    $scope.userLogo = logo._url;
                  }
                  else{
                      $scope.userLogo = './assets/images/user-icon.png';
                  }
                  if(!$scope.$$phase)
						$scope.$apply();

              },
              error: function(obj, error) {
                // The object was not retrieved successfully.
                // error is a Parse.Error with an error code and message.
              }
        });
    }
    
	$scope.users = [];

	hideLoader();
    

    $scope.deleteUserConfirm = function($index){
        $scope.currenDeleteIndex = $index;
        $('.confirmation-pop-up').addClass('show');
    }
    
	$scope.deleteUser = function($index) {
        debugger;
        
		showLoader();
		var userObj = $scope.users[$index].get('userID');
        $('.confirmation-pop-up').removeClass('show');

		if (!userObj) return;
        
        var UserTable = Parse.Object.extend("User");
        var query = new Parse.Query(UserTable);
        query.equalTo("username", $scope.users[$index].userName);
        return query.first({
          success: function(obj) {
                Parse.Cloud.run('deleteUser',{
                    identificator : obj.id
                })
                .then(function(res){
                    return $scope.users[$index].destroy();
                },function(e){
                    console.log(e.message);
                    hideLoader();
                })
                .then(function(res){
                    window.location.reload();;
                    $scope.$apply(function() {
                        $scope.users.splice($index,1);
                    });
                    hideLoader();
                },function(e){
                    if(e)
                    {
                        console.log(e.message);
                    }
                    hideLoader();
                });
          },
          error: function(error) {
            alert("Error: " + error.code + " " + error.message);
          }
        });	

	}

	$scope.editUser = function(id) {
        $scope.currenDeleteIndex = id;
		var modalInstance = $uibModal.open({
			animation 			: true,
			templateUrl 		: 'modal-user',
			controller 			: 'NewUserController',
			backdrop 			: true,
			appendTo 			: angular.element(document.querySelector('#view')),
			windowTemplateUrl 	: 'modal-window',
			resolve 			: {
				user : function() {
                    var UserTable = Parse.Object.extend("User");
                    var query = new Parse.Query(UserTable);
                    query.equalTo("username", $scope.users[id].userName);
                    return query.first({
                      success: function(obj) {
                            setObjectOperations({
                                object 		: obj,
                                fields 		: appFields.user
                            });
                          obj.status = $scope.users[id].status;
                          obj.projectUser = $scope.users[id];
                          return obj;
                      },
                      error: function(error) {
                        alert("Error: " + error.code + " " + error.message);
                      }
                    });
                    
					//return $scope.users[id].get('userID');
				},
				method : function() {
					return 'update';
				},
				title : function() {
					return 'Edit user';
				}
			}
		});

		modalInstance.result.then(function(prUser){
			setObjectOperations({
				object 		: prUser,
				fields 		: appFields.projectUser
			});
			$scope.users[id] = prUser;
		},function(res){
			console.log('Dismiss modal');
			if (res && res.deleted) {
				$scope.users.splice(id,1);
			}
		});
	}

	$scope.createUser = function(){
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
				status 		 : 'Activated',
				organization : userFactory.entity[0].get('selectedOrganization')
			}).then(function(res){
				showSnackbar("User Added successfully.")
				$scope.$apply(function(){
					$scope.users.push(res);
				});
			},function(e){
				console.log(e.message);
			});
		},function(){
			console.log('Dismiss modal');
		});
	}
    
    $scope.inviteUser = function(){
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
                    obj.mustInvite = true;
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
					$scope.users.push(res);
				});
			},function(e){
				console.log(e.message);
			});
		},function(){
			console.log('Dismiss modal');
		});
    }

	$q.when(projectUserFactory.getAll()).then(function(users,arg2){
		$scope.users = users.map(function(el){
			setObjectOperations({
				object 		: el,
				fields 		: appFields.projectUser
			});
			return el;
		});
		
		$scope.users = $scope.users.filter(function(obj){
			if(obj.role == 'Main' || obj.userName == userFactory.entity[0].get('username'))
                return false;
            return true;
		});
        
        $scope.dispalyedUsers = $scope.users;
        $scope.sortByUserName();
        
	});
    
    $scope.sortByUserName= function(){
    
        if($("#name").css('display') === "none"){
           $scope.users.sort(function(a,b){
        return a.userName.localeCompare(b.userName)});
            $('#name').css({
                'display': 'inline-table'
            });
            $('#nameUp').css({
                'display': 'none'
            });
        }
        else{
              $scope.users.sort(function(a,b){
        return b.userName.localeCompare(a.userName)});
            $('#nameUp').css({
                'display': 'inline-table'
            });
            $('#name').css({
                'display': 'none'
            });
        }
        
            $('#email').css({
            'display': 'none'
        });
       $('#role').css({
            'display': 'none'
        });
         $('#status').css({
            'display': 'none'
        });
        
        
         $('#emailUp').css({
            'display': 'none'
        });
       $('#roleUp').css({
            'display': 'none'
        });
         $('#statusUp').css({
            'display': 'none'
        });
        
    }
    
    $scope.sortByemail= function(){
    $scope.users.sort(function(a,b){
        return a.emailID.localeCompare(b.emailID)});
        
        if($("#email").css('display') === "none"){
           $scope.users.sort(function(a,b){
        return a.userName.localeCompare(b.userName)});
            $('#email').css({
                'display': 'inline-table'
            });
            $('#emailUp').css({
                'display': 'none'
            });
        }
        else{
              $scope.users.sort(function(a,b){
        return b.userName.localeCompare(a.userName)});
            $('#emailUp').css({
                'display': 'inline-table'
            });
            $('#email').css({
                'display': 'none'
            });
        }
        
        $('#name').css({
            'display': 'none'
        });
            
       $('#role').css({
            'display': 'none'
        });
         $('#status').css({
            'display': 'none'
        });
        
        
        $('#nameUp').css({
            'display': 'none'
        });
            
       $('#roleUp').css({
            'display': 'none'
        });
         $('#statusUp').css({
            'display': 'none'
        });
    }
    
    $scope.sortByRole= function(){
    
         if($("#role").css('display') === "none"){
          $scope.users.sort(function(a,b){
        return a.role.localeCompare(b.role)});
            $('#role').css({
                'display': 'inline-table'
            });
            $('#roleUp').css({
                'display': 'none'
            });
        }
        else{
             $scope.users.sort(function(a,b){
        return b.role.localeCompare(a.role)});
            $('#roleUp').css({
                'display': 'inline-table'
            });
            $('#role').css({
                'display': 'none'
            });
        }
        
         $('#name').css({
            'display': 'none'
        });
            $('#email').css({
            'display': 'none'
        });
         $('#status').css({
            'display': 'none'
        });
        
        
        $('#nameUp').css({
            'display': 'none'
        });
            $('#emailUp').css({
            'display': 'none'
        });
         $('#statusUp').css({
            'display': 'none'
        });
    }
    
    $scope.sortByStatus= function(){
        
        if($("#status").css('display') === "none"){
           $scope.users.sort(function(a,b){
        return a.status.localeCompare(b.status)});
            $('#status').css({
                'display': 'inline-table'
            });
            $('#statusUp').css({
                'display': 'none'
            });
        }
        else{
              $scope.users.sort(function(a,b){
        return b.status.localeCompare(a.status)});
            $('#statusUp').css({
                'display': 'inline-table'
            });
            $('#status').css({
                'display': 'none'
            });
        }
        
         $('#name').css({
            'display': 'none'
        });
            $('#email').css({
            'display': 'none'
        });
       $('#role').css({
            'display': 'none'
        });
        
        $('#nameUp').css({
            'display': 'none'
        });
            $('#emailUp').css({
            'display': 'none'
        });
       $('#roleUp').css({
            'display': 'none'
        });
        
         
    }
 
    $scope.search = function()
    {
        if($scope.searchText.length)
        {   
            $scope.users = $scope.dispalyedUsers.filter(function(obj)
            {
                if(!obj.userName)
                {
                    obj.userName = "";
                }
                if(!obj.emailID)
                {
                    obj.emailID = "";
                }
                if(!obj.role)
                {
                   obj.role = "";
                }
                if(!obj.status)
                {
                   obj.status = "";
                }
                return obj.userName.toLowerCase().includes($scope.searchText.toLowerCase()) || 
                obj.emailID.toLowerCase().includes($scope.searchText.toLowerCase()) || 
                obj.role.toLowerCase().includes($scope.searchText.toLowerCase()) || 
                obj.status.toLowerCase().includes($scope.searchText.toLowerCase());
            });
        }
        else
        { 
            $scope.users =$scope.dispalyedUsers;
        }
    }

}]);