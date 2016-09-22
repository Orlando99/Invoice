'use strict';

invoicesUnlimited.controller('AccountInfoController',
	function($q,$rootScope,$scope,$state,signUpFactory,userFactory){

	if (!signUpFactory.getFactory('User').entity.length) {
		$state.go('signup');
		return;
	}
    
    var user = signUpFactory.getFactory('User');
    
    var currentUser = undefined;
        
        $q.when(userFactory.entity[0].fetch())
        .then(function(obj) {
            currentUser = obj;
            $scope.businessName = obj.get('company');
        });

	if($rootScope.fromPaymentSettings) {
		var userObj = signUpFactory.getFactory('User').entity[0];
		signUpFactory.setField('AccountInfo', 'userID', userObj);
		signUpFactory.setField('AccountInfo', 'organization',
			userObj.get('selectedOrganization'));

		showLoader();
		debugger;
		signUpFactory.getFactory('Role').load()
		.then(function() {
			hideLoader();

		}, function(error) {
			hideLoader();
			console.log(error.message);
		});
	}
    
    $("input").keyup(function(event){
            var id = event.target.id;
            $('#' + id + '-' + 'error').css('display', 'none');
       
            $('#' + id).removeClass('error');
    });

	$.validator.addMethod(
		"AvgSaleRequired",
		function(value,element){
			return value != "avgSaleTitle";
		}
	);

	$.validator.addMethod(
		"MonthlySalesRequired",
		function(value,element){
			return value != 'monthlySalesTitle';
		}
	);

	$('[name=routingNumber]').mask('000000000');
	$('[name=accountNumber]').mask('0000000000');
    $('#phoneNumber').mask("(Z00) 000-0000",{
		translation : {
			'Z': {
				pattern : /[2-9]/g
			}
		}
	});

	$("#signUpForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules: {
			avgSale 		: {
				required : true,
				AvgSaleRequired : true
			},
			monthlySales 	: {
				required : true,
				MonthlySalesRequired : true
			},
			bankName 		: 'required',
			routingNumber	: 'required',
			accountNumber	: 'required',
            phoneNumber     : 'required',
            businessName    : 'required'

		},
		messages: {
			avgSale 		: 'Please specify your average sale per customer!',
			monthlySales 	: 'Please specify your estimated montly credit card sales!',
			bankName 		: 'Please specify your bank name!',
			routingNumber	: 'Please specify your bank routing number!',
			accountNumber	: 'Please specify your bank account number!',
            phoneNumber     : 'Please specify your phone number!',
            businessName    : 'Please specify your business name!'
		}
	});

    
    
	$scope.avgSaleList 		= [];
	$scope.monthlySalesList = [];
	
	var moneyVal = 0;
	
	do {
		if (!moneyVal) moneyVal = 1;
		else if (moneyVal == 1) moneyVal = 5;
		else if (moneyVal < 100) moneyVal += 5;
		else if (moneyVal < 1000) moneyVal += 50;
		else if (moneyVal < 10000) moneyVal += 500;
		else moneyVal += 5000;
		$scope.avgSaleList.push({value:"$ " + (moneyVal == 50000 ? moneyVal + "+" : moneyVal)});
	} while(moneyVal != 50000)

	moneyVal = 0;

	do {
		if (moneyVal < 25000) moneyVal += 500;
		else moneyVal += 5000;
		$scope.monthlySalesList.push({value:"$ " + (moneyVal == 100000 ? moneyVal + "+" : moneyVal)});
	} while(moneyVal != 100000)

	$scope.accountInfo = {
		bankName		: '',
		routingNumber	: '',
		accountNumber	: '',
		avgSale			: '',
		//inPerson		: 'inPerson',
		monthlySales	: ''
	};

	function saveHelper() {
		for (var field in $scope.accountInfo){
			signUpFactory.setField('AccountInfo',{
				field : field,
				value : $scope.accountInfo[field]
			});
		}
        
		signUpFactory.setField('AccountInfo',{
			field : 'inPerson',
            value : false
			//value : ($scope.accountInfo['inPerson'] == 'inPerson')
		});
        
		var account = signUpFactory.create('AccountInfo');
		
		return account
		.then(function(obj){
			var save = signUpFactory.save('User',{
				'accountInfo':obj,
                'company':$scope.businessName,
                'phonenumber':$scope.phoneNumber
			})
            .then(function(){
                return signUpFactory.save('BusinessInfo',{
				'businessName':$scope.businessName,
                'phoneNumber':$scope.phoneNumber
			     })
            });
			if (save) return save;
		//	window.reload();
		});
	}

	$scope.saveAccountInfo = function(){
		if (!$('#signUpForm').valid()) return;

		showLoader();
        
        saveHelper().then(function(){
			hideLoader();
			$state.go('signup.signature');
            },function(error){
                hideLoader();
                console.log(error.message);
            });
        
        /*
        currentUser.set('phonenumber', $scope.phoneNumber);
        $q.when(user.save())
        .then(function() {
            
            saveHelper().then(function(){
			hideLoader();
			$state.go('signup.signature');
            },function(error){
                hideLoader();
                console.log(error.message);
            });
		
		});
        */
        
		
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

	function allFieldsFilled() {
  		for(var field in $scope.accountInfo) {
  			if (! $scope.accountInfo[field])
  				return false;
  		}
  		return true;
  	}

});
