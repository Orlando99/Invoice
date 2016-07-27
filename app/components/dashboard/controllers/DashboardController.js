'use strict';

invoicesUnlimited.controller('DashboardController',['$scope','$state','userFactory','businessFactory','$q',
	'invoiceService', 'expenseService', 'coreFactory', 'currencyFilter',
function($scope,$state,userFactory,businessFactory,$q,invoiceService,expenseService,
	coreFactory,currencyFilter){

	showLoader();

	var user = userFactory;
	var business = businessFactory;

	if (!user.entity.length) {
		hideLoader();
		$state.go('login');
		return;
	}

	loadColorTheme(user);
	$scope.businessInfo = businessFactory.entity.length ?
						  businessFactory.entity[0] :
						  {};

	$scope.logOut = function(){
		return user.logout().then(function(){
			resetColorTheme();
			businessFactory.entity = [];
			$state.go('login');
		});
	};

	$q
	.all([businessFactory.load()])
	.then(function(obj){
		if (obj.length && obj[0]) {
			$scope.businessInfo = obj[0].entity[0];
			hideLoader();
		} else $scope.logOut().then(function(){
			hideLoader();
		});
	}, function(error){
		hideLoader();
		$scope.logOut();
	});

	if (! $state.current.name.endsWith('dashboard'))
		return;
	var organization = user.entity[0].get("organizations")[0];

	var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY',
		'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
	var colors = ['#0ea81c', '#2aa7f7', '#c31e1e']
	var monthlySales   = [0,0,0,0,0,0,0,0,0,0,0,0];
	var monthlyIncome  = [0,0,0,0,0,0,0,0,0,0,0,0];
	var monthlyExpense = [0,0,0,0,0,0,0,0,0,0,0,0];

	$q.when(invoiceService.getInvoicesForSummary({
		organization : organization
	}))
	.then(function(objs) {
		$scope.totalSales = 0;
		$scope.totalIncome = 0;
		$scope.totalReceivables = 0;
		$scope.totalCurrentReceivables = 0;
		$scope.totalOverdueReceivables = 0;
		$scope.overDueInLast15 = 0;
		$scope.overDueInLast30 = 0;
		$scope.overDueInLast45 = 0;
		$scope.overDueFromOver45 = 0;

		objs.forEach(function(invoice) {
			var total = invoice.entity.total;
			var due = invoice.entity.balanceDue;
			var date = invoice.entity.invoiceDate;
			var expireDate = invoice.entity.dueDate;
			var index = date.getMonth();

			switch(invoice.entity.status) {
			case 'Unpaid':
			case 'Sent':
				$scope.totalSales += total;
				$scope.totalReceivables += total;
				$scope.totalCurrentReceivables += total;
				break;

			case 'Overdue':
				$scope.totalSales += total;
				$scope.totalReceivables += total;
				$scope.totalOverdueReceivables += total;
				addToRelevantRange(date, expireDate, total);
				break;

			case 'Paid':
				$scope.totalSales += total;
				$scope.totalIncome += total;
				monthlyIncome[index] += total;
				break;

			case 'Partial Paid':
				$scope.totalSales += total;
				$scope.totalIncome += total - due;
				$scope.totalReceivables += due;
				$scope.totalCurrentReceivables += due;
				monthlyIncome[index] += total - due;
				break;

			case 'Refunded':
				$scope.totalSales += total;
				break;

			case 'Partial Refunded':
				$scope.totalSales += total;
				$scope.totalIncome += total - due;
				monthlyIncome[index] += total - due;
				break;
			}

			monthlySales[index] += total;
		});

		var ctx = $("#barchart");
		var myChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: months,
				datasets: [{
					backgroundColor: colors[0],
					data: monthlySales
				}, {
					backgroundColor: colors[1],
					data: monthlyIncome
				}, {
					backgroundColor: colors[2],
					data: monthlyExpense
				}]
			},
			options: {
				responsive: false,
				legend: {
					display: false
				},
				scales: {
					yAxes: [{
						ticks: {
								beginAtZero:true
						}
					}]
				}
			}
		});

	});

	$q.when(coreFactory.getExpenseCategories({
		organization : organization
	}))
	.then(function(objs) {
		$scope.categories = objs;
		return expenseService.getExpensesForSummary({
			organization : organization
		});
	})
	.then(function(objs) {
		var totalExpense = 0;
		var expenseList = [];
		var expenseNameList = [];
		var expenseValueList = [];
		var expenseColorList = [];

		objs.forEach(function(expense) {
			var name = expense.entity.category;
			var value = expense.entity.amount;
			
			totalExpense += value;
			expenseNameList.push(name);
			expenseValueList.push(value);
			expenseColorList.push(
				getColorCode(
					$scope.categories.find(
						function(category) {
							return category.entity.name == name;
						})
					.entity.color
				)
			);

			expenseList.push({
				name: name,
				value: currencyFilter(value, '$', 2),
				customer: expense.customer.displayName
			});
		});
		$scope.expenseList = expenseList;
		$scope.totalExpenseAmount = currencyFilter(totalExpense, '$', 2);

		var ctx = document.getElementById("piechart");
		var myChart = new Chart(ctx, {
			type: 'pie',
			data: {
				labels: expenseNameList,
				datasets: [{
					data: expenseValueList,
					backgroundColor: expenseColorList
				}]
			},
			options: {
				responsive: false,
				rotation: 0,
				legend: {
					display: false
				},
				tooltips: {
					callbacks: {
						label: function(item,data) {
							var value = data.datasets[item.datasetIndex].data[item.index];
							var label = data.labels[item.index];
							var percentage =
								((value / totalExpense) * 100).toFixed(1);
							return [percentage + ' %', label];
						}
					}
				}
			}
		});

	});

function addToRelevantRange(creatDate, expireDate, amount) {
	// if there is no expire date, then invoice can not be in Overdue state.
	if (! expireDate) {
		console.log('expire date not available');
		return;

	//	expireDate = new Date(creatDate.getTime());
	//	expireDate.setHours(expireDate.getHours() + 1);
	}

	var today = new Date();
	var diff = Math.abs(today.getTime() - expireDate.getTime());
	var days = diff / (1000 * 3600 * 24);

	if (days >= 1 && days <= 15)
		$scope.overDueInLast15 += amount;

	else if (days >= 16 && days <= 30)
		$scope.overDueInLast30 += amount;

	else if (days >= 31 && days <= 45)
		$scope.overDueInLast45 += amount;

	else if (days > 45)
		$scope.overDueFromOver45 += amount;

}

function getColorCode(number) {
	switch(number) {
	case 0:
		return 'rgba(47,112,225,1)';
	case 1:
		return 'rgba(83,215,106,1)';
	case 2:
		return 'rgba(221,170,59,1)';
	case 3:
		return 'rgba(229,0,15,1)';
	case 4:
		return 'rgba(250,235,215,1)';
	case 5:
		return 'rgba(253,245,230,1)';
	case 6:
		return 'rgba(255,255,240,1)';
	case 7:
		return 'rgba(255,245,238,1)';
	case 8:
		return 'rgba(248,248,255,1)';
	case 9:
		return 'rgba(255,250,250,1)';
	case 10:
		return 'rgba(250,240,230,1)';
	case 11:
		return 'rgba(64,64,64,1)';
	case 12:
		return 'rgba(128,128,128,1)';
	case 13:
		return 'rgba(191,191,191,1)';
	case 14:
		return 'rgba(133,117,112,1)';
	case 15:
		return 'rgba(118,122,133,1)';
	case 16:
		return 'rgba(34,34,34,1)';
	case 17:
		return 'rgba(28,160,170,1)';
	case 18:
		return 'rgba(103,153,170,1)';
	case 19:
		return 'rgba(141,218,247,1)';
	case 20:
		return 'rgba(99,161,247,1)';
	case 21:
		return 'rgba(112,219,219,1)';
	case 22:
		return 'rgba(0,178,238,1)';
	case 23:
		return 'rgba(13,79,139,1)';
	case 24:
		return 'rgba(67,114,170,1)';
	case 25:
		return 'rgba(89,113,173,1)';
	case 26:
		return 'rgba(100,149,237,1)';
	case 27:
		return 'rgba(190,220,230,1)';
	case 28:
		return 'rgba(13,26,35,1)';
	case 29:
		return 'rgba(23,137,155,1)';
	case 30:
		return 'rgba(200,213,219,1)';
	case 31:
		return 'rgba(102,169,251,1)';
	case 32:
		return 'rgba(1,152,117,1)';
	case 33:
		return 'rgba(99,214,74,1)';
	case 34:
		return 'rgba(126,242,124,1)';
	case 35:
		return 'rgba(77,226,140,1)';
	case 36:
		return 'rgba(176,226,172,1)';
	case 37:
		return 'rgba(99,111,87,1)';
	case 38:
		return 'rgba(69,139,0,1)';
	case 39:
		return 'rgba(32,87,14,1)';
	case 40:
		return 'rgba(91,114,34,1)';
	case 41:
		return 'rgba(107,142,35,1)';
	case 42:
		return 'rgba(134,198,124,1)';
	case 43:
		return 'rgba(216,255,231,1)';
	case 44:
		return 'rgba(56,237,56,1)';
	case 45:
		return 'rgba(87,121,107,1)';
	case 46:
		return 'rgba(233,87,95,1)';
	case 47:
		return 'rgba(151,27,16,1)';
	case 48:
		return 'rgba(241,167,162,1)';
	case 49:
		return 'rgba(228,31,54,1)';
	case 50:
		return 'rgba(255,95,154,1)';
	case 51:
		return 'rgba(205,92,92,1)';
	case 52:
		return 'rgba(190,38,37,1)';
	case 53:
		return 'rgba(240,128,128,1)';
	case 54:
		return 'rgba(80,4,28,1)';
	case 55:
		return 'rgba(242,71,63,1)';
	case 56:
		return 'rgba(255,99,71,1)';
	case 57:
		return 'rgba(255,105,180,1)';
	case 58:
		return 'rgba(255,228,225,1)';
	case 59:
		return 'rgba(187,18,36,1)';
	case 60:
		return 'rgba(105,5,98,1)';
	case 61:
		return 'rgba(207,100,235,1)';
	case 62:
		return 'rgba(229,180,235,1)';
	case 63:
		return 'rgba(140,93,228,1)';
	case 64:
		return 'rgba(191,95,255,1)';
	case 65:
		return 'rgba(139,102,139,1)';
	case 66:
		return 'rgba(204,153,204,1)';
	case 67:
		return 'rgba(135,38,87,1)';
	case 68:
		return 'rgba(255,20,147,1)';
	case 69:
		return 'rgba(54,11,88,1)';
	case 70:
		return 'rgba(135,159,237,1)';
	case 71:
		return 'rgba(218,112,214,1)';
	case 72:
		return 'rgba(215,170,51,1)';
	case 73:
		return 'rgba(192,242,39,1)';
	case 74:
		return 'rgba(229,227,58,1)';
	case 75:
		return 'rgba(205,171,45,1)';
	case 76:
		return 'rgba(254,241,181,1)';
	case 77:
		return 'rgba(139,117,18,1)';
	case 78:
		return 'rgba(240,226,187,1)';
	case 79:
		return 'rgba(240,238,215,1)';
	case 80:
		return 'rgba(240,238,215,1)';
	case 81:
		return 'rgba(245,245,220,1)';
	case 82:
		return 'rgba(242,187,97,1)';
	case 83:
		return 'rgba(184,102,37,1)';
	case 84:
		return 'rgba(248,197,143,1)';
	case 85:
		return 'rgba(250,154,79,1)';
	case 86:
		return 'rgba(237,145,33,1)';
	case 87:
		return 'rgba(247,145,55,1)';
	case 88:
		return 'rgba(199,63,23,1)';
	case 89:
		return 'rgba(138,54,15,1)';
	case 90:
		return 'rgba(94,38,5,1)';
	case 91:
		return 'rgba(141,60,15,1)';
	case 92:
		return 'rgba(123,63,9,1)';
	case 93:
		return 'rgba(196,142,72,1)';
	case 94:
		return 'rgba(252,230,201,1)';
	case 95:
		return 'rgba(222,182,151,1)';
	case 96:
		return 'rgba(70,45,29,1)';
	case 97:
		return 'rgba(160,82,45,1)';
	default:
		return 'rgba(236,214,197,1)';
	}
}



}]);
