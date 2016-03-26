'use strict';

invoicesUnlimited.factory('userFactory',function(){
	
	var currentUser = Parse.User.current();
	var businessInfo, principalInfo, accountInfo;

	return {
		authorized : function(){
			return currentUser;	
		},
		logout : function(){
			Parse.User.logOut();
		},
		login : function(params){
			debugger;
			Parse.User.logIn(params.username, 
							 params.password, {
							 	success : function(user){
							 		debugger;
							 		currentUser = user;
							 		console.log('Logged in successfuly');
							 	},
							 	error : function(user, error){
							 		debugger;
							 		console.log(error.message);
							 	}
							}).then(function(){
								debugger;
								if (currentUser) return true;
								return false;
							});
		},
		getBusinessInfo : function(){
			if (!currentUser) return false;
			return currentUser.get('businessInfo');
		}

	}
});

invoicesUnlimited.factory('signUpFactory',['userFactory',function(){

	var verificationCode = undefined;
	var verificationCodeProvider = '';
	var endRegistration = false;

	var parseObjects = {};

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

		}
	};

	return {
		getParse : function(className){
			return parseObjects[className];
		},
		get : function(table,expr){
			if (typeof(table) == "object") {
				expr = table.expr;
				table = table.table;
			}
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
			eval(accessor+"='"+value+"'");

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
		Save: function(table){
			var Entity = Parse.Object.extend(table);

			var parseObject = new Entity();

			for(var field in newUser[table])
				parseObject.set(field,newUser[table][field]);
			
			var callbacks = {
				success:function(object){
					parseObjects[object.className] = object;
					console.log('Object saved:'+object.id);
				},
				error : function(object,error){
					console.log("Error: " + error.description);
				}
			}
			/*if (table == "User") {
			/	parseObject.signUp(null,callbacks);
			/	return;
			}*/
			parseObject.save(null,callbacks);
		},
		Update : function(className,table){
			if (!parseObjects[className]) return false;

			var parseObject = parseObjects[className];

			for(var field in newUser[table])
				parseObject.set(field,newUser[table][field]);
			debugger;
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