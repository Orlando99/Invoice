'use strict';

invoicesUnlimited.controller('InvoiceTemplateInfoController',
	['$q','$rootScope','$scope','$state','signUpFactory','userFactory','roleFactory',
	function($q,$rootScope,$scope,$state,signUpFactory,userFactory,roleFactory){

	if (!userFactory.entity.length){
		$state.go('signup');
		return;
	}
        
        var currentUser = undefined;
        var currentBusiness = undefined;
        showLoader();
        $q.when(userFactory.entity[0].fetch())
        .then(function(obj) {
            currentUser = obj;
            var bs = obj.get('businessInfo');
            $scope.fullName = obj.get('fullName');
            if(bs){
                $q.when(bs.fetch())
                .then(function(business){
                    currentBusiness = business;
                    $scope.bsnsInfo = business;
                    $scope.bsnsInfo.businessName = business.get('businessName');
                    $scope.bsnsInfo.streetName = business.get('streetName');
                    $scope.bsnsInfo.city = business.get('city');
                    $scope.bsnsInfo.state = business.get('state');
                    $scope.bsnsInfo.zipCode = business.get('zipCode');
                    $scope.bsnsInfo.phoneNumber = business.get('phoneNumber');
                    hideLoader();
                });
            }
            else{
                hideLoader();
            }
            
        });
        
        $("input").keyup(function(event){
            var id = event.target.id;
            $('#' + id + '-' + 'error').css('display', 'none');
       
            $('#' + id).removeClass('error');
    });

        
        
       
        
	$("#signUpForm").validate({
		onkeyup : false,
		onfocusout : false,
		rules: {
            company             : 'required',
            fullName            : 'required',
			streetName			: 'required',
			city 				: 'required',
			state 				: 'required',
			zipCode 			: 'required',
            //  phoneNumber       : 'required'
             phoneNumber : {
                    minlength : 10,
                    required: true
                }
            
		},
		messages: {
			streetName	: 'Please specify your business street name!',
			city 		: 'Please specify your business city!',
			state 		: 'Please specify your business state!',
            fullName	: 'Please specify your Full Name!',
			zipCode 	: 'Please specify your business zip code!',
            company     : 'Please specify your business name',
            phoneNumber : 
            {  
                minlength:'Please enter a valid phone number!',
                required: 'Please specify your phone number!'
             }
		}
	});

	$scope.bsnsInfo = {
		'streetName'	: '',
		'city'			: '',
		'state'			: '',
		'zipCode'		: ''
	}

	$scope.saveBusinessInfo = saveData;
        
    function saveData(){
	
		if (!$('#signUpForm').valid()) return;

		showLoader();
		var b = $scope.bsnsInfo;
        
        if(!currentBusiness){
            var binfo = new Parse.Object.extend('BusinessInfo');
            currentBusiness = new binfo();
        }
        
        currentBusiness.set('businessName', b.businessName);
        currentBusiness.set('streetName', b.streetName);
        currentBusiness.set('city', b.city);
        currentBusiness.set('state', b.state);
        currentBusiness.set('zipCode', b.zipCode);
        currentBusiness.set('phoneNumber', b.phoneNumber);
        currentBusiness.set('userID', currentUser);
        currentBusiness.set('organization', currentUser.get('selectedOrganization'));
        
        $q.when(currentBusiness.save())
        .then(function(obj){
            currentUser.set('company', b.businessName);
            currentUser.set('fullName', $scope.fullName);
            currentUser.set('phonenumber', b.phoneNumber);
            currentUser.set('tutorial', 1);
            currentUser.set('businessInfo', obj);
            $q.when(currentUser.save())
            .then(function(u){
                var query = new Parse.Query('ProjectUser');
                query.equalTo('userName', u.get('username'));

                $q.when(query.first()).then(function(projectUser) {
                    projectUser.set('title', $scope.fullName);
                    $q.when(projectUser.save())
                    .then(function(pUser){
                        fromTutorial = true;
                        hideLoader();
                        $state.go('dashboard.settings.app-preferences');
                    });
                    
                });
                
                
            });
        });
        
	}
        
        $scope.nextClicked = function(){
            $('.tutorial').hide();
        }
        $(document).click(function() {
            $('.tutorial').hide();
});
    
    $('#phoneNumber').mask("(Z00) 000-0000",{
		translation : {
			'Z': {
				pattern : /[2-9]/g
			}
		}
	});

}]);
