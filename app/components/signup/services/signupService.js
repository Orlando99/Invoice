'use strict';

invoicesUnlimited.factory('signUpFactory',['userFullFactory',function(userFullFactory){

	var verificationCode = undefined;
	var verificationCodeProvider = '';
	var endRegistration = false;

	var parseObjects = {};

	if (userFullFactory.authorized()) {

		var callbackFunc = function(object){
			if (object) parseObjects[object.className] = object;
		};

		callbackFunc(userFullFactory.authorized());
		userFullFactory.getBusinessInfo(true).then(callbackFunc);
		userFullFactory.getPrincipalInfo(callbackFunc);
		userFullFactory.getAccountInfo(callbackFunc);
	}

	var newUser = {
		User : {
			country		: '',
			company 	: '',
			fullName 	: '',
			email		: '',
			username	: '',
			password	: '',
			phonenumber	: ''
		},
		AccountInfo : {
			bankName		: '',
			routingNumber	: '',
			accountNumber	: '',
			avgSale			: '',
			inPerson		: '',
			monthlySales	: ''
		},
		BusinessInfo : {
			businessName  		: '',
			streetName	  		: '',
			city		  		: '',
			state		  		: '',
			zipCode		  		: '',
			phoneNumber   		: '',
			businessDescription : '',
			federalTaxID  		: '',
			ownershipType 		: ''
		},
		PrincipalInfo : {
			city		: '',
			zipCode		: '',
			streetName	: '',
			ssn			: '',
			state		: '',
			dob			: ''
		},
		Signature : {
			imageName : ''
		}
	};

	if (userFullFactory.authorized()) {
		var businessInfo = userFullFactory.getBusinessInfo(true).then(function(object){
			if (object)
				for(var field in newUser.BusinessInfo){
					newUser.BusinessInfo[field] = object.get(field);
				}
		});
	}	

	return {
		getParse : function(className){
			return parseObjects[className];
		},
		get : function(table,expr){
			if (typeof(table) == "object") {
				expr = table.expr;
				table = table.table;
			}
			if (!expr) return newUser[table];
			var ancestors = expr.split('.');
			if (ancestors.length == 1 && newUser[table][ancestors[0]]==undefined) {
				console.log('Property doesn\'t exist');
				return false;
			}
			var accessor = "newUser" + (table == '' ? '' : "['"+table+"']");
			if (ancestors.length > 1) {
				for (var i in ancestors) 
					accessor += "['"+ancestors[i]+"']";
			} else
				accessor += "['"+ancestors[0]+"']";
			return eval(accessor);
		},
		set : function(table,expr){
			if (typeof(table) == "object") {
				expr = table.expr;
				table = table.table;
			}
			var result = expr.split(':');
			
			if (result.length != 2) {
				console.log('Wrong format of expression');
				return false;
			}
			var value = result[1];

			if (value == 'true') value = true;
			else if (value == 'false') value = false;

			var ancestors = result[0].split('.');
			if (ancestors.length == 1 && newUser[table][ancestors[0]]==undefined) {
				console.log('Property'+ancestors[0]+' doesn\'t exist');
				return false;
			}
			var accessor = "newUser" + (table == ''? '' : "['"+table+"']");
			if (ancestors.length > 1) {
				for (var i in ancestors) 
					accessor += "['"+ancestors[i]+"']";
			} else {
				accessor += "['"+ancestors[0]+"']";
			}

			if (typeof(value) != 'boolean')
				value = "'"+value+"'";
			eval(accessor+"="+value+"");

		},
		setObject : function(table,params){

			if (typeof(table) == "object"){
				params = table.params;
				table = table.table;
			}

			newUser[table][params.field] = params.value;
		},
		getObject : function(table,field){
			return newUser[table][field];
		},
		Save: function(table,params,callback){

			if (typeof(table) == 'object') {
				callback = table.callback;
				table = table.tableName;
			}

			var Entity = Parse.Object.extend(table);

			var parseObject;

			if (table == "User" && parseObjects["_User"]) parseObject = parseObjects['_User'];
			else if (parseObjects[table]) parseObject = parseObjects[table];
			else parseObject = new Entity();

			if (!params)
				for(var field in newUser[table]){
					parseObject.set(field,newUser[table][field]);
				}
			
			var callbacks = {
				success:function(object){
					parseObjects[object.className] = object;
					console.log('Object saved:'+object.id);
				},
				error : function(object,error){
					console.log("Error: " + error.message);
				}
			}

			if (!params) params = null;
			parseObject.save(params,callbacks).then(function(){if(callback) callback();});
		},
		Update : function(className,table){
			if (!parseObjects[className]) return false;

			var parseObject = parseObjects[className];

			for(var field in newUser[table])
				parseObject.set(field,newUser[table][field]);
			parseObject.save(null,{
				success:function(object){
					console.log('Object updated:'+object.id);
				},
				error : function(object,error){
					console.log("Error (Update): " + error.message);
				}
			});
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

}]);