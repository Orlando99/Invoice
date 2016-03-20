'use strict';

invoicesUnlimited.factory('signUpFactory',function(){

	var verificationCode = undefined;
	var verificationCodeProvider = '';

	var newUser = {
		country		: '',
		company 	: '',
		fullname 	: '',
		email		: '',
		username	: '',
		password	: '',
		phonenumber	: '',
		AccountInfo : {

		},
		BusinessInfo: {

		}
	};

	return {
		getProp : function(propName){
			if (newUser[propName]) return newUser[propName];
			newUser[propName] = '';
			return newUser[propName];
		},
		getAccountProp : function(propName){
			if (newUser.AccountInfo[propName]) 
				return newUser.AccountInfo[propName];
			newUser.AccountInfo[propName] = '';
			return newUser.AccountInfo[propName];
		},
		getBusinessProp : function(propName){
			if (newUser.BusinessInfo[propName]) 
				return newUser.BusinessInfo[propName];
			newUser.BusinessInfo[propName] = '';
			return newUser.BusinessInfo[propName];	
		},
		setProp : function(propName,value){
			newUser[propName] = value;
		},
		setVerification : {
			code : function(code){
				verificationCode = code;	
			},
			provider : function(provider){
				verificationCodeProvider = provider;
			}			
		},
		getVerification : {
			code : function(){
				return verificationCode;
			},
			provider : function(){
				return verificationCodeProvider;
			}
		}
	}

});