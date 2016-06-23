'use strict';

invoicesUnlimited.factory('invoiceService', function($q, invoiceFactory, itemService, currencyFilter){
return {
	test : function() {
		console.log("working");
	},
	getInvoice : function(invoiceId) {
		var invoiceTable = Parse.Object.extend('Invoices');
		var query = new Parse.Query(invoiceTable);
		query.include('invoiceItems');

		return query.get(invoiceId)
		.then(function(invObj) {
			var invoice = new invoiceFactory(invObj, {
				operation : 'getInvoice'
			});
			return invoice;
		});
	},
	copyInInvoiceInfo : function (invoice) {
		var invInfo = invoice.get('invoiceInfo');
		if (! invInfo) {
			console.log('new created');
			var InvoiceInfo = Parse.Object.extend('InvoiceInfo');
			invInfo = new InvoiceInfo();
		} else console.log('used old');

		invInfo.set('sendNotifications', 1);
		invInfo.set('invoiceDate', invoice.get('invoiceDate'));
		invInfo.set('dueDate', invoice.get('dueDate'));
		invInfo.set('referenceNumber', invoice.get('invoiceNumber'));
		invInfo.set('totalAmount', String(invoice.get('total')));

		var user, p;
		var promises = [];
		
		p = $q.when(invoice.get('userID').fetch())
		.then(function(userID) {
			user = userID;
			invInfo.set('userId', user.id);
			invInfo.set('email', user.get('email'));
			invInfo.set('phone', user.get('phonenumber'));
			return user.get('selectedOrganization').fetch();
		})
		.then(function(org) {
			invInfo.set('organizationLogo', org.get('logo'));
			return user.get('businessInfo').fetch();
		})
		.then(function(bInfo) {
			invInfo.set('businessName', bInfo.get('businessName'));
			
			var preferences = Parse.Object.extend('Preferencies');
			var query = new Parse.Query(preferences);
			query.select('invoiceNotes');
			query.equalTo('userID', user);
			return query.first();
		})
		.then(function(prefs) {
			invInfo.set('emailReceipt', prefs.get('invoiceNotes'));
		});
		promises.push(p);

		p = $q.when(invoice.get('customer').fetch())
		.then(function(customer) {
			invInfo.set('clientName', customer.get('displayName'));
			invInfo.set('clientEmail', customer.get('email'));
			invInfo.set('clientPhone', customer.get('phone'));
		});
		promises.push(p);

		return $q.all(promises)
		.then(function() {
			return invInfo.save();
		})
		.then(function(invInfoObj) {
			invoice.set('invoiceInfo', invInfoObj);
			invoice.set('status', 'Sent');
			return invoice.save()
			.then(function(inv) {
				return invInfoObj;
			});
		});

	},
	updateInvoice : function(invoiceObj, invoiceItems, deletedItems, user, role, file) {
		var invItems = [];
		var itemsToDelete = [];
		var itemsToCreate = [];
		var invItemsToCreate = [];
		var invItemsToUpdate = {};
		var InvoiceItem = Parse.Object.extend("InvoiceItems");
		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);

		// filter items from invoiceItems
		invoiceItems.forEach(function(item) {
			if (item.selectedItem.create) {
				itemsToCreate.push(item);
			} else {
				if (item.id) {
					invItemsToUpdate[item.id] = item;
				} else {
					invItemsToCreate.push(item);
				}
			}
		});

		var otherData = {
			acl : acl,
			user : user,
			organization : user.get('organizations')[0],
			objectType : InvoiceItem
		};

		// create new items
		return createNewItems(itemsToCreate, otherData)
		.then(function (items) {
		//	console.log('created items');
		//	console.log(items);
			// filter newly created items
			items.forEach(function(item) {
				if (item.id) {
					invItemsToUpdate[item.id] = item;
				} else {
					invItemsToCreate.push(item);
				}
			});

			//create new invoice Items
			invItemsToCreate = invItemsToCreate.map(function(item) {
				return createInvoiceItem(item, otherData);
			});
		//	console.log('created invoice items');
		//	console.log(invItemsToCreate);

			// update old invoice Items and filter out items to delete.
			var oldItems = invoiceObj.invoiceItems;
			for(var i=0; i < oldItems.length; ++i) {
				var itemData = invItemsToUpdate[oldItems[i].entity.id];
				if (! itemData) {
					itemsToDelete.push(oldItems[i].entity);
				} else {
					oldItems[i].entity.set('item', itemData.selectedItem.entity);
					oldItems[i].entity.set('quantity', Number(itemData.quantity));
					oldItems[i].entity.set('amount', Number(itemData.amount));

					var discount = Number(itemData.discount);
					if (discount == 0)
						oldItems[i].entity.unset('discount');
					else
						oldItems[i].entity.set('discount', discount);

					if(! itemData.selectedTax) oldItems[i].entity.unset('tax');
					else {
						oldItems[i].entity.set('tax', Parse.Object.extend("Tax")
							.createWithoutData(itemData.selectedTax.id));
					}
					invItems.push(oldItems[i].entity);	
				}
				
			}

		//	console.log('updated invoice items')
		//	console.log(invItems);
			invItems = invItems.concat(invItemsToCreate);
			return Parse.Object.destroyAll(itemsToDelete)
		})
		.then(function(delItems) {
		//	console.log('deleted invoice items');
		//	console.log(delItems);
			return Parse.Object.saveAll(invItems);
		})
		.then(function(list) {
		//	console.log('invoice items');
		//	console.log(list);
			invoiceObj.entity.set('invoiceItems', list);
			return invoiceObj.entity.save();
		})
		.then(function(invObj) {
		//	console.log('invoice updated.');
			return invObj;
		});

	},
	createNewInvoice : function(invoice, invoiceItems, role, file) {
		var items = [];
		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);

		var promise = undefined;
		if(file) {
			var parseFile = new Parse.File(file.name, file);
			promise = parseFile.save()
			.then(function(savedFile) {
				console.log(savedFile.url());
				return [savedFile];
			});
		} else
			promise = Parse.Promise.as(undefined);

		var itemsToCreate = [];
		var itemThatExist = [];
		invoiceItems.forEach(function(item) {
			if (item.selectedItem.create) {
				itemsToCreate.push(item);
			} else {
				itemThatExist.push(item);
			}
		});
		var params = {
			user : invoice.userID,
			organization : invoice.organization,
			acl : acl
		};

		return createNewItems(itemsToCreate, params)
		.then(function(newItems) {
			invoiceItems = itemThatExist.concat(newItems);
			return promise;		// just to make code structure clean.
		})
		.then(function(fileObj) {
			var invItem = Parse.Object.extend("InvoiceItems");
			invoiceItems.forEach(function(item) {
				var obj = new invItem();
				obj.setACL(acl);
				obj.set("userID", invoice.userID);
				obj.set("organization", invoice.organization);
				obj.set("item", item.selectedItem.entity);
				obj.set("quantity", Number(item.quantity));
				obj.set("amount", Number(item.amount));
				
				var discount = Number(item.discount);
				if (discount != 0)
					obj.set('discount', discount);

				if (item.selectedTax) {
					obj.set("tax", Parse.Object.extend("Tax")
						.createWithoutData(item.selectedTax.id));
				}
				items.push(obj);
			});
			
			return Parse.Object.saveAll(items)
			.then(function(list) {
			//	console.log("items saved successfully");
				var Invoice = Parse.Object.extend("Invoices");
				var obj = new Invoice();
				obj.setACL(acl);
				obj.set("invoiceFiles", fileObj);
				invoice.invoiceItems = list;
				
				return obj.save(invoice)
				.then(function(invObj) {
					return invObj.get('organization').fetch()
					.then(function(org) {
						var invNum = org.get('invoiceNumber');
						var arr = invNum.split('-');
						var n = Number(arr[1]) + 1;
						var newNum = arr[0] + '-' + formatInvoiceNumber(n, arr[1].length);
						org.set('invoiceNumber', newNum);
						return org.save();
					})
					.then(function(orgAgain) {
						console.log("invoice created successfully");
						return invObj;
					});

				} /* add method to delete file and items */);
			}/* add method to delete file*/);

		});

	},
	getPreferences : function(user) {
		var organization = getOrganization(user);
		if (! organization) {
			var message = 'user: ' + user.id + ' has no Organization assigned.'
			return Parse.Promise.error(message);
		}

		var prefs = {};
		var prefTable = Parse.Object.extend("Preferencies");
		var query = new Parse.Query(prefTable);
		query.equalTo("organization", organization);

		return query.first().then(function(prefObj) {
		//	var prefObj = prefObjs[0];
			prefs.discountType = prefObj.get("invoiceDiscount");
			prefs.numAutoGen = prefObj.get("invoiceAg");
			prefs.shipCharges = prefObj.get("invoiceShippingCharges");
			prefs.adjustments = prefObj.get("invoiceAdjustments");
			prefs.salesPerson = prefObj.get("invoiceSalesPerson");
			prefs.thanksNote = prefObj.get("invoiceThanksNotes");
			prefs.notes = prefObj.get("invoiceNotes");
			prefs.terms = prefObj.get("invoiceTerms");

		}).then(function() {
			var orgTable = Parse.Object.extend("Organization");
			query = new Parse.Query(orgTable);
			query.select("dateFormat", "invoiceFields", "invoiceNumber");

			return query.get(organization.id).then(function(orgObj) {
				prefs.dateFormat = orgObj.get("dateFormat");
				prefs.customFields = orgObj.get("invoiceFields");
				prefs.invoiceNumber = orgObj.get("invoiceNumber");

			}).then(function() {
				return prefs;
			});

		});
	},
	listInvoices : function(user) {
		var organization = getOrganization(user);
		if (! organization)	return;

		var invoiceTable = Parse.Object.extend("Invoices");
		var query = new Parse.Query(invoiceTable);

		query.equalTo("organization", organization);
		query.include("customer");
		query.select("invoiceNumber", "invoiceDate", "dueDate",
			"total", "balanceDue", "status", "customer");

		return query.find().then(function(invoiceObjs) {
			var invoices = [];
			invoiceObjs.forEach(function(invoice) {
				invoices.push(new invoiceFactory(invoice, {
					operation : "listInvoices"
				}));
			});
			return invoices;
		});

	},
	createInvoiceReceipt : function(invoiceId, invoiceInfoId) {
		var invoiceTable = Parse.Object.extend("Invoices");
		var query = new Parse.Query(invoiceTable);
		query.include("invoiceItems", "customer", "lateFee",
			"invoiceItems.item", "invoiceItems.item.tax", "organization",
			"userID", "userID.defaultTemplate", "userID.businessInfo");

		var data = {};
		return query.get(invoiceId)
		.then(function(invoiceObj) {
			data.invoiceObj = invoiceObj;	// save for later use
			var user = invoiceObj.get("userID");
			var template = user.get("defaultTemplate");
			// in case of edit, get them from invocieObj
			var xmlFile = template.get("templateData");
			data.htmlFile = template.get("templateHTML");	// save for later use
			data.cardUrl = template.get("linkedFile").url();// save for later use
			return fillInXmlData(xmlFile.url(), user, invoiceObj, invoiceInfoId);
		})
		.then(function(newXml) {
			var labelsFile = new Parse.File("test1.xml",{base64: newXml}, "text/xml");
			return labelsFile.save();
		})
		.then(function(xml) {
			data.xml = xml;	// save for later use
			return fillInHtmlData(xml.url(), data.htmlFile.url(), data.cardUrl);
		})
		.then(function(newHtml) {
			var invoiceFile = new Parse.File("test2.html",{base64: newHtml});
			return invoiceFile.save();
		})
		.then(function(html) {
			data.invoiceObj.set("invoiceLabels", data.xml);
			data.invoiceObj.set("invoiceReceipt", html);
			return data.invoiceObj.save();
		})
		.then(function(invObj) {
			return invObj;
		});
	},
	sendInvoiceReceipt : function(invoice) {
		var inv = new invoiceFactory(invoice, {
			operation : 'sendReceipt'
		});
		var toEmail = inv.entity.customerEmails[0];
		var customerName = inv.customer.displayName;
		var amount = currencyFilter(inv.entity.balanceDue, $, 2);
		var businessName = inv.organization.name;
		var link = inv.entity.invoiceReceipt.url();
		
		var emailSubject = 'Invoice From ' + businessName;
		var emailBody = customerName + ',<br/>'
			+ businessName + ' has sent you an invoice of ' + amount
			+ '. <a href="' + link + '">Click here to view.</a>';

		return Parse.Cloud.run("sendMailgun", {
			toEmail: toEmail,
			fromEmail: "no-reply@invoicesunlimited.com",
			subject : emailSubject,
			message : emailBody
		}).then(function(msg) {
			console.log(msg);
			return invoice;
		});
	}

};

function createNewItems (items, params) {
	params.items = [];
	items.forEach(function (item) {
		var obj = {
			title : item.selectedItem.entity.title,
			rate : item.selectedItem.entity.rate,
			expenseId : item.selectedItem.entity.expenseId
		};
		if (item.selectedItem.tax)
			obj.tax = item.selectedItem.tax;

		params.items.push(obj);
	});

	return itemService.createItems(params)
	.then(function(newItems) {
		for (var i = 0; i < items.length; ++i) {
			items[i].selectedItem = newItems[i];
		}
		return items;
	});
}

function createInvoiceItem (itemData, otherData) {
	var obj = new otherData.objectType();
	obj.setACL(otherData.acl);
	obj.set('userID', otherData.user);
	obj.set('organization', otherData.organization);
	obj.set('item', itemData.selectedItem.entity);
	obj.set('quantity', Number(itemData.quantity));
	obj.set('amount', Number(itemData.amount));

	var discount = Number(itemData.discount);
	if (discount == 0)
		obj.unset('discount');
	else
		obj.set('discount', discount);

	if (itemData.selectedTax) {
		obj.set('tax', Parse.Object.extend('Tax')
			.createWithoutData(itemData.selectedTax.id));
	}
	return obj;
}

function fillInHtmlData(xmlUrl, htmlUrl, cardUrl) {
	return $.ajax({
		type: "GET",
		url: htmlUrl,
		dataType: "html"
	}).then(function (htmlDoc) {
		var s1 = 'Connect.open("GET", "uppage.xml"';
		var s2 = 'Connect.open("GET", ' + '"' + xmlUrl + '"';
		htmlDoc = htmlDoc.replace(s1,s2);

		s1 = "background: url(icn-card.png) no-repeat";
		s2 = "background: url(" + cardUrl + ") no-repeat";
		htmlDoc = htmlDoc.replace(s1,s2);

		return $.ajax({
			type: "POST",
			url: "./assets/php/convert_base64.php",
			data: {
				str : htmlDoc
			}
		}).then(function(newHtml) {
			return newHtml;
		});

	});
}

function fillInXmlData(xmlUrl, user, invoice, invoiceInfoId) {
	return $.ajax({
		type: "GET",
		url: xmlUrl,
		dataType: "xml"
	}).then(function (xmlDoc) {
		var x2js = new X2JS();
		var jsonObj = x2js.xml2json(xmlDoc);
		var labels = jsonObj.items.label;

		// static values
		labels['invoiceId'] = invoiceInfoId;
		labels['invoice-title'] = "Invoice";
		labels['billType'] 	 = "invoice";
		labels['list-header-total'] = "Total";
		labels['headerTitle'] = "Payment Due";
		labels['longmsg-title'] = "Notes";
		labels['ordernotes-title'] = "Terms & Conditions";
		labels['copyright'] = "";
		labels['disablePay'] = "";
		labels['due-text'] = "";
		labels['due-price'] = "";
		labels['received-text'] = "";
		labels['received-price'] = "";
		labels['thanksmsg'] = "";
		labels['website-link'] = "";
		labels['website-name'] = "";
		
		// value directly available from Invoices
		labels['ordernotes'] = invoice.get("terms");
		labels['longmsg'] = invoice.get("notes");

		labels['body-date'] = formatDate(invoice.get("invoiceDate"), "MMM D, YYYY");
		labels['past-due'] = formatDate(invoice.get("dueDate"), "MMM D, YYYY");

		labels['purchaseOrderNumber'] = invoice.get("poNumber") ?
			"P.O.Number:" + invoice.get("poNumber") : "";

		/* this will be used as EST# and CREDIT# as well */
		labels['refid'] = invoice.get("invoiceNumber");

		var customFields = jsonObj.items.customFields;
		var fields = invoice.get("customFields");
		if (fields) {
			customFields.customField = [];
			for (var i = 0; i < fields.length; ++i) {
				var key = Object.keys(fields[i])[0];
				var value = fields[i][key];
				customFields.customField.push({'name':key, 'value':value});
			}
		}
		else
			customFields.customField = undefined;

		var attachments = jsonObj.items.attachments;
		var files = invoice.get("invoiceFiles");
		if (files) {
			attachments.attachment = [];
			for (var i = 0; i < files.length; ++i) {
				attachments.attachment.push(files[i].url());
			}
		}
		else
			attachments.attachment = undefined;

		// values available from User
		labels['nr'] = user.get("phonenumber");
		labels['mailtotxt'] = user.get("email");

		// values available from Organization
		var orgObj = invoice.get("organization");
		if (orgObj) {
			labels['mailto'] = "mailto:" + orgObj.get("email");
			labels['logo'] = orgObj.get("logo").url();
			labels['title'] = "Invoice from " + orgObj.get("name");
		}

		// values available from BusinessInfo
		var bInfo = user.get("businessInfo");
		if (bInfo) {
			var address = [
				bInfo.get("streetName"),
				bInfo.get("zipCode"),
				bInfo.get("city"),
				bInfo.get("state"),
				user.get("country")
			];
			labels['addres1'] = address.join(', ');
		}

		// values available from Customer
		/* Customer is laready loaded */
		var custmr = invoice.get("customer");
		if (custmr) {
			var mail = custmr.get("email");
			labels['clientmail'] =  mail;
			labels['clientmailto'] = "mailto:" + mail;
			labels['clientname'] = custmr.get("displayName");
			labels['clientnr'] = custmr.get("phone");
			labels['body-currency'] = custmr.get("currency").split(" ")[0];
		}

		var discountType = invoice.get("discountType");
		labels['discountPlace'] = { text:
			(discountType == 2 ? "before" : (discountType == 3 ? "after" : ""))
		};

		/* tax is only on item level */
		/* invoiceItems, InvoiceItems.item and
		   InvoiceItems.item.tax is already loaded */
		var items = jsonObj.items;
		var taxes = jsonObj.items.label.taxes;
		var totalTax = 0;
		var subTotal = 0;

		var itemList = invoice.get("invoiceItems");
		if (itemList) {
			items.itemRow = [];
			taxes.tax = [];
			for (var i = 0; i < itemList.length; ++i) {
				var name = itemList[i].get("item").get("title");
				var qty = itemList[i].get("quantity");
				var amount = itemList[i].get("amount");
				var discount = itemList[i].get("discount") || 0;

				subTotal += amount * ((100 - discount) * 0.01);

				var itmObj = {
					'name': name,
					'qty': qty,
					'price': currencyFilter(amount, '$', 2)
				};
				if (discountType == 1)
					itmObj.discount = (discount ? discount : 0);

				items.itemRow.push(itmObj);

				var tax = itemList[i].get("tax");
				if (tax) {
					var taxName = tax.get("title") + " (" + tax.get("value") + "%)";
					var t = calculateTax(itemList[i], tax);
					totalTax += t;
					var taxValue =  currencyFilter(t, '$', 2);
					var taxObj = {
						'name' : taxName,
						'value': taxValue
					};
					taxes.tax.push(taxObj);
				}
			}
			if (! taxes.tax.length)
				taxes.tax = undefined;

		} else {
			items.itemRow = undefined;
			taxes.tax = undefined;
		}

		// values available from lateFee
		/* lateFee is already loaded */
		// only fill if Overdue
		var lateFee = invoice.get("lateFee");
		var status = invoice.get("Status");
		var lateFeeValue = 0;

		if (lateFee && status == "Overdue") {
			labels['tip-text'] = "Late Fee";
			var price = lateFee.get("price");
			var type = lateFee.get("type");

			if (type == "$") {
				lateFeeValue = price;
				labels['tip-price'] = currencyFilter(price, '$', 2);

			} else if (type == "%") {
				lateFeeValue = subTotal * price * 0.01;
				labels['tip-price'] = price + type;
			}
		}
		else
			labels['tip-text'] = labels['tip-price'] = "";

		var discounts = invoice.get("discounts") || 0;
		var shipCharges = invoice.get('shippingCharges') || 0;
		var adjustments = invoice.get('adjustments') || 0;
		var sum = subTotal + totalTax;
		var discountRatio = (100 - discounts) * 0.01;

		jsonObj.items['shippingChargesPrice'] = currencyFilter(shipCharges, '$', 2);
		jsonObj.items['adjustmentsPrice'] = currencyFilter(adjustments, '$', 2);

		if(discountType == 2) // before tax
			sum = (subTotal * discountRatio) + totalTax;
		else if (discountType == 3) // after tax
			sum = (subTotal + totalTax) * discountRatio;

		if (discounts) {
			labels['discountNameBottom'] = {text:"Discount " + discounts + "%:"};
			labels['discountPriceBottom'] = {text:discounts + "%"};

			discounts = Math.abs(sum - subTotal - totalTax);
			labels['discountAmount'] = {text:currencyFilter(discounts, '$', 2)};
		}
		else
			labels['discountAmount'] = labels['discountNameBottom'] =
				labels['discountPriceBottom'] = "";

		labels['subtotalprice'] = currencyFilter(subTotal, '$', 2);
		
		var total = sum + shipCharges + adjustments + lateFeeValue;
		labels['total-price3'] = labels['body-price'] = currencyFilter(total, '$', 2);

		var paymentMade = invoice.get("paymentMade") || 0;
		var creditApplied = invoice.get("creditApplied") || 0;

		labels['paymentMadePrice'] = currencyFilter(paymentMade, '$', 2);
		labels['creditsAppliedPrice'] = currencyFilter(creditApplied, '$', 2);

		var balanceDue = total - paymentMade - creditApplied;
		labels['refundtotal'] = currencyFilter(balanceDue, '$', 2);

//----------------------------------------------------------------

		// test lines
	//	console.log(jsonObj);

		xmlDoc = x2js.json2xml_str(jsonObj);
		return $.ajax({
			type: "POST",
			url: "./assets/php/convert_base64.php",
			data: {
				str : xmlDoc
			}
		}).then(function(newXml) {
			return newXml;
		});

	});

}

function calculateTax(item, tax) {
	var taxType = tax.get("type");
	var taxRate = tax.get("value");
	var compound = tax.get("compound");

	var amount = item.get("amount");
	var res = 0;
	if (taxType == 1)
		res = amount * taxRate * 0.01;
	else if (taxType == 2) {
		res = amount * taxRate * 0.01;
		if (compound)
			res = res * compound * 0.01;
	}

	return res;
}

function getOrganization (user) {
	var organizationArray = user.get("organizations");
	if (!organizationArray) {
		return undefined;
	}
	else return organizationArray[0];
}

});
