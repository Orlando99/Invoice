'use strict';

invoicesUnlimited.factory('invoiceService', function($q, invoiceFactory, itemService, currencyFilter, userFactory){
return {
	test : function() {
		console.log("working");
	},
	checkInvoiceNumAvailable : function(params) {
		var invoiceTable = Parse.Object.extend('Invoices');
		var query = new Parse.Query(invoiceTable);
		query.equalTo('organization', params.organization);
		query.equalTo('invoiceNumber', params.invoiceNumber);
		query.select('invoiceNumber');

		return query.first()
		.then(function(obj) {
			return obj ? false : true;
		});
	},
	addPayments : function(objs, role) {
		var promises = [];
		var Payment = Parse.Object.extend('Payment');
		var acl = new Parse.ACL();
		//acl.setRoleWriteAccess(role.get("name"), true);
		//acl.setRoleReadAccess(role.get("name"), true);

        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(true);
        
		for (var i=0; i < objs.length; ++i) {
			var payment = new Payment();
			payment.setACL(acl);
			promises.push(payment.save(objs[i]));
		}
		
		return $q.all(promises);
	},
	getInvoicesForSummary : function(params) {
		var customerTable = Parse.Object.extend("Customer");
		var innerQuery = new Parse.Query(customerTable);
		innerQuery.notEqualTo("isDeleted", 1);
		
		var invoiceTable = Parse.Object.extend('Invoices');
		var query = new Parse.Query(invoiceTable);
		
		query.matchesQuery("customer", innerQuery);
		
		query.equalTo('organization', params.organization);
        query.limit(1000);
		// set year,month,day constraint
		query.select('invoiceDate', 'dueDate', 'status', 'balanceDue', 'lateFee', 'total');

		return query.find().then(function(objs) {
			var invoices = [];
			objs.forEach(function(invoice) {
				invoices.push(new invoiceFactory(invoice, {
					operation : 'summary'
				}));
			});
			return invoices;
		});
	},
	getInvoiceDetails : function(invoiceId) {
		var Invoice = Parse.Object.extend('Invoices');
		var query = new Parse.Query(Invoice);
		query.include('comments', 'payment', 'invoiceInfo', 'customer', 'customer.contactPersons');

		return query.get(invoiceId)
		.then(function(invObj) {
			var invoice = new invoiceFactory(invObj, {
				operation : 'details'
			});
			return invoice;
		});
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

		invInfo.set('sendNotifications', userFactory.entity[0].get('getInvoiceNotification'));
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
            var date = invoice.get('dueDate');
            var today = new Date();
            date.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            if(date < today)
			     invoice.set('status', 'Overdue');
            //else
            //    invoice.set('status', 'Sent');
			return invoice.save()
			.then(function(inv) {
				return invInfoObj;
			});
		});

	},
	updateInvoice : function(invoiceObj, invoiceItems, deletedItems, user, role, files) {
		var invItems = [];
		var itemsToDelete = [];
		var itemsToCreate = [];
		var invItemsToCreate = [];
		var invItemsToUpdate = {};
		var InvoiceItem = Parse.Object.extend("InvoiceItems");
		var acl = new Parse.ACL();
		//acl.setRoleWriteAccess(role.get("name"), true);
		//acl.setRoleReadAccess(role.get("name"), true);

        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(true);
        
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

		var promise = undefined;
		var newFiles = []; // store already saved and newly created files
		if(files.length) {
			newFiles = [];
			var promises = [];
			files.forEach(function(file) {
				if(file.exist) {
					delete file.exist;
					delete file.fileName;
					newFiles.push(file);

				} else {
					var parseFile = new Parse.File(file.fileName, file);
					promises.push(parseFile.save());
				}
			});

			promise = $q.all(promises);

		} else
			promise = Parse.Promise.as(undefined);

		return promise.then(function(fileObjs) {
			if (fileObjs)
				newFiles = newFiles.concat(fileObjs);

			invoiceObj.entity.set('invoiceFiles', newFiles);
			
			// create new items
			return createNewItems(itemsToCreate, otherData)
		})
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
	createNewInvoice : function(invoice, invoiceItems, role, files) {
		var items = [];
		var acl = new Parse.ACL();
		//acl.setRoleWriteAccess(role.get("name"), true);
		//acl.setRoleReadAccess(role.get("name"), true);

        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(true);
        
		var promise = undefined;
		var newFiles = undefined; // store already saved and newly created files
		if(files.length) {
			newFiles = [];
			var promises = [];
			files.forEach(function(file) {
				if(file.exist) {
					delete file.exist;
					delete file.fileName;
					newFiles.push(file);

				} else {
					var parseFile = new Parse.File(file.fileName, file);
					promises.push(parseFile.save());
				}
			});

			promise = $q.all(promises)
			.then(function(fileObjs) {
				if (fileObjs)
					newFiles = newFiles.concat(fileObjs);
				return newFiles;
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
		.then(function(fileObjs) {
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
				obj.set("invoiceFiles", fileObjs);
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
			prefs.itemDescOnInvoice = prefObj.get("itemDescOnInvoice");

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
	setPreferences : function (user, params) {
		var organization = getOrganization(user);
		if (! organization) {
			var message = 'user: ' + user.id + ' has no Organization assigned.'
			return Parse.Promise.error(message);
		}

		var promises = [];
		organization.set('invoiceFields', params.customFields);
		if(params.invoiceAg) {
			organization.set('invoiceNumber', params.invoiceNumber);
		}
		promises.push(organization.save());

		var Preference = Parse.Object.extend('Preferencies');
		var query = new Parse.Query(Preference);
		query.equalTo("organization", organization);
	
		return query.first().then(function(prefObj) {
			prefObj.set("invoiceAg", params.invoiceAg);
			prefObj.set("invoiceSalesPerson", params.salesPerson);
			prefObj.set("invoiceDiscount", params.discountType);
			prefObj.set("invoiceAdjustments", params.adjustments);
			prefObj.set("invoiceShippingCharges", params.shipCharges);
			prefObj.set("invoiceNotes", params.notes);
			prefObj.set("invoiceTerms", params.terms);
			prefObj.set("invoiceThanksNotes", params.thanksNote);
			prefObj.set("itemDescOnInvoice", params.itemDescOnInvoice);

			promises.push(prefObj.save());
			return Parse.Promise.when(promises);
		});

	},
	listInvoices : function(user) {
		var organization = getOrganization(user);
		if (! organization)	return;

		var customerTable = Parse.Object.extend("Customer");
		var innerQuery = new Parse.Query(customerTable);
		innerQuery.notEqualTo("isDeleted", 1);
		
		var invoiceTable = Parse.Object.extend("Invoices");
		var query = new Parse.Query(invoiceTable);

		//query.matchesQuery("customer", innerQuery);
		
		query.equalTo("organization", organization);
		query.include("customer");
		//query.notEqualTo("customer.isDeleted", 1);
        query.limit(1000);
		//query.select("invoiceNumber", "invoiceDate", "dueDate", "total", "balanceDue", "status", "customer", "poNumber");

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
			"invoiceItems.item", "invoiceItems.tax", "organization",
			"userID", "userID.defaultTemplate", "userID.businessInfo");

		var data = {};
		return query.get(invoiceId)
		.then(function(invoiceObj) {
			data.invoiceObj = invoiceObj;	// save for later use
			var user = invoiceObj.get("userID");
			var org = invoiceObj.get('organization');
			var logo = org.get('logo');
			if(logo)
				userLogo = logo._url;
			else
				userLogo = undefined;
			return getPreferences(user)
			.then(function(pref){
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
						return fillInXmlData(xmlFile.url(), user, invoiceObj, invoiceInfoId, pref, logo);
					});
				}
				else{
					var xmlFile = template.get("templateData");
					data.htmlFile = template.get("templateHTML");	// save for later use
					data.cardUrl = template.get("linkedFile").url();// save for later use
					return fillInXmlData(xmlFile.url(), user, invoiceObj, invoiceInfoId, pref, logo);
				}
			});
			
			// in case of edit, get them from invocieObj
		})
		.then(function(obj) {
			return $q.when(obj)
			.then(function(res){
				var newXml = res.newXml;
				var labelsFile = new Parse.File("test1.xml",{base64: newXml}, "text/xml");
				data.pdf = res.pdf;
				return labelsFile.save();
			});
			
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
			data.invoiceObj.set("invoiceLabels", data.xml);
			data.invoiceObj.set("invoiceReceipt", html);
			data.invoiceObj.set("pdfReceipt", data.pdf);
			data.invoiceObj.set('hasPdfReceipt', true);
			return data.invoiceObj.save();
		})
		.then(function(invObj) {
			return invObj;
		});
	},
    sendInvoiceText : function(invoice) {
		var inv = new invoiceFactory(invoice, {
			operation : 'sendReceipt'
		});
        var mob = inv.entity.get('customer');
        mob = mob.get('mobile');
        if(mob)
        {
            var to = mob;
            var customerName = inv.customer.displayName;
            var amount = currencyFilter(inv.entity.balanceDue, '$', 2);
            //var businessName = inv.organization.name;
            var businessName = userFactory.entity[0].get('company');
            var link = inv.entity.invoiceReceipt.url();
            var msgBody = customerName + ', '
                + businessName + ' has sent you an invoice of ' + amount
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
			return invoice;
		}, function(error){
                console.error(error);
			 return invoice;
            });
        });
        
		  
	},
    sendInvoiceTextToNumber : function(invoice, number) {
		var inv = new invoiceFactory(invoice, {
			operation : 'sendReceipt'
		});
        var mob = number;
        if(mob)
        {
            var to = mob;
            var customerName = inv.customer.displayName;
            var amount = currencyFilter(inv.entity.balanceDue, '$', 2);
            var businessName = userFactory.entity[0].get('company');
            var link = inv.entity.invoiceReceipt.url();
            var msgBody = customerName + ', '
                + businessName + ' has sent you an invoice of ' + amount
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
			return invoice;
		}, function(error){
                console.error(error);
			 return invoice;
            });
        });
        
		  
	},
	sendInvoiceReceipt : function(invoice) {
		var inv = new invoiceFactory(invoice, {
			operation : 'sendReceipt'
		});
        
        var link = inv.entity.invoiceReceipt.url();
        return $.ajax({
                type: "GET",
                url: 'proxy.php',
                dataType: "html",
                data: {
                address: link
            }
        }).then(function (htmlDoc) {
            
            var toEmail = undefined;
            var businessName = userFactory.entity[0].get('company');
            var link = inv.entity.invoiceReceipt.url();

            var emailSubject = 'Invoice From ' + businessName;
            var emailBody = htmlDoc;
            
            if(inv.entity.customerEmails)
            {
                toEmail = inv.entity.customerEmails[0];
            }
            else{
                var cust = inv.entity.get('customer')
                toEmail = cust.get('email');
            }
            htmlDoc = htmlDoc.replace('<!DOCTYPE html>', '');
            htmlDoc = htmlDoc.trim();
            var abc = 1;
            
            var fr = document.getElementById('targetframe1');
            fr.src = "about:blank";
            fr.contentWindow.document.open();
            fr.contentWindow.document.write(htmlDoc);
            fr.contentWindow.document.close();
            
            fr.onload = function() {
               //var div=iframe.contentWindow.document.getElementById('mydiv');
                abc = 0;
                return Parse.Cloud.run("sendMailgunHtml", {
                toEmail: toEmail,
                fromEmail: "no-reply@invoicesunlimited.com",
                subject : emailSubject,
                html : '<html>' + $('#targetframe1').contents().find('html').html() + '</html>'
                }).then(function(msg) {
                    console.log(msg);
                    return invoice;
                });
            };

            return Promise.resolve('');
        });
        
        
        /*
        if(inv.entity.customerEmails)
        {
            var toEmail = inv.entity.customerEmails[0];
            var customerName = inv.customer.displayName;
            var amount = currencyFilter(inv.entity.balanceDue, '$', 2);
            var businessName = inv.organization.name;
            var link = inv.entity.invoiceReceipt.url();

            var emailSubject = 'Invoice From ' + businessName;
            var emailBody = customerName + ',<br/>'
                + businessName + ' has sent you an invoice of ' + amount
                + '. <a href="' + link + '">Click here to view.</a>';
        }
        
        
		return Parse.Cloud.run("sendMailgunHtml", {
			toEmail: toEmail,
			fromEmail: "no-reply@invoicesunlimited.com",
			subject : emailSubject,
			html : emailBody
		}).then(function(msg) {
			console.log(msg);
			return invoice;
		}); 
        */
	},
    sendInvoiceReceiptToEmail : function(invoice, email) {
		var inv = new invoiceFactory(invoice, {
			operation : 'sendReceipt'
		});
        
        var link = inv.entity.invoiceReceipt.url();
        return $.ajax({
                type: "GET",
                url: 'proxy.php',
                dataType: "html",
                data: {
                address: link
            }
        }).then(function (htmlDoc) {
            
            var toEmail = email;
            var businessName = userFactory.entity[0].get('company');
            var link = inv.entity.invoiceReceipt.url();

            var emailSubject = 'Invoice From ' + businessName;
            var emailBody = htmlDoc;
            
            htmlDoc = htmlDoc.replace('<!DOCTYPE html>', '');
            htmlDoc = htmlDoc.trim();
            var abc = 1;
            
            var fr = document.getElementById('targetframe1');
            fr.src = "about:blank";
            fr.contentWindow.document.open();
            fr.contentWindow.document.write(htmlDoc);
            fr.contentWindow.document.close();
            
            fr.onload = function() {
               //var div=iframe.contentWindow.document.getElementById('mydiv');
                abc = 0;
                return Parse.Cloud.run("sendMailgunHtml", {
                toEmail: toEmail,
                fromEmail: "no-reply@invoicesunlimited.com",
                subject : emailSubject,
                html : '<html>' + $('#targetframe1').contents().find('html').html() + '</html>'
                }).then(function(msg) {
                    console.log(msg);
                    return invoice;
                });
            };

            return Promise.resolve('');
        });
	},
	downloadInvoiceReceipt : function(invoice) {
		var inv = new invoiceFactory(invoice, {
			operation : 'sendReceipt'
		});
        
        var link = inv.entity.invoiceReceipt.url();
        return $.ajax({
                type: "GET",
                url: 'proxy.php',
                dataType: "html",
                data: {
                address: link
            }
        }).then(function (htmlDoc) {
            if(inv.entity.customerEmails)
            {
                var toEmail = inv.entity.customerEmails[0];
                //var customerName = inv.customer.displayName;
                //var amount = currencyFilter(inv.entity.balanceDue, '$', 2);
                var businessName = inv.organization.name;
                var link = inv.entity.invoiceReceipt.url();

                var emailSubject = 'Invoice From ' + businessName;
                var emailBody = htmlDoc;
            }
            htmlDoc = htmlDoc.replace('<!DOCTYPE html>', '');
            htmlDoc = htmlDoc.trim();
            var abc = 1;
            //var fr = document.getElementById('targetframe1');
            
            var fr = document.createElement('iframe');
            document.body.appendChild(fr);
            fr.style.display = 'none';
            fr.setAttribute("id", "myFrame");
            fr.contentWindow.document.open();
            fr.contentWindow.document.write(htmlDoc);
            fr.contentWindow.document.close();
            
            fr.onload = function() {
               var div = fr.contentWindow.document.getElementsByTagName('body');
                div = div.innerHTML;
                //var html = '<page id="page-container" backtop="0mm" backbottom="10mm" backleft="10mm" backright="15mm">' + $('#myFrame').contents().find('body').html() + '</page>';
                var html = '<page id="page-container">' + $('#myFrame').contents().find('body').html() + '</page>';
                debugger;
                var abc = 0;
                $.ajax({
                    method:"POST",
                    type:"POST",
                    url: "generatePDF.php",
                    data: { 
                        'html' : html,
                    }
                })
                .then(function (htmlDoc) {
                    debugger;
                });
                
            };
            
            return Promise.resolve('');
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

function getPreferences(user) {
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
		prefs.itemDescOnInvoice = prefObj.get("itemDescOnInvoice");
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
		}, function(error){
            console.log(error);
        });

	});
}
var userLogo = undefined;
function fillInXmlData(xmlUrl, user, invoice, invoiceInfoId, pref, logo) {
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
			"Order # " + invoice.get("poNumber") : "";

		/* this will be used as EST# and CREDIT# as well */
		labels['refid'] = invoice.get("invoiceNumber");

		var customFields = jsonObj.items.customFields;
		customFields.customField = [];

		var salesPerson = invoice.get("salesPerson");
		if (salesPerson) {
			customFields.customField.push({'name':'Sales Person', 'value':salesPerson});
		}

		var fields = invoice.get("customFields");
		if (fields) {
			for (var i = 0; i < fields.length; ++i) {
				var key = Object.keys(fields[i])[0];
				var value = fields[i][key];
				customFields.customField.push({'name':key, 'value':value});
			}
		}

		if (! customFields.customField.length)
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
		
		if(userLogo)
			labels['logo'] = userLogo;
		
		// values available from Organization
		var orgObj = invoice.get("organization");
		if (orgObj) {
			labels['mailto'] = "mailto:" + orgObj.get("email");
			labels['title'] = "Invoice from " + orgObj.get("name");
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
			labels['business-name'] = bInfo.get('businessName');
		}

		// values available from Customer
		/* Customer is laready loaded */
		var custmr = invoice.get("customer");
		if (custmr) {
			var mail = custmr.get("email");
			labels['clientmail'] =  mail;
			labels['clientmailto'] = "mailto:" + mail;
            if(custmr.get("salutation"))
			     labels['clientname'] = custmr.get('salutation') + " " + custmr.get("displayName");
            else 
			     labels['clientname'] = custmr.get("displayName");
			labels['clientnr'] = custmr.get("phone");
            if(custmr.get("currency"))
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
				var desc = itemList[i].get("item").get("itemDescription");

				subTotal += amount * ((100 - discount) * 0.01);

				var itmObj = {
					'name': name,
					'qty': qty,
					'price': currencyFilter(amount, '$', 2)
				};
				
				if(desc && pref.itemDescOnInvoice == 1)
					itmObj.desc = desc;
				
				if (discountType == 1)
					itmObj.discount = (discount ? discount : 0);

				items.itemRow.push(itmObj);

				var tax = itemList[i].get("tax");
				if (tax) {
					var taxName = tax.get("title") + " (" + tax.get("value") + "%)";
					
					var t = 0;
					var discounts = invoice.get("discounts") || 0;
					if(discountType == 2) //before tax
						t = calculateTax(amount * ((100 - discounts) * 0.01), tax);
					else
						t = calculateTax(amount * ((100 - discount) * 0.01), tax);
					
					//var t = calculateTax(itemList[i], tax);
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
		//var shipCharges = invoice.get('shippingCharges') || 0;
		var shipCharges = invoice.get('shippingCharges');
		var adjustments = invoice.get('adjustments');
		//var adjustments = invoice.get('adjustments') || 0;
		var sum = subTotal + totalTax;
		var discountRatio = (100 - discounts) * 0.01;

        if(shipCharges){
            jsonObj.items['shippingChargesPrice'] = currencyFilter(shipCharges, '$', 2);
            jsonObj.items['shippingCharges'] = 'SHIPPING CHARGES';
        }
        else {
            jsonObj.items['shippingChargesPrice'] = '';
            jsonObj.items['shippingCharges'] = '';
        }
        
        shipCharges = invoice.get('shippingCharges') || 0;
        
        
        if(adjustments){
            jsonObj.items['adjustmentsPrice'] = currencyFilter(adjustments, '$', 2);
            jsonObj.items['adjustments'] = 'ADJUSTMENTS';
        }
        else {
            jsonObj.items['adjustmentsPrice'] = '';
            jsonObj.items['adjustments'] = '';
        }

        adjustments = invoice.get('adjustments') || 0
        
		if(discountType == 2) // before tax
			sum = (subTotal * discountRatio) + totalTax;
		else if (discountType == 3) // after tax
			sum = (subTotal + totalTax) * discountRatio;

		if (discounts) {
			labels['discountNameBottom'] = {text:"Discount (" + discounts + "%)"};
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

		total = parseFloat(total.toFixed(2));
		
		var balanceDue = total - paymentMade - creditApplied;
		labels['refundtotal'] = currencyFilter(balanceDue, '$', 2);
		
		if(balanceDue > 0){
			labels['headerTitle'] = "Payment Due";
			labels['disablePay'] = "false";
		} else {
			labels['headerTitle'] = "Paid Date";
			labels['disablePay'] = "true";
		}

//----------------------------------------------------------------

		// test lines
	//	console.log(jsonObj);

		xmlDoc = x2js.json2xml_str(jsonObj);
		
		return updatePage(xmlDoc, invoice)
		.then(function(pdfFile){
			return pdfFile.save()
			.then(function(pdf){
				
				labels['pdf'] = pdf.url();
				xmlDoc = x2js.json2xml_str(jsonObj);
				return $.ajax({
					type: "POST",
					url: "./assets/php/convert_base64.php",
					data: {
						str : xmlDoc
					}
				}).then(function(newXml) {
					var obj = {};
					obj.newXml = newXml;
					obj.pdf = pdf;
					//return newXml;
					return obj;
				}, function(error){
					console.log(error);
				});
			}, function(error){
				debugger;
				console.error(error);
			});
			
		}, function(error){
			debugger;
			console.error(error);
		});
	});

}

function updatePage(dataTable, invoice){
	dataTable = $.parseXML(dataTable);
	var itemRows = $(dataTable).find('itemRow');
	var modsRow = $(dataTable).find('modsRow');
	var attachments = $(dataTable).find('attachment');
	var customFields = $(dataTable).find('customField');
	var taxes = $(dataTable).find('tax');
	var td = $('<td></td>');

	if ($(dataTable).find('billType').text().includes('estimate')){
		$('.footer .info').hide()
		$('.payment-due').hide()
	}

	$('#invoice-items-header').html('');

	if (!/^[\s]*$/.test(itemRows.first().find('discount').text())) {
		$('#invoice-items-header').append('<td class="ff1 fc0 btm-line top-line" colspan="2" style="height: 9mm; font-size: 16px; vertical-align: middle; /*background: #317cf4;*/ padding-left: 14pt;">Item</td> <td class="ff1 fc0 btm-line top-line" colspan="1" style="height: 9mm; vertical-align: middle; text-align: right; font-size: 16px; /*background: #317cf4;*/">Quantity</td> <td class="ff1 fc0 btm-line top-line" colspan="1" style="height: 9mm; vertical-align: middle; text-align: right; font-size: 16px; /*background: #317cf4;*/">Discount</td> <td class="ff1 fc0 btm-line top-line" colspan="2" style="height: 9mm; vertical-align: middle; text-align: right; font-size: 16px; /*background: #317cf4;*/ padding-right: 14pt;">Amount</td>');

	} else {
		$('#invoice-items-header').append('<td class="ff1 fc0 btm-line top-line" colspan="2" style="height: 9mm; font-size: 16px; vertical-align: middle; /*background: #317cf4;*/ padding-left: 14pt;">Item</td> <td class="ff1 fc0 btm-line top-line" colspan="2" style="height: 9mm; vertical-align: middle; text-align: right; font-size: 16px; /*background: #317cf4;*/">Quantity</td> <td class="ff1 fc0 btm-line top-line" colspan="2" style="height: 9mm; vertical-align: middle; text-align: right; font-size: 16px; /*background: #317cf4;*/ padding-right: 14pt;">Amount</td>');
	}

	$('.invoice-items').remove();
	
	itemRows.each(function(funcOne){

		var sp = "<span class='fc0'>" + $(this).children('name').text() + "</span><br>" + $(this).children('desc').text() + "";

		if (!/^[\s]*$/.test(itemRows.first().find('discount').text())) {
			var item = $("<tr class='invoice-items'></tr>");
			//var itemTitle = $("<td class='ff1 fc0 invoice-item-title' style='width: 50mm;' colspan='2'>"+ $(this).children('name').text() +"</td>");
			var itemTitle = $("<td class='ff1 fc1 invoice-item-title' style='width: 50mm;' colspan='2'>"+ sp +"</td>");
			var itemQty = $("<td class='ff1 fc0  invoice-item-qty' colspan='1'>"+ $(this).children('qty').text() +"</td>");
			var itemDiscount = $("<td class='ff1 fc0  invoice-item-qty' colspan='1'>"+ $(this).children('discount').text() +"</td>");
			var itemCost = $("<td class='ff1 fc0  invoice-item-cost' colspan='2'>"+ $(this).children('price').text() +"</td>");
			item.append(itemTitle)
				.append(itemQty)
				.append(itemDiscount)
				.append(itemCost);
			$('#invoice-items-header').after($(item));
		}
		else {
			var item = $("<tr class='invoice-items'></tr>");
			//var itemTitle = $("<td class='ff1 fc0 invoice-item-title' style='width: 50mm;' colspan='2'>"+ $(this).children('name').text() +"</td>");
			var itemTitle = $("<td class='ff1 fc1 invoice-item-title' style='width: 50mm;' colspan='2'>"+ sp +"</td>");
			var itemQty = $("<td class='ff1 fc0  invoice-item-qty' colspan='2'>"+ $(this).children('qty').text() +"</td>");
			var itemCost = $("<td class='ff1 fc0  invoice-item-cost' colspan='2'>"+ $(this).children('price').text() +"</td>");
			item.append(itemTitle)
				.append(itemQty)
				.append(itemCost);
			$('#invoice-items-header').after($(item));
		}
	});

	$('.invoice-taxes').remove();
	
	taxes.each(function() {

		var item = $("<tr class='invoice-taxes'></tr>");
		var blank = $("<td colspan='3' class=''></td>");
		var itemTitle = $("<td class='ff1 fc1 ' colspan='2' style = 'padding-bottom: 4mm; vertical-align: middle; font-size: 16px;'>" + $(this).children('name').text() +"</td>");
		var itemCost = $("<td class='ff1 fc1 ' style='padding-bottom: 4mm; text-align: right; vertical-align: middle; font-size: 16px;'>" + $(this).children('value').text() +"</td>");
		item.append(blank)
			.append(itemTitle)
			.append(itemCost);
		$('#invoice-subtotal').after($(item));

	});

	var tr = $('<tr class="salestax"></tr>');
	$('tr.adjustments').after(tr);

	customFields.each(function() {
		var tr = $('.customFields');

		tr.append($('<div class="info-1" style="margin: 0;border: 0;font-size: 100%;font: inherit;float: left;box-sizing: border-box;width: 70%; float: left; margin-left: 3%;margin-left: 0px"><p class="" style="margin: 0;padding: 10px 0px 0px 0px;border: 0;font-size: 16px;vertical-align: baseline;line-height: 30px;margin-bottom: 10px;color: #989898;">' + $(this).children('name').text() + '</p><p class="" style="margin: 0;padding: 0;border: 0;font-size: 16px;margin-bottom: 10px;color: #000;">' + $(this).children('value').text() + '</p></div>'));
	});

	attachments.each(function() {
		var fileName = $(this).text();
		fileName = fileName.substring(fileName.indexOf("_") + 1 , fileName.length);
		fileName = fileName.replace(/%20/g, " ");
		$('.attach').append('<a style="color: #989898" target="_blank" href=\'' + $(this).text() + '\'>' + fileName + '</a><br><br>');
	});

	$('table tbody tr').each(function(){
		if($(this).children().text().length == 0){
			$(this).addClass('hideOnMob');
		}
	});


	var invoiceId = $(dataTable).find('invoiceId').text();
	$('#pay-link').attr('href',"https://invoicesunlimited.net/pay/?InvoiceInfoID="+invoiceId);
	$('#pay-link-2').attr('href',"https://invoicesunlimited.net/pay/?InvoiceInfoID="+invoiceId);

	var labels = $(dataTable).find('items');
	console.log(labels);
	labels.each(function(){

		var dueTime = new Date(Date.parse($(this).find('past-due').text()));
		var now = new Date(Date.now());
		dueTime = new Date(dueTime.setHours(0,0,0,0));
		now = new Date(dueTime.setHours(0,0,0,0));
		if (dueTime.getTime() >= now.getTime() || dueTime.toString() === "Invalid Date") {
			$('.payment-due p:last').append($(this).find('past-due').text());
			$('.payment-due').addClass('green-status');
		} else {
			$('.payment-due p:last').append($(this).find('past-due').text());
			$('.payment-due').addClass('red-status');
		}

		var headerTitle = $(this).find('headerTitle').text();
		$('.payment-due p:first').append(headerTitle);

		var disablePay = $(this).find('disablePay').text();
		var disable = 'true'

		if (disable === disablePay) {
			$('.btn-border-pay').addClass('disable');
			$('.info.cl').addClass('disable');
			$('.payment-due').removeClass('red-status');
			$('.payment-due').addClass('green-status');
		} 

		var discountAmount = $(this).find('discountAmount').text();

		var tr = $('<tr class="discount"></tr>');
		tr.append($('<td class="discountNm" colspan="3"></td>').html('Discount'));
		// tr.append($('<td colspan="1"></td>'));
		tr.append($('<td class="discountPr"></td>').html(discountAmount));

		if ($(this).find('discountPlace text').text() == 'after') {
			$('.salestax:last').after(tr);
		} else if ($(this).find('discountPlace text').text() == 'before') {
			$('.salestax:first').before(tr);
		}

		var item = $("<tr class='invoice-adjustments'><td colspan='3' class=''></td><td class='ff1 fc1' colspan='2' style = 'padding-bottom: 4mm; vertical-align: middle; font-size: 16px;'>" + $(this).find('discountNameBottom').text() + "</td><td class='ff1 fc1 ' style='padding-bottom: 4mm; text-align: right; vertical-align: middle; font-size: 16px;'>" + $(this).find('discountAmount').text() +"</td></tr>");

		if($(this).find('discountPlace text').text() == 'after'){
			$('.invoice-taxes:last').after($(item));
		} 
		else if($(this).find('discountPlace text').text() == 'before'){
			$('#invoice-subtotal').after($(item));
		}

		if($(this).find('adjustments').text().length > 0){
			var item = $("<tr class='invoice-adjustments'><td colspan='3' class=''></td><td class='ff1 fc1' colspan='2' style = 'padding-bottom: 4mm; vertical-align: middle; font-size: 16px;'>" + $(this).find('adjustments').text() + "</td><td class='ff1 fc1 ' style='padding-bottom: 4mm; text-align: right; vertical-align: middle; font-size: 16px;'>" + $(this).find('adjustmentsPrice').text() +"</td></tr>");
			$('#invoice-subtotal').after($(item));
		}

		if($(this).find('shippingCharges').text().length > 0){
			item = $("<tr class='invoice-adjustments'><td colspan='3' class=''></td><td class='ff1 fc1 ' colspan='2' style = 'padding-bottom: 4mm; vertical-align: middle; font-size: 16px;'>" + $(this).find('shippingCharges').text() + "</td><td class='ff1 fc1 ' style=' padding-bottom: 4mm;text-align: right; vertical-align: middle; font-size: 16px;'>" + $(this).find('shippingChargesPrice').text() +"</td></tr>");

			$('#invoice-subtotal').after($(item));
		}

		var headerTitle = $(this).find('headerTitle').text();
		var pastDate = $(this).find('past-due').text();
		if(headerTitle){
			$('#pdf-title').text(headerTitle + "   " + pastDate);
		} else {
			//$('.top-bar').hide();
			$('#pdf-title').text("");
			$('.top-bar').css('height', '0mm');
			$('.top-bar').css('border-bottom', '0mm');
		}

		var ordernotesTitle = $(this).find('ordernotes-title').text();
		var ordernotes = $(this).find('ordernotes').text();
		if(ordernotes){
			$('#pdf-terms-title').text(ordernotesTitle);
			$('#pdf-terms').text(ordernotes);
		} else {
			$('#pdf-terms-title').text("");
			$('#pdf-terms').text("");
			$('#pdf-terms-title').hide();
			$('#pdf-terms').hide();
		}

		$('#pdf-business-name').text(userFactory.entity[0].get('company'));
		$('#pdf-invoice-title').text($(this).find('invoice-title').text());
		$('#pdf-invoice-number').text($(this).find('refid').text());
		$('#pdf-amount-received').text($(this).find('body-price').text());
		$('#pdf-date').text($(this).find('body-date').text());
		$('#pdf-subtotal').text($(this).find('subtotalprice').text());
		$('#pdf-payment-made').text($(this).find('paymentMadePrice').text());
		$('#pdf-total').text($(this).find('total-price3').text());
		$('#pdf-total-top').text($(this).find('total-price3').text());
		$('#pdf-credit-applied').text($(this).find('creditsAppliedPrice').text());
		$('#pdf-amount-due').text($(this).find('refundtotal').text());
		$('#pdf-payment-name').text($(this).find('title').text());
		$('#pdf-currency').text($(this).find('body-currency').text());
		$('#pdf-total-text').text($(this).find('refundedText').text());
		$('#pdf-payment-text').text($(this).find('paymentMadeText').text());
		$('#pdf-credit-text').text($(this).find('creditsAppliedText').text());

		var ad = $(this).find('addres1').text();

		$('#pdf-address').html(ad);

		//$('#pdf-address').html(ad.replace(/(.{35})/g, "$1<br>"));

		var longmsg = $(this).find('longmsg').text();
		if (longmsg.length != 0){
			var longmsgTitle = $(this).find('longmsg-title').text();

			$('#pdf-notes-title').html(longmsgTitle);
			$('#pdf-notes').html(longmsg);
		} else {
			$('#pdf-notes-title').html("");
			$('#pdf-notes').html("");
			$('#pdf-notes-title').hide();
			$('#pdf-notes').hide();
		}

		var mailto = $(this).find('mailto').text();
		$('#user-mail').attr('href', mailto);
		var mailtotxt = $(this).find('mailtotxt').text();
		$('#user-mail').text(mailtotxt);

		var clientmailto = $(this).find('clientmailto').text();
		$('#client-mail').attr('href', clientmailto);
		var clientmail = $(this).find('clientmail').text();
		$('#client-mail').text(clientmail);

		var clientname = $(this).find('clientname').text();
		$('#client-name').text(clientname);

		var nr = $(this).find('nr').text();
		$('#user-phone').attr('href', "tel:" + nr);
		$('#user-phone').text(nr);
	});
	
	return $.ajax({
        method:"POST",
        type : "POST",
        url: "generatePDF.php",
        data: { 
            'html' : $('.pdf-page').html(),
        }
    }).then(function(pdfData){
		var pdfFile = new Parse.File("receipt.pdf",{base64: pdfData});
		return pdfFile;
    }, function(error){
        console.error(error);
        debugger;
    });
	
}

function calculateTax(amount, tax) {
	var taxType = tax.get("type");
	var taxRate = tax.get("value");
	var compound = tax.get("compound");

	//var amount = item.get("amount");
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
/*
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
*/
function getOrganization (user) {
	var organizationArray = user.get("organizations");
	if (!organizationArray) {
		return undefined;
	}
	else return organizationArray[0];
}

});
