'use strict';

var app = invoicesUnlimited;

app.value('appFields',{
	user : [
		'AuthNet',
		'AuthKey',
		'paymentGateway',
		'EPNrestrictKey',
		'merchantID',
		'colorTheme',
		'role',
		'username',
		'country',
		'phonenumber',
		'EPNusername',
		'fullName',
		'firstScreen',
		'email',
		'company',
        'currency'
	],
	customer : [
		"companyName",
		"displayName",
		"lastName",
		"firstName",
		"phone",
		"email",
		"mobile",
		"unusedCredits",
		"outstanding",
		"status",
		"currency",
		"paymentTerms",
		"billingAddress",
		"shippingAddress",
		"notes",
		"salutation",
        "isSameAddress"
	],
	newCustomer : [
		'AuthNet',
		'AuthKey',
		'paymentGateway',
		'EPNusername',
		'merchantID',
		'EPNrestrictKey',
		'businessInfo',
		'principalInfo',
		'organizations',
		'signatureImage',
		'selectedOrganization',
		'currency',
		'company',
		'phonenumber',
		'country',
		'defaultTemplate'
	],
	projectUser : [
		'userName',
		'emailID',
		'title',
		'role',
		'status',
		'companyName',
		'country'
	]
});