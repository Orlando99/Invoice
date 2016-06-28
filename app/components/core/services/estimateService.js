'use strict';

invoicesUnlimited.factory('estimateService', ['$q', 'estimateFactory', 'itemService', 'currencyFilter',
function($q, estimateFactory, itemService, currencyFilter){

return {
	test : function() {
		console.log("working");
	},
	getEstimate : function(estimateId) {
		var Estimate = Parse.Object.extend('Estimates');
		var query = new Parse.Query(Estimate);
		query.include('estimateItems');

		return query.get(estimateId)
		.then(function(estObj) {
			var estimate = new estimateFactory(estObj, {
				operation : 'getEstimate'
			});
			return estimate;
		});
	},
	listEstimates : function(user) {
		var organization = getOrganization(user);
		if (! organization)	return;

		var estimateTable = Parse.Object.extend("Estimates");
		var query = new Parse.Query(estimateTable);

		query.equalTo("organization", organization);
		query.include("customer");
		query.select("estimateNumber", "estimateDate",
			"totalAmount", "referenceNumber", "status", "customer");

		return query.find().then(function(estimateObjs) {
			var estimates = [];
			estimateObjs.forEach(function(estimate) {
				estimates.push(new estimateFactory(estimate, {
					operation : "listEstimates"
				}));
			});
			return estimates;
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
			prefs.discountType = prefObj.get("invoiceDiscount"); //-
			prefs.numAutoGen = prefObj.get("estimateAg");
			prefs.shipCharges = prefObj.get("invoiceShippingCharges"); //-
			prefs.adjustments = prefObj.get("invoiceAdjustments"); //-
			prefs.salesPerson = prefObj.get("invoiceSalesPerson"); //-
			prefs.thanksNote = prefObj.get("invoiceThanksNotes"); //-
			prefs.notes = prefObj.get("estimateNotes");
			prefs.terms = prefObj.get("estimateTerms");

		}).then(function() {
			var orgTable = Parse.Object.extend("Organization");
			query = new Parse.Query(orgTable);
			query.select("dateFormat", "estimatesFields", "estimateNumber");

			return query.get(organization.id).then(function(orgObj) {
				prefs.dateFormat = orgObj.get("dateFormat");
				prefs.customFields = orgObj.get("estimatesFields");
				prefs.estimateNumber = orgObj.get("estimateNumber");

			}).then(function() {
				return prefs;
			});

		});
	},
	createNewEstimate : function(estimate, estimateItems, role) {
		var items = [];
		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);

		var promise =  Parse.Promise.as(undefined);//undefined;
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
		estimateItems.forEach(function(item) {
			if (item.selectedItem.create) {
				itemsToCreate.push(item);
			} else {
				itemThatExist.push(item);
			}
		});
		var params = {
			user : estimate.userID,
			organization : estimate.organization,
			acl : acl
		};

		return createNewItems(itemsToCreate, params)
		.then(function(newItems) {
			estimateItems = itemThatExist.concat(newItems);
			return promise;		// just to make code structure clean.
		})
		.then(function(fileObj) {
			var estItem = Parse.Object.extend("EstimateItem");
			estimateItems.forEach(function(item) {
				var obj = new estItem();
				obj.setACL(acl);
				obj.set("userID", estimate.userID);
				obj.set("organization", estimate.organization);
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
				var Estimate = Parse.Object.extend("Estimates");
				var obj = new Estimate();
				obj.setACL(acl);
			//	obj.set("estimateFiles", fileObj);
				estimate.estimateItems = list;
				
				return obj.save(estimate)
				.then(function(estObj) {
					return estObj.get('organization').fetch()
					.then(function(org) {
						var estNum = org.get('estimateNumber');
						var arr = estNum.split('-');
						var n = Number(arr[1]) + 1;
						var newNum = arr[0] + '-' + formatInvoiceNumber(n, arr[1].length);
						org.set('estimateNumber', newNum);
						return org.save();
					})
					.then(function(orgAgain) {
						console.log("estimate created successfully");
						return estObj;
					});

				} /* add method to delete file and items */);
			}/* add method to delete file*/);

		});

	},
	updateEstimate : function(estimateObj, estimateItems, deletedItems, user, role) {
		var estItems = [];
		var itemsToDelete = [];
		var itemsToCreate = [];
		var estItemsToCreate = [];
		var estItemsToUpdate = {};
		var EstimateItem = Parse.Object.extend("EstimateItem");
		var acl = new Parse.ACL();
		acl.setRoleWriteAccess(role.get("name"), true);
		acl.setRoleReadAccess(role.get("name"), true);

		// filter items from estimateItems
		estimateItems.forEach(function(item) {
			if (item.selectedItem.create) {
				itemsToCreate.push(item);
			} else {
				if (item.id) {
					estItemsToUpdate[item.id] = item;
				} else {
					estItemsToCreate.push(item);
				}
			}
		});

		var otherData = {
			acl : acl,
			user : user,
			organization : user.get('organizations')[0],
			objectType : EstimateItem
		};

		// create new items
		return createNewItems(itemsToCreate, otherData)
		.then(function (items) {
		//	console.log('created items');
		//	console.log(items);
			// filter newly created items
			items.forEach(function(item) {
				if (item.id) {
					estItemsToUpdate[item.id] = item;
				} else {
					estItemsToCreate.push(item);
				}
			});

			//create new estimate Items
			estItemsToCreate = estItemsToCreate.map(function(item) {
				return createEstimateItem(item, otherData);
			});
		//	console.log('created estimate items');
		//	console.log(estItemsToCreate);

			// update old estimate Items and filter out items to delete.
			var oldItems = estimateObj.estimateItems;
			for(var i=0; i < oldItems.length; ++i) {
				var itemData = estItemsToUpdate[oldItems[i].entity.id];
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
					estItems.push(oldItems[i].entity);	
				}
				
			}

		//	console.log('updated estimate items')
		//	console.log(estItems);
			estItems = estItems.concat(estItemsToCreate);
			return Parse.Object.destroyAll(itemsToDelete)
		})
		.then(function(delItems) {
		//	console.log('deleted estimate items');
		//	console.log(delItems);
			return Parse.Object.saveAll(estItems);
		})
		.then(function(list) {
		//	console.log('estimate items');
		//	console.log(list);
			estimateObj.entity.set('estimateItems', list);
			return estimateObj.entity.save();
		})
		.then(function(estObj) {
		//	console.log('estimate updated.');
			return estObj;
		});

	},
	createEstimateReceipt : function(estimateId) {
		var Estimate = Parse.Object.extend("Estimates");
		var query = new Parse.Query(Estimate);
		query.include("estimateItems", "customer",
			"estimateItems.item", "estimateItems.item.tax", "organization",
			"userID", "userID.defaultTemplate", "userID.businessInfo");

		var data = {};
		return query.get(estimateId)
		.then(function(estimateObj) {
			data.estimateObj = estimateObj;	// save for later use
			var user = estimateObj.get("userID");
			var template = user.get("defaultTemplate");
			// in case of edit, get them from estimateObj
			var xmlFile = template.get("templateData");
			data.htmlFile = template.get("templateHTML");	// save for later use
			data.cardUrl = template.get("linkedFile").url();// save for later use
			return fillInXmlData(xmlFile.url(), user, estimateObj);
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
			var receiptFile = new Parse.File("test2.html",{base64: newHtml});
			return receiptFile.save();
		})
		.then(function(html) {
			data.estimateObj.set("estimateLabels", data.xml);
			data.estimateObj.set("estimateReceipt", html);
			return data.estimateObj.save();
		})
		.then(function(estObj) {
			return estObj;
		});
	},
	sendEstimateReceipt : function(estimate) {
		var est = new estimateFactory(estimate, {
			operation : 'sendReceipt'
		});
		var toEmail = est.entity.customerEmails[0];
		var customerName = est.customer.displayName;
		var amount = currencyFilter(est.entity.totalAmount, $, 2);
		var businessName = est.organization.name;
		var link = est.entity.estimateReceipt.url();
		
		var emailSubject = 'Estimate From ' + businessName;
		var emailBody = customerName + ',<br/>'
			+ businessName + ' has sent you an estimate of ' + amount
			+ '. Please confirm that the estimate is correct. <a href="'
			+ link + '">Click here to view.</a>';

		return Parse.Cloud.run("sendMailgun", {
			toEmail: toEmail,
			fromEmail: "no-reply@invoicesunlimited.com",
			subject : emailSubject,
			message : emailBody
		}).then(function(msg) {
			console.log(msg);
			estimate.set('status', 'Sent');
			return estimate.save();
		})
		.then(function(estObj) {
			return estObj;
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

function createEstimateItem (itemData, otherData) {
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

function fillInXmlData(xmlUrl, user, estimate) {
	return $.ajax({
		type: "GET",
		url: xmlUrl,
		dataType: "xml"
	}).then(function (xmlDoc) {
		var x2js = new X2JS();
		var jsonObj = x2js.xml2json(xmlDoc);
		var labels = jsonObj.items.label;

		// static values
		labels['invoice-title'] = "Estimate";
		labels['billType'] 	 = "estimate";
		labels['list-header-total'] = "Total";
		labels['longmsg-title'] = "Notes";
		labels['ordernotes-title'] = "Terms & Conditions";
		labels['refundedText'] = "Estimated Total";
		labels['headerTitle'] = "";
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
		
		// value directly available from Estimate
		labels['ordernotes'] = estimate.get("termsConditions");
		labels['longmsg'] = estimate.get("notes");

		labels['body-date'] = formatDate(estimate.get("estimateDate"), "MMM D, YYYY");
		labels['past-due'] = labels['body-date'];

		var refNum = estimate.get("referenceNumber");
		labels['purchaseOrderNumber'] = refNum ? "Ref.# " + refNum : "";

		/* this will be used as EST# and CREDIT# as well */
		labels['refid'] = estimate.get("estimateNumber");

		var customFields = jsonObj.items.customFields;
		var fields = estimate.get("customFields");
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
		attachments.attachment = undefined;
/*		var files = estimate.get("estimateFiles");
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
		var orgObj = estimate.get("organization");
		if (orgObj) {
			labels['mailto'] = "mailto:" + orgObj.get("email");
			labels['logo'] = orgObj.get("logo").url();
			labels['title'] = "Estimate from " + orgObj.get("name");
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
		var custmr = estimate.get("customer");
		if (custmr) {
			var mail = custmr.get("email");
			labels['clientmail'] =  mail;
			labels['clientmailto'] = "mailto:" + mail;
			labels['clientname'] = custmr.get("displayName");
			labels['clientnr'] = custmr.get("phone");
			labels['body-currency'] = custmr.get("currency").split(" ")[0];
		}

		var discountType = estimate.get("discountType");
		labels['discountPlace'] = { text:
			(discountType == 2 ? "before" : (discountType == 3 ? "after" : ""))
		};

		/* tax is only on item level */
		/* estimateItems, estimateItems.item and
		   estimateItems.item.tax is already loaded */
		var items = jsonObj.items;
		var taxes = jsonObj.items.label.taxes;
		var totalTax = 0;
		var subTotal = 0;

		var itemList = estimate.get("estimateItems");
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

		var discounts = estimate.get("discounts") || 0;
		var shipCharges = estimate.get('shippingCharges') || 0;
		var adjustments = estimate.get('adjustments') || 0;
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
		
		var total = sum + shipCharges + adjustments;
		labels['total-price3'] = labels['body-price'] = currencyFilter(total, '$', 2);

		var paymentMade = 0;
		var creditApplied = 0;

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

}]);
