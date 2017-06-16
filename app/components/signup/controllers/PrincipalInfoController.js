'use strict';

invoicesUnlimited.controller('PrincipalInfoController',
	['$q','$rootScope','$scope','$state','signUpFactory','userFactory',
	function($q,$rootScope,$scope,$state,signUpFactory, userFactory){

	var user = signUpFactory.getFactory('User');
        
        var currentUser = undefined;
        
        $q.when(userFactory.entity[0].fetch())
.then(function(obj) {
	currentUser = obj;
});
        
/*
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
*/	$('[name=ssn]').mask("000-00-0000");

	if (!signUpFactory.getFactory('User').entity.length) {
		$state.go('signup');
		return;
	}
        
        $("input").keyup(function(event){
            var id = event.target.id;
            $('#' + id + '-' + 'error').css('display', 'none');
       
            $('#' + id).removeClass('error');
    });

	if (!signUpFactory.getVerification.code() && ! $rootScope.fromPaymentSettings) {
		user.logout();
		$state.go('signup');
		return;
	}

	$("#signUpForm").validate({
		onkeyup : function(element) {$(element).valid()},
		onfocusout : false,
		rules: {
			streetName 	: 'required',
			city 		: 'required',
			state 		: 'required',
			zipCode 	: 'required',
			dob			: 'required',
			ssn			: 'required',
            fullName    : 'required'
		},
		messages: {
			streetName	: 'Please specify your street name!',
			city 		: 'Please specify your city!',
			state 		: 'Please specify your state!',
			zipCode 	: 'Please specify your zip code!',
			dob 		: 'Please specify your Date Of Birth!',
			ssn			: 'Please specify your SSN!',
            fullName	: 'Please specify your Full Name!'
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
        
        $scope.fullName = '';

	$scope.toggleHomeChecked = true;

	var fields = ['streetName','city','state','zipCode'];

	$scope.toggleHomeInfo = function(){
		fields.forEach(function(field){
			$scope.principalInfo[field] = 
				$scope.toggleHomeChecked ? 
				getBusField(field) :
				"";
		});
	};

	if($rootScope.fromPaymentSettings) {
		var userObj = user.entity[0];
		signUpFactory.setField('PrincipalInfo', 'userID', userObj);
		signUpFactory.setField('PrincipalInfo', 'organization',
			userObj.get('selectedOrganization'));

		showLoader();
		var p = undefined;
		var promises = [];
		p = $q.when(userObj.get('businessInfo').fetch())
		.then(function(bInfo) {
			for(var i=0; i < fields.length; ++i) {
				signUpFactory.setField('BusinessInfo', fields[i],
					bInfo.get(fields[i]));
			}
			$scope.toggleHomeInfo();
		});
		promises.push(p);

		p = $q.when(signUpFactory.getFactory('Role').load());
		promises.push(p);

		$q.all(promises).then(function() {
			hideLoader();

		}, function(error) {
			hideLoader();
			console.log(error.message);
		});

	}

	$scope.$watch(function(){return signUpFactory.get('BusinessInfo')},function(newValue,oldValue){
		if (oldValue == newValue) return;
		fields.forEach(function(field){
			$scope.principalInfo[field] = newValue[field];
		});
	},true);

	function saveHelper() {
		$scope.principalInfo.dob = formatDate($scope.dob, "MM-DD-YYYY");
		for (var field in $scope.principalInfo){
			signUpFactory.setField('PrincipalInfo',{
				field : field, 
				value : $scope.principalInfo[field]
			});
		}

		var principal = signUpFactory.create('PrincipalInfo');

		return principal
		.then(function(obj){
			var save = signUpFactory.save('User',{
				'principalInfo' : obj
			});
			if (save) return save;
		//	window.reload();
		});
	}

	$scope.savePrincipalInfo = function(){
		if (!$('#signUpForm').valid()) return;
		
		showLoader();
        
            currentUser.set('fullName', $scope.fullName);
        $q.when(user.save())
        .then(function() {
            saveHelper().then(function(){
			hideLoader();
			$state.go('signup.account-info');

		},function(error){
			hideLoader();
			console.log(error.message);
		});
        });
        
		
	};

	$scope.saveAndContinueLater = function(){
		if(! allFieldsFilled()) {
			$state.go('dashboard');
			return;
		}

		if (!$('#signUpForm').valid()) return;

		showLoader();
		saveHelper().then(function(){
			hideLoader();
			if (signUpFactory.getFactory('User').entity.length)
				$state.go('dashboard');

		},function(error){
			hideLoader();
			console.log(error.message);
		});
	};

	$scope.openDatePicker = function(n) {
		switch (n) {
			case 1: $scope.openPicker1 = true; break;
		}
  	}

  	function allFieldsFilled() {
  		fields.forEach(function(field) {
  			if(! $scope.principalInfo[field])
  				return false;
  		});
  		if (! $scope.dob || !$scope.principalInfo['ssn'])
  			return false;

  		return true;
  	}

}]);
