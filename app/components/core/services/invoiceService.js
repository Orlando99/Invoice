'use strict';

invoicesUnlimited.factory('invoiceFactory', function($q, invoicesFactory){
	return {
		test : function() {
			console.log("working");
		},
		createNewInvoice : function(invoice, invoiceItems, role, file) {
			var items = [];
			var acl = new Parse.ACL();
			acl.setRoleWriteAccess(role.get("name"), true);
			acl.setRoleReadAccess(role.get("name"), true);
			var invItem = Parse.Object.extend("InvoiceItems");
			
			invoiceItems.forEach(function(item) {
				var obj = new invItem();
				obj.setACL(acl);
				obj.set("userID", invoice.userID);
				obj.set("organization", invoice.organization);
				obj.set("item", item.selectedItem.entity);
				obj.set("quantity", Number(item.quantity));
				obj.set("amount", Number(item.amount));
				obj.set("discount", Number(item.discount));
				if (item.selectedTax) {
					obj.set("tax", Parse.Object.extend("Tax")
						.createWithoutData(item.selectedTax.id));
				}
				items.push(obj);
			});
			
			return Parse.Object.saveAll(items)
			.then(function(list) {
			//	console.log("items saved successfully");
				var invoiceTable = Parse.Object.extend("Invoices");
				var obj = new invoiceTable();
				obj.setACL(acl);
				invoice.invoiceItems = list;
				
				return obj.save(invoice)
				.then(function(invObj) {
					console.log("invoice created successfully");
					return invObj;
				});
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
		getInvoices : function(user) {
			var organization = getOrganization(user);
			if (! organization)	return;

			// get other fields,
			var invoiceTable = Parse.Object.extend("Invoices");
			var query = new Parse.Query(invoiceTable);

			query.equalTo("organization", organization);
			query.limit(2);
			query.select("invoiceNumber", "customer", "invoiceDate", "dueDate",
				"total", "balanceDue", "status");

			return query.find().then(function(invoiceObjs) {
				var invoices = [];
				var customerIds = [];
				for (var i = 0; i < invoiceObjs.length; ++i) {

					var obj = new invoicesFactory (invoiceObjs[i]);
					var invoice = {
						values : obj.entity,
					};


					// save customer ids to fetch display names later
					customerIds.push(obj.entity.customer.id);

					// select css class for status
					switch(invoice.values.status) {
						case "Unpaid":
							invoice.statusClass = "text-color-normalize";
							break;
						case "Paid":
							invoice.statusClass = "text-positive";
							break;
						case "Overdue":
							invoice.statusClass = "text-danger";
							break;
						default:
							invoice.statusClass = "text-color-normalize";
					}

					invoices.push(invoice);

				}
				// get customer display name
				var customerTable = Parse.Object.extend("Customer");
				var customerQuery = new Parse.Query(customerTable);
				customerQuery.containedIn("objectId", customerIds);
				customerQuery.select("displayName");
				customerQuery.find().then(function(customerObjs) {
					for (var i = 0; i < customerIds.length; ++i) {
						for (var j = 0; j < customerObjs.length; ++j) {
							if (customerIds[i] == customerObjs[j].id) {
								invoices[i].customerName = customerObjs[j].get("displayName");
								break;
							}
						}
					}
				});

				return invoices;
			});
		},
		createInvoiceReceipt : function(invoiceId) {
			var invoiceTable = Parse.Object.extend("Invoices");
			var query = new Parse.Query(invoiceTable);
			query.include("invoiceItems", "customer", "lateFee",
				"invoiceItems.item", "invoiceItems.item.tax", "organization",
				"userID", "userID.defaultTemplate", "userID.businessInfo");

				return query.get(invoiceId)
				.then(function(invoiceObj) {
					var user = invoiceObj.get("userID");
					var template = user.get("defaultTemplate");
					var xmlFile = template.get("templateData");
					var htmlFile = template.get("templateHTML");
					var cardUrl = template.get("linkedFile").url();

					return fillInXmlData(xmlFile.url(), user, invoiceObj)
					.then(function(newXml) {
						var labelsFile = new Parse.File("test1.xml",{base64: newXml}, "text/xml");
						return labelsFile.save()
						.then(function(xml) {
							return fillInHtmlData(xml.url(), htmlFile.url(), cardUrl)
							.then(function(newHtml) {
								var invoiceFile = new Parse.File("test2.html",{base64: newHtml});
								return invoiceFile.save()
								.then(function(html) {
									invoiceObj.set("invoiceLabels", xml);
									invoiceObj.set("invoiceReceipt", html);
									return invoiceObj.save()
									.then(function(invObj) {
										console.log("files saved");
										return invObj;
									});

								});
							});
						});
					});
				}, function(error) {
				console.log(error.message);
			});

		}

	};

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

	function fillInXmlData(xmlUrl, user, invoice) {
		return $.ajax({
			type: "GET",
			url: xmlUrl,
			dataType: "xml"
		}).then(function (xmlDoc) {
			var x2js = new X2JS();
			var jsonObj = x2js.xml2json(xmlDoc);
			var labels = jsonObj.items.label;

			// static values
			labels['invoiceId'] = "123456";
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

			/* format date aswell */
			labels['body-date'] = formatDate(invoice.get("invoiceDate"));
			labels['past-due'] = formatDate(invoice.get("dueDate"));

			/* don't show it, if empty */
			labels['purchaseOrderNumber'] = invoice.get("poNumber") ?
				"P.O.Number:" + invoice.get("poNumber") : "";

			/* this will be used as EST# and CREDIT# as well */
			labels['refid'] = invoice.get("invoiceNumber");

			/* format upto 2 decimal points */
			labels['refundtotal'] = "$" + formatNumber(invoice.get("balanceDue"));
			labels['subtotalprice'] = "$" + formatNumber(invoice.get("subTotal"));
			labels['paymentMadePrice'] = "$" + formatNumber(invoice.get("paymentMade"));
			labels['creditsAppliedPrice'] =
				"$" + formatNumber(invoice.get("creditApplied"));
			labels['total-price3'] = labels['body-price'] =
				"$" + formatNumber(invoice.get("total"));
			jsonObj.items['shippingChargesPrice'] =
				"$" + formatNumber(invoice.get("shippingCharges"));
			jsonObj.items['adjustmentsPrice'] =
				"$" + formatNumber(invoice.get("adjustments"));

			var discounts = invoice.get("discounts");
			if (discounts) {
				labels['discountAmount'] = invoice.get("discounts") + "%";
				labels['discountNameBottom'] =
					"Discount " + labels['discountAmount'] + "%:";
				labels['discountPriceBottom'] = "$0.12";
			}
			else
				labels['discountAmount'] = labels['discountNameBottom'] =
					labels['discountPriceBottom'] = "";

			var type = invoice.get("discountType");
			labels['discountPlace'] =
				(type == 2 ? "before" : (type == 3 ? "after" : ""));

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

			/* tax is only on item level */
			/* invoiceItems, InvoiceItems.item and
			   InvoiceItems.item.tax is already loaded */
			var items = jsonObj.items;
			var taxes = jsonObj.items.label.taxes;

			var itemList = invoice.get("invoiceItems");
			if (itemList) {
				items.itemRow = [];
				taxes.tax = [];
				for (var i = 0; i < itemList.length; ++i) {
					var name = itemList[i].get("item").get("title");
					var qty = itemList[i].get("quantity");
					var amount = "$" + formatNumber(itemList[i].get("amount"));
					var discount = itemList[i].get("discount");

					var itmObj = {
						'name': name,
						'qty': qty,
						'price': amount
					};
					itmObj.discount = (discount ? discount : 0);
					items.itemRow.push(itmObj);

					var tax = itemList[i].get("tax");
					if (tax) {
						var taxName = tax.get("title") + " (" + tax.get("value") + "%)";
						var taxValue = "$" + calculateTax(itemList[i], tax);
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
				labels['addres1'] = "";
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

			// values available from lateFee
			/* lateFee is already loaded */
			// only fill if Overdue
			var lateFee = invoice.get("lateFee");
			if (lateFee) {
				labels['tip-text'] = "Late Fee";
				var price = lateFee.get("price");
				var type = lateFee.get("type");
				if (type == "$")
					labels['tip-price'] = type + formatNumber(price);
				else
					labels['tip-price'] = price + type;
			}
			else
				labels['tip-text'] = labels['tip-price'] = "";

//------------------
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

		return formatNumber(res);
	}

	function formatDate(date) {
		if(date){
			var d = moment(date);
			return d.format("MMM D, YYYY");
		}
	}
/*
	function formatNumber(num) {
		if (num)
			return num.toFixed(2);
		return "0.00";
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
