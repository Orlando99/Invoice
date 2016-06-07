'use strict';

invoicesUnlimited.controller('CreateInvoiceController',
	['$scope', '$state', '$controller', '$q', 'userFullFactory',
	'invoiceFactory', 'coreFactory', 'taxFactory',
	function($scope, $state, $controller, $q, userFullFactory,
		invoiceFactory,coreFactory,taxFactory) {

	var user = userFullFactory.authorized();
	$controller('DashboardController',{$scope:$scope,$state:$state});
	loadColorTheme(user);

	prepareToCreateInvoice();
//	prepareForm();

	function prepareToCreateInvoice() {
		showLoader();
		var promises = [];
		var p = null;
		var organization = user.get("organizations")[0];

		p = $q.when(coreFactory.getAllCustomers())
		.then(function(res) {
			$scope.customers = res.sort(function(a,b){
				return alphabeticalSort(a.entity.displayName,b.entity.displayName)
			});
			$scope.selectedCustomer = $scope.customers[0];
		});
		promises.push(p);

		p = $q.when(coreFactory.getAllItems({
			organization : organization
		})).then(function(items) {
			$scope.items = items;
		});
		promises.push(p);

		p = $q.when(invoiceFactory.getPreferences(user))
		.then(function(prefs) {
			$scope.prefs = prefs;
		});
		promises.push(p);

		p = $q.when(coreFactory.getUserRole(user))
		.then(function(role) {
			$scope.userRole = role;
		});
		promises.push(p);

		p = taxFactory.getTaxes(user, function(taxes) {
			$scope.taxes = taxes;
		});
		promises.push(p);

		$q.all(promises).then(function() {
			prepareForm();
			hideLoader();

		}, function(error) {
			console.log(error.message);
		});

	}

	function prepareForm() {
		if($scope.prefs.numAutoGen == 1) {
			$scope.invoiceNo = $scope.prefs.invoiceNumber;
			$scope.disableInvNo = true;
		} else {
			$scope.invoiceNo = "";
			$scope.disableInvNo = false;
		}

		$scope.paymentTerms = {
			terms : [
				{name: "Due on Receipt", value : 1},
				{name: "Off", 			 value : 0}
			],
			selectedTerm : {name: "Due on Receipt", value : 1}
		};

		$scope.hasDueDate = true;
		$scope.todayDate = new Date();
		$scope.calculateDueDate();
		$scope.subTotal = "0.00";
		$scope.discountValue = "0.00";
		$scope.shippingCharges = 0;
		$scope.adjustments = 0;

		$scope.prefs.discountType = 1;
		switch($scope.prefs.discountType) {
			case 0:
				$scope.itemLevelTax = false;
				$scope.invoiceLevelTax = false;
				break;

			case 1:
				$scope.itemLevelTax = true;
				$scope.invoiceLevelTax = false;
				break;

			case 2:
			case 3:
				$scope.itemLevelTax = false;
				$scope.invoiceLevelTax = true;
				break;
		}

		if ($scope.prefs.shipCharges)
			$scope.showShippingCharges = true;

		if ($scope.prefs.adjustments)
			$scope.showAdjustments = true;

		if ($scope.prefs.salesPerson)
			$scope.showSalesPerson = true;

		// put first item placeholder
		$scope.invoiceItems = [{
			selectedItem : undefined,
			selectedTax : undefined,
			rate : 0,
			quantity : 1,
			discount : 0,
			amount : 0
		}];

		// test image input thing
	}

	function saveInvoice() {
		var invoice = {
			userID : user,
			organization : user.get("organizations")[0],
			customer : $scope.selectedCustomer.entity,
			invoiceDate : $scope.todayDate,
			dueDate : ($scope.paymentTerms.selectedTerm.value == 1 ? $scope.dueDate : undefined),
			invoiceNumber : $scope.invoiceNo,
			status : "Unpaid",
			adjustments : Number($scope.adjustments),
			discountType : $scope.prefs.discountType,
			discounts : Number($scope.discount),
			shippingCharges : Number($scope.shippingCharges),
			subTotal : Number($scope.subTotal),
			total : Number($scope.total),
			poNumber : $scope.poNumber,
			salesPerson : $scope.salesPerson,
			notes : $scope.notes || $scope.prefs.notes,
			terms : $scope.terms || $scope.prefs.terms

		};

		return $q.when(invoiceFactory.createNewInvoice
			(invoice, $scope.invoiceItems, $scope.userRole, $scope.filepicker))
		.then(function(invObj) {
			return invObj;

		}, function(error) {
			console.log(error.message);
		});
	}

	function saveAndSendInvoice() {
		saveInvoice().then(function(invObj) {
			// save in InvoiceInfo get its id, needed afterwards
			invoiceFactory.createInvoiceReceipt(invObj.id)
			.then(function(obj) {
				console.log("saved and sent");
				console.log(obj);

			}, function(error) {
				console.log(error.message);
			});

		});
	}

	$scope.save = function() {
		saveInvoice();
	}

	$scope.saveAndSend = function () {
		saveAndSendInvoice();
	}

	$scope.uploadFile = function() {
		var file = $scope.filepicker;
		if (file) {
			console.log(file.name);
			/*
			var parseFile = new Parse.File(file.name, file);
			parseFile.save()
			.then(function(savedFile) {
				console.log(savedFile);
				console.log(savedFile.url());

			}, function(error) {
				console.log(error.message);
			});
			*/
		} else {
			console.log("no file attached");
		}
	}

	$scope.calculateDueDate = function() {
	//	$('#end_date').datepicker();
	//	$('#end_date').datepicker('setDate', 345);
	//	$scope.dueDate = $('#end_date').val();
		
		var d = new Date($scope.todayDate);
		d.setHours(d.getHours() + 12);
		$scope.dueDate = d; //$.format.date(d, "MM/dd/yyyy");
	}

	$scope.paymentTermsChanged = function() {
		$scope.hasDueDate =
			$scope.paymentTerms.selectedTerm.value == 1 ? true : false;
	}

	$scope.openDatePicker = function(n) {
		switch (n) {
			case 1: $scope.openPicker1 = true; break;
			case 2: $scope.openPicker2 = true; break;
		}
  	}

	$scope.addInvoiceItem = function() {
		$scope.invoiceItems.push({
			selectedItem : undefined,
			selectedTax : undefined,
			rate : 0,
			quantity : 1,
			discount : 0,
			amount : 0
		});
	}

	
	function reCalculateSubTotal() {
		var items = $scope.invoiceItems;
		var subTotal = 0;
		items.forEach(function(item) {
			subTotal += Number(item.amount);
		});
		$scope.subTotal = formatNumber(subTotal);
		$scope.reCalculateTotal();
	}

	$scope.reCalculateTotal = function() {
		$scope.discountValue =
			formatNumber((Number($scope.subTotal) * Number($scope.discount) * 0.01));
		$scope.total =
			formatNumber(Number($scope.subTotal) - Number($scope.discountValue) +
			Number($scope.shippingCharges) + Number($scope.adjustments));
	}

	$scope.reCalculateItemAmount = function(index) {
		var itemInfo = $scope.invoiceItems[index];
		if (! itemInfo.selectedItem) return;

		var withOutDiscount = itemInfo.rate * itemInfo.quantity;
		itemInfo.amount =
		formatNumber(withOutDiscount * ((100 - itemInfo.discount) * 0.01));
		reCalculateSubTotal();
	}

	$scope.removeInvoiceItem = function(index) {
		if ($scope.invoiceItems.length > 1) {
			$scope.invoiceItems.splice(index,1);
			reCalculateSubTotal();
		} else {
			console.log("there should be atleast 1 item in an invoice");
		}
	}

	$scope.itemChanged = function(index) {
		var itemInfo = $scope.invoiceItems[index];
		itemInfo.rate = Number(itemInfo.selectedItem.entity.get("rate"));
		var tax = itemInfo.selectedItem.entity.get("tax");
		if (!tax) {
			console.log("no tax applied");
			itemInfo.selectedTax = "";
		} else {
			var taxes = $scope.taxes;
			for (var i = 0; i < taxes.length; ++i) {
				if (tax.id == taxes[i].id) {
					itemInfo.selectedTax = taxes[i];
					break;
				}
			}
		}
		$scope.reCalculateItemAmount(index);
	}

	$scope.printSelected = function() {
		console.log($scope.selectedCustomer.entity);
	}

}]);
