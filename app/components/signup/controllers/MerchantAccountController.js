'use strict';

invoicesUnlimited.controller('MerchantAccountController',
	['$rootScope','$scope','$state','userFullFactory','signUpFactory','userFactory','roleFactory',
	function($rootScope,$scope,$state,userFullFactory,signUpFactory,userFactory,roleFactory){
	
	var user1 = signUpFactory.getFactory('User');

	if (!user1.entity.length) $state.go('signup');

	$scope.goNext = function(){
		debugger;
		if (signUpFactory.getFactory('User').entity.length)
			$state.go('signup.business-info');
	}
    $scope.skipStep = function(){
        saveBusinessInfo();
    }
    
    //----------------------------------------------------------------
    

	// User object in signUpFactory doesn't have data.
	if($rootScope.fromPaymentSettings) {
		var user = userFactory.entity[0];
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
        
        
		signUpFactory.setField('User','company', user.get('company'));
		//signUpFactory.setField('User','phonenumber', user.get('phonenumber'));
		signUpFactory.setField('BusinessInfo', 'organization',
			user.get('selectedOrganization'));
	}

        /*
	$scope.bsnsInfo = {
		'businessName'  : signUpFactory.getField('User','company'),
		'streetName'	: '',
		'city'			: '',
		'state'			: '',
		'zipCode'		: '',
		//'businessDescription' : '',
		'federalTaxID'	: '',
		ownershipType	: 'Ownership Type'
	}
    */

	function saveBusinessInfo(){

		showLoader();
		for (var field in $scope.bsnsInfo){
			signUpFactory.setField('BusinessInfo',{
				field : field,
				value : $scope.bsnsInfo[field]
			});
		}
        
        signUpFactory.setField('BusinessInfo',{
				field : 'businessName',
				value : signUpFactory.getField('User','company')
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
			$state.go('dashboard');
		},errorCallback);
	}
    
    //----------------------------------------------------------------
    
}]);
