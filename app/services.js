'use strict';

invoicesUnlimited.factory('userFactory',function($q){
	
	var currentUser = Parse.User.current();
	var businessInfo, principalInfo, accountInfo;

	return {
		authorized : function(){
			return currentUser;	
		},
		logout : function(){
			Parse.User.logOut();
		},
		login : function(params,callback){
			Parse.User.logIn(params.username, 
							 params.password, {
							 	success : function(user){
							 		currentUser = user;
							 		console.log('Logged in successfuly');
							 	},
							 	error : function(user, error){
							 		console.log(error.message);
							 	}
							}).then(function(){
								if (callback) callback();
							});
		},
		getBusinessInfo : function(e){
			if (!e) {
				if (!currentUser) return false;
				return currentUser.get('businessInfo');	
			}
			var defer = $q.defer();
			var businessInfo = Parse.Object.extend("BusinessInfo");
			var query = new Parse.Query(businessInfo);
			var object = currentUser.get('businessInfo');
			if (!object) return;
			query.equalTo("objectId",object.id);
			query.first({
				success:function(object){
					defer.resolve(object);
					//callback(object);
				},
				error : function(object,error){
					console.log(error.message);
				}
			});

			return defer.promise;
		},
		getPrincipalInfo : function(callback){
			if (!callback){
				if (!currentUser) return false;
				return currentUser.get('principalInfo');
			}
			var principalInfo = Parse.Object.extend("PrincipalInfo");
			var query = new Parse.Query(principalInfo);
			var object = currentUser.get('principalInfo');
			if (!object) return;
			query.equalTo("objectId",object.id);
			query.first({
				success:function(object){
					callback(object);
				},
				error : function(object,error){
					console.log(error.message);
				}
			});
		},
		getAccountInfo : function(callback){
			if (!callback){
				if (!currentUser) return false;
				return currentUser.get('accountInfo');
			}
			var accountInfo = Parse.Object.extend("AccountInfo");
			var query = new Parse.Query(accountInfo);
			var object = currentUser.get('accountInfo');
			if (!object) return;
			query.equalTo("objectId",object.id);
			query.first({
				success:function(object){
					callback(object);
				},
				error : function(object,error){
					console.log(error.message);
				}
			});
		},
		getSignature : function(callback){
			if (!callback){
				if (!currentUser) return false;
				return currentUser.get('signatureImage');
			}
			var signature = Parse.Object.extend("Signature");
			var query = new Parse.Query(signature);
			var object = currentUser.get('signatureImage');
			if (!object) return;
			query.equalTo("objectId",object.id);
			query.first({
				success:function(object){
					callback(object);
				},
				error : function(object,error){
					console.log(error.message);
				}
			});
		}

	}
});

invoicesUnlimited.factory('signUpFactory',['userFactory',function(userFactory){

	var verificationCode = undefined;
	var verificationCodeProvider = '';
	var endRegistration = false;

	var parseObjects = {};

	if (userFactory.authorized()) {

		var callbackFunc = function(object){
			if (object) parseObjects[object.className] = object;
		};

		callbackFunc(userFactory.authorized());
		userFactory.getBusinessInfo(true).then(callbackFunc);
		userFactory.getPrincipalInfo(callbackFunc);
		userFactory.getAccountInfo(callbackFunc);
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

	if (userFactory.authorized()) {
		var businessInfo = userFactory.getBusinessInfo(true).then(function(object){
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