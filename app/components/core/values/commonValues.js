'use strict';

var app = invoicesUnlimited;

app.value('appFields',{
	user : [
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
		'company'
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
		"currency",
		"paymentTerms",
		"billingAddress",
		"shippingAddress",
		"notes",
		"salutation"
	]
});