'use strict';

invoicesUnlimited.factory('creditNoteService', ['creditNoteFactory', 'itemService', 'currencyFilter',

function(creditNoteFactory, itemService, currencyFilter){

return {
	test : function() {
		console.log("working");
	},
	checkCreditNoteNumAvailable : function(params) {
		var CreditNote = Parse.Object.extend('CreditNotes');
		var query = new Parse.Query(CreditNote);
		query.equalTo('organization', params.organization);
		query.equalTo('creditNumber', params.creditNumber);
		query.select('creditNumber');

		return query.first()
		.then(function(obj) {
			return obj ? false : true;
		});
	},
	getCustomerCreditNotes : function(customer) {
		var CreditNote = Parse.Object.extend('CreditNotes');
		var query = new Parse.Query(CreditNote);
		query.select('remainingCredits', 'creditsUsed', 'creditNumber');
		query.equalTo('customer', customer);
		query.notEqualTo('status', 'Closed');

		return query.find()
		.then(function(objs) {
			var creditNotes = [];
			objs.forEach(function(obj) {
				creditNotes.push(new creditNoteFactory(obj, {
					operation : 'apply2Invoice'
				}));
			});
			return creditNotes;
		});

	},
	getCreditNoteDetails : function(creditNoteId) {
		var CreditNote = Parse.Object.extend('CreditNotes');
		var query = new Parse.Query(CreditNote);
		query.include('comments');

		return query.get(creditNoteId)
		.then(function(cnObj) {
			var creditNote = new creditNoteFactory(cnObj, {
				operation : 'details'
			});
			return creditNote;
		});
	},
	getCreditNote : function(creditNoteId) {
		var CreditNote = Parse.Object.extend('CreditNotes');
		var query = new Parse.Query(CreditNote);
		query.include('creditNoteItems');

		return query.get(creditNoteId)
		.then(function(creditObj) {
			var creditNote = new creditNoteFactory(creditObj, {
				operation : 'getCreditNote'
			});
			return creditNote;
		});
	},
	listCreditNotes : function(user) {
		var organization = getOrganization(user);
		if (! organization)	return;

		var CreditNote = Parse.Object.extend("CreditNotes");
		var query = new Parse.Query(CreditNote);

		query.equalTo("organization", organization);
		query.include("customer");
		//query.select("creditNumber", "creditNoteDate", "reference",
			//"total", "status", "customer", "remainingCredits");

		return query.find().then(function(creditNoteObjs) {
			var creditNotes = [];
			creditNoteObjs.forEach(function(creditNote) {
				creditNotes.push(new creditNoteFactory(creditNote, {
					operation : "listCreditNotes"
				}));
			});
			return creditNotes;
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
			prefs.numAutoGen = prefObj.get("creditAg");
			prefs.notes = prefObj.get("creditNotes");
			prefs.terms = prefObj.get("creditTerms");

		}).then(function() {
			var orgTable = Parse.Object.extend("Organization");
			query = new Parse.Query(orgTable);
			query.select("dateFormat", "creditNumber");

			return query.get(organization.id).then(function(orgObj) {
				prefs.dateFormat = orgObj.get("dateFormat");
				prefs.creditNumber = orgObj.get("creditNumber");

			}).then(function() {
				return prefs;
			});

		});
	},
	setPreferences : function (user, params) {
		var organization = getOrganization(user);
		if (! organization) {
			var message = 'user: ' + user.id + ' has no Organization assigned.'
			return Parse.Promise.error(message);
		}

		var promises = [];
		if(params.creditAg) {
			organization.set('creditNumber', params.creditNumber);
		}
		promises.push(organization.save());

		var Preference = Parse.Object.extend('Preferencies');
		var query = new Parse.Query(Preference);
		query.equalTo("organization", organization);
	
		return query.first().then(function(prefObj) {
			prefObj.set("creditAg", params.creditAg);
			prefObj.set("creditNotes", params.notes);
			prefObj.set("creditTerms", params.terms);

			promises.push(prefObj.save());
			return Parse.Promise.when(promises);
		});

	},
	createNewCreditNote : function(creditNote, creditItems, role) {
		var items = [];
		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);

		var promise = Parse.Promise.as(undefined);//undefined;
/*		if(file) {
			var parseFile = new Parse.File(file.name, file);
			promise = parseFile.save()
			.then(function(savedFile) {
				console.log(savedFile.url());
				return [savedFile];
			});
		} else
			promise = Parse.Promise.as(undefined);
*/
		var itemsToCreate = [];
		var itemThatExist = [];
		creditItems.forEach(function(item) {
			if (item.selectedItem.create) {
				itemsToCreate.push(item);
			} else {
				itemThatExist.push(item);
			}
		});
		var params = {
			user : creditNote.userID,
			organization : creditNote.organization,
			acl : acl
		};

		return createNewItems(itemsToCreate, params)
		.then(function(newItems) {
			creditItems = itemThatExist.concat(newItems);
			return promise;		// just to make code structure clean.
		})
		.then(function(fileObj) {
			var creditNoteItem = Parse.Object.extend("CreditNoteItem");
			creditItems.forEach(function(item) {
				var obj = new creditNoteItem();
				obj.setACL(acl);
				obj.set("userID", creditNote.userID);
				obj.set("organization", creditNote.organization);
				obj.set("item", item.selectedItem.entity);
				obj.set("quantity", Number(item.quantity));
				obj.set("amount", Number(item.amount));

				if (item.selectedTax) {
					obj.set("tax", Parse.Object.extend("Tax")
						.createWithoutData(item.selectedTax.id));
				}
				items.push(obj);
			});
			
			return Parse.Object.saveAll(items)
			.then(function(list) {
			//	console.log("items saved successfully");
				var CreditNote = Parse.Object.extend("CreditNotes");
				var obj = new CreditNote();
				obj.setACL(acl);
			//	obj.set("creditNoteFiles", fileObj);
				creditNote.creditNoteItems = list;
				
				return obj.save(creditNote)
				.then(function(creditObj) {
					return creditObj.get('organization').fetch()
					.then(function(org) {
						var creditNum = org.get('creditNumber');
						var arr = creditNum.split('-');
						var n = Number(arr[1]) + 1;
						var newNum = arr[0] + '-' + formatInvoiceNumber(n, arr[1].length);
						org.set('creditNumber', newNum);
						return org.save();
					})
					.then(function(orgAgain) {
						console.log("creditNote created successfully");
						return creditObj;
					});

				} /* add method to delete file and items */);
			}/* add method to delete file*/);

		});	
	},
	updateCreditNote : function(creditObj, creditItems, deletedItems, user, role, file) {
		var creditNoteItems = [];
		var itemsToDelete = [];
		var itemsToCreate = [];
		var creditItemsToCreate = [];
		var creditItemsToUpdate = {};
		var CreditItem = Parse.Object.extend("CreditNoteItem");
		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);

		// filter items from creditItems
		creditItems.forEach(function(item) {
			if (item.selectedItem.create) {
				itemsToCreate.push(item);
			} else {
				if (item.id) {
					creditItemsToUpdate[item.id] = item;
				} else {
					creditItemsToCreate.push(item);
				}
			}
		});

		var otherData = {
			acl : acl,
			user : user,
			organization : user.get('organizations')[0],
			objectType : CreditItem
		};

		// create new items
		return createNewItems(itemsToCreate, otherData)
		.then(function (items) {
		//	console.log('created items');
		//	console.log(items);
			// filter newly created items
			items.forEach(function(item) {
				if (item.id) {
					creditItemsToUpdate[item.id] = item;
				} else {
					creditItemsToCreate.push(item);
				}
			});

			//create new creditNote Items
			creditItemsToCreate = creditItemsToCreate.map(function(item) {
				return createCreditNoteItem(item, otherData);
			});
		//	console.log('created creditNote items');
		//	console.log(creditItemsToCreate);

			// update old creditNote Items and filter out items to delete.
			var oldItems = creditObj.creditItems;
			for(var i=0; i < oldItems.length; ++i) {
				var itemData = creditItemsToUpdate[oldItems[i].entity.id];
				if (! itemData) {
					itemsToDelete.push(oldItems[i].entity);
				} else {
					oldItems[i].entity.set('item', itemData.selectedItem.entity);
					oldItems[i].entity.set('quantity', Number(itemData.quantity));
					oldItems[i].entity.set('amount', Number(itemData.amount));

					if(! itemData.selectedTax) oldItems[i].entity.unset('tax');
					else {
						oldItems[i].entity.set('tax', Parse.Object.extend("Tax")
							.createWithoutData(itemData.selectedTax.id));
					}
					creditNoteItems.push(oldItems[i].entity);	
				}
				
			}

		//	console.log('updated creditNote items')
		//	console.log(creditNoteItems);
			creditNoteItems = creditNoteItems.concat(creditItemsToCreate);
			return Parse.Object.destroyAll(itemsToDelete)
		})
		.then(function(delItems) {
		//	console.log('deleted creditNote items');
		//	console.log(delItems);
			return Parse.Object.saveAll(creditNoteItems);
		})
		.then(function(list) {
		//	console.log('creditNote items');
		//	console.log(list);
			creditObj.entity.set('creditNoteItems', list);
			return creditObj.entity.save();
		})
		.then(function(creditNoteObj) {
		//	console.log('creditNote updated.');
			return creditNoteObj;
		});

	},
	createCreditNoteReceipt : function(creditNoteId) {
		var CreditNote = Parse.Object.extend("CreditNotes");
		var query = new Parse.Query(CreditNote);
		query.include("creditNoteItems", "customer",
			"creditNoteItems.item", "creditNoteItems.item.tax", "organization",
			"userID", "userID.defaultTemplate", "userID.businessInfo");

		var data = {};
		return query.get(creditNoteId)
		.then(function(creditNoteObj) {
			data.creditNoteObj = creditNoteObj;	// save for later use
			var user = creditNoteObj.get("userID");
			var template = user.get("defaultTemplate");
            
            if(!template){
                var Template = Parse.Object.extend('InvoiceTemplate');
                var query = new Parse.Query(Template);
                query.equalTo ('name', 'Template 1');
                return query.first()
                .then(function(t) {
                    var xmlFile = t.get("templateData");
                    data.htmlFile = t.get("templateHTML");	// save for later use
                    data.cardUrl = t.get("linkedFile").url();// save for later use
                    return fillInXmlData(xmlFile.url(), user, creditNoteObj);
                });
            }
            else{
                var xmlFile = template.get("templateData");
                data.htmlFile = template.get("templateHTML");	// save for later use
                data.cardUrl = template.get("linkedFile").url();// save for later use
                return fillInXmlData(xmlFile.url(), user, creditNoteObj);
            }
            
			// in case of edit, get them from creditNoteObj
			
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
			var receiptFile = new Parse.File("test2.html",{base64: newHtml}, "text/html");
			return receiptFile.save();
		})
		.then(function(html) {
			data.creditNoteObj.set("creditLabels", data.xml);
			data.creditNoteObj.set("creditReceipt", html);
			return data.creditNoteObj.save();
		})
		.then(function(creditObj) {
			return creditObj;
		});
	},
    sendCreditNoteText : function(creditNote) {
		var credit = new creditNoteFactory(creditNote, {
			operation : 'sendReceipt'
		});
        var mob = credit.entity.get('customer');
        mob = mob.get('mobile');
        if(mob)
        {
            var to = mob;
            var customerName = credit.customer.displayName;
            var amount = currencyFilter(credit.entity.remainingCredits, '$', 2);
            var businessName = credit.organization.name;
            var link = credit.entity.creditReceipt.url();
            var msgBody = customerName + ', '
                + businessName + ' has sent you Credit Note of ' + amount
                + '. ';
        }
        
        return Parse.Cloud.run('createShortUrl', {
            link: link
        }).then(function(shortUrl){
            return Parse.Cloud.run("sendSms", {
			to: to,
			body : msgBody + shortUrl.data.data.url
        }).then(function(msg) {
            console.log(msg);
            return creditNote;
        });
        }); 
	},
	sendCreditNoteReceipt : function(creditNote) {
		var credit = new creditNoteFactory(creditNote, {
			operation : 'sendReceipt'
		});
        
        if(credit.entity.customerEmails)
        {
            var toEmail = credit.entity.customerEmails[0];
            var customerName = credit.customer.displayName;
            var amount = currencyFilter(credit.entity.remainingCredits, '$', 2);
            var businessName = credit.organization.name;
            var link = credit.entity.creditReceipt.url();

            var emailSubject = 'Credit Note From ' + businessName;
            var emailBody = customerName + ',<br/>'
                + businessName + ' has sent you Credit Note of ' + amount
                + '. <a href="' + link + '">Click here to view.</a>';
        }
        else{
            return creditNote;
        }
        
		return Parse.Cloud.run("sendMailgunHtml", {
			toEmail: toEmail,
			fromEmail: "no-reply@invoicesunlimited.com",
			subject : emailSubject,
			html : emailBody
		}).then(function(msg) {
			console.log(msg);
			creditNote.set('status', 'Sent');
			return creditNote.save();
		})
		.then(function(creditObj) {
			return creditObj;
		});
	}
};

function createNewItems (items, params) {
	params.items = [];
	items.forEach(function (item) {
		var obj = {
			title : item.selectedItem.entity.title,
			rate : item.selectedItem.entity.rate,
			expenseId : item.selectedItem.entity.expanseId
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

function createCreditNoteItem (itemData, otherData) {
	var obj = new otherData.objectType();
	obj.setACL(otherData.acl);
	obj.set('userID', otherData.user);
	obj.set('organization', otherData.organization);
	obj.set('item', itemData.selectedItem.entity);
	obj.set('quantity', Number(itemData.quantity));
	obj.set('amount', Number(itemData.amount));

	if (itemData.selectedTax) {
		obj.set('tax', Parse.Object.extend('Tax')
			.createWithoutData(itemData.selectedTax.id));
	}
	return obj;
}

function fillInHtmlData(xmlUrl, htmlUrl, cardUrl) {
	return $.ajax({
		type: "GET",
		url: 'proxy.php',
		dataType: "html",
        data: {
        address: htmlUrl
    }
	}).then(function (htmlDoc) {
		var s1 = 'Connect.open("GET", "uppage.xml"';
		var s2 = 'Connect.open("GET", ' + '"' + xmlUrl + '"';
        s2 = s2.replace('http:', 'https:');
		htmlDoc = htmlDoc.replace(s1,s2);

		s1 = "background: url(icn-card.png) no-repeat";
		s2 = "background: url(" + cardUrl + ") no-repeat";
        s2 = s2.replace('http:', 'https:');
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

function fillInXmlData(xmlUrl, user, creditNote) {
	return $.ajax({
		type: "GET",
		url: 'proxy.php',
		dataType: "xml",
        data: {
        address: xmlUrl
    }
	}).then(function (xmlDoc) {
		var x2js = new X2JS();
		var jsonObj = x2js.xml2json(xmlDoc);
		var labels = jsonObj.items.label;

		// static values
		labels['invoice-title'] = "Credit";
		labels['billType'] 	 = "estimate";
		labels['list-header-total'] = "Total";
		labels['headerTitle'] = "";
		labels['longmsg-title'] = "Notes";
		labels['ordernotes-title'] = "Terms & Conditions";
		labels['copyright'] = "";
		labels['disablePay'] = "true";
		labels['due-text'] = "";
		labels['due-price'] = "";
		labels['received-text'] = "";
		labels['received-price'] = "";
		labels['thanksmsg'] = "";
		labels['website-link'] = "";
		labels['website-name'] = "";
		labels['tip-text'] = labels['tip-price'] = "";
		jsonObj.items['shippingCharges'] = "";
		jsonObj.items['shippingChargesPrice'] = "";
		jsonObj.items['adjustments'] = "";
		jsonObj.items['adjustmentsPrice'] = "";
		labels['discountPlace'] = {text:""};
		labels['paymentMadeText'] = "Refund Made";
		labels['creditsAppliedText'] = "Credits Used";
		labels['refundedText'] = "Remaining Credits";
		
		// value directly available from CreditNote
		labels['ordernotes'] = creditNote.get("terms");
		labels['longmsg'] = creditNote.get("notes");

		labels['body-date'] = formatDate(creditNote.get("creditNoteDate"), "MMM D, YYYY");
		labels['past-due'] = labels['body-date'];

		labels['purchaseOrderNumber'] = creditNote.get("reference") ?
			"Ref.# " + creditNote.get("reference") : "";

		/* this will be used as EST# and CREDIT# as well */
		labels['refid'] = creditNote.get("creditNumber");

		var customFields = jsonObj.items.customFields;
		customFields.customField = undefined;
/*		var fields = creditNote.get("customFields");
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
*/
		var attachments = jsonObj.items.attachments;
		attachments.attachment = undefined;
/*		var files = creditNote.get("creditNoteFiles");
		if (files) {
			attachments.attachment = [];
			for (var i = 0; i < files.length; ++i) {
				attachments.attachment.push(files[i].url());
			}
		}
		else
			attachments.attachment = undefined;
*/
		// values available from User
		labels['nr'] = user.get("phonenumber");
		labels['mailtotxt'] = user.get("email");

		// values available from Organization
		var orgObj = creditNote.get("organization");
		if (orgObj) {
			labels['mailto'] = "mailto:" + orgObj.get("email");
			labels['title'] = "Credit from " + orgObj.get("name");
			var logo = orgObj.get("logo");
			if(logo)
				labels['logo'] = orgObj.get("logo").url();
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
		var custmr = creditNote.get("customer");
		if (custmr) {
			var mail = custmr.get("email");
			labels['clientmail'] =  mail;
			labels['clientmailto'] = "mailto:" + mail;
			labels['clientname'] = custmr.get("displayName");
			labels['clientnr'] = custmr.get("phone");
            if(custmr.get("currency"))
			     labels['body-currency'] = custmr.get("currency").split(" ")[0];
		}

		/* tax is only on item level */
		/* creditItems, creditItems.item and
		   creditItems.item.tax is already loaded */
		var items = jsonObj.items;
		var taxes = jsonObj.items.label.taxes;
		var totalTax = 0;
		var subTotal = 0;

		var itemList = creditNote.get("creditNoteItems");
		if (itemList) {
			items.itemRow = [];
			taxes.tax = [];
			for (var i = 0; i < itemList.length; ++i) {
				var name = itemList[i].get("item").get("title");
				var qty = itemList[i].get("quantity");
				var amount = itemList[i].get("amount");
				subTotal += amount;

				var itmObj = {
					'name': name,
					'qty': qty,
					'price': currencyFilter(amount, '$', 2)
				};
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

		var sum = subTotal + totalTax;
		labels['subtotalprice'] = currencyFilter(subTotal, '$', 2);
		
		var total = sum;
		labels['total-price3'] = labels['body-price'] = currencyFilter(total, '$', 2);

		var refundsMade = creditNote.get("refundsMade") || 0;
		var creditsUsed = creditNote.get("creditsUsed") || 0;
		labels['paymentMadePrice'] = currencyFilter(refundsMade, '$', 2);
		labels['creditsAppliedPrice'] = currencyFilter(creditsUsed, '$', 2);

		var remainingCredits = total - refundsMade - creditsUsed;
		labels['refundtotal'] = currencyFilter(remainingCredits, '$', 2);

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

}]);
