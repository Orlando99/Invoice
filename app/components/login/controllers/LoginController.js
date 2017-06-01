'use strict';

String.prototype.capitilize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

invoicesUnlimited.controller('LoginController',['$scope','$state','userFullFactory','userFactory',
	function($scope,$state,userFullFactory,userFactory){

	$scope.username = "";
	$scope.password = "";

	var user = userFactory;

    if ($state.$current.name.includes('processing')) {
		showLoader();
        return;
	}
        
	if (user.entity.length) {
		$state.go('dashboard');
		return;
	}

	if ($state.params.errorMsg) {
		showError($state.params.errorMsg);
		hideLoader();
	}

	$scope.signUpAction = function(){
		$state.go('signup');
	}

	$scope.signInAction = function()
    {
		if(! ($scope.username && $scope.password)) {
			showError('Please provide both username and password.');
			return;
		}
		showLoader();
            user.login({
                        username : $scope.username,
                        password : $scope.password
                        },function()
                        {
                            $('.errorMessage').html('').hide();
                            var firstScreen = user.entity[0].get('firstScreen');
                            var tutorial = user.entity[0].get('tutorial');
                            var userObjectId = user.entity[0].id;
                            var projectUser = Parse.Object.extend('ProjectUser');
                            var query = new Parse.Query(projectUser);
                            query.equalTo('userName', $scope.username);
                            query.first()
                            .then(function(obj) {
                            if(obj)
                             {
                                if(obj.get("status") == "Deactivated")
                                {
                                    
                                    user.logout()
                                    .then(function(){
                                        hideLoader();
                                       $('.errorMessage').html("Your Account is not Activated!").show();
                                    });
                                }
                                else
                                {      
                                 if(!tutorial)
                                     $state.go('signup.invoiceTemplateInfo');
                                  else
                                    {
										if(user.entity[0].get('role') == 'Sales')
											$state.go('dashboard.sales.invoices.all');
										else {
											switch(firstScreen) 
											{
												case 'Dashboard': 		  $state.go('dashboard'); break;
												case 'Customer List': 	  $state.go('dashboard.customers.all'); break;
												case 'Invoices List': 	  $state.go('dashboard.sales.invoices.all'); break;
												case 'Expense List': 	  $state.go('dashboard.expenses.all'); break;
												case 'Estimate List': 	  $state.go('dashboard.sales.estimates.all'); break;
												case 'Credit Notes List': $state.go('dashboard.sales.creditnotes.all'); break;
												case 'Reports': 		  $state.go('dashboard.reports'); break;
												case 'Settings': 		  $state.go('dashboard.settings.company-profile'); break;
												default: 				  $state.go('dashboard'); break;
											}
										}
                                    }//end of else
                                }//end of else
                              }//eend of if 
                              else
                              {
                                         hideLoader();
                                          $('.errorMessage').html("Invalid username/password.").show();

                                      }

                                        });
                            },function(error){
                                hideLoader();
                                $('.errorMessage').html(error.message.capitilize()).show();
                                $('.input-container').css({'border':'1px solid red'});
                            });

    }//end of scope.sign in
 
	$scope.sendPasswordResetLink = function() {
		if(! $scope.email) {
			showError('Please enter email address.');
			return;
		}

		showLoader();
		Parse.User.requestPasswordReset($scope.email)
		.then(function() {
			showSuccess('Reset Password Link sent to specified email.');
			hideLoader();
		}, function(error) {
			showError(error.message);
			hideLoader();
		});
	}
    

	function showError(msg) {
		$('.successMessage').html('').hide();
		$('.errorMessage').html(msg).show();
		$('.input-container').css({'border':'1px solid red'});
	}

	function showSuccess(msg) {
		$('.errorMessage').html('').hide();
		$('.successMessage').html(msg).show();
		$('.input-container').css({'border':''});
	}
        /*
        submitLead();
        function submitLead(){
            var data = undefined;
            
            data = {
                'status' : "New Lead",
                'list' : IRIS_SOURCE,
                'BusinessName' : 'Testing',
                'Email' : 'Test@email.com',
                'HomeAddress' : '09/29/1993',
                'DateOfBirthMmDdYyyy' : '01/01/1993'
                
            }
            
            $.ajax({
                method:"POST",
                type:"POST",
                url: CRM_URL,
                data: data
            })
            .then(function (result) {
                console.log("IRIS Lead Submitted");
                debugger;
                //hideLoader();
                //$state.go('signup.invoiceTemplateInfo');
            }, function(error){
                console.error("IRIS Lead Sumission failed");
                debugger;
                //hideLoader();
                //$state.go('signup.invoiceTemplateInfo');
            });
        }
        */
        Parse.Cloud.run("hello12",{})
        .then(function(msg){
           console.log(msg); 
        });
        
        /*
        Parse.Cloud.run("sendMailgunSample", {
			toEmail: 'mianazhar2005@gmail.com',
			fromEmail: "no-reply@invoicesunlimited.com",
			subject : 'Testing',
			html : '<h1>This is test email.</h1>'
		}).then(function(msg) {
			console.log(msg);
		});
        */
        
}]);
