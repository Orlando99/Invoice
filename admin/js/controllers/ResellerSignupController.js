'use strict';

clientAdminPortalApp.controller('ResellerSignupController',[
	'$q','$scope', '$state', '$modal', 'userRecordFactory', 'accountInfoFactory', 'businessInfoFactory', 'signatureFactory', 'principalInfoFactory', 'organizationFactory', 'currencyFactory', 'projectUserFactory', 'preferencesFactory','resellerInfoFactory',
	function($q,$scope, $state, $modal, userRecordFactory, accountInfoFactory, businessInfoFactory, signatureFactory, principalInfoFactory, organizationFactory, currencyFactory, projectUserFactory, preferencesFactory, resellerInfoFactory) {

		if (Parse.User.current()) {
			if(Parse.User.current().get("isReseller"))
				$state.go("resellers");
			else
				$state.go("home");
		}

		$("#resellerSignupForm").validate({
			onkeyup : function(element) {$(element).valid()},
			onfocusout : false,
			rules: {
				businessName	: 'required',
				businessAddress	: 'required',
				city			: 'required',
				state 			: 'required',
				zipCode 		: 'required',
				email 			: {
					email 		: true,
					required 	: true
				},
				username 		: 'required',
				fullName 		: 'required',
				creditCardNumber: 'required',
				expDate			: 'required',
				cvv				: 'required',
				zipCodeAccount	: 'required',
				password : {
					minlength : 6,
					required: true
				},
				phoneNumber : {
					minlength : 14,
					required: true
				}
			},
			messages: {
				businessName	: 'Please enter business name',
				businessAddress	: 'Please enter business address',
				city			: 'Please enter business city',
				state 			: 'Please enter business state',
				zipCode 		: 'Please enter business zipcode',
				email 			: {
					email : 'Please enter valid email',
					required : 'Please enter email'
				},
				username 		: 'Please enter username',
				fullName 		: 'Please enter account holder name',
				creditCardNumber: 'Please enter credit card number',
				expDate			: 'Please enter expiry date',
				cvv				: 'Please enter cvv',
				zipCodeAccount	: 'Please enter zip code',
				password : {
					minlength : "Password length must be atleast 6 characters",
					required: "Please enter password"
				},
				phoneNumber : {
					minlength : "Please enter valid phone number",
					required: "Please enter phone number"
				}
			}
		});

		$('.phonenumber').mask("(Z00) 000-0000",{
			translation : {
				'Z': { pattern : /[2-9]/g }
			}
		});

		$scope.signUpUser = function(){
			if(!$("#resellerSignupForm").valid())
				return;

			createUser();
		}

		$scope.newUserRecord = new userRecordFactory();
		$scope.newUserRecord.accountAssigned = true;
		$scope.newUserRecord.paymentGateway = '';

		$scope.account = new accountInfoFactory();
		$scope.business = new businessInfoFactory();
		$scope.resellerInfo = new resellerInfoFactory();
		$scope.newUserRecord.SetDummyInfo();
		$scope.account.SetDummyInfo();
		$scope.newUserRecord.set("accountInfo", $scope.account);
		$scope.newUserRecord.set("businessInfo", $scope.business);
		$scope.newUserRecord.set("resellerInfo", $scope.resellerInfo);
		$scope.newUserRecord.accountAssigned = true;
		$scope.newUserRecord.businessAssigned = true;

		function createUser() {
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
				paymentGateway: $scope.newUserRecord.paymentGateway,
				ccNumber 	  : $scope.newUserRecord.ccNumber,
				cardZipCode   : $scope.newUserRecord.cardZipCode
			};

			$scope.newUserRecord.set("isReseller", true);
			
			$scope.newUserRecord.signUp(null, {
				success: function(record) {
					console.log("successfully created:", record);
				},
				error: function(record, error) {
					alert("Failed to create object:" + error.message);
				}
			}).then(function(user){
				var userTables = {
					business : null,
					account : null,
					principal : new principalInfoFactory(),
					signatureImage : new signatureFactory(),
					selectedOrganization : new organizationFactory(),
					currency : new currencyFactory(),
					projectUser : new projectUserFactory(),
					preferences : new preferencesFactory(),
					reseller : null
				}

				for (var table in userTables){
					if (!userTables[table]) continue;
					if(userTables[table].SetDummyInfo)
						userTables[table].SetDummyInfo();
					if (userTables[table].SetData)
						userTables[table].SetData(formInfo);
				}

				$scope.business.SetData(formInfo);
				$scope.resellerInfo.SetData(formInfo);

				userTables.signatureImage.set("imageName","Signature_" + user.id);
				userTables.signatureImage.set("user",user);
				userTables.account = $scope.account;
				userTables.business = $scope.business;
				userTables.reseller = $scope.resellerInfo;
				userTables.selectedOrganization.set("userID", user);
				userTables.currency.set('userId', user);
				userTables.projectUser.set('userID', user);
				userTables.preferences.set('userID', user);
				userTables.reseller.set('userID', user);

				var promises = toArray(userTables).map(function(table){
					return table.save();
				});

				Parse.Promise.when(promises).then(function(result){

					var busObj = result[0];
					var accObj = result[1];
					var prObj = result[2];
					var signObj = result[3];
					var orgObj = result[4];
					var currObj = result[5];
					var projObj = result[6];
					var prefObj = result[7];
					var resellerObj = result[8];

					busObj.set('organization', orgObj);
					currObj.set('organization', orgObj);
					prefObj.set('organization', orgObj);
					projObj.set('organization', orgObj);
					var p = [];
					busObj.save();
					prefObj.save();
					projObj.save();
					currObj.save()
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
								},
								{
									id : resellerObj.id,
									className : 'Reseller',
									field : 'resellerInfo'
								}
							]
						}})
							.then(function(msg){
							console.log("Cloud update successfull");
							//$scope.updateQueryResults();
							//window.location.reload();
							$state.go('resellers');
						}, function(error){
							console.log(error);
						});
					}, function(err){
						debugger;
					});
				}, function(error){
					console.error(error.message);
					debugger;
				});
			});
		}
	}]);
