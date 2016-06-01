'use strict';

invoicesUnlimited.factory('invoiceFactory', function($q, invoicesFactory){
	return {
		test : function() {
			console.log("working");
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
				prefs.discount = prefObj.get("invoiceDiscount");
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
		createInvoiceReceipt : function(user, invoiceId) {
			var ptr = user.get("defaultTemplate");

			return ptr.fetch().then(function(template) {
				var xmlFile = template.get("templateData");
				var htmlFile = template.get("templateHTML");
				var invoiceTable = Parse.Object.extend("Invoices");
				var query = new Parse.Query(invoiceTable);
				query.include("invoiceItems", "customer", "lateFee",
					"invoiceItems.item", "invoiceItems.item.tax");
				
				return query.get(invoiceId).then(function(invoiceObj) {
					return fillInXmlData(xmlFile.url(), user, invoiceObj)
						.then(function(newXml) {

						// do something here.
						// create new parse file
					//	var labelsFile = new Parse.File("test.xml",{base64: newXml}, "text/xml");
					//	invoiceObj.set("invoiceLabels", labelsFile);
					//	invoiceObj.save().then(function(invObj) {
						console.log("files saved");

						$.ajax({
							type: "GET",
							url: htmlUrl,
							dataType: "html"
						}).then(function (htmlDoc) {
							

							});

						});

				
				});
/*
				return fillInXmlData(xmlFile.url())
					.then(function(newXml) {
						var invoiceTable = Parse.Object.extend("Invoices");
						var query = new Parse.Query(invoiceTable);

						return query.get(invoiceId).then(function(invoiceObj) {
							// create new parse file
							var labelsFile = new Parse.File("test.xml",{base64: newXml}, "text/xml");
							invoiceObj.set("invoiceLabels", labelsFile);
							invoiceObj.save().then(function(invObj) {
								console.log("files saved");

							});
						});

					});
*/
			}, function(error) {
				console.log(error.message);
			});

		}

	};

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
			labels['invoice-title'] = "Invoice";
			labels['billType'] 	 = "invoice";
			labels['list-header-total'] = "Total";
			labels['headerTitle'] = "Payment Due";
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
			labels['body-date'] = invoice.get("invoiceDate");
			labels['past-due'] = invoice.get("dueDate");

			/* don't show it, if empty */
			labels['purchaseOrderNumber'] =
				"P.O. Number: " + invoice.get("poNumber");

			/* this will be used as EST# and CREDIT# as well */
			labels['refid'] = invoice.get("invoiceNumber");

			/* format upto 2 decimal points */
			labels['refundtotal'] = "$" + invoice.get("balanceDue");
			labels['subtotalprice'] = "$" + invoice.get("subTotal");
			labels['paymentMadePrice'] = "$" + invoice.get("paymentMade");
			labels['creditsAppliedPrice'] =
				"$" + invoice.get("creditApplied");
			labels['total-price3'] = labels['body-price'] =
				"$" + invoice.get("total");
			jsonObj.items['shippingChargesPrice'] =
				"$" + invoice.get("shippingCharges");
			jsonObj.items['adjustmentsPrice'] =
				"$" + invoice.get("adjustments");

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
					var amount = itemList[i].get("amount");
					var discount = itemList[i].get("discount");

					var itmObj = {
						'name': name,
						'qty': qty,
						'amount': amount
					};
					if (discount)	itmObj.discount = discount;
					items.itemRow.push(itmObj);

					var tax = itemList[i].get("tax");
					if (tax) {
						var taxName = tax.get("title") + " " + tax.get("value") + "%";
						var taxValue = "$0.00"; //	tax.get("compound");
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
			user.get("selectedOrganization").fetch().then(function(orgObj){
				labels['mailto'] = "mailto:" + orgObj.get("email");
				labels['logo'] = orgObj.get("logo").url();
				labels['title'] = "Invoice from " + orgObj.get("name");
			});
/*
			// values available from BusinessInfo
			user.get("businessInfo").fetch().then(function(bInfo) {
				labels['addres1'] = bInfo.get("address");
			});
*/
			// values available from Customer
			/* Customer is laready loaded */
			var custmr = invoice.get("customer");
			if (custmr) {
				var mail = custmr.get("email");
				labels['clientmail'] =  mail;
				labels['clientmailto'] = "mailto:" + mail;
				labels['clientname'] = custmr.get("displayName");
				labels['clientnr'] = custmr.get("phone");
				labels['body-currency'] = custmr.get("currency");
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
					labels['tip-price'] = type + price;
				else
					labels['tip-price'] = price + type;
			}
			else
				labels['tip-text'] = labels['tip-price'] = "";

//--------------
			// test lines
		//	console.log(jsonObj);

			xmlDoc = x2js.json2xml_str(jsonObj);
			return $.ajax({
				type: "POST",
				url: "./assets/php/convert_base64.php",
				data: {
					xmlstr : xmlDoc
				}
			}).then(function(newXml) {
				return newXml;
			});

		});

	}

	function getOrganization (user) {
		var organizationArray = user.get("organizations");
		if (!organizationArray) {
			return undefined;
		}
		else return organizationArray[0];
	}

});
