'use strict';

clientAdminPortalApp.controller('resellersController',[
	'$q', '$scope', '$state', '$modal', 'userRecordFactory', 'accountInfoFactory', 'businessInfoFactory', 'signatureFactory', 'principalInfoFactory', 'organizationFactory', 'currencyFactory', 'projectUserFactory', 'preferencesFactory',
	function($q,$scope, $state, $modal, userRecordFactory, accountInfoFactory, businessInfoFactory, signatureFactory,principalInfoFactory,organizationFactory,currencyFactory,projectUserFactory,preferencesFactory) {

		if (Parse.User.current()) {
			if(!(Parse.User.current().get("isReseller") || Parse.User.current().authenticated()))
				$state.go("home");
		} else {
			$state.go("login");
		}

		$scope.sessionUsername = Parse.User.current().get("fullName");

		$scope.logOut = function() {
			Parse.User.logOut();
			$scope.authenticated = false;
			$scope.sessionUsername = '';
			$state.go('login');
		};

		$scope.records = [];
		var obj = {
			id : "2121313131",
			bname : "lorem Ipusm",
			name : "Lonnie Spencier",
			email : "lorem@hotmail.com",
			phone : "(703) 117167617",
			uname : "lorem",
			amount : "$100"
		};

		$scope.records.push(obj);   
		obj = {
			id : "17891817911",
			bname : "Sam",
			name : "Sam Wilson",
			email : "Sam@gmail.com",
			phone : "(703) 117167617",
			uname : "Sam",
			amount : "$200"
		};

		$scope.records.push(obj);

		obj = {
			id : "98287878927",
			bname : "Jared",
			name : "Jared Smith",
			email : "Jared@gmail.com",
			phone : "(703) 117167617",
			uname : "Jared",
			amount : "$300"  

		};

		$scope.records.push(obj);

		obj = {
			id : "893871837",
			bname : "George",
			name : "George Mike",
			email : "George@gmail.com",
			phone : "(703) 117167617",
			uname : "George",
			amount : "$400"         
		};  


		$scope.records.push(obj);

		obj = {
			id : "1391837137",
			bname : " Will",
			name : "Will Smith",
			email : "will@gmail.com",
			phone : "(703) 117167617",
			uname : "Will",
			amount : "$200" 

		};         
		$scope.records.push(obj);


		$scope.adminUsers = [];
		$scope.adminIds = [];

		$scope.query = "";
		$scope.lastUsedQuery = null;
		$scope.lastUsedQuerySkip = 0;
		$scope.paginating = false;
		$scope.queryChunkSize = 20;
		$scope.lastUsedQueryGotAll = false;


		$scope.gatewayTypeNames = {
			'': 'Select Gateway',
			'1': 'Epn',
			'2': 'Auth. Net',
			'3': 'Pivotal'
		}        

		$scope.openDeleteModal = function(){
			$("#myModal").css("display" ,"block");
		}   

		$scope.closeDeleteModal = function(){
			$("#myModal").css("display" ,"none");
		}

		window.onclick = function(event){
			var modal = document.getElementById('myModal');
			if (event.target == modal){
				$("#myModal").css("display" ,"none");
			}
		}


		$scope.openModalCreate = function() {
			var modalInstance = $modal.open({
				animation: false,
				templateUrl: 'add-basic-info',
				controller: 'ModalCreateControllerResellers',
				windowClass: 'window-shadow',
				backdrop: true,
				resolve: {
					newUserRecord: function() {
						console.log('resolve');
						return $scope.newUserRecord;
					},
					gatewayTypeNames: function() {
						return $scope.gatewayTypeNames;
					},
					account : function(){
						return new accountInfoFactory();
					},
					business : function(){
						return new businessInfoFactory();
					}
				}
			});

			modalInstance.result.then(function(result) {

				console.log('modal create submitted');

				var skipApp = $scope.newUserRecord.skipApplication;
				var formInfo = {
					fullname      : $scope.newUserRecord.fullName,
					address       : $scope.newUserRecord.address,
					city          : $scope.newUserRecord.city,
					state         : $scope.newUserRecord.state,
					zipCode       : $scope.newUserRecord.zip,
					phone         : $scope.newUserRecord.phone,
					email         : $scope.newUserRecord.email,
					merchantId    : $scope.newUserRecord.merchantReferenceId,
					businessName  : $scope.newUserRecord.businessName,
					username      : $scope.newUserRecord.username,
					paymentGateway   : $scope.newUserRecord.paymentGateway,

				};

				$scope.newUserRecord.save(null, {
					success: function(record) {
						$scope.$apply(function() {
							$scope.records.push($scope.newUserRecord);
							$scope.newUserRecord = new userRecordFactory();
							$scope.newUserRecord.set("accountInfo", new accountInfoFactory);
							$scope.newUserRecord.set("businessInfo", new businessInfoFactory);
							$scope.newUserRecord.accountAssigned = true;
							$scope.newUserRecord.businessAssigned = true;
							$scope.newUserRecord.paymentGateway = '';
						});
						console.log("successfully created:", record);
					},
					error: function(record, error) {
						alert("Failed to create object:" + error.message);
					}
				}).then(function(user){
					if (!skipApp) {
						result.account.save().then(function(account){
							var saving = {
								id        : user.id,
								accountId : account.id
							};
							Parse.Cloud.run("updateUser", {saving: saving})
								.then(function(){
								alert("User " + user.username + " was successfuly created!");
								$scope.updateQueryResults();
								window.location.reload();
							});
						});
						return;
					}

					var userTables = {
						//business : new businessInfoFactory(),
						business : null,
						account : null,
						principal : new principalInfoFactory(),
						signatureImage : new signatureFactory(),
						selectedOrganization : new organizationFactory(),
						currency : new currencyFactory(),
						projectUser : new projectUserFactory(),
						preferences : new preferencesFactory()
					}

					for (var table in userTables){
						if (!userTables[table]) continue;
						userTables[table].SetDummyInfo();
						if (userTables[table].SetData)
							userTables[table].SetData(formInfo);
					}

					result.business.SetData(formInfo);

					userTables.signatureImage.set("imageName","Signature_" + user.id);
					userTables.signatureImage.set("user",user);
					userTables.account = result.account;
					userTables.business = result.business;
					userTables.selectedOrganization.set("userID", user);
					userTables.currency.set('userId', user);
					userTables.projectUser.set('userID', user);
					userTables.preferences.set('userID', user);

					var promises = toArray(userTables).map(function(table){
						return table.save();
					});

					//Parse.Promise.when(promises).then(function(busObj,accObj,prObj,signObj,orgObj,currObj,projObj,prefObj){
					Parse.Promise.when(promises).then(function(result){

						var busObj = result[0];
						var accObj = result[1];
						var prObj = result[2];
						var signObj = result[3];
						var orgObj = result[4];
						var currObj = result[5];
						var projObj = result[6];
						var prefObj = result[7];

						currObj.set('organization', orgObj);
						prefObj.set('organization', orgObj);
						projObj.set('organization', orgObj);
						var p = [];
						prefObj.save();
						projObj.save();
						//p.push(currObj.save());
						//p.push(prefObj.save());
						currObj.save()
						//$q.all(p)
							.then(function(currencyObj){
							Parse.Cloud.run("UpdateUser",{user : {
								id : user.id,
								params : {},
								pointers : [
									{
										id : busObj.id,
										className : 'BusinessInfo',
										field : 'businessInfo'
									},
									{
										id : accObj.id,
										className : 'AccountInfo',
										field : 'accountInfo'
									},
									{
										id : prObj.id,
										className : 'PrincipalInfo',
										field : 'principalInfo'
									},
									{
										id : signObj.id,
										className : 'Signature',
										field : 'signatureImage'
									},
									{
										id : orgObj.id,
										className : 'Organization',
										field : 'selectedOrganization'
									},
									{
										id : orgObj.id,
										className : 'Organization',
										field : 'organizations'
									},
									{
										id : currencyObj.id,
										className : 'Currency',
										field : 'currency'
									}
								]
							}})
								.then(function(msg){
								console.log("Cloud update successfull");
								//$scope.updateQueryResults();
								window.location.reload();
							}, function(error){
								console.log(error);
							});
						}, function(err){
							debugger;
						});


						/*
          if (busObj && accObj && prObj && signObj){
            var saving = {};
            saving.id = user.id;
            saving.busId = busObj.id;
            saving.accId = accObj.id;
            saving.prId = prObj.id;
            saving.signId = signObj.id;

            Parse.Cloud.run("updateUserTables", {saving: saving}, {
              success: function() {
                console.log("Cloud update successfull");
                $scope.updateQueryResults();
                window.location.reload();
              },
              error: function(error) {
                console.log("Cloud update failed:" + error.message);
              }
            });
          }
            */
					});

					/*
        Parse.Promise.when(promises).then(function(busObj,accObj,prObj,signObj,orgObj,currObj,projObj,prefObj){
            currObj.set('organization', orgObj);
            prefObj.set('organization', orgObj);
            var p = [];
            prefObj.save();
            //p.push(currObj.save());
            //p.push(prefObj.save());
            currObj.save()
            //$q.all(p)
            .then(function(currencyObj){
                Parse.Cloud.run("UpdateUser",{user : {
                  id : user.id,
                  params : {},
                  pointers : [
                    {
                      id : busObj.id,
                      className : 'BusinessInfo',
                      field : 'businessInfo'
                    },
                    {
                      id : accObj.id,
                      className : 'AccountInfo',
                      field : 'accountInfo'
                    },
                    {
                      id : prObj.id,
                      className : 'PrincipalInfo',
                      field : 'principalInfo'
                    },
                    {
                      id : signObj.id,
                      className : 'Signature',
                      field : 'signatureImage'
                    },
                    {
                      id : orgObj.id,
                      className : 'Organization',
                      field : 'selectedOrganization'
                    },
                    {
                      id : orgObj.id,
                      className : 'Organization',
                      field : 'organizations'
                    },
                    {
                      id : currencyObj.id,
                      className : 'Currency',
                      field : 'currency'
                    }
                  ]
                }})
                .then(function(msg){
                    console.log("Cloud update successfull");
                    //$scope.updateQueryResults();
                    window.location.reload();
                }, function(error){
                    console.log(error);
                });
            }, function(err){
                debugger;
            });

        });
          */
				});

			}, function() {
				console.log('modal create cancelled');
			});
		};
	}]);
