'use strict';

clientAdminPortalApp.controller('resellerProfileController',[
	'$q', '$scope', '$state', '$modal', 'userRecordFactory', 'accountInfoFactory', 'businessInfoFactory', 'signatureFactory', 'principalInfoFactory', 'organizationFactory', 'currencyFactory', 'projectUserFactory', 'preferencesFactory',
	function($q,$scope, $state, $modal, userRecordFactory, accountInfoFactory, businessInfoFactory, signatureFactory,principalInfoFactory,organizationFactory,currencyFactory,projectUserFactory,preferencesFactory) {

		if (Parse.User.current()) {
			if(!(Parse.User.current().get("isReseller") || Parse.User.current().authenticated()))
				$state.go("home");
		} else {
			$state.go("login");
		}

		$("#signUpForm").validate({
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
				expDate			: 'required',
				cvv				: 'required',
				zipCodeAccount	: 'required',
				password : {
					minlength : 6,
					required: false
				},
				phoneNumber : {
					minlength : 10,
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
				expDate			: 'Please enter expiry date',
				cvv				: 'Please enter cvv',
				zipCodeAccount	: 'Please enter zip code',
				password : {
					minlength : "Password length must be atleast 6 characters",
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

		getUserData();

		function getUserData(){
			var query = new Parse.Query(userRecordFactory);

			query.include("businessInfo");
			query.include("resellerInfo");

			query.get(Parse.User.current().id, {
				success: function(user) {
					$scope.record = user;
					if(!$scope.$$phase)
						$scope.$apply();
				},
				error: function(object, error) {
					// The object was not retrieved successfully.
					// error is a Parse.Error with an error code and message.
				}
			});
		}

		$scope.updateInfo = function(){
			if(!$("#signUpForm").valid())
				return;

			if($scope.record.ccNumber && $scope.record.ccNumber.length){
				$scope.record.resellerInfo.set('ccNumber', $scope.record.ccNumber);
			}

			$scope.record.resellerInfo.save();
			$scope.record.businessInfo.save();

			$scope.record.save()
				.then(function(){
				$state.go("resellers");
			}, function(error){
				console.error(error.message());
			});
		}
	}]);
