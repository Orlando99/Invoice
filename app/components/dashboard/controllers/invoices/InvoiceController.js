'use strict';

invoicesUnlimited.controller('InvoiceController',['$q', '$scope', '$state', '$controller',
	'userFullFactory', 'invoiceService', 'coreFactory', 'taxFactory',
	function($q,$scope,$state,$controller,userFullFactory,invoiceService, coreFactory, taxFactory){

	var user = userFullFactory.authorized();
	$controller('DashboardController',{$scope:$scope,$state:$state});
//	loadColorTheme(user);

	var isGoTo = {
		details : function(to){
			return to.endsWith('details');	
		},
		invoices : function(to){ 
			return to.endsWith('invoices.all');
		},
		edit : function(to){
			return to.endsWith('edit');
		},
		newInvoice : function(to){
			return to.endsWith('new');	
		}
	};

	CheckUseCase();

	function CheckUseCase(stateName) {
		if (! stateName)
			stateName = $state.current.name;

		if (isGoTo.invoices(stateName)) {
			if (! $scope.invoiceList)
				ListInvoices();

		} else if (isGoTo.newInvoice(stateName)) {
			console.log("its in new");
			//doSelectCustomerIfValidId(customerId);

		} else if (isGoTo.edit(stateName)) {
			console.log("its in edit");
			EditInvoice();
		}
	}

	function EditInvoice() {
		var invoiceId = parseInt($state.params.invoiceId);
		$q.when(LoadRequiredData()).then(function(msg) {
			console.log("data loaded");
		})
	}

	function LoadRequiredData() {
		showLoader();
		var promises = [];
		var p = null;
		var organization = user.get("organizations")[0];

		p = $q.when(coreFactory.getAllCustomers())
		.then(function(res) {
			$scope.customers = res.sort(function(a,b){
				return alphabeticalSort(a.entity.displayName,b.entity.displayName)
			});
		//	$scope.selectedCustomer = $scope.customers[0];
		});
		promises.push(p);

		p = $q.when(coreFactory.getAllItems({
			organization : organization
		})).then(function(items) {
			$scope.items = items;
		});
		promises.push(p);

		p = $q.when(invoiceService.getPreferences(user))
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

		return $q.all(promises).then(function() {
			hideLoader();
			console.log("ready");
			return Parse.Promise.as("ready");

		}, function(error) {
			console.log(error.message);
		});

	}

	function ListInvoices() {
		showLoader();
		$q.when(invoiceService.listInvoices(user))
		.then(function(res) {
			res.forEach(function(obj) {
				switch (obj.entity.status) {
					case "Unpaid":
						obj.statusClass = "text-color-normalize";
						break;
					case "Paid":
						obj.statusClass = "text-positive";
						break;
					case "Overdue":
						obj.statusClass = "text-danger";
						break;
					default:
						obj.statusClass = "text-color-normalize";
				}

				obj.invoiceDate = formatDate(
					obj.entity.invoiceDate, "MM/DD/YYYY");
				obj.dueDate = formatDate(
					obj.entity.dueDate, "MM/DD/YYYY");
				obj.balanceDue = formatNumber(obj.entity.balanceDue);
				obj.total = formatNumber(obj.entity.total);
			});

			$scope.invoiceList = res;
			hideLoader();

		}, function(error) {
			hideLoader();
			console.log(error.message);
		});	
	}

}]);
