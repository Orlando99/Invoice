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
            $scope.businessName = '';
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
    
    $("select").bind("change keyup", function(event){
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
    /*
    $('#phoneNumber').mask("(Z00) 000-0000",{
		translation : {
			'Z': {
				pattern : /[2-9]/g
			}
		}
	});
    */
    $('.mobilePhone').mask('9 (999) 999-9999',mobileOptions);

	$("#signUpForm").validate({
		//onkeyup : true,
		onfocusout : true,
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
            var save;
            if(!obj.length){
                save = signUpFactory.save('User',{
                        'accountInfo':signUpFactory.getFactory('AccountInfo').entity[0],
                        'company':$scope.businessName,
                        'phonenumber':$scope.phoneNumber
                    })
                    .then(function(){
                        return signUpFactory.save('BusinessInfo',{
                        'businessName':$scope.businessName,
                        'phoneNumber':$scope.phoneNumber
                         })
                    });
            }
            else{
                save = signUpFactory.save('User',{
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
            }
			
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
            showLoader();
            //submitLead();
			$state.go('signup.invoiceTemplateInfo');
			return;
		}

		if (!$('#signUpForm').valid()){
            showLoader();
            //submitLead();
            return;
        } 

		showLoader();
		saveHelper().then(function(){
            //submitLead();
            
			hideLoader();
			if (signUpFactory.getFactory('User').entity.length)
			$state.go('signup.invoiceTemplateInfo');
            

		},function(error){
			hideLoader();
			console.log(error.message);
		});

	};
    
    function submitLead(){
        //var currentUser = user.entity[0];
            var bsnsInfo = currentUser.get('businessInfo');
            var principalInfo = currentUser.get('principalInfo');
            //var accountInfo = currentUser.get('accountInfo');
            
            var lastName = undefined;
            var firstName = undefined;
            if(currentUser.fullName){
                firstName = currentUser.fullName.split(' ')[0];
                if(currentUser.fullName.split(' ').length > 1)
                    lastName = currentUser.fullName.split(' ')[1];
            }

            $.ajax({
                method:"POST",
                type:"POST",
                url: IRIS,
                data: { 
                    'originator' : IRIS_ORIGINATOR,
                    'source' : IRIS_SOURCE,
                    'DBA' : currentUser.get('company'),
                    'Email' : currentUser.get('email'),
                    'userId' : currentUser.id,
                    'Location Address'	: bsnsInfo.get('streetName'),
                    'Mailing Address'	: bsnsInfo.get('streetName'),
                    'Location'			: bsnsInfo.get('streetName'),
                    'Mailing'			: bsnsInfo.get('streetName'),
                    'Location State'	: bsnsInfo.get('state'),
                    'Mailing State'		: bsnsInfo.get('state'),
                    'Location ZIP'		: bsnsInfo.get('zipCode'),
                    'Mailing ZIP'		: bsnsInfo.get('zipCode'),
                    'Location City'		: bsnsInfo.get('city'),
                    'Mailing City'		: bsnsInfo.get('city'),
                    'Federal Tax ID'	: bsnsInfo.get('federalTaxID'),
                    'Entity Type'	    : bsnsInfo.get('ownershipType'),
                    'Residence Address'	: principalInfo.get('streetName'),
                    'Residence state'	: principalInfo.get('state'),
                    'Residence zip'		: principalInfo.get('zipCode'),
                    'Residence city'	: principalInfo.get('city'),
                    'Date of Birth'		: principalInfo.get('dob'),
                    'Social Security Number'	: principalInfo.get('ssn'),
                    'Contact_First_Name'	: firstName,
                    'Contact_Last_Name'	: lastName
                }
            })
            .then(function (result) {
                //console.log("IRIS Lead Submitted");
                debugger;
                hideLoader();
                $state.go('signup.invoiceTemplateInfo');
            }, function(error){
                //console.error("IRIS Lead Sumission failed");
                debugger;
                hideLoader();
                $state.go('signup.invoiceTemplateInfo');
            });
    }
    
	function allFieldsFilled() {
  		for(var field in $scope.accountInfo) {
  			if (! $scope.accountInfo[field])
  				return false;
  		}
  		return true;
  	}

});
