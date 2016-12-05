'use strict';

$(document).ready(function(){
	$.validator.addMethod(
		"OwhershipTypeNotSelected",
		function(value,element){
			return value != "ownershipTitle";
		}
	);
	$.validator.addMethod(
		"FederalTaxIDisMissing",
		function(value,element){
			if ($(element).css('display') == 'none') return true;
			else if (value == "") return false;
			return true;
		}
	)
	$.validator.addMethod(
		"exactlength",
		function(value, element, param) {
 			return value.length == param;
		}
	);
});

invoicesUnlimited.controller('BusinessInfoController',
	['$q','$rootScope','$scope','$state','signUpFactory','userFactory','roleFactory',
	function($q,$rootScope,$scope,$state,signUpFactory,userFactory,roleFactory){

	if (!userFactory.entity.length){
		$state.go('signup');
		return;
	}
        /*
	if (!signUpFactory.getVerification.code() && ! $rootScope.fromPaymentSettings) {
		userFactory.logout();
		$state.go('signup');
		return;
	}
       */ 
        var user = signUpFactory.getFactory('User');
        
        var currentUser = undefined;
        
        $q.when(userFactory.entity[0].fetch())
        .then(function(obj) {
            currentUser = obj;
        });

	// User object in signUpFactory doesn't have data.
	if($rootScope.fromPaymentSettings) {
		var user1 = userFactory.entity[0];
        /*
		signUpFactory.setField('PrincipalInfo', 'userID', user);
		signUpFactory.setField('PrincipalInfo', 'organization',
			user.get('selectedOrganization'));
/*
		showLoader();
		var p = undefined;
		var promises = [];
		p = $q.when(user.get('businessInfo').fetch())
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
        */
        
        
		signUpFactory.setField('User','company', user1.get('company'));
		//signUpFactory.setField('User','phonenumber', user.get('phonenumber'));
		signUpFactory.setField('BusinessInfo', 'organization',
			user1.get('selectedOrganization'));
	}
        
        $("input").keyup(function(event){
            var id = event.target.id;
            $('#' + id + '-' + 'error').css('display', 'none');
       
            $('#' + id).removeClass('error');
    });

	$("#signUpForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules: {
			company 			: 'required',
            fullName            : 'required',
            dob                 : 'required',
            ssn                 : 'required',
			streetName			: 'required',
			city 				: 'required',
			state 				: 'required',
			zipCode 			: 'required',
			//businessDescription : 'required',
			ownershipType : {
				OwhershipTypeNotSelected : true
			},
			federalTaxID : {
				FederalTaxIDisMissing : true,
				exactlength : 10

			}
		},
		messages: {
			company 	: 'Please specify your business name!',
			streetName	: 'Please specify your business street name!',
			city 		: 'Please specify your business city!',
			state 		: 'Please specify your business state!',
            dob 		: 'Please specify your Date Of Birth!',
			ssn			: 'Please specify your SSN!',
            fullName	: 'Please specify your Full Name!',
			zipCode 	: 'Please specify your business zip code!',
			//businessDescription : 'Please specify your business description!',
			ownershipType : {
				OwhershipTypeNotSelected : "Please select your ownership type!"
			},
			federalTaxID : {
				FederalTaxIDisMissing : 'Please specify your Federal Tax ID!',
				exactlength : 'Please enter exactly 9 digits'
			}
		}
	});

	$('input[name="federalTaxID"]').mask('00-0000000');
userFactory.entity[0].get('company')
	$scope.bsnsInfo = {
		'businessName'  : userFactory.entity[0].get('company'),
		//'businessName'  : signUpFactory.getField('User','company'),
		'streetName'	: '',
		'city'			: '',
		'state'			: '',
		'zipCode'		: '',
		//'businessDescription' : '',
		'federalTaxID'	: '',
		ownershipType	: 'Ownership Type'
	}
    /*
    $scope.toggleHomeInfo = function(){
		if($scope.toggleHomeChecked)
            {
                $('#homeAdressDiv')
            }
	};

    /*
	$('#phone').mask("(Z00) 000-0000",{
		translation : {
			'Z': {
				pattern : /[2-9]/g
			}
		}
	}).val(signUpFactory.getField('User','phonenumber'));
*/
	$scope.options = [{
   		name: 'ownershipTitle',
   		value: 'Ownership Type'
	}, {
   		name: 'Individual or Sole Proprietor',
   		value: 'Individual or Sole Proprietor'
	},
	{
   		name: 'Limited Liability Compnay',
   		value: 'Limited Liability Compnay'
	},
    {
   		name: 'Non Profit',
   		value: 'Non Profit'
	},
    {
   		name: 'S-Corporation',
   		value: 'S-Corporation'
	},
	{
   		name: 'C-Corporation',
   		value: 'C-Corporation'
	},
    {
   		name: 'Partenership',
   		value: 'Partenership'
	}];
        
        var nextScreen = 'signup.account-info';
        
    $scope.saveAndLaterBusinessInfo = function(){
        nextScreen = 'signup.invoiceTemplateInfo';
        if($('#signUpForm').validate().errorList)
        {   
            signUpFactory.setField('BusinessInfo',{
                    field : 'businessName',
                    value : signUpFactory.getField('User','company')
                });
            signUpFactory.setField('BusinessInfo',{
                    field : 'streetName',
                    value : ''
                });
            signUpFactory.setField('BusinessInfo',{
                    field : 'city',
                    value : ''
                });
            signUpFactory.setField('BusinessInfo',{
                    field : 'state',
                    value : ''
                });
            signUpFactory.setField('BusinessInfo',{
                    field : 'zipCode',
                    value : ''
                });

            var business = signUpFactory.create('BusinessInfo');

            business
            .then(function(busObj){
                return signUpFactory.save('User',{
                    'businessInfo' : busObj,
                });
            },
            function(err){
                if (!err.length) console.log(err.message);
                err.forEach(function(er){
                    console.log(er.message);
                });
            })
            .then(function(){
                hideLoader();
                $state.go('signup.invoiceTemplateInfo')
                //$state.go('signup.principal-info');
            },errorCallback);
            
            //-------------------
        }
        else{
            saveData();
        }
    };

	$scope.saveBusinessInfo = saveData;
        
    function saveData(){
	
		if (!$('#signUpForm').valid()) return;
        
        signUpFactory.setDefaultValues();
        
		showLoader();
		for (var field in $scope.bsnsInfo){
			signUpFactory.setField('BusinessInfo',{
				field : field,
				value : $scope.bsnsInfo[field]
			});
		}
		
		var business = signUpFactory.create('BusinessInfo');

		business
		.then(function(busObj){
			return signUpFactory.save('User',{
				'businessInfo' : busObj,
			});
		},
		function(err){
			if (!err.length) console.log(err.message);
			err.forEach(function(er){
				console.log(er.message);
			});
		})
		.then(function(){
            savePrincipalInfo();
			//hideLoader();
			//$state.go('signup.principal-info');
		},errorCallback);
	}

    $('.federal-tax-id-input').hide();
    $('.ownershipTypeInput').show();
        
	$scope.federalTaxIdClick = function() {
		//var checked = $('.federal-tax-id').prop('checked');
        var checked = $scope.x2;
		$('.federal-tax-id-input').hide();
      //  $('.ownershipTypeInput').hide();
		$scope.bsnsInfo.federalTaxID = '';
		if(checked == true){
			$('.federal-tax-id-input').show();
        //    $('.ownershipTypeInput').show();
        }
	}
    
    //------------------------------ Principle Info data------------
    
    $('[name=ssn]').mask("000-00-0000");
    
         function savePrincipalInfo(){

            showLoader();

                currentUser.set('fullName', $scope.fullName);
            $q.when(user.save())
            .then(function() {
                saveHelper().then(function(){
                hideLoader();
                $state.go(nextScreen);

            },function(error){
                hideLoader();
                console.log(error.message);
            });
            });


        };
    /*
        $scope.toggleHomeInfo = function(){
		fields.forEach(function(field){
			$scope.principalInfo[field] = 
				$scope.toggleHomeChecked ? 
				$scope.bsnsInfo[field] :
				"";
		});
	};
        */
        
        $scope.toggleHomeChecked = true;
        
        $scope.principalInfo = {
		streetName		: '',
		city			: '',
		state			: '',
		zipCode			: '',
		dob				: '',
		ssn				: ''
	};
        
        var fields = ['streetName','city','state','zipCode'];
        
        $scope.toggleHomeInfo = function(){
		fields.forEach(function(field){
			$scope.principalInfo[field] = $scope.bsnsInfo[field];
		});
	};
    
        function saveHelper() {
            $scope.principalInfo.dob = formatDate($scope.dob, "MM-DD-YYYY");
            
            if($scope.toggleHomeChecked)
                {
                    fields.forEach(function(field){
                        $scope.principalInfo[field] = $scope.bsnsInfo[field];
                    });
                }
            
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
        
        $scope.openDatePicker = function(n) {
		switch (n) {
			case 1: $scope.openPicker1 = true; break;
		}
  	}
        
    //------------------------------

}]);
