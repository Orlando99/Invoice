'use strict';

Array.prototype.rotate = function( n ) {
  this.unshift.apply( this, this.splice( n, this.length ) )
  return this;
}

invoicesUnlimited.controller('DashboardController',['$scope','$state','userFactory','businessFactory','$q',
	'invoiceService', 'expenseService', 'coreFactory', 'currencyFilter', 'cleanDataService',
function($scope,$state,userFactory,businessFactory,$q,invoiceService,expenseService,
	coreFactory,currencyFilter,cleanDataService){

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

	$scope.logOut = function(errorMsg){
		return user.logout()
		.then(function(){
			resetColorTheme();
			cleanDataService.clearAllOnLogOut();
			$state.go('login', {'errorMsg' : errorMsg});
		});
	};

	$scope.pageReady = function($event) {
		var c = $state.current.name;
		$('.nav-item').removeClass('active');

		if (c.includes('customers.'))
			$('#customers').addClass('active');

		else if (c.includes('sales.'))
			$('#sales').addClass('active');

		else if (c.includes('expenses.'))
			$('#expenses').addClass('active');

		else if (c.includes('reports.'))
			$('#reports').addClass('active');

		else if (c.includes('settings.'))
			$('#settings').addClass('active');

		else if(c.includes('dashboard'))
			$('#dashboard').addClass('active');

		if ($('#link-sales').offset) {
			var pos = parseInt($('#link-sales').offset().left);
			var negative_pos = pos * (-1) ;
			$('.navigation > li .link-sales-div').css('left',negative_pos);
		}

		if ($('#link-expense').offset) {
			pos = parseInt($('#link-expense').offset().left);
			negative_pos = pos * (-1) ;
			$('.navigation > li .link-expense-div').css('left',negative_pos);
		}

		if ($('#link-settings').offset) {
			pos = parseInt($('#link-settings').offset().left);
			negative_pos = pos * (-1);
			$('.navigation > li .link-settings-div').css('left',negative_pos);
		}

		if ($('#link-reports').offset) {
			pos = parseInt($('#link-reports').offset().left);
			negative_pos = pos * (-1);
			$('.navigation > li .link-reports-div').css('left',negative_pos);
		}
		
/*

		$('.nav-item').click(function(event) {
			$('.nav-item').removeClass('active');
			var a = $(this).parents('li');
			if (a.length) {
				a.addClass('active')
			} else {
				$(this).addClass('active');
			}
		});
*/
	}

	var organization = undefined;
	var promises = [];
	promises.push(businessFactory.load());

	$q.all(promises)
	.then(function(obj){
		if (obj.length && obj[0]) {
			$scope.businessInfo = obj[0].entity[0];

			// return if we are not on Dashboard
			if (! $state.current.name.endsWith('dashboard')) return;

			organization = user.entity[0].get("organizations")[0];
			hideLoader();
			drawBarChart();
			drawPieChart();

		} else {
			$scope.logOut('Your account is not setup correctly.');
		}

	}, function(error){
		$scope.logOut('Your account is not setup correctly.');
	});


function drawBarChart() {
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

		return organization.fetch();
	})
	.then(function(org) {
		// rotate arrays according to selected fiscal month
		var fiscalMonth = org.get('fiscalYearStart');
		var count = getrotateCount(fiscalMonth);
		months.rotate(count);
		monthlySales.rotate(count);
		monthlyIncome.rotate(count);
		monthlyExpense.rotate(count);

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

}

function drawPieChart() {
	var promiseList = [];
	var promise = undefined;

	promise = $q.when(coreFactory.getExpenseCategories({
		organization : organization
	})).then(function(objs) {
		$scope.categories = objs;
	});
	promiseList.push(promise);

	promise = $q.when(coreFactory.getDefaultExpenseCategories())
	.then(function(objs) {
		$scope.defaultCategories = objs;
	});
	promiseList.push(promise);

	expenseService.getExpensesForSummary({
		organization : organization
	}).then(function(objs) {
		return $q.all(promiseList)
		.then(function() {
			return objs;
		});
	})
	.then(function(objs) {
		var totalExpense = 0;
		var expenseList = [];
		var expenseNameList = [];
		var expenseValueList = [];
		var expenseColorList = [];

		var uniqueExpenses = {};
		for(var i=0; i < objs.length; ++i) {
			var expense = objs[i];
			var name = expense.entity.category;
			var value = expense.entity.amount;

			if(uniqueExpenses[name]) {
				uniqueExpenses[name] += value;
			} else {
				uniqueExpenses[name] = value;
				expenseNameList.push(name);
			}

			var expObj = {
				name: name,
				value : value
			};
			if (expense.customer)
				expObj.customer = expense.customer.displayName;

			expenseList.push(expObj);
		}
		expenseList.sort(function(a,b) {
			return b.value - a.value;
		});
		expenseList.forEach(function(exp) {
			exp.value = currencyFilter(exp.value, '$', 2);
		});
		$scope.expenseList = expenseList;

		for(var i=0; i < expenseNameList.length; ++i) {
			var name = expenseNameList[i];
			var value = uniqueExpenses[name];

			totalExpense += value;
			expenseValueList.push(value);
			expenseColorList.push(getColor(name));
		}
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
				events : false,
				showAllTooltips: true,
				responsive: false,
				rotation: 0,
				legend: {
					display: true
				},
				tooltips: {
					callbacks: {
						label: function(item,data) {
							var value = data.datasets[item.datasetIndex].data[item.index];
							var label = data.labels[item.index];
							var percentage =
								((value / totalExpense) * 100).toFixed(1);
							return [percentage + ' %']; // [,label]
						}
					}
				}
			}
		});
	});

}

function getrotateCount(month) {
	var mnth = month.slice(0,3).toUpperCase();
	switch(mnth) {
	case 'JAN': return 0;
	case 'FEB': return 1;
	case 'MAR': return 2;
	case 'APR': return 3;
	case 'MAY': return 4;
	case 'JUN': return 5;
	case 'JUL': return 6;
	case 'AUG': return -5;
	case 'SEP': return -4;
	case 'OCT': return -3;
	case 'NOV': return -2;
	case 'DEC': return -1;
	default: return 0;
	}

}

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

function getColor(name) {
	var category =
	$scope.categories.find(function(obj) {
		return obj.entity.name == name;
	});
	if(! category) {
		category =
		$scope.defaultCategories.find(function(obj) {
			return obj.entity.name == name;
		});
		if(! category) category = {entity:{color:-1}};
	}

	return colorCodeToValue(category.entity.color);
}

}]);
