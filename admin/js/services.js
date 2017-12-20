'use strict';

clientAdminPortalApp.factory('userRecordFactory', function() {
	var UserRecord = Parse.Object.extend(Parse.User);

	var fields = [
		'merchantID',
		'company',
		'fullName',
		'name',
		'email',
		'username',
		'country',
		'accountInfo',
		'businessInfo',
		'AuthNet',
		'AuthKey',
		'EPNusername',
		'EPNrestrictKey',
		'isReseller',
		'resellerInfo',
		'reseller'
		//'tutorial',
		//'firstScreen',
		//'country',
		//'role',
		//'colorTheme',
		//'getInvoiceNotification',
		//'isTrackUsage'
		//'state'
	];

	var searchedFields = [
		'merchantID',
		'company',
		'name',
		'email',
		'username'
	];

	UserRecord.prototype.SetDummyInfo = function(){
		this.set("tutorial",0);
		this.set("firstScreen","Dashboard");
		this.set("country","United States of America");
		this.set("role","Admin");
		this.set("colorTheme","appBlueColor");
		this.set("getInvoiceNotification",1);
		this.set("isTrackUsage",1);
	}

	UserRecord.searchedFields = searchedFields;

	UserRecord.temp = {
		merchantId  : "",
		privateKey  : "",
		gatewayType : ""
	};

	for (var i = 0; i < fields.length; i++) {
		Object.defineProperty(UserRecord.prototype, fields[i], {
			get: (function (tmp) {
				return function() {
					return this.get(tmp);
				};
			})(fields[i]),
			set: (function (tmp) {
				return function(aValue) {
					return this.set(tmp, aValue);
				};
			})(fields[i])
		});
	}

	UserRecord.pass = "";

	Object.defineProperty(UserRecord.prototype,'password', {
		get: function(){
			return this.pass;
		},
		set : function(value){
			this.pass = value;
			if (/^\*{2,}/g.test(this.pass)) return;
			this.set('password',this.pass);
		}
	});

	Object.defineProperty(UserRecord.prototype, "paymentGateway", {
		get: function() {
			/*
      if (!this.accountAssigned) {
        return "Loading...";
      }
      */
			return this.get("paymentGateway");
		},
		set: function(aValue) {
			/*
      if (!this.accountAssigned) {
        return;
      }
      */
			return this.set("paymentGateway",aValue);
		}
	});

	Object.defineProperty(UserRecord.prototype, "phoneNumber", {
		get: function() {
			if (!this.get('businessInfo')) return;
			return this.get("businessInfo").get('phoneNumber');
		},
		set: function(aValue) {
			if (!this.get('businessInfo')) return;
			return this.get("businessInfo").set('phoneNumber',aValue);
		}
	});

	Object.defineProperty(UserRecord.prototype, "businessName", {
		get: function() {
			if (!this.get('businessInfo')) return;
			return this.get("businessInfo").get('businessName');
		},
		set: function(aValue) {
			if (this.get('businessInfo'))
				this.get("businessInfo").set('businessName',aValue);
			return this.set('company', aValue);
		}
	});

	Object.defineProperty(UserRecord.prototype, "address", {
		get: function() {
			if (!this.get('businessInfo')) return;
			return this.get("businessInfo").get('streetName');
		},
		set: function(aValue) {
			if (!this.get('businessInfo')) return;
			return this.get("businessInfo").set('streetName',aValue);
		}
	});
	Object.defineProperty(UserRecord.prototype, "city", {
		get: function() {
			if (!this.get('businessInfo')) return;
			return this.get("businessInfo").get('city');
		},
		set: function(aValue) {
			if (!this.get('businessInfo')) return;
			return this.get("businessInfo").set('city',aValue);
		}
	});
	Object.defineProperty(UserRecord.prototype, "zipCode", {
		get: function() {
			if (!this.get('businessInfo')) return;
			return this.get("businessInfo").get('zipCode');
		},
		set: function(aValue) {
			if (!this.get('businessInfo')) return;
			return this.get("businessInfo").set('zipCode',aValue);
		}
	});
	Object.defineProperty(UserRecord.prototype, "state", {
		get: function() {
			if (!this.get('businessInfo')) return;
			return this.get("businessInfo").get('state');
		},
		set: function(aValue) {
			if (!this.get('businessInfo')) return;
			return this.get("businessInfo").set('state',aValue);
		}
	});
	
	//Reseller Properties
	Object.defineProperty(UserRecord.prototype, "accountHolderName", {
		get: function() {
			if (!this.get('resellerInfo')) return;
			return this.get("resellerInfo").get('accountHolderName');
		},
		set: function(aValue) {
			if (!this.get('resellerInfo')) return;
			return this.get("resellerInfo").set('accountHolderName',aValue);
		}
	});
	Object.defineProperty(UserRecord.prototype, "ccNumberCurrent", {
		get: function() {
			if (!this.get('resellerInfo')) return;
			var number = this.get("resellerInfo").get('ccNumber');
			number = number.split(' ').join("");
			number = number.split('-').join("");
			number = "************" + number.substring(number.length-4, number.length);
			return number;
		},
		set: function(aValue) {
			return;
		}
	});
	/*
	Object.defineProperty(UserRecord.prototype, "ccNumber", {
		get: function() {
			return;
		},
		set: function(aValue) {
			if (!this.get('resellerInfo')) return;
			if(!aValue || !aValue.length)
				return;
			return this.get("resellerInfo").set('ccNumber',aValue);
		}
	});
	*/
	
	Object.defineProperty(UserRecord.prototype, "costPerMerchant", {
		get: function() {
			if (!this.get('resellerInfo')) return;
			return this.get("resellerInfo").get('costPerMerchant');
		},
		set: function(aValue) {
			if (!this.get('resellerInfo')) return;
			return this.get("resellerInfo").set('costPerMerchant',aValue);
		}
	});
	
	Object.defineProperty(UserRecord.prototype, "expDate", {
		get: function() {
			if (!this.get('resellerInfo')) return;
			return this.get("resellerInfo").get('expDate');
		},
		set: function(aValue) {
			if (!this.get('resellerInfo')) return;
			return this.get("resellerInfo").set('expDate',aValue);
		}
	});
	Object.defineProperty(UserRecord.prototype, "cvv", {
		get: function() {
			if (!this.get('resellerInfo')) return;
			return this.get("resellerInfo").get('cvv');
		},
		set: function(aValue) {
			if (!this.get('resellerInfo')) return;
			return this.get("resellerInfo").set('cvv',aValue);
		}
	});
	
	Object.defineProperty(UserRecord.prototype, "accountZip", {
		get: function() {
			if (!this.get('resellerInfo')) return;
			return this.get("resellerInfo").get('zipCode');
		},
		set: function(aValue) {
			if (!this.get('resellerInfo')) return;
			return this.get("resellerInfo").set('zipCode',aValue);
		}
	});

	return UserRecord;
});

clientAdminPortalApp.factory('accountInfoFactory', function() {

	var defaultAccountInfo = {
		bankName : "Wells Fargo",
		routingNumber : "1234567890",
		accountNumber : "1234567",
		monthlySales  : "5000$"
	}

	var AccountInfo = Parse.Object.extend("AccountInfo");

	AccountInfo.prototype.SetDummyInfo = function(){
		for(var prop in defaultAccountInfo) this.set(prop,defaultAccountInfo[prop]);
	}

	AccountInfo.prototype.SetData = function(data){
		if (data) {
			/*this.set("gatewayType",data.gatewayType);*/
			/*this.set("merchantId",data.merchantId);*/
			/*this.set("privateKey",data.privateKey);*/
		}
	}

	return AccountInfo;
});

clientAdminPortalApp.factory('businessInfoFactory', function() {

	var defaultBusinessInfo = {
		ownershipType     : "LLC",
		businessDescription : "Testing the Product",
		federalTaxID  : "555555555"
	}

	var BusinessInfo = Parse.Object.extend("BusinessInfo");

	BusinessInfo.prototype.SetDummyInfo = function(){
		for(var prop in defaultBusinessInfo) this.set(prop,defaultBusinessInfo[prop]); 
	}

	BusinessInfo.prototype.SetData = function(data){
		if (data) {
			if (data) {
				this.set("city",data.city);
				this.set("businessName",data.businessName);
				this.set("zipCode",data.zipCode);
				this.set("streetName",data.address);
				this.set("phoneNumber",data.phone);
				this.set("state",data.state);
			}
		}
	}

	return BusinessInfo;
});

clientAdminPortalApp.factory('resellerInfoFactory', function() {

	var Reseller = Parse.Object.extend("Reseller");

	Reseller.prototype.SetData = function(data){
		if (data) {
			this.set("accountHolderName",data.fullname);
			this.set("ccNumber",data.ccNumber);
			this.set("expDate",data.expDate);
			this.set("cvv",data.cvv);
			this.set("zipCode",data.cardZipCode);
		}
	}

	return Reseller;
});

clientAdminPortalApp.factory('signatureFactory', function() {
	var Signature = Parse.Object.extend("Signature");

	Signature.prototype.SetDummyInfo = function(){
		this.set("imageFile", new Parse.File("Signature.png", {base64:"data:image/jpeg;base64,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k8cKge5dgK+Q/wDhgn4cajx4z8W+MvEgPUanrU0mfY+Wsdbujf8ABP8A/ZD0SZLmHwbBcyq6uWu7i6udzKc/MJpnUgkcgjBHBBFOOByCk/32Mqy8oUY/nKqmv/AWHNVe0V9//AOX1D9r/wATfFK9l8N/sieFp/FsiMY5Ncvg1nosDDgnzXCyTlT1SMKSOVLVt/Dn9lTXb3x5D8Y/2mdfXxr4ktQDp9ssXlaZpjdzbQE4d+FxI6hsgMRuww+yNP0+w0myi03S4I7a2gUJHFEoREUdFVVAAA7ACrlKtxNHD05YbI6KoxkrOV+arJPdOdlyp9VTjBNaO4Kjd3qO/wCX3f5hRRRXyhuFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQB//0P38ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/9H9/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//S/fyiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/0/38ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/9k="}));
	}

	return Signature;
});

clientAdminPortalApp.factory('principalInfoFactory', function() {
	var PrincipalInfo = Parse.Object.extend('PrincipalInfo');

	PrincipalInfo.prototype.SetDummyInfo = function(){
		this.set("ssn","123-45-6789");
		this.set("dob","01-03-1982");
	}

	PrincipalInfo.prototype.SetData = function(data){
		if (data) {
			this.set("city",data.city);
			this.set("zipCode",data.zipCode);
			this.set("state",data.state);
			this.set("steetName",data.address);
		}
	}

	return PrincipalInfo;
});

clientAdminPortalApp.factory('organizationFactory', function() {
	var Organization = Parse.Object.extend('Organization');

	Organization.prototype.SetDummyInfo = function(){
		this.set("creditNumber","CN-0001");
		this.set("dateFormat","MM/dd/yyyy");
		this.set("fiscalYearStart","January");
		this.set("fieldSeparator","/");
		this.set("estimateNumber","EST-0001");
		this.set("invoiceNumber","INV-0001");
		this.set("language","en-us");
		this.set("timeZone","( PDT ) America/Los_Angeles ( Pacific Standard Time )");
	}

	Organization.prototype.SetData = function(data){
		if (data) {
			this.set("email",data.email);
			this.set("name",data.username);
		}
	}

	return Organization;
});

clientAdminPortalApp.factory('currencyFactory', function() {
	var Currency = Parse.Object.extend('Currency');

	Currency.prototype.SetDummyInfo = function(){
		this.set("exchangeRate",1);
		this.set("currencySymbol","$");
		this.set("decimalPlace",2);
		this.set("format","###,###,###");
		this.set("title","USD - US Dollar");
	}

	return Currency;
});

clientAdminPortalApp.factory('projectUserFactory', function() {
	var ProjectUser = Parse.Object.extend('ProjectUser');

	ProjectUser.prototype.SetDummyInfo = function(){
		this.set("status","Activated");
		this.set("role","Main");
		this.set("country","United States of America");
	}

	ProjectUser.prototype.SetData = function(data){
		if (data) {
			this.set("companyName",data.businessName);
			this.set("userName",data.username);
			this.set("emailID",data.email);
			this.set("title",data.fullname);
		}
	}

	return ProjectUser;
});

clientAdminPortalApp.factory('preferencesFactory', function() {
	var Preferencies = Parse.Object.extend('Preferencies');

	Preferencies.prototype.SetDummyInfo = function(){
		this.set("invoiceShippingCharges",0);
		this.set("creditNotes","Thank you for your business. If you have any questions, please contact us as soon as possible.");
		this.set("invoiceThanksNotes","Thank you for your payment. We appreciate your business and look forward to assisting you in the future.");
		this.set("creditTerms","");
		this.set("invoiceDiscount",0);
		this.set("invoiceNotes","Thank you for your business. If you have any questions, please contact us as soon as possible.");
		this.set("estimateNotes","Thank you for your business. If you have any questions, please contact us as soon as possible.");
		this.set("invoiceTerms","");
		this.set("estimateTerms","");
		this.set("invoiceAdjustments",0);
		this.set("invoiceSalesPerson",0);
		this.set("invoiceAg",1);
		this.set("estimateAg",1);
		this.set("creditAg",1);
	}

	return Preferencies;
});
