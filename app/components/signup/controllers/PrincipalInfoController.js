'use strict';

invoicesUnlimited.controller('PrincipalInfoController',
	['$scope','$state','signUpFactory',
	function($scope,$state,signUpFactory){

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

	if (!signUpFactory.getFactory('User').entity.length) {
		$state.go('signup');
		return;
	}

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

	var getBusField = function(field){
		return signUpFactory.getField('BusinessInfo',field);
	};

	$scope.principalInfo = {
		streetName		: getBusField('streetName'),
		city			: getBusField('city'),
		state			: getBusField('state'),
		zipCode			: getBusField('zipCode'),
		dob				: '',
		ssn				: ''
	};

	$scope.toggleHomeChecked = true;

	var fields = ['streetName','city','state','zipCode'];

	$scope.toggleHomeInfo = function(){

		if (!$scope.toggleHomeChecked) {
			fields.forEach(function(field){
				$scope.principalInfo[field] = "";
			});
			return;
		}

		fields.forEach(function(field){
			$scope.principalInfo[field] = getBusField(field);
		});
	};

	$scope.$watch(function(){return signUpFactory.get('BusinessInfo')},function(newValue,oldValue){
		if (oldValue == newValue) return;
		fields.forEach(function(field){
			$scope.principalInfo[field] = newValue[field];
		});
	},true);

	$scope.savePrincipalInfo = function(){
		if (!$('#signUpForm').valid()) return;

		showLoader();

		for (var field in $scope.principalInfo){
			signUpFactory.setField('PrincipalInfo',{
				field : field, 
				value : $scope.principalInfo[field]
			});
		}

		var user = signUpFactory.getFactory('User');

		signUpFactory.setField('PrincipalInfo','userID',
								user.entity[0]);

		var principal = signUpFactory.create('PrincipalInfo');

		if (!principal) {
			$state.go('signup');
			return;
		}

		principal.then(function(obj){
			var save = signUpFactory.save('User',{'principalInfo':obj});
			if (save) return save;
			window.reload();
		},function(error){
			console.log(error.message);
		}).then(function(){
			hideLoader();
			$state.go('signup.account-info');
		},function(error){
			console.log(error.message);
		});
	};

	$scope.saveAndContinueLater = function(){
		$state.go('dashboard');
	};

}]);
