'use strict';

invoicesUnlimited.controller('PrincipalInfoController',['$scope','$state','userFactory','signUpFactory',
	function($scope,$state,userFactory,signUpFactory){

	var dobMaskOptions = {
		onKeyPress: function(val, e, field, options) {
      		
      		if (!val || val == "") return;

      		var dateObj = new Date();

      		var now = {
      			year 	: dateObj.getFullYear() + "",
      			month 	: (parseInt(dateObj.getMonth()) + 1) + "",
      			date 	: parseInt(dateObj.getDate()) + ""
      		}

      		var oldValue = val.split("-");
      		var newValue = [];

      		if (oldValue[0]) {
      			var value = parseInt(oldValue[0]);
      			if (oldValue[0].length == 2 && value > 0 && value < 32)
      				newValue.push(oldValue[0]);
      			else if (parseInt(oldValue[0][0]) < 4)
      				newValue.push(oldValue[0][0]);
      		}

      		if (oldValue[1]) {
      			var value = parseInt(oldValue[1]);
      			if (oldValue[1].length == 2 && value > 0 && value < 13)
      				newValue.push(oldValue[1]);
      			else if (parseInt(oldValue[1][0]) < 2)
      				newValue.push(oldValue[1][0]);
      		}

      		if (oldValue[2]) {
      			var value = parseInt(oldValue[2]);
      			if (oldValue[2].length == 4 && value == parseInt(now.year)){
      				if (parseInt(oldValue[1]) > parseInt(now.month))
      					newValue.push(oldValue[2].slice(0,3));
      				else if (parseInt(oldValue[0]) > parseInt(now.date))
      					newValue.push(oldValue[2].slice(0,3));
      				else newValue.push(oldValue[2]);
      			}
      			else if (value < parseInt(now.year)){
      				newValue.push(oldValue[2]);	
      			}
      			else if (parseInt(oldValue[2].slice(0,3)) <= parseInt(now.year.slice(0,3)))
      				newValue.push(oldValue[2].slice(0,3));
      			else if (parseInt(oldValue[2].slice(0,2)) <= parseInt(now.year.slice(0,2)))
      				newValue.push(oldValue[2].slice(0,2));
      			else if (parseInt(oldValue[2].slice(0,1)) <= parseInt(now.year.slice(0,1)))
      				newValue.push(oldValue[2].slice(0,1));
      		}

      		field.val((newValue[0]?newValue[0]:"")+(newValue[1]?("-"+newValue[1]):"")+(newValue[2]?("-"+newValue[2]):""));
    	}
	}

	$('[name=dob]').mask("00-00-0000",dobMaskOptions);
	$('[name=ssn]').mask("000-00-0000");

	if (userFactory.authorized()){
		if (!userFactory.getBusinessInfo(false)) {
			userFactory.logout();
			$state.go('signup');
		}
	} else $state.go('signup');

	$("#signUpForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules: {
			streetName 	: 'required',
			city 		: 'required',
			state 		: 'required',
			zipCode 	: 'required',
			dob			: 'required',
			ssn			: 'required'
		},
		messages: {
			streetName	: 'Please specify your street name!',
			city 		: 'Please specify your city!',
			state 		: 'Please specify your state!',
			zipCode 	: 'Please specify your zip code!',
			dob 		: 'Please specify your Date Of Birth!',
			ssn			: 'Please specify your SSN!'
		}
	});

	$scope.principalInfo = {
		streetName		: signUpFactory.get('BusinessInfo','streetName'),
		city			: signUpFactory.get('BusinessInfo','city'),
		state			: signUpFactory.get('BusinessInfo','state'),
		zipCode			: signUpFactory.get('BusinessInfo','zipCode'),
		dob				: '',
		ssn				: ''
	};

	$scope.toggleHomeChecked = true;

	$scope.toggleHomeInfo = function(){

		if (!$scope.toggleHomeChecked) {
			$scope.principalInfo.streetName = "";
			$scope.principalInfo.city = "";
			$scope.principalInfo.state = "";
			$scope.principalInfo.zipCode = "";
			return;
		}

		$scope.principalInfo.streetName = signUpFactory.get('BusinessInfo','streetName');
		$scope.principalInfo.city = signUpFactory.get('BusinessInfo','city');
		$scope.principalInfo.state = signUpFactory.get('BusinessInfo','state');
		$scope.principalInfo.zipCode = signUpFactory.get('BusinessInfo','zipCode');
	};

	$scope.$watch(function(){return signUpFactory.get('BusinessInfo')},function(newValue,oldValue){
		if (oldValue == newValue) return;
		$scope.principalInfo.streetName = newValue.streetName;
		$scope.principalInfo.city = newValue.city;
		$scope.principalInfo.state = newValue.state;
		$scope.principalInfo.zipCode = newValue.zipCode;
	},true);

	$scope.savePrincipalInfo = function(){
		if (!$('#signUpForm').valid()) return;

		showLoader();

		for (var field in $scope.principalInfo){
			signUpFactory.set({
				table : 'PrincipalInfo',
				expr  : field + ":" + $scope.principalInfo[field]
			});
		}

		signUpFactory.setObject({
			table 	: 'PrincipalInfo',
			params  : {
				field : "userID",
				value : signUpFactory.getParse("_User")
			}
		});

		signUpFactory.Save({
			tableName :'PrincipalInfo',
			callback  : function(){

				if (!userFactory.authorized) return;
				signUpFactory.Save('User',{
					principalInfo : signUpFactory.getParse("PrincipalInfo")
				},function(){
					hideLoader();
					$state.go('signup.account-info');
				});

			}
		});
	};

	$scope.saveAndContinueLater = function(){
		if (!userFactory.authorized){
			var user = signUpFactory.getParse('_User');
			if (!user) {
				$state.go('signup');
			}
			userFactory.login({
				username : user.get('username'),
				password : user.get('password'),
			},function(){
				$state.go('dashboard');
			});
		}
		else $state.go('dashboard');
	};

}]);
