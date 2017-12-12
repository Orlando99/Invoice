'use strict';

invoicesUnlimited.factory('signUpFactory',[
	'userFullFactory',
	'userFactory',
	'businessFactory',
	'organizationFactory',
	'accountFactory',
	'principalFactory',
	'signatureFactory',
	'roleFactory',
	'currencyFactory',
	'preferencesFactory','$q','$http',
	function(userFullFactory,
			  userFactory,
			  businessFactory,
			  organizationFactory,
			  accountFactory,
			  principalFactory,
			  signatureFactory,
			  roleFactory,
			  currencyFactory,
			  preferencesFactory,
			  $q,$http){

		var verificationCode = undefined;
		var verificationCodeProvider = '';
		var endRegistration = false;

		var parseObjects = {};

		var factories = {
			'_User'			: userFactory,
			'User' 			: userFactory,
			'Role' 			: roleFactory,
			'BusinessInfo' 	: businessFactory,
			'AccountInfo' 	: accountFactory,
			'PrincipalInfo'	: principalFactory,
			'Signature'		: signatureFactory,
			'Organization'	: organizationFactory,
			'Currency'		: currencyFactory,
			'Preferences'	: preferencesFactory
		};

		var newUser;
		function setDefaultValues() {
			newUser = {
				User : {
					country		: '',
					company 	: '',
					fullName 	: '',
					email		: '',
					username	: '',
					password	: '',
					phonenumber	: '',
					colorTheme 	: 'appBlueColor',
					role 		: 'Admin',
					firstScreen : 'Dashboard',
					getInvoiceNotification : 1,
					isTrackUsage : 1,
					tutorial     : 0,
					subscription : false
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
				},
				Organization : {
					invoiceNumber 	: 'INV-0001',
					estimateNumber 	: 'EST-0001',
					creditNumber 	: 'CN-0001',
					fiscalYearStart : 'January',
					dateFormat 		: 'MM/dd/yyyy',
					fieldSeparator 	: '/',
					language		: 'en-us',
					timeZone 		: '( PDT ) America/Los_Angeles ( Pacific Standard Time )'
				},
				Role : {},
				Currency : {
					currencySymbol 	: '$',
					decimalPlace 	: 2,
					format 			: '###,###,###',
					title 			: 'USD - US Dollar'
				},
				Preferences : {
					invoiceShippingCharges 	: 0,
					creditNotes 			: "Thank you for your business. If you have any questions, please contact us as soon as possible.",
					invoiceThanksNotes 		: "Thank you for your payment. We appreciate your business and look forward to assisting you in the future.",
					creditTerms 			: "",
					invoiceDiscount 		: 0,
					invoiceNotes 			: "Thank you for your business. If you have any questions, please contact us as soon as possible.",
					estimateNotes 			: "Thank you for your business. If you have any questions, please contact us as soon as possible.",
					invoiceTerms 			: "",
					estimateTerms 			: "",
					invoiceAdjustments 		: 0,
					invoiceSalesPerson 		: 0,
					invoiceAg 				: 1,
					estimateAg 				: 1,
					creditAg 				: 1
				}
			};
		}

		return {
			setDefaultValues : function(){
				setDefaultValues();
			},
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
			getFactory : function(className){
				return factories[className];
			},
			getField : function(table,field) {
				if (newUser[table])
					return newUser[table][field];
			},
			setField : function(table,arg1,arg2) {
				var field, value;
				switch(arguments.length){
					case 1:
						console.log('Error! Not enough arguments!');
						break;
					case 2:
						field = arg1.field;
						value = arg1.value;
						break;
					case 3:
						field = arg1;
						value = arg2;
						break;
					default:
						break;
									   }

				if (newUser[table])
					newUser[table][field] = value;
			},
			set : function(table,expr){
				if (arguments.length == 1) {
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
			create : function(table,params){
				if (factories[table].entity.length) return Promise.resolve('');
				return factories[table]
					.createNew((params ? params : newUser[table]));
			},
			signup : function(){
				return userFactory.signup(newUser.User);
			},
			save : function(table,params) {
				if (factories[table].entity.length)
					return factories[table]
						.entity[0]
						.save((params ? params : newUser[table]));
				return;
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
			copyDefaultCategories : function(params) {
				var DefaultCategory = Parse.Object.extend('CategoryDefaults');
				var query = new Parse.Query(DefaultCategory);
				query.limit(1000);

				return query.find()
					.then(function(objs) {
					var Category = Parse.Object.extend('Category');
					var newCategories = [];
					objs.forEach(function(obj) {
						var parseObj = new Category();
						parseObj.set('userID', params.user);
						parseObj.set('organization', params.organization);
						parseObj.set('name', obj.get('name'));
						parseObj.set('color', obj.get('color'));
						parseObj.set('notes', obj.get('notes'));
						parseObj.setACL(roleFactory.createACL());

						newCategories.push(parseObj);
					});

					return Parse.Object.saveAll(newCategories);
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
			},
			submitLeadToAggregator : function(data){
				return $.ajax({
					method:"GET",
					type:"GET",
					url: "https://app.marketingoptimizer.com/api/v1/login/jfkpresident/Johnk@420",
					data: {}
				})
					.then(function (result) {
					var id_token = result.data.id_token;

					$.ajax({
						method:"POST",
						type:"POST",
						url: "https://app.marketingoptimizer.com/api/v1/contacts",
						headers: { 
							'Authorization': 'Bearer ' + id_token 
						},
						data: JSON.stringify(data)
					})
						.then(function (result) {
						console.log("Lead sent to https://app.marketingoptimizer.com");
						return true;
					}, function(error){
						console.error(error.message);
						debugger;
					});

					console.log(result);
				}, function(error){
					console.error(error.message);
					debugger;
				});
			}
		}

	}]);